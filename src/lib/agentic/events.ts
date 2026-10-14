/**
 * The run timeline. Every agent reports what it is doing through one log, and
 * the same events are streamed to the browser and persisted to Firestore — so
 * what a judge watches live is exactly what an auditor can replay later.
 */

export type AgentName =
  | "orchestrator"
  | "intake"
  | "extractor"
  | "verifier"
  | "fraud"
  | "judge"
  | "advisor"
  | "healer"
  | "learner";

export type EventKind =
  /** An agent starts or finishes its stage. */
  | "stage"
  /** A unit of work inside a stage. */
  | "step"
  /** A typed judgment was produced. */
  | "judgment"
  /** The engine acted on a judgment, or sent it to a person. */
  | "decision"
  /** A failure was detected and a repair attempted. */
  | "heal"
  | "warning"
  | "error"
  /** A final artefact (score range, integrity verdict, pack). */
  | "result";

export interface RunEvent {
  seq: number;
  /** Milliseconds since the run started. */
  t: number;
  at: string;
  agent: AgentName;
  kind: EventKind;
  message: string;
  data?: Record<string, unknown>;
}

export type EventSink = (event: RunEvent) => void | Promise<void>;

export class RunLog {
  private seq = 0;
  private readonly started = Date.now();
  private readonly pending: Promise<void>[] = [];
  readonly events: RunEvent[] = [];

  constructor(private readonly sinks: EventSink[] = []) {}

  emit(
    agent: AgentName,
    kind: EventKind,
    message: string,
    data?: Record<string, unknown>
  ): RunEvent {
    const event: RunEvent = {
      seq: this.seq++,
      t: Date.now() - this.started,
      at: new Date().toISOString(),
      agent,
      kind,
      message,
      ...(data ? { data } : {}),
    };
    this.events.push(event);
    for (const sink of this.sinks) {
      // A failing sink (a dropped SSE connection, a Firestore hiccup) must never
      // stop the run; the event is still in `events` for the final write.
      const r = Promise.resolve()
        .then(() => sink(event))
        .catch(() => undefined);
      this.pending.push(r);
    }
    return event;
  }

  /** Wait for every sink to finish with the events emitted so far. */
  async flush(): Promise<void> {
    await Promise.all(this.pending.splice(0));
  }
}
