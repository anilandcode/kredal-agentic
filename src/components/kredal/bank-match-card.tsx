import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankMatch } from "@/lib/scoring/bank-match";

function fitTone(score: number): string {
  if (score >= 80) return "bg-risk-low-bg text-risk-low-foreground";
  if (score >= 55) return "bg-risk-medium-bg text-risk-medium-foreground";
  return "bg-risk-high-bg text-risk-high-foreground";
}

/**
 * Agent 9 UI — ranked bank fit for the current file. Server component; input
 * comes from the same deterministic signals the scoring engine uses.
 */
export function BankMatchCard({ matches }: { matches: BankMatch[] }) {
  const top = matches.slice(0, 3);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Landmark className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-h3 font-semibold">Bank match</h2>
      </div>
      <p className="mb-4 text-caption text-muted-foreground">
        Which banks this file fits best, from the same signals as your score.
        Guidance only — never a guarantee of approval.
      </p>
      <div className="space-y-3">
        {top.map((m, i) => (
          <div
            key={m.bank}
            className="rounded-md border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium">
                {i + 1}. {m.bank}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium tabular-nums",
                  fitTone(m.score)
                )}
              >
                {m.score}/100 fit
              </span>
            </div>
            {m.blockers.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-caption text-muted-foreground">
                {m.blockers.slice(0, 2).map((b, j) => (
                  <li key={j}>• {b}</li>
                ))}
              </ul>
            ) : m.reasons.length > 0 ? (
              <p className="mt-2 text-caption text-muted-foreground">
                {m.reasons[0]}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
