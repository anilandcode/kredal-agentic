import type { Decision, Judgment, Severity, Verdict } from "./types";

/**
 * When may the engine act without a human?
 *
 * The bar rises with what a wrong call costs. A model judgment below its bar is
 * never silently accepted *or* silently rejected — it goes to a person with one
 * precise question. Rule and human judgments are certain by construction and
 * always act.
 */
export const ACT_THRESHOLD: Record<Severity, number> = {
  info: 0.6,
  standard: 0.85,
  critical: 0.97,
};

const pct = (p: number) => `${Math.round(p * 100)}%`;

export function decide<V extends Verdict>(
  judgment: Judgment<V>,
  thresholds: Record<Severity, number> = ACT_THRESHOLD
): Decision<V> {
  if (judgment.source === "rule") {
    return { judgment, action: "act", reason: "Deterministic rule — no model involved." };
  }
  if (judgment.source === "human") {
    return { judgment, action: "act", reason: "Confirmed by a person." };
  }

  const bar = thresholds[judgment.severity];
  const p = judgment.probability;
  const raw = judgment.rawProbability;

  if (p >= bar) {
    return {
      judgment,
      action: "act",
      reason: `${pct(p)} confidence clears the ${pct(bar)} bar for ${judgment.severity} checks.`,
    };
  }

  // Say *why* it is below the bar. When calibration is the reason, that is the
  // learning loop doing its job, and the reviewer should see it.
  const pulledDown = raw !== undefined && raw >= bar && p < bar;
  const reason = pulledDown
    ? `The model claimed ${pct(raw)}, but at that confidence it has been right ` +
      `${pct(p)} of the time — below the ${pct(bar)} needed for ${judgment.severity} checks.`
    : `${pct(p)} confidence is below the ${pct(bar)} bar for ${judgment.severity} checks.`;

  return {
    judgment,
    action: "review",
    reason,
    reviewQuestion: judgment.question,
  };
}
