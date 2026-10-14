import { AGENT_LABEL, type RunEvent } from "@/lib/agentic/view";
import { cn } from "@/lib/utils";

/**
 * The run as it happened: one row per event, each agent with its own colour.
 * Healing gets the brand accent — it is the moment worth watching.
 */

const AGENT_DOT: Record<RunEvent["agent"], string> = {
  orchestrator: "bg-foreground/60",
  intake: "bg-chart-3",
  extractor: "bg-chart-2",
  verifier: "bg-chart-4",
  fraud: "bg-risk-high",
  judge: "bg-foreground",
  advisor: "bg-chart-1",
  healer: "bg-brand",
  learner: "bg-risk-low",
};

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function RunTimeline({ events, live = false }: { events: RunEvent[]; live?: boolean }) {
  return (
    <ol className="divide-y divide-border rounded-lg border border-border bg-card" aria-live={live ? "polite" : undefined}>
      {events.map((e) => {
        const heal = e.kind === "heal";
        const review = e.kind === "decision" && e.data?.action === "review";
        const acted = e.kind === "decision" && e.data?.action === "act";
        return (
          <li
            key={e.seq}
            className={cn(
              "grid grid-cols-[3.25rem_7.5rem_1fr] items-baseline gap-3 px-4 py-2.5 text-body-sm",
              heal && "border-l-2 border-l-brand bg-brand/5",
              e.kind === "result" && "bg-muted",
              e.kind === "error" && "bg-risk-high-bg"
            )}
          >
            <span className="font-mono text-caption text-muted-foreground tabular-nums">{seconds(e.t)}</span>
            <span className="flex items-center gap-2 text-caption font-medium">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", AGENT_DOT[e.agent])} aria-hidden />
              {AGENT_LABEL[e.agent]}
            </span>
            <span className={cn(e.kind === "stage" && "text-muted-foreground", e.kind === "result" && "font-medium")}>
              {heal && <span className="mr-2 rounded-sm bg-brand px-1.5 py-0.5 text-caption font-medium text-white">Healed</span>}
              {review && <span className="mr-2 rounded-sm bg-risk-medium-bg px-1.5 py-0.5 text-caption font-medium text-risk-medium-foreground">Needs a person</span>}
              {acted && <span className="mr-2 rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">Acted</span>}
              {e.message}
            </span>
          </li>
        );
      })}
      {live && (
        <li className="flex items-center gap-2 px-4 py-2.5 text-caption text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden /> Agents working…
        </li>
      )}
    </ol>
  );
}
