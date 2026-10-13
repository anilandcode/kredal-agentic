import { riskLevel } from "@/lib/scoring/risk";
import {
  SCORING_CATEGORIES,
  SCORING_RULES,
  type ScoringInput,
} from "@/lib/scoring/rules";
import type { CategoryScore, ReadinessFlag, RiskLevel } from "@/lib/types";

export const SCORING_VERSION = "v0";

export type { ScoringInput };

export interface ScoringResult {
  overallScore: number;
  riskLevel: RiskLevel;
  categoryScores: Record<string, CategoryScore>;
  flags: ReadinessFlag[];
  recommendations: string[];
}

function categoryLabelFor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Fair";
  if (pct >= 20) return "Needs work";
  return "Insufficient";
}

/**
 * Deterministic readiness scoring (TECH_SPEC.md §6). Rules live declaratively in
 * `rules.ts`; this function evaluates them, per category, into a score + flags.
 */
export function calculateReadiness(input: ScoringInput): ScoringResult {
  const categoryScores: Record<string, CategoryScore> = {};
  const flags: ReadinessFlag[] = [];
  let overallScore = 0;

  for (const category of SCORING_CATEGORIES) {
    let deductions = 0;
    const categoryFlags: ReadinessFlag[] = [];

    for (const rule of SCORING_RULES) {
      if (rule.category !== category.id) continue;
      if (!rule.when(input)) continue;
      deductions += rule.points;
      categoryFlags.push({
        severity: rule.severity,
        category: category.id,
        issue: rule.issueFor ? rule.issueFor(input) : rule.issue,
        fix: rule.fix,
      });
    }

    const score = Math.max(0, category.max - deductions);
    categoryScores[category.id] = {
      score,
      max: category.max,
      label: categoryLabelFor(score, category.max),
      detail: categoryFlags.map((f) => f.issue).join(" ") || "No issues found.",
    };
    overallScore += score;
    flags.push(...categoryFlags);
  }

  const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const recommendations = [...new Set(flags.map((f) => f.fix))].slice(0, 7);
  if (recommendations.length === 0) {
    recommendations.push(
      "Your file looks bank-ready. Keep documents current and re-run this assessment before you apply."
    );
  }

  return {
    overallScore: Math.round(overallScore),
    riskLevel: riskLevel(overallScore),
    categoryScores,
    flags,
    recommendations,
  };
}
