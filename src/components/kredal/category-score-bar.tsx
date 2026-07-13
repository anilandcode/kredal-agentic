import { riskLevel } from "@/lib/scoring/risk";
import type { CategoryScore } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  document_completeness: "Document completeness",
  ownership_consistency: "Identity & ownership consistency",
  source_of_funds: "Source-of-funds strength",
  business_activity: "Business activity clarity",
  bank_fit: "Bank fit",
  uae_history: "UAE founder/company history",
  compliance_readiness: "Compliance readiness",
};

const RISK_BAR_COLOR = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
} as const;

export function CategoryScoreBar({
  categoryId,
  score,
}: {
  categoryId: string;
  score: CategoryScore;
}) {
  const pct = score.max > 0 ? (score.score / score.max) * 100 : 0;
  const level = riskLevel(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-body-sm">
        <span>{CATEGORY_LABELS[categoryId] ?? categoryId}</span>
        <span className="tabular-nums text-muted-foreground">
          {score.score}/{score.max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${RISK_BAR_COLOR[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
