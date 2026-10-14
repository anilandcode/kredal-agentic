import { recordOutcome } from "@/lib/agentic/learning/calibrators";
import { firestore, runs } from "@/lib/agentic/store/firestore";
import { answerKey, kindFor, type DecisionView, type RunSummaryView } from "@/lib/agentic/view";

/**
 * POST /api/agent/reviews  { runId, judgmentId, answer }
 *
 * A person answers a question the engine would not answer alone. The answer is
 * a verified outcome: it tells the Learner whether the model was right at the
 * confidence it claimed, and that model's calibration curve moves — so the
 * next run trusts it exactly as much as it has earned.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
    judgmentId?: string;
    answer?: boolean;
  };
  if (!body.runId || !/^[0-9a-f-]{36}$/i.test(body.runId) || !body.judgmentId || typeof body.answer !== "boolean") {
    return Response.json({ error: "runId, judgmentId and a yes/no answer are required." }, { status: 400 });
  }

  const ref = runs().doc(body.runId);
  const snap = await ref.get();
  const run = snap.data() as { result?: RunSummaryView; answers?: Record<string, unknown> } | undefined;
  const decision = run?.result?.decisions.find((d: DecisionView) => d.id === body.judgmentId);
  if (!decision) return Response.json({ error: "No such question on this run." }, { status: 404 });
  if (decision.action !== "review") {
    return Response.json({ error: "The engine already decided this one; there is nothing to answer." }, { status: 409 });
  }
  const key = answerKey(body.judgmentId);
  if (run?.answers?.[key]) return Response.json({ error: "Already answered." }, { status: 409 });

  const correct = body.answer === decision.verdict;
  const kind = kindFor(decision.id);
  const raw = decision.rawProbability ?? decision.probability;

  let learned: { observations: number; atClaim: number; ece: number } | null = null;
  if (decision.source === "model" && decision.model) {
    const cal = await recordOutcome(decision.model, kind, raw, correct);
    learned = { observations: cal.observations, atClaim: cal.calibrate(raw), ece: cal.expectedCalibrationError() };
  }

  // Report what was learned at the confidence that was actually tested —
  // one answer at 55% says nothing about how far to trust a 99% claim.
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  const message =
    (correct
      ? `Confirmed — the model was right (it claimed ${pct(raw)}).`
      : `Overturned — the model was wrong at a claimed ${pct(raw)}.`) +
    (learned
      ? ` ${decision.model}'s ${kind.replace(/_/g, " ")} judgments: ${learned.observations} checked so far; a ${pct(raw)} claim is now trusted at ${pct(learned.atClaim)}.`
      : "");

  const at = new Date().toISOString();
  await Promise.all([
    ref.set({ answers: { [key]: { answer: body.answer, correct, at, message } } }, { merge: true }),
    firestore().collection("reviews").add({
      runId: body.runId,
      judgmentId: body.judgmentId,
      question: decision.question,
      answer: body.answer,
      modelVerdict: decision.verdict,
      correct,
      model: decision.model,
      kind,
      rawProbability: raw,
      at,
    }),
  ]);

  return Response.json({ correct, message, kind, model: decision.model, learned });
}
