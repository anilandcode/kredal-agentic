import "server-only";
import { Calibrator, type CalibratorState } from "../decision";
import { firestore } from "../store/firestore";

/**
 * The Learner's memory of how far to trust each model, per kind of judgment.
 *
 * One calibrator per (model × judgment kind): gemini-3.8-flash reading a field
 * and the same model judging a name match are different skills and are trusted
 * separately. Loaded once at the start of a run, so a run's routing is
 * consistent from its first judgment to its last.
 */

const collection = () => firestore().collection("calibrators");
export const calibratorKey = (model: string | null, kind: string) => `${model ?? "unknown"}__${kind}`;

export type CalibratorSet = Map<string, Calibrator>;

export async function loadCalibrators(): Promise<CalibratorSet> {
  const snap = await collection().get();
  return new Map(snap.docs.map((d) => [d.id, new Calibrator(d.data() as CalibratorState)]));
}

/** A calibrate function bound to a loaded set. Unknown model/kind → raw value. */
export function calibrateWith(set: CalibratorSet) {
  return (model: string | null, kind: string, raw: number) => {
    const c = set.get(calibratorKey(model, kind));
    return c ? c.calibrate(raw) : raw;
  };
}

export interface Observation {
  raw: number;
  correct: boolean;
}

/**
 * Record verified outcomes — from a person answering a review, or from a
 * specimen's ground truth. Transactional, so concurrent runs and reviews all
 * count; one transaction per (model × kind), however many observations.
 */
export async function recordOutcomes(
  model: string | null,
  kind: string,
  observations: Observation[]
): Promise<Calibrator> {
  const ref = collection().doc(calibratorKey(model, kind));
  return firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const c = new Calibrator(snap.exists ? (snap.data() as CalibratorState) : undefined);
    for (const o of observations) c.observe(o.raw, o.correct);
    tx.set(ref, { ...c.toJSON(), model, kind, updatedAt: new Date().toISOString() });
    return c;
  });
}

export const recordOutcome = (model: string | null, kind: string, raw: number, wasCorrect: boolean) =>
  recordOutcomes(model, kind, [{ raw, correct: wasCorrect }]);

export async function allCalibrators() {
  const snap = await collection().get();
  return snap.docs.map((d) => {
    const data = d.data() as CalibratorState & { model: string | null; kind: string; updatedAt?: string };
    const c = new Calibrator(data);
    return {
      key: d.id,
      model: data.model,
      kind: data.kind,
      updatedAt: data.updatedAt ?? null,
      observations: c.observations,
      ece: c.expectedCalibrationError(),
      bins: data.bins,
      curve: c.curve(),
      /** What a 99% claim is actually worth, after learning. */
      at99: c.calibrate(0.99),
    };
  });
}
