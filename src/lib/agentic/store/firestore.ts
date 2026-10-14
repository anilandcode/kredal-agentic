import "server-only";
import { Firestore } from "@google-cloud/firestore";
import type { RunEvent } from "../events";

/**
 * Firestore, named database `kredal`. On Cloud Run the `kredal-run` service
 * account can reach only this database (IAM condition); locally it uses
 * Application Default Credentials.
 */

let db: Firestore | null = null;

export function firestore(): Firestore {
  if (!db) {
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      databaseId: process.env.KREDAL_FIRESTORE_DB ?? "kredal",
      ignoreUndefinedProperties: true,
    });
  }
  return db;
}

export const runs = () => firestore().collection("runs");

/** Zero-padded so events list in order without an index. */
const seqId = (seq: number) => String(seq).padStart(5, "0");

export async function appendEvent(runId: string, event: RunEvent): Promise<void> {
  await runs().doc(runId).collection("events").doc(seqId(event.seq)).set(event);
}

export async function getRunWithEvents(runId: string) {
  const ref = runs().doc(runId);
  const [snap, events] = await Promise.all([ref.get(), ref.collection("events").orderBy("seq").get()]);
  if (!snap.exists) return null;
  return { id: runId, ...snap.data(), events: events.docs.map((d) => d.data() as RunEvent) };
}

export async function recentRuns(limit = 12) {
  const snap = await runs().orderBy("startedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
