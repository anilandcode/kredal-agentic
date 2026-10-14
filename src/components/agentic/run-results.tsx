import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";
import { ScoreGauge } from "@/components/kredal/score-gauge";
import {
  answerKey,
  type AnswerView,
  type DecisionView,
  type IntegrityView,
  type RunSummaryView,
  type ScreeningView,
} from "@/lib/agentic/view";
import { cn } from "@/lib/utils";
import { ReviewQuestion } from "./review-question";

const SCREEN = {
  clear: { Icon: ShieldCheck, title: "Screening: clear", box: "bg-muted text-foreground" },
  review: { Icon: AlertTriangle, title: "Screening: needs a person", box: "bg-risk-medium-bg text-risk-medium-foreground" },
  hit: { Icon: AlertOctagon, title: "Screening: possible match — escalate", box: "bg-risk-high-bg text-risk-high-foreground" },
} as const;

function ScreeningPanel({ screening }: { screening: ScreeningView }) {
  const { Icon, title, box } = SCREEN[screening.status];
  return (
    <section className={cn("rounded-lg p-4", box)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <div>
          <p className="text-body-sm font-semibold">{title}</p>
          <p className="text-body-sm">{screening.summary}</p>
          <p className="mt-1 text-caption opacity-75">{screening.notice}</p>
        </div>
      </div>
    </section>
  );
}

const GATE = {
  clear: { Icon: ShieldCheck, title: "Integrity: clear", box: "bg-risk-low-bg text-risk-low-foreground" },
  review: { Icon: AlertTriangle, title: "Integrity: needs a person", box: "bg-risk-medium-bg text-risk-medium-foreground" },
  blocked: { Icon: AlertOctagon, title: "Integrity: do not submit", box: "bg-risk-high-bg text-risk-high-foreground" },
} as const;

/**
 * Sits above the score on purpose. An altered document does not make a file
 * weaker — it makes it unsubmittable, whatever the readiness number says.
 */
function IntegrityGate({ integrity }: { integrity: IntegrityView }) {
  const { Icon, title, box } = GATE[integrity.status];
  const raised = integrity.signals.filter((s) => !s.verdict);
  return (
    <section className={cn("rounded-lg p-5", box)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          <p className="text-h3 font-semibold">{title}</p>
          <p className="mt-1 text-body-sm">{integrity.summary}</p>
        </div>
      </div>
      {raised.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-current/15 pt-4 text-body-sm">
          {raised.map((s) => (
            <li key={s.id}>
              <span className="font-medium">{s.source === "rule" ? "Fact" : `Gemini (${pct(s.probability)})`}:</span>{" "}
              {s.rationale}
              {s.evidence.length > 0 && s.source === "model" && (
                <span className="block text-caption opacity-80">{s.evidence.join(" · ")}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

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

export function RunResults({
  summary,
  runId,
  answers,
}: {
  summary: RunSummaryView;
  /** When present, questions can be answered in place. */
  runId?: string;
  answers?: Record<string, AnswerView>;
}) {
  const { range } = summary;
  const settled = range.low === range.high;
  const reviews = summary.decisions.filter((d) => d.action === "review");
  const acted = summary.decisions.filter((d) => d.action === "act");

  return (
    <div className="space-y-8">
      {summary.integrity && <IntegrityGate integrity={summary.integrity} />}
      {summary.screening && <ScreeningPanel screening={summary.screening} />}
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
          <p className="mt-1 text-body-sm text-muted-foreground">
            The engine would not decide these alone. Each answer is recorded as a verified outcome and moves that model&apos;s
            calibration — the next run trusts it exactly as much as it has earned.
          </p>
          <ul className="mt-3 space-y-3">
            {reviews.map((d) =>
              runId ? (
                <ReviewQuestion key={d.id} runId={runId} decision={d} answered={answers?.[answerKey(d.id)]} />
              ) : (
                <Decision key={d.id} d={d} />
              )
            )}
          </ul>
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
