import { startSpecimenRun } from "@/lib/agentic/service";
import { specimenCase } from "@/lib/agentic/specimens";
import type { RunEvent } from "@/lib/agentic/events";

/**
 * POST /api/agent/runs  { caseId, chaos? }
 *
 * Starts a run and streams its timeline as Server-Sent Events over the same
 * response, so the browser watches the agents work as they work. The run is
 * persisted as it goes; if the connection drops, the run still finishes and
 * can be replayed from /agent/runs/{id}.
 */

// The demo is public and every run spends Vertex quota. A small per-instance
// limit keeps a stuck refresh button from costing much; Cloud Run's instance
// cap bounds the total.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_RUNS = 6;
const recent = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_RUNS) return false;
  hits.push(now);
  recent.set(ip, hits);
  return true;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { caseId?: string; chaos?: boolean };
  if (!body.caseId || !specimenCase(body.caseId)) {
    return Response.json({ error: "Unknown case." }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) {
    return Response.json(
      { error: "Run limit reached for now — try again in a few minutes, or replay an earlier run." },
      { status: 429 }
    );
  }

  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true; // client went away; the run carries on and persists
        }
      };
      // An SSE comment every 15 s keeps proxies from idling the stream out
      // during a long model call.
      const keepAlive = setInterval(() => send(": keep-alive\n\n"), 15_000);

      const { runId, error } = await startSpecimenRun({
        caseId: body.caseId!,
        chaos: body.chaos === true,
        sinks: [(e: RunEvent) => send(`data: ${JSON.stringify(e)}\n\n`)],
      });

      clearInterval(keepAlive);
      send(`event: done\ndata: ${JSON.stringify({ runId, error: error ?? null })}\n\n`);
      if (!closed) controller.close();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
