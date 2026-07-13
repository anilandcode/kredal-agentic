import { cn } from "@/lib/utils";
import { COMPANY_STATUS_LABELS } from "@/lib/constants";
import type { CompanyStatus } from "@/lib/types";

const STATUS_STYLES: Record<CompanyStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_review: "bg-info/10 text-info border-info/30",
  ready: "bg-risk-low-bg text-risk-low-foreground border-risk-low/30",
  high_risk: "bg-risk-high-bg text-risk-high-foreground border-risk-high/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium",
        STATUS_STYLES[status]
      )}
    >
      {COMPANY_STATUS_LABELS[status]}
    </span>
  );
}
