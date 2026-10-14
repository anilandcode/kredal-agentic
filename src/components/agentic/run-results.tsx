import { ScoreGauge } from "@/components/kredal/score-gauge";
import type { DecisionView, RunSummaryView } from "@/lib/agentic/view";
import { cn } from "@/lib/utils";

/**
 * What the agents concluded: the score (as a range while anything is pending),
 * every decision with its probability and evidence, what to do next, and how
 * accurate the reading was against ground truth.
 */

const pct = (p: number) => `${Math.round(p * 100)}%`;

function Probability({ d }: { d: DecisionView }) {
  if (d.source === "rule") {
    return <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-caption">rule · certain</span>;
  }
  const calibrated = d.rawProbability !== null && Math.abs(d.rawProbability - d.probability) >= 0.01;
  return (
    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-caption" title={d.model ?? undefined}>
      {pct(d.probability)}
      {calibrated && <span className="text-muted-foreground"> (model said {pct(d.rawProbability!)})</span>}
    </span>
  );
}

function Decision({ d }: { d: DecisionView }) {
  const review = d.action === "review";
  return (
    <li className={cn("rounded-lg border border-border p-4", review ? "bg-risk-medium-bg/40" : "bg-card")}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-caption font-medium",
            review ? "bg-risk-medium-bg text-risk-medium-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {review ? "Needs a person" : "Acted"}
        </span>
        <Probability d={d} />
        <span className="text-caption text-muted-foreground">
          {d.verdict ? "yes" : "no"} · {d.severity}
          {d.model ? ` · ${d.model}` : ""}
        </span>
      </div>
      <p className="mt-2 text-body-sm font-medium">{d.question}</p>
      {d.rationale && <p className="mt-1 text-body-sm text-muted-foreground">{d.rationale}</p>}
      <p className="mt-1 text-caption text-muted-foreground">{d.reason}</p>
    </li>
  );
}

export function RunResults({ summary }: { summary: RunSummaryView }) {
  const { range } = summary;
  const settled = range.low === range.high;
  const reviews = summary.decisions.filter((d) => d.action === "review");
  const acted = summary.decisions.filter((d) => d.action === "act");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <ScoreGauge score={Math.round(range.expected)} riskLevel={summary.risk} />
        <div>
          <p className="eyebrow">Readiness</p>
          {settled ? (
            <p className="mt-1 text-h2 font-semibold">{range.low}/100 — every check settled</p>
          ) : (
            <>
              <p className="mt-1 text-h2 font-semibold">
                {range.low}–{range.high}/100, most likely {range.expected}
              </p>
              <p className="mt-1 text-body-sm text-muted-foreground">
                {range.pending.length} check{range.pending.length === 1 ? "" : "s"} wait on a person. Answer{" "}
                {range.pending.length === 1 ? "it" : "them"} and the range collapses to one number.
              </p>
            </>
          )}
          {summary.accuracy && (
            <p className="mt-3 text-body-sm">
              <span className="font-medium">
                Extraction accuracy: {summary.accuracy.correct}/{summary.accuracy.total} fields
              </span>{" "}
              <span className="text-muted-foreground">— measured against the specimen&apos;s ground truth, not self-reported.</span>
            </p>
          )}
          {summary.accuracy?.misses.map((m) => (
            <p key={`${m.file}-${m.field}`} className="text-caption text-muted-foreground">
              Missed {m.field} on {m.file}: read “{m.got ?? "nothing"}”, printed “{m.want}”
              {m.confidence !== null ? ` (claimed ${pct(m.confidence)})` : ""}.
            </p>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section>
          <h3 className="text-h3 font-semibold">Questions for a person</h3>
          <ul className="mt-3 space-y-3">{reviews.map((d) => <Decision key={d.id} d={d} />)}</ul>
        </section>
      )}

      <section>
        <h3 className="text-h3 font-semibold">What to do next</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body-sm">
          {summary.nextActions.map((a) => <li key={a}>{a}</li>)}
        </ol>
        {summary.recovery && (
          <div className="mt-4 rounded-lg border border-border bg-card-warm p-4 text-body-sm">
            <p className="font-medium">Rejection recovery — {summary.recovery.causeLabel}</p>
            <p className="text-muted-foreground">{summary.recovery.timeline}</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-h3 font-semibold">Every decision</h3>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Each is a typed judgment with a probability. Rules are certain; a model must clear the bar for its severity, or a
          person is asked.
        </p>
        <ul className="mt-3 space-y-3">{acted.map((d) => <Decision key={d.id} d={d} />)}</ul>
      </section>

      <section>
        <h3 className="text-h3 font-semibold">What the agents read</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {summary.extractions.map((e) => (
            <div key={e.file} className="rounded-lg border border-border bg-card p-4">
              <p className="text-body-sm font-medium">{e.docType.replace(/_/g, " ")}</p>
              <p className="text-caption text-muted-foreground">
                {e.file} · {e.model ?? "model unknown"} · {e.attempts} attempt{e.attempts === 1 ? "" : "s"}
                {e.healed ? " · healed" : ""}
              </p>
              <table className="mt-3 w-full text-caption">
                <tbody>
                  {Object.entries(e.fields).map(([k, f]) => (
                    <tr key={k} className="border-t border-border">
                      <td className="py-1.5 pr-2 text-muted-foreground">{k.replace(/_/g, " ")}</td>
                      <td className="py-1.5 pr-2 font-mono">{f.value ?? "—"}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">{pct(f.confidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
