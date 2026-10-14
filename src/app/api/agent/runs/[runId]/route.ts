import { getRunWithEvents } from "@/lib/agentic/store/firestore";

/** GET /api/agent/runs/{runId} — a stored run with its full timeline. */
export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(runId)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const run = await getRunWithEvents(runId);
  if (!run) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json(run);
}
