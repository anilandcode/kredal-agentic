import type { AgentName, RunLog } from "../events";
import type { Tier } from "../models";

/**
 * The Healer's second layer: a supervisor around every agent step.
 *
 * Model failover (in `models.ts`) handles a model that cannot answer. This
 * handles an answer that is *wrong in a detectable way* — it fails its schema,
 * it is too unsure to use, or it contradicts another document. Each failure
 * kind has its own repair, and every detection and repair is on the timeline.
 *
 * What it never does is guess. When the repairs are exhausted the step comes
 * back `unresolved`, and the Judge turns that into a question for a person.
 */

export type ProblemKind =
  | "schema_invalid"
  | "low_confidence"
  | "contradiction"
  | "model_error"
  | "tool_error";

export interface Problem {
  kind: ProblemKind;
  detail: string;
  /** Fields the problem concerns, so the repair can focus on them. */
  fields?: string[];
}

/** How the next attempt should differ from the last. */
export interface Attempt {
  number: number;
  tier: Tier;
  /** Instruction added to the prompt describing what went wrong last time. */
  repairHint?: string;
}

export type HealResult<T> =
  | { ok: true; value: T; attempts: number; healed: boolean }
  | { ok: false; problem: Problem; attempts: number; lastValue?: T };

/** The repair for each failure kind. Pure, so it is unit-tested directly. */
export function repairFor(problem: Problem, previous: Attempt): Omit<Attempt, "number"> {
  const focus = problem.fields?.length ? ` Focus on: ${problem.fields.join(", ")}.` : "";
  switch (problem.kind) {
    case "schema_invalid":
      // Same tier: the model can usually fix its own output once shown the error.
      return {
        tier: previous.tier,
        repairHint: `Your previous answer did not match the required schema: ${problem.detail}. Answer again, exactly in the schema.`,
      };
    case "low_confidence":
      // Escalate: a stronger model reading the same page more carefully.
      return {
        tier: "strong",
        repairHint: `A previous reading was uncertain (${problem.detail}). Read the document again slowly; quote exactly what is printed.${focus}`,
      };
    case "contradiction":
      return {
        tier: "strong",
        repairHint: `Your reading conflicts with another document (${problem.detail}). Re-read and report precisely what this document says, character by character.${focus}`,
      };
    case "model_error":
    case "tool_error":
      // Transient by assumption; the model chain itself has already failed over.
      return { tier: previous.tier };
  }
}

export interface SuperviseOptions<T> {
  agent: AgentName;
  /** Human-readable name of the step, for the timeline. */
  label: string;
  log: RunLog;
  run: (attempt: Attempt) => Promise<T>;
  /** Return a problem if the output is unusable as it stands. */
  check: (value: T) => Problem | null;
  startTier?: Tier;
  maxAttempts?: number;
}

export async function supervise<T>(opts: SuperviseOptions<T>): Promise<HealResult<T>> {
  const max = opts.maxAttempts ?? 3;
  let attempt: Attempt = { number: 1, tier: opts.startTier ?? "fast" };
  let lastValue: T | undefined;
  let problem: Problem | null = null;

  while (attempt.number <= max) {
    try {
      const value = await opts.run(attempt);
      lastValue = value;
      problem = opts.check(value);
    } catch (err) {
      problem = { kind: "model_error", detail: err instanceof Error ? err.message : String(err) };
    }

    if (!problem) {
      if (attempt.number > 1) {
        opts.log.emit("healer", "heal", `${opts.label}: repaired on attempt ${attempt.number}.`, {
          strategy: "verified",
          agent: opts.agent,
          attempts: attempt.number,
        });
      }
      return { ok: true, value: lastValue as T, attempts: attempt.number, healed: attempt.number > 1 };
    }

    if (attempt.number === max) break;

    const repair = repairFor(problem, attempt);
    opts.log.emit(
      "healer",
      "heal",
      `${opts.label}: ${problem.kind.replace("_", " ")} — ${problem.detail}. Retrying on the ${repair.tier} tier.`,
      { strategy: problem.kind, agent: opts.agent, attempt: attempt.number, nextTier: repair.tier, fields: problem.fields }
    );
    attempt = { number: attempt.number + 1, ...repair };
  }

  opts.log.emit(
    "healer",
    "warning",
    `${opts.label}: still unresolved after ${max} attempts — a person will be asked.`,
    { agent: opts.agent, problem }
  );
  return { ok: false, problem: problem!, attempts: max, lastValue };
}
