import { SCORING_RULES, type ScoringInput, type ScoringRule } from "@/lib/scoring/rules";
import { decide, type Decision, type Judgment } from "../decision";
import { readinessWithUncertainty, type PendingRule, type ReadinessRange } from "../decision/readiness";

/**
 * Judge: from judgments to decisions to a score.
 *
 * Pure — no model, no I/O — so every outcome is reproducible and unit-tested.
 *
 * Each rule-linked judgment settles or unsettles the published rules it feeds:
 *   - acted on, and agreeing with the rule as evaluated → settled;
 *   - acted on, but contradicting the rule → pending: a rule and a model
 *     disagree, which is exactly what a person should see;
 *   - sent for review → pending, weighted by the judgment's probability.
 * Pending rules make the score a range; answering the questions collapses it.
 */

export interface Verdicts {
  decisions: Decision<boolean>[];
  range: ReadinessRange;
  /** Decisions a person must answer, in the order to ask them. */
  questions: Decision<boolean>[];
  /** Rules where the model contradicted the rule as evaluated. */
  disagreements: string[];
}

/** For a judgment whose verdict means "this check passes": P(the rule deducts). */
function pFiresFrom(j: Judgment<boolean>, firesAsRead: boolean, isRead: boolean): number {
  if (isRead) {
    // A field read: if the read is right, the rule's outcome as evaluated stands.
    return firesAsRead ? j.probability : 1 - j.probability;
  }
  // A consistency check: the rule deducts when the check fails.
  return j.verdict ? 1 - j.probability : j.probability;
}

export function judge(
  input: ScoringInput,
  judgments: Judgment<boolean>[],
  rules: readonly ScoringRule[] = SCORING_RULES
): Verdicts {
  const decisions = judgments.map((j) => decide(j));
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const pending = new Map<string, PendingRule>();
  const disagreements: string[] = [];

  for (const d of decisions) {
    const j = d.judgment;
    const isRead = j.id.startsWith("read.");
    for (const ruleId of j.ruleIds) {
      const rule = ruleById.get(ruleId);
      if (!rule) continue;
      const firesAsRead = rule.when(input);
      const pFires = pFiresFrom(j, firesAsRead, isRead);

      let unsettled = d.action === "review";
      if (!unsettled && !isRead) {
        const modelSaysFires = !j.verdict;
        if (modelSaysFires !== firesAsRead) {
          unsettled = true;
          disagreements.push(ruleId);
        }
      }
      if (!unsettled) continue;

      // Several judgments can unsettle one rule; keep the most uncertain view.
      const prev = pending.get(ruleId);
      if (!prev || Math.abs(pFires - 0.5) < Math.abs(prev.pFires - 0.5)) {
        pending.set(ruleId, { ruleId, pFires });
      }
    }
  }

  const range = readinessWithUncertainty(input, [...pending.values()], rules);
  const order = { critical: 0, standard: 1, info: 2 } as const;
  const questions = decisions
    .filter((d) => d.action === "review" || (d.judgment.ruleIds.some((r) => disagreements.includes(r)) && d.judgment.source === "model"))
    .sort((a, b) => order[a.judgment.severity] - order[b.judgment.severity] || a.judgment.probability - b.judgment.probability);

  return { decisions, range, questions, disagreements: [...new Set(disagreements)] };
}
