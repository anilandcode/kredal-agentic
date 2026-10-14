import "server-only";
import {
  InMemoryRunner,
  LlmAgent,
  ReflectAndRetryModelPlugin,
  TrackingScope,
} from "@google/adk";
import type { Part } from "@google/genai";
import type { z } from "zod";
import type { RunLog } from "../events";
import { tierModel, type Tier } from "../models";

/**
 * Run one ADK agent once and get its typed answer back.
 *
 * Each call builds an `LlmAgent` with a zod `outputSchema`, on a routed model
 * tier (failover is native to ADK, see `models.ts`), under ADK's
 * `ReflectAndRetryModelPlugin`, which recovers malformed model turns.
 *
 * It does not throw on a schema mismatch: it returns the zod issues, so the
 * supervisor can treat "wrong shape" differently from "model down".
 */

export interface AgentCall<S extends z.ZodType> {
  name: string;
  instruction: string;
  schema: S;
  tier: Tier;
  parts: Part[];
  log?: RunLog;
  chaos?: boolean;
  temperature?: number;
}

export type AgentAnswer<T> =
  | { ok: true; value: T; model: string | null; ms: number }
  | { ok: false; schemaError: string; raw: string; model: string | null; ms: number };

/**
 * At most this many model calls in flight per instance. A run fans out one call
 * per document; unbounded, a single run bursts past the preview models' quota
 * and turns its own parallelism into 429s.
 */
const MAX_IN_FLIGHT = Number(process.env.KREDAL_MAX_MODEL_CALLS ?? 3);
let inFlight = 0;
const waiting: (() => void)[] = [];

async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
  try {
    return await work();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

export function runTypedAgent<S extends z.ZodObject>(call: AgentCall<S>): Promise<AgentAnswer<z.infer<S>>> {
  return slot(() => runTypedAgentNow(call));
}

async function runTypedAgentNow<S extends z.ZodObject>(
  call: AgentCall<S>
): Promise<AgentAnswer<z.infer<S>>> {
  let model: string | null = null;
  const agent = new LlmAgent({
    name: call.name,
    model: tierModel(call.tier, {
      log: call.log,
      chaos: call.chaos,
      onRoute: (id) => (model = id),
    }),
    instruction: call.instruction,
    outputSchema: call.schema,
    includeContents: "none",
    generateContentConfig: { temperature: call.temperature ?? 0 },
  });

  const runner = new InMemoryRunner({
    agent,
    appName: "kredal",
    plugins: [
      new ReflectAndRetryModelPlugin({
        maxRetries: 2,
        trackingScope: TrackingScope.INVOCATION,
      }),
    ],
  });

  const started = Date.now();
  let raw = "";
  for await (const event of runner.runEphemeral({
    userId: "kredal-agent",
    newMessage: { role: "user", parts: call.parts },
  })) {
    if (event.errorMessage) throw new Error(event.errorMessage);
    const text = event.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (text) raw = text;
  }
  const ms = Date.now() - started;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, schemaError: "response was not valid JSON", raw: raw.slice(0, 400), model, ms };
  }
  const parsed = call.schema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return { ok: false, schemaError: issues, raw: raw.slice(0, 400), model, ms };
  }
  return { ok: true, value: parsed.data, model, ms };
}
