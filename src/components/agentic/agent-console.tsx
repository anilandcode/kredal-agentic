"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RunEvent, RunSummaryView, StoredRun } from "@/lib/agentic/view";
import { RunResults } from "./run-results";
import { RunTimeline } from "./run-timeline";

export interface CaseCard {
  id: string;
  title: string;
  summary: string;
  expect: string;
  documents: { id: string; type: string; file: string; url: string }[];
}

type Phase = "idle" | "running" | "done" | "failed";

/**
 * Start a run and watch it. The run streams as Server-Sent Events over the POST
 * response (EventSource only does GET), parsed here frame by frame; when it
 * ends, the stored result is fetched so the view matches the replay exactly.
 */
export function AgentConsole({ cases }: { cases: CaseCard[] }) {
  const [selected, setSelected] = useState(cases[0]?.id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [summary, setSummary] = useState<RunSummaryView | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const current = cases.find((c) => c.id === selected);

  async function start(chaos: boolean) {
    if (!selected) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setPhase("running");
    setEvents([]);
    setSummary(null);
    setRunId(null);
    setError(null);

    try {
      const res = await fetch("/api/agent/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selected, chaos }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done: { runId: string; error: string | null } | null = null;

      while (true) {
        const { value, done: finished } = await reader.read();
        if (finished) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          if (frame.startsWith(":")) continue; // keep-alive
          const isDone = frame.startsWith("event: done");
          const data = frame.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
          if (!data) continue;
          if (isDone) done = JSON.parse(data);
          else setEvents((prev) => [...prev, JSON.parse(data) as RunEvent]);
        }
      }

      if (!done) throw new Error("The stream ended before the run reported completion.");
      setRunId(done.runId);
      if (done.error) throw new Error(done.error);

      const stored = (await (await fetch(`/api/agent/runs/${done.runId}`)).json()) as StoredRun;
      setSummary(stored.result ?? null);
      setPhase("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : String(err));
      setPhase("failed");
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow">1 · Choose a company</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              disabled={phase === "running"}
              className={`rounded-lg border p-5 text-left transition-colors ${
                selected === c.id ? "border-foreground bg-card" : "border-border bg-muted hover:bg-card"
              }`}
            >
              <p className="text-h3 font-semibold">{c.title}</p>
              <p className="mt-1 text-body-sm text-muted-foreground">{c.summary}</p>
              <p className="mt-3 text-caption">
                <span className="font-medium">Designed to show:</span> {c.expect}
              </p>
              <p className="mt-2 text-caption text-muted-foreground">{c.documents.length} specimen documents</p>
            </button>
          ))}
        </div>
        {current && (
          <p className="mt-3 text-caption text-muted-foreground">
            Documents:{" "}
            {current.documents.map((d, i) => (
              <span key={d.id}>
                {i > 0 && " · "}
                <a href={d.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {d.file}
                </a>
              </span>
            ))}
            . Every document is a generated specimen — fictional companies, people, authorities and bank.
          </p>
        )}
      </section>

      <section>
        <p className="eyebrow">2 · Run the agents</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => start(false)} disabled={!selected || phase === "running"}>
            {phase === "running" ? "Running…" : "Run the agent team"}
          </Button>
          <Button variant="outline" onClick={() => start(true)} disabled={!selected || phase === "running"}>
            Run with an injected failure
          </Button>
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          The injected failure sends the first model call to a Gemini model id that does not exist — a real failed request
          to Vertex AI. Watch the Healer fail over.
        </p>
      </section>

      {(events.length > 0 || phase === "running") && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <p className="eyebrow">3 · Watch them work</p>
            {runId && (
              <Link href={`/agent/runs/${runId}`} className="text-caption underline underline-offset-2">
                Permanent link to this run
              </Link>
            )}
          </div>
          <div className="mt-4">
            <RunTimeline events={events} live={phase === "running"} />
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-border bg-risk-high-bg p-4 text-body-sm text-risk-high-foreground">{error}</p>
      )}

      {summary && (
        <section>
          <p className="eyebrow">4 · What they concluded</p>
          <div className="mt-4">
            <RunResults summary={summary} />
          </div>
        </section>
      )}
    </div>
  );
}
