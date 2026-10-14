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

/** Record a human-checked outcome. Transactional: concurrent reviews both count. */
export async function recordOutcome(
  model: string | null,
  kind: string,
  raw: number,
  wasCorrect: boolean
): Promise<Calibrator> {
  const ref = collection().doc(calibratorKey(model, kind));
  return firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const c = new Calibrator(snap.exists ? (snap.data() as CalibratorState) : undefined);
    c.observe(raw, wasCorrect);
    tx.set(ref, { ...c.toJSON(), model, kind, updatedAt: new Date().toISOString() });
    return c;
  });
}
