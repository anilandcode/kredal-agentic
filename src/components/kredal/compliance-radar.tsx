import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadarItem } from "@/lib/compliance";

const DOT: Record<RadarItem["severity"], string> = {
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

/**
 * Agent 10 UI — time-based compliance exposure for this company: expiring
 * documents, corporate-tax deadline, VAT posture, WPS, bank document gaps.
 */
export function ComplianceRadar({ items }: { items: RadarItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Radar className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-h3 font-semibold">Compliance radar</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          No compliance items due. Kredal watches document expiries and the
          2026 tax, VAT, and WPS deadlines for you.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  DOT[item.severity]
                )}
                aria-hidden
              />
              <div>
                <p className="text-body-sm font-medium">{item.label}</p>
                <p className="text-caption text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
