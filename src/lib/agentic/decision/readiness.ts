import { calculateReadiness, type ScoringResult } from "@/lib/scoring/engine";
import { SCORING_RULES, type ScoringInput, type ScoringRule } from "@/lib/scoring/rules";

/**
 * The published readiness score, reported honestly while some of its inputs
 * are still awaiting a human.
 *
 * Most rules read things that are simply true or false — is the UBO declaration
 * uploaded? A few read what a model extracted from a document, and when the
 * Judge routes one of those to a person, the rule's outcome is genuinely
 * unknown. Rather than guess, the engine scores the file both ways and reports
 * the range.
 *
 * It reuses `calculateReadiness` unchanged — the same 32 rules, the same seven
 * categories and the same per-category floors — by pinning each pending rule's
 * `when` to true or false.
 */

export interface PendingRule {
  ruleId: string;
  /** Probability that the rule's condition really holds, i.e. that it deducts. */
  pFires: number;
}

export interface ReadinessRange {
  /** Most likely score: each pending deduction weighted by its probability. */
  expected: number;
  /** Every pending deduction applies. */
  low: number;
  /** No pending deduction applies. */
  high: number;
  /** Rules whose outcome waits on a human answer. */
  pending: string[];
  /** Full result with pending rules evaluated on the values as extracted. */
  asExtracted: ScoringResult;
}

function pinned(
  rules: readonly ScoringRule[],
  ids: Set<string>,
  fires: (id: string) => boolean
): ScoringRule[] {
  return rules.map((r) => (ids.has(r.id) ? { ...r, when: () => fires(r.id) } : r));
}

export function readinessWithUncertainty(
  input: ScoringInput,
  pending: PendingRule[],
  rules: readonly ScoringRule[] = SCORING_RULES
): ReadinessRange {
  const ids = new Set(pending.map((p) => p.ruleId));
  const asExtracted = calculateReadiness(input, rules);

  if (ids.size === 0) {
    const s = asExtracted.overallScore;
    return { expected: s, low: s, high: s, pending: [], asExtracted };
  }

  const low = calculateReadiness(input, pinned(rules, ids, () => true)).overallScore;
  const high = calculateReadiness(input, pinned(rules, ids, () => false)).overallScore;

  // Each pending rule's marginal cost, measured on its own so the category
  // floor is respected; the clamp absorbs the small interaction between two
  // pending rules that share a floored category.
  let expected = high;
  for (const { ruleId, pFires } of pending) {
    const onlyThis = calculateReadiness(
      input,
      pinned(rules, ids, (id) => id === ruleId)
    ).overallScore;
    expected -= (high - onlyThis) * Math.min(1, Math.max(0, pFires));
  }
  expected = Math.round(Math.min(high, Math.max(low, expected)) * 10) / 10;

  return { expected, low, high, pending: [...ids], asExtracted };
}
