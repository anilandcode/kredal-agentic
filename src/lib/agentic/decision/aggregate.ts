import type { Decision } from "./types";

/**
 * Combining judgments into a score that admits what it does not yet know.
 *
 * A file with three unresolved checks does not have one score; it has a range.
 * Rather than hide that behind a single number, the engine reports the score
 * if every pending check passes, if every one fails, and the expectation in
 * between — and names the checks whose answers would close the gap.
 */

const EPS = 1e-6;
const clampP = (p: number) => Math.min(1 - EPS, Math.max(EPS, p));
const logit = (p: number) => Math.log(clampP(p) / (1 - clampP(p)));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Pool several estimates of the same probability (e.g. two models asked the
 * same question) by weighted averaging in log-odds space. Averaging, not
 * summing, because the estimates share the same evidence — summing would count
 * it twice and manufacture certainty.
 */
export function poolLogOdds(probabilities: number[], weights?: number[]): number {
  if (probabilities.length === 0) throw new Error("poolLogOdds: no probabilities");
  const w = weights ?? probabilities.map(() => 1);
  const total = w.reduce((s, x) => s + x, 0);
  const pooled = probabilities.reduce((s, p, i) => s + w[i] * logit(p), 0) / total;
  return sigmoid(pooled);
}

/** Probability that at least one of several independent risks is real. */
export function noisyOr(probabilities: number[]): number {
  return 1 - probabilities.reduce((s, p) => s * (1 - p), 1);
}

/** The probability that the check behind a boolean judgment *passes*. */
export function passProbability(decision: Decision): number {
  const { verdict, probability } = decision.judgment;
  if (typeof verdict !== "boolean") {
    throw new Error(`passProbability: judgment ${decision.judgment.id} is not boolean`);
  }
  return verdict ? probability : 1 - probability;
}

export interface ScoredRule {
  ruleId: string;
  points: number;
  decision: Decision;
}

export interface ScoreWithUncertainty {
  /** Most likely score, weighting each pending check by its pass probability. */
  expected: number;
  /** Score if every pending check fails. */
  low: number;
  /** Score if every pending check passes. */
  high: number;
  /** Checks a human must answer before the range collapses to one number. */
  pending: string[];
}

export function scoreWithUncertainty(rules: ScoredRule[]): ScoreWithUncertainty {
  let settled = 0;
  let expectedPending = 0;
  let maxPending = 0;
  const pending: string[] = [];

  for (const { ruleId, points, decision } of rules) {
    const p = passProbability(decision);
    if (decision.action === "act") {
      // Acted on: the verdict stands, points are all or nothing.
      if (p >= 0.5) settled += points;
    } else {
      pending.push(ruleId);
      expectedPending += points * p;
      maxPending += points;
    }
  }

  const round = (x: number) => Math.round(x * 10) / 10;
  return {
    expected: round(settled + expectedPending),
    low: round(settled),
    high: round(settled + maxPending),
    pending,
  };
}
