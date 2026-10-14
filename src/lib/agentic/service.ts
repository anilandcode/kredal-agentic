import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { RunLog, type EventSink } from "./events";
import { AE } from "./jurisdictions/ae";
import { calibrateWith, loadCalibrators } from "./learning/calibrators";
import { runCase, type RunOutcome } from "./run";
import { specimenCase } from "./specimens";
import { appendEvent, runs } from "./store/firestore";

/**
 * Start a run of the agent team on a specimen case, persist it as it happens,
 * and stream its events to any extra sink (the SSE response).
 *
 * Persistence is best-effort per event — a Firestore hiccup must never stop a
 * run in front of a judge — and authoritative at the end, when the full event
 * list and result are written in one place.
 */

export interface StartOptions {
  caseId: string;
  chaos?: boolean;
  sinks?: EventSink[];
}

export interface StartedRun {
  runId: string;
  outcome: RunOutcome | null;
  error?: string;
}

/** What a stored run keeps — enough to replay the whole view without re-running. */
function summarise(outcome: RunOutcome) {
  const { verdicts, advice, accuracy } = outcome;
  return {
    range: {
      expected: verdicts.range.expected,
      low: verdicts.range.low,
      high: verdicts.range.high,
      pending: verdicts.range.pending,
    },
    risk: verdicts.range.asExtracted.riskLevel,
    categoryScores: verdicts.range.asExtracted.categoryScores,
    flags: verdicts.range.asExtracted.flags,
    disagreements: verdicts.disagreements,
    decisions: verdicts.decisions.map((d) => ({
      id: d.judgment.id,
      question: d.judgment.question,
      action: d.action,
      reason: d.reason,
      verdict: d.judgment.verdict,
      probability: d.judgment.probability,
      rawProbability: d.judgment.rawProbability ?? null,
      severity: d.judgment.severity,
      source: d.judgment.source,
      model: d.judgment.model ?? null,
      rationale: d.judgment.rationale ?? null,
      ruleIds: d.judgment.ruleIds,
    })),
    questions: verdicts.questions.map((q) => q.judgment.id),
    nextActions: advice.nextActions,
    recovery: advice.recovery,
    packMarkdown: advice.packMarkdown,
    accuracy,
    intake: outcome.intake,
    extractions: outcome.extractions.map((e) => ({
      file: e.file,
      docType: e.docType,
      model: e.model,
      attempts: e.attempts,
      healed: e.healed,
      unresolved: e.unresolved ?? null,
      fields: e.fields,
    })),
  };
}

export type RunSummary = ReturnType<typeof summarise>;

export async function startSpecimenRun(opts: StartOptions): Promise<StartedRun> {
  const c = specimenCase(opts.caseId);
  if (!c) throw new Error(`Unknown case: ${opts.caseId}`);

  const runId = randomUUID();
  const ref = runs().doc(runId);
  const startedAt = new Date().toISOString();
  await ref.set({
    caseId: c.id,
    caseTitle: c.title,
    status: "running",
    chaos: opts.chaos === true,
    specimen: true,
    startedAt,
  });

  const log = new RunLog([
    ...(opts.sinks ?? []),
    (event) => appendEvent(runId, event),
  ]);
  log.emit("orchestrator", "step", `Run ${runId.slice(0, 8)} — ${c.title}.`, { runId, caseId: c.id });

  try {
    const dir = path.join(process.cwd(), "public", "specimens", c.id);
    const files = await Promise.all(
      c.documents.map(async (d) => ({
        id: d.id,
        name: d.file,
        mimeType: d.file.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        base64: (await readFile(path.join(dir, d.file))).toString("base64"),
      }))
    );
    const calibrators = await loadCalibrators();
    if (calibrators.size > 0) {
      log.emit("learner", "step", `Loaded ${calibrators.size} calibration curve${calibrators.size === 1 ? "" : "s"} learned from past human answers.`);
    }

    const outcome = await runCase(
      {
        caseId: c.id,
        profile: c,
        files,
        pack: AE,
        chaos: opts.chaos,
        truth: Object.fromEntries(c.documents.map((d) => [d.file, d.truth])),
      },
      log,
      calibrateWith(calibrators)
    );

    await log.flush();
    await ref.set(
      {
        status: "done",
        finishedAt: new Date().toISOString(),
        durationMs: log.events.at(-1)?.t ?? null,
        heals: log.events.filter((e) => e.kind === "heal").length,
        result: summarise(outcome),
      },
      { merge: true }
    );
    return { runId, outcome };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.emit("orchestrator", "error", `Run failed: ${message.slice(0, 300)}`);
    await log.flush();
    await ref.set({ status: "failed", finishedAt: new Date().toISOString(), error: message.slice(0, 500) }, { merge: true });
    return { runId, outcome: null, error: message };
  }
}
