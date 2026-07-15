import { ChevronDown } from "lucide-react";
import { RISK_LABEL } from "@/lib/scoring/risk";
import { cn } from "@/lib/utils";
import type { ReadinessAssessment, ReadinessFlag, RiskLevel } from "@/lib/types";

const RISK_BADGE: Record<RiskLevel, string> = {
  low: "bg-risk-low-bg text-risk-low-foreground",
  medium: "bg-risk-medium-bg text-risk-medium-foreground",
  high: "bg-risk-high-bg text-risk-high-foreground",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Prior assessment snapshots (excluding the latest), expandable per run. */
export function AssessmentHistory({
  assessments,
}: {
  assessments: ReadinessAssessment[];
}) {
  if (assessments.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 text-h3 font-semibold">
        Previous assessments ({assessments.length})
      </h2>
      <ul className="space-y-2">
        {assessments.map((a) => {
          const flags = a.flags as ReadinessFlag[];
          return (
            <li key={a.id}>
              <details className="group rounded-md border border-border">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-body-sm [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums font-semibold">
                      {a.overall_score}/100
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-caption font-medium",
                        RISK_BADGE[a.risk_level]
                      )}
                    >
                      {RISK_LABEL[a.risk_level]}
                    </span>
                    <span className="text-muted-foreground">
                      {flags.length} flag{flags.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-caption text-muted-foreground">
                    {formatDateTime(a.created_at)}
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      strokeWidth={1.5}
                    />
                  </span>
                </summary>
                <div className="border-t border-border px-3 py-2">
                  {flags.length === 0 ? (
                    <p className="text-body-sm text-muted-foreground">
                      No issues found in this run.
                    </p>
                  ) : (
                    <ul className="list-inside list-disc space-y-1 text-body-sm text-muted-foreground">
                      {flags.map((f, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">
                            [{f.severity}]
                          </span>{" "}
                          {f.issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
