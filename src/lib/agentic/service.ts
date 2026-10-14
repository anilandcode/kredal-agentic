import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { RunLog, type EventSink } from "./events";
import { AE } from "./jurisdictions/ae";
import { calibrateWith, loadCalibrators, recordOutcomes, type Observation } from "./learning/calibrators";
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
  const { verdicts, advice, accuracy, integrity, screening } = outcome;
  const decisionView = (d: (typeof verdicts.decisions)[number]) => ({
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
  });
  return {
    screening: {
      status: screening.status,
      summary: screening.summary,
      notice: screening.notice,
      checked: screening.decisions.length,
    },
    integrity: {
      status: integrity.status,
      pTamper: integrity.pTamper,
      summary: integrity.summary,
      signals: integrity.signals.map((s) => ({
        id: s.id,
        question: s.question,
        verdict: s.verdict,
        probability: s.probability,
        source: s.source,
        model: s.model ?? null,
        rationale: s.rationale ?? null,
        evidence: s.evidence.map((e) => e.quote).filter(Boolean) as string[],
      })),
    },
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
    decisions: [...screening.decisions, integrity.decision, ...verdicts.decisions].map(decisionView),
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

    // Learn from the run: every field read against ground truth is a verified
    // outcome for that model's calibration. (For a real customer the same
    // outcomes come from people answering the review questions.)
    if (outcome.accuracy) {
      const truth = Object.fromEntries(c.documents.map((d) => [d.file, d.truth]));
      const byModel = new Map<string, Observation[]>();
      const missed = new Set(outcome.accuracy.misses.map((m) => `${m.file}:${m.field}`));
      for (const e of outcome.extractions) {
        for (const field of Object.keys(truth[e.file] ?? {})) {
          const read = e.fields[field];
          if (!read || !e.model) continue;
          const list = byModel.get(e.model) ?? [];
          list.push({ raw: read.confidence, correct: !missed.has(`${e.file}:${field}`) });
          byModel.set(e.model, list);
        }
      }
      for (const [model, obs] of byModel) {
        const cal = await recordOutcomes(model, "field_read", obs);
        log.emit(
          "learner",
          "step",
          `Learned from ${obs.length} verified reads by ${model}: after ${cal.observations} checked reads, a 99% claim is now trusted at ${(cal.calibrate(0.99) * 100).toFixed(1)}%.`,
          { model, kind: "field_read", observations: cal.observations, at99: cal.calibrate(0.99), ece: cal.expectedCalibrationError() }
        );
      }
    }

    await log.flush();
    await ref.set(
      {
        status: "done",
        finishedAt: new Date().toISOString(),
        durationMs: log.events.at(-1)?.t ?? null,
        heals: log.events.filter((e) => e.kind === "heal").length,
        integrity: outcome.integrity.status,
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
