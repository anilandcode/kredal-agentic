import "server-only";
import { z } from "zod";
import type { CaseProfile } from "../assemble";
import { decide, noisyOr, type Decision, type Judgment } from "../decision";
import type { RunLog } from "../events";
import { describeHistory, readPdfHistory, wasAltered } from "../fraud/pdf-forensics";
import type { DocFile } from "./intake";
import type { Extraction } from "./extractor";
import { runTypedAgent } from "./run-agent";
import type { Calibrate } from "./verifier";

/**
 * Fraud Sentinel: has a document been altered?
 *
 * Three independent signals, because a real forgery rarely leaves only one:
 *   1. File history — re-saved by another program after issue (rule, certain).
 *   2. Arithmetic — opening + credits − debits ≠ closing (rule, certain).
 *   3. Visual — a figure in another typeface, off its baseline, pasted over
 *      (Gemini vision, calibrated).
 *
 * Each signal is a fact or a judgment; what they *mean together* is a
 * probability of tampering (noisy-OR), turned into one critical judgment the
 * decision engine routes like any other — act only at 97%, otherwise ask.
 *
 * Integrity is a gate, not a score deduction: an altered statement is not a
 * weaker file, it is a file that must not be submitted.
 */

export type IntegrityStatus = "clear" | "review" | "blocked";

export interface IntegrityVerdict {
  status: IntegrityStatus;
  /** Probability that at least one document was altered. */
  pTamper: number;
  signals: Judgment<boolean>[];
  decision: Decision<boolean>;
  summary: string;
}

/** How strongly each signal, when present, indicates tampering. */
const WEIGHT = {
  /** A re-save is suspicious but not damning: signatures re-save too. */
  file_history: 0.35,
  /** Totals that do not add up: a misread, or an edit. */
  arithmetic: 0.7,
} as const;

const VisualInspection = z.object({
  altered: z.boolean().describe("True if any part of the document appears edited after printing"),
  probability: z.number().min(0).max(1).describe("Probability that `altered` is correct"),
  findings: z
    .array(
      z.object({
        location: z.string().describe("Where on the page, e.g. 'closing balance in the summary'"),
        observation: z.string().describe("What looks wrong, in one sentence"),
      })
    )
    .describe("Empty if nothing looks altered"),
  rationale: z.string(),
});

const money = (s: string | null | undefined) => (s ? Number(s.replace(/[^0-9.-]/g, "")) : NaN);
const aed = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface VisualFinding {
  signal: Judgment<boolean>;
  /** The model's view as a tamper probability, whichever way it leaned. */
  weight: number;
}

/**
 * The visual inspection needs only the file — not anything the Extractor read —
 * so the orchestrator starts it the moment Intake recognises a statement and
 * collects it later. On a 30-second Pro call, that overlap is most of a run.
 */
export async function inspectVisual(f: DocFile, log: RunLog, calibrate: Calibrate): Promise<VisualFinding | null> {
  const answer = await runTypedAgent({
    name: "fraud_sentinel",
    tier: "strong",
    log,
    schema: VisualInspection,
    instruction:
      "You are the Fraud Sentinel, a document examiner. Inspect this bank statement for signs it " +
      "was edited after the bank produced it: a figure in a different typeface, size or weight from " +
      "its neighbours; characters off the baseline or misaligned with their column; uneven spacing; " +
      "a value that contradicts the transaction list. Look closely at balances and totals. Report " +
      "only what you can actually see; a clean document is the common case.",
    parts: [{ inlineData: { mimeType: f.mimeType, data: f.base64 } }],
  }).catch((err: unknown) => ({ ok: false as const, schemaError: err instanceof Error ? err.message : String(err), raw: "", model: null, ms: 0 }));

  if (!answer.ok) {
    log.emit("fraud", "warning", `${f.name}: visual inspection unavailable — ${answer.schemaError.slice(0, 160)}`);
    return null;
  }
  const raw = answer.value.probability;
  const p = calibrate(answer.model, "tamper_visual", raw);
  log.emit(
    "fraud",
    answer.value.altered ? "warning" : "step",
    answer.value.altered
      ? `${f.name}: looks edited — ${answer.value.findings.map((x) => x.observation).join(" ") || answer.value.rationale}`
      : `${f.name}: no visual sign of editing (${Math.round(p * 100)}%).`,
    { model: answer.model, findings: answer.value.findings }
  );
  return {
    signal: {
      id: `integrity.visual.${f.name}`,
      question: `Does ${f.name} look unedited?`,
      verdict: !answer.value.altered,
      probability: p,
      rawProbability: raw,
      severity: "critical",
      evidence: answer.value.findings.map((x) => ({ docId: f.name, docType: "bank_statement", quote: `${x.location}: ${x.observation}` })),
      ruleIds: [],
      source: "model",
      model: answer.model ?? undefined,
      rationale: answer.value.rationale,
    },
    weight: answer.value.altered ? p : 1 - p,
  };
}

export async function inspectIntegrity(
  files: DocFile[],
  extractions: (Extraction & { file: string })[],
  profile: CaseProfile,
  log: RunLog,
  calibrate: Calibrate,
  /** Visual inspections already under way, by file name. */
  visual?: Map<string, Promise<VisualFinding | null>>
): Promise<IntegrityVerdict> {
  log.emit("fraud", "stage", "Checking every document for signs of alteration.");
  const signals: Judgment<boolean>[] = [];
  const weights: number[] = [];

  // 1. File history, every PDF.
  for (const f of files) {
    const h = readPdfHistory(Buffer.from(f.base64, "base64"));
    if (!h.isPdf) continue;
    const altered = wasAltered(h);
    if (altered) {
      signals.push({
        id: `integrity.file_history.${f.id}`,
        question: `Was ${f.name} left unaltered after it was issued?`,
        verdict: false,
        probability: 1,
        severity: "standard",
        evidence: [{ docId: f.id, docType: "file", quote: describeHistory(h) }],
        ruleIds: [],
        source: "rule",
        rationale: describeHistory(h),
      });
      weights.push(WEIGHT.file_history);
      log.emit("fraud", "warning", `${f.name}: ${describeHistory(h)}`, { file: f.name, revisions: h.revisions, producers: h.producers });
    }
  }

  // 2 + 3. Bank statements: arithmetic, then a visual inspection.
  for (const e of extractions.filter((x) => x.docType === "bank_statement")) {
    const f = files.find((x) => x.name === e.file);
    const v = (k: string) => money(e.fields[k]?.value);
    const [open, cr, dr, close] = [v("opening_balance"), v("total_credits"), v("total_debits"), v("closing_balance")];

    if ([open, cr, dr, close].every(Number.isFinite)) {
      const expected = Math.round((open + cr - dr) * 100) / 100;
      const adds = Math.abs(expected - close) < 0.01;
      signals.push({
        id: `integrity.arithmetic.${e.file}`,
        question: `Do the totals on ${e.file} add up?`,
        verdict: adds,
        probability: 1,
        severity: "standard",
        evidence: [{ docId: e.file, docType: "bank_statement", field: "closing_balance", quote: e.fields.closing_balance?.quote ?? undefined }],
        ruleIds: [],
        source: "rule",
        rationale: adds
          ? `Opening ${aed(open)} + credits ${aed(cr)} − debits ${aed(dr)} = closing ${aed(close)}.`
          : `Opening ${aed(open)} + credits ${aed(cr)} − debits ${aed(dr)} = ${aed(expected)}, but the statement prints a closing balance of ${aed(close)} — a difference of ${aed(close - expected)}.`,
      });
      if (!adds) {
        weights.push(WEIGHT.arithmetic);
        log.emit("fraud", "warning", `${e.file}: the totals do not add up — ${aed(close - expected)} unexplained.`, { expected, printed: close });
      } else {
        log.emit("fraud", "step", `${e.file}: totals reconcile.`);
      }
    }

    if (!f) continue;
    const seen = await (visual?.get(f.name) ?? inspectVisual(f, log, calibrate));
    if (seen) {
      signals.push(seen.signal);
      weights.push(seen.weight);
    }
  }

  const pTamper = weights.length ? noisyOr(weights) : 0;
  const unaltered = pTamper < 0.5;
  const decision = decide<boolean>({
    id: "integrity.overall",
    question: "Are the submitted documents unaltered since they were issued?",
    verdict: unaltered,
    probability: unaltered ? 1 - pTamper : pTamper,
    severity: "critical",
    evidence: signals.flatMap((s) => s.evidence),
    ruleIds: [],
    // Rule-derived signals are certain; the model's makes the whole a judgment.
    source: signals.some((s) => s.source === "model") ? "model" : "rule",
    rationale: `${signals.filter((s) => !s.verdict).length} of ${signals.length} integrity signals raised.`,
  });

  const status: IntegrityStatus = decision.action === "review" ? "review" : unaltered ? "clear" : "blocked";
  const summary =
    status === "clear"
      ? "No sign that any document was altered."
      : status === "blocked"
        ? `Do not submit: a document appears to have been altered (${Math.round(pTamper * 100)}% likely). Ask the bank for a fresh original.`
        : `Possible alteration (${Math.round(pTamper * 100)}%) — a person should compare the statement with one obtained directly from the bank.`;
  log.emit("fraud", "result", `Integrity: ${status}. ${summary}`, { status, pTamper, signals: signals.length });

  void profile;
  return { status, pTamper, signals, decision, summary };
}
