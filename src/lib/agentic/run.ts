import "server-only";
import { advise, type Advice } from "./agents/advisor";
import { extract, type Extraction } from "./agents/extractor";
import { classify, type DocFile, type IntakeResult } from "./agents/intake";
import { judge, type Verdicts } from "./agents/judge";
import { verify, type Calibrate } from "./agents/verifier";
import { assembleScoringInput, type CaseProfile, type FoundDocument } from "./assemble";
import type { RunLog } from "./events";
import type { JurisdictionPack } from "./jurisdictions/types";

/**
 * The orchestrator: one run of the agent team over one company's file.
 *
 *   Intake ─▶ Extractor ─▶ Verifier ─▶ Judge ─▶ Advisor
 *               (Healer supervises every model step; failover is in the tier)
 *
 * Stages run in order because each needs the last one's output; inside a stage,
 * documents are processed in parallel. Every step reports to the run log,
 * which is what the browser watches and what Firestore keeps.
 */

export interface RunInput {
  caseId: string;
  profile: CaseProfile;
  files: DocFile[];
  pack: JurisdictionPack;
  /** Demo control: the first model call meets a model that does not exist. */
  chaos?: boolean;
  /** Ground truth, for specimen cases: field values keyed by file name. */
  truth?: Record<string, Record<string, string>>;
}

export interface RunOutcome {
  intake: (IntakeResult & { file: string })[];
  extractions: (Extraction & { file: string })[];
  verdicts: Verdicts;
  advice: Advice;
  accuracy: {
    correct: number;
    total: number;
    misses: { file: string; field: string; want: string; got: string | null; confidence: number | null }[];
  } | null;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/[\s,]+/g, " ").replace(/\.00$/, "").trim();

/**
 * Personal names are compared as a set of words: "KWAME DANIEL MENSAH" and the
 * surname-first "MENSAH KWAME DANIEL" are the same name. Scoring word order as
 * an extraction error would understate accuracy, which is as dishonest as
 * overstating it.
 */
const NAME_FIELDS = new Set(["full_name", "account_holder", "tenant_name"]);
const sameValue = (field: string, got: string | null | undefined, want: string) =>
  NAME_FIELDS.has(field)
    ? norm(got).split(" ").sort().join(" ") === norm(want).split(" ").sort().join(" ")
    : norm(got) === norm(want);

export async function runCase(input: RunInput, log: RunLog, calibrate: Calibrate): Promise<RunOutcome> {
  const { pack } = input;
  log.emit("orchestrator", "stage", `Starting the agent team on ${input.files.length} documents (${pack.name} pack).`);

  // 1. Intake — every file, in parallel. Chaos hits only the first call so the
  //    failover is visible once, not drowned in repeats.
  log.emit("intake", "stage", "Classifying each document.");
  const classified = await Promise.all(
    input.files.map(async (file, i) => {
      const r = await classify(file, pack, log, input.chaos === true && i === 0);
      if (r) {
        log.emit("intake", "step", `${file.name} → ${r.doc_type} (${Math.round(r.confidence * 100)}%, ${r.legibility}).`, {
          file: file.name,
          docType: r.doc_type,
          confidence: r.confidence,
          legibility: r.legibility,
          model: r.model,
        });
      } else {
        log.emit("intake", "warning", `${file.name} could not be classified.`, { file: file.name });
      }
      return { file, r };
    })
  );

  // 2. Extraction — only document types that have fields to read.
  log.emit("extractor", "stage", "Reading every field, with a confidence and the exact quote.");
  const extractable = classified.filter(({ r }) => r && (pack.docTypes.find((d) => d.id === r.doc_type)?.fields.length ?? 0) > 0);
  const extractions = await Promise.all(
    extractable.map(async ({ file, r }) => {
      const spec = pack.docTypes.find((d) => d.id === r!.doc_type)!;
      const e = await extract(file, spec, log);
      const fields = Object.keys(e.fields).length;
      const lowest = Math.min(...Object.values(e.fields).map((f) => f.confidence), 1);
      log.emit("extractor", "step", `${spec.label}: ${fields} fields read (lowest confidence ${Math.round(lowest * 100)}%).`, {
        file: file.name,
        docType: spec.id,
        model: e.model,
        attempts: e.attempts,
        healed: e.healed,
        fields: e.fields,
      });
      return { ...e, file: file.name };
    })
  );

  // Ground truth, when the file is a specimen: measured, not claimed.
  let accuracy: RunOutcome["accuracy"] = null;
  if (input.truth) {
    let correct = 0;
    let total = 0;
    const misses: NonNullable<RunOutcome["accuracy"]>["misses"] = [];
    for (const e of extractions) {
      for (const [field, want] of Object.entries(input.truth[e.file] ?? {})) {
        total++;
        const got = e.fields[field];
        if (sameValue(field, got?.value, want)) correct++;
        else misses.push({ file: e.file, field, want, got: got?.value ?? null, confidence: got?.confidence ?? null });
      }
    }
    accuracy = { correct, total, misses };
    log.emit(
      "learner",
      misses.length ? "warning" : "step",
      `Extraction accuracy against ground truth: ${correct}/${total} fields` +
        (misses.length ? ` — missed ${misses.map((m) => `${m.field} (read "${m.got}", printed "${m.want}")`).join("; ")}.` : "."),
      accuracy
    );
  }

  // 3. Verify, 4. Judge.
  const found: FoundDocument[] = classified
    .filter(({ r }) => r && r.doc_type !== "unknown")
    .map(({ file, r }) => {
      const e = extractions.find((x) => x.file === file.name);
      return {
        id: file.id,
        type: r!.doc_type,
        fileName: file.name,
        fields: Object.fromEntries(Object.entries(e?.fields ?? {}).map(([k, v]) => [k, v.value])),
      };
    });
  const scoringInput = assembleScoringInput(input.caseId, input.profile, found);
  const judgments = await verify(input.profile, extractions, log, calibrate);

  log.emit("judge", "stage", "Routing every judgment: act on it, or ask a person.");
  const verdicts = judge(scoringInput, judgments, pack.rules);
  for (const d of verdicts.decisions) {
    // The timeline renders the action as a badge; the message is the question.
    log.emit("judge", "decision", d.judgment.question, {
      id: d.judgment.id,
      action: d.action,
      reason: d.reason,
      probability: d.judgment.probability,
      severity: d.judgment.severity,
    });
  }
  const { expected, low, high, pending } = verdicts.range;
  log.emit(
    "judge",
    "result",
    low === high
      ? `Readiness ${low}/100 — every check settled.`
      : `Readiness ${low}–${high}/100, most likely ${expected}. ${pending.length} check${pending.length === 1 ? "" : "s"} wait on a person.`,
    { expected, low, high, pending, risk: verdicts.range.asExtracted.riskLevel, disagreements: verdicts.disagreements }
  );

  // 5. Advise.
  const advice = advise(scoringInput, verdicts, log);

  log.emit("orchestrator", "stage", "Run complete.");
  return {
    intake: classified.filter(({ r }) => r).map(({ file, r }) => ({ ...r!, file: file.name })),
    extractions,
    verdicts,
    advice,
    accuracy,
  };
}
