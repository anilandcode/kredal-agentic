"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AnswerView, DecisionView } from "@/lib/agentic/view";

/**
 * One question the engine would not answer alone. The person's answer is
 * recorded as a verified outcome, and the model's calibration moves.
 */
export function ReviewQuestion({
  runId,
  decision,
  answered,
}: {
  runId: string;
  decision: DecisionView;
  answered?: AnswerView;
}) {
  const [state, setState] = useState<AnswerView | null>(answered ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function answer(value: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, judgmentId: decision.id, answer: value }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setState({ answer: value, correct: body.correct, at: new Date().toISOString(), message: body.message });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-border bg-risk-medium-bg/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-risk-medium-bg px-1.5 py-0.5 text-caption font-medium text-risk-medium-foreground">
          Needs a person
        </span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-caption">
          {Math.round(decision.probability * 100)}%
        </span>
        <span className="text-caption text-muted-foreground">
          {decision.severity}
          {decision.model ? ` · ${decision.model}` : ""}
        </span>
      </div>
      <p className="mt-2 text-body-sm font-medium">{decision.question}</p>
      {decision.rationale && (
        <p className="mt-1 text-body-sm text-muted-foreground">
          The model leans {decision.verdict ? "yes" : "no"}: {decision.rationale}
        </p>
      )}
      <p className="mt-1 text-caption text-muted-foreground">{decision.reason}</p>

      {state ? (
        <p className="mt-3 rounded-md bg-card p-3 text-body-sm">
          <span className="font-medium">You answered {state.answer ? "yes" : "no"}.</span> {state.message}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => answer(true)} disabled={busy}>
            Yes
          </Button>
          <Button size="sm" variant="outline" onClick={() => answer(false)} disabled={busy}>
            No
          </Button>
          <span className="text-caption text-muted-foreground">Your answer teaches the Learner how far to trust this model.</span>
        </div>
      )}
      {error && <p className="mt-2 text-caption text-risk-high-foreground">{error}</p>}
    </li>
  );
}
