import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";
import type { ReadinessFlag } from "@/lib/types";

const SEVERITY_STYLES = {
  high: {
    icon: AlertOctagon,
    border: "border-l-risk-high",
    badge: "bg-risk-high-bg text-risk-high-foreground",
    label: "High",
  },
  medium: {
    icon: AlertTriangle,
    border: "border-l-risk-medium",
    badge: "bg-risk-medium-bg text-risk-medium-foreground",
    label: "Medium",
  },
  low: {
    icon: ShieldCheck,
    border: "border-l-risk-low",
    badge: "bg-risk-low-bg text-risk-low-foreground",
    label: "Low",
  },
} as const;

export function RiskCard({ flag }: { flag: ReadinessFlag }) {
  const style = SEVERITY_STYLES[flag.severity];
  const Icon = style.icon;

  return (
    <div className={`rounded-md border border-border border-l-[3px] ${style.border} bg-card p-3`}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
        <span className={`rounded-full px-2 py-0.5 text-caption font-medium ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <p className="text-body-sm font-medium">{flag.issue}</p>
      <p className="mt-1 text-body-sm text-muted-foreground">
        <span className="font-medium text-foreground">Fix: </span>
        {flag.fix}
      </p>
    </div>
  );
}
