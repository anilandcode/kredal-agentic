import type { RiskLevel } from "@/lib/types";

/**
 * The single place score bands map to risk. Every UI component must consume this —
 * see DESIGN_SYSTEM.md §7.4. Bands match TECH_SPEC.md §6: 80-100 low, 55-79 medium, 0-54 high.
 */
export function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 55) return "medium";
  return "high";
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export const RISK_ICON: Record<RiskLevel, string> = {
  low: "shield-check",
  medium: "alert-triangle",
  high: "alert-octagon",
};
