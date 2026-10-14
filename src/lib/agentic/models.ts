import "server-only";
import { BaseLlm, Gemini, RoutedLlm, type LlmRequest, type LlmResponse } from "@google/adk";
import { ThinkingLevel, type ThinkingConfig } from "@google/genai";
import type { RunLog } from "./events";

/**
 * How much a model should think. Measured on a one-page bank statement:
 * gemini-3.8-flash 6.6 s at default thinking, 2.4 s at LOW, same correct answer.
 * Reading a printed field is not a reasoning problem; routine reads think
 * little, escalations think fully.
 */
export type Thinking = "low" | "default";

/** The thinking control differs by model family, so it is set per model. */
function thinkingFor(model: string, thinking: Thinking): ThinkingConfig | undefined {
  if (thinking === "default") return undefined;
  if (/^gemini-[34]/.test(model)) return { thinkingLevel: ThinkingLevel.LOW };
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-2\.5-pro/.test(model)) return { thinkingBudget: 128 }; // cannot be disabled
  return undefined;
}

/**
 * Model tiers and the failover chain.
 *
 * Every agent asks for a *tier*, never a model. The tier is an ADK `RoutedLlm`
 * that walks a chain: when a model fails on a request, ADK hands the router the
 * set of models that already failed, and the router picks the next. That is the
 * first layer of self-healing, and it is native to ADK.
 *
 * Model ids come from the environment so a retired preview can be swapped
 * without a deploy of code. Vertex AI via Application Default Credentials —
 * no API key exists anywhere in this system.
 */

export type Tier = "fast" | "strong";

export const MODEL_IDS = {
  fast: process.env.KREDAL_MODEL_FAST ?? "gemini-3.8-flash",
  fastFallback: process.env.KREDAL_MODEL_FAST_FALLBACK ?? "gemini-3.5-flash",
  strong: process.env.KREDAL_MODEL_STRONG ?? "gemini-3.1-pro-preview",
  /**
   * Generally available: the last resort when every preview is down. It answered
   * reliably under load on 14 Oct; gemini-2.5-flash, tried in this slot, returned
   * 429 even to single sequential calls in this project, so it is not in a chain.
   */
  stable: process.env.KREDAL_MODEL_STABLE ?? "gemini-2.5-pro",
} as const;

const CHAINS: Record<Tier, (keyof typeof MODEL_IDS)[]> = {
  fast: ["fast", "fastFallback", "stable"],
  strong: ["strong", "stable", "fast"],
};

/**
 * A model id that does not exist. The "inject a failure" demo control puts it
 * at the head of the chain so the failover can be watched live. It is a real
 * failed request to Vertex, not a simulation.
 */
export const CHAOS_MODEL_ID = "gemini-kredal-chaos-unavailable";

/**
 * A model call with a deadline.
 *
 * A failed request is easy to heal — the router moves on. A request that never
 * answers is worse: it stalls the whole run in silence. This turns silence into
 * an ordinary failure, so `RoutedLlm` fails over exactly as it does for an
 * error. It races the call rather than trusting the abort signal alone, so a
 * request that ignores the abort still cannot hold the run hostage.
 */
export class TimedLlm extends BaseLlm {
  constructor(
    private readonly inner: BaseLlm,
    private readonly timeoutMs: number,
    private readonly thinking: Thinking = "default"
  ) {
    super({ model: inner.model });
  }

  /** A copy with this model's thinking setting, so failover never inherits another model's. */
  private withThinking(request: LlmRequest): LlmRequest {
    const thinkingConfig = thinkingFor(this.model, this.thinking);
    return thinkingConfig ? { ...request, config: { ...request.config, thinkingConfig } } : request;
  }

  async *generateContentAsync(
    request: LlmRequest,
    stream?: boolean,
    abortSignal?: AbortSignal
  ): AsyncGenerator<LlmResponse, void> {
    const controller = new AbortController();
    abortSignal?.addEventListener("abort", () => controller.abort(abortSignal.reason), { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`${this.model} did not answer within ${Math.round(this.timeoutMs / 1000)}s`);
        controller.abort(err);
        reject(err);
      }, this.timeoutMs);
    });
    const it = this.inner
      .generateContentAsync(this.withThinking(request), stream, controller.signal)
      [Symbol.asyncIterator]();
    try {
      while (true) {
        const next = await Promise.race([it.next(), deadline]);
        if (next.done) return;
        yield next.value;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  connect(request: LlmRequest) {
    return this.inner.connect(request);
  }
}

/** Per-call deadline. Flash answers in ~5–15 s; Pro is slower by design. */
const TIMEOUT_MS = {
  fast: Number(process.env.KREDAL_MODEL_TIMEOUT_FAST_MS ?? 30_000),
  strong: Number(process.env.KREDAL_MODEL_TIMEOUT_STRONG_MS ?? 75_000),
};

function gemini(model: string, timeoutMs: number, thinking: Thinking): BaseLlm {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set.");
  return new TimedLlm(
    new Gemini({ model, vertexai: true, project, location: process.env.GOOGLE_CLOUD_LOCATION ?? "global" }),
    timeoutMs,
    thinking
  );
}

export interface TierOptions {
  log?: RunLog;
  /** Prepend a model that is guaranteed to fail (demo control). */
  chaos?: boolean;
  /**
   * Told which model the router chose. Calibration is per model, so the
   * caller must know which one actually answered, not which one it asked for.
   */
  onRoute?: (modelId: string) => void;
}

/**
 * A fresh routed model for one agent invocation. Fresh, because the router
 * reports failovers into the run's own log.
 */
export function tierModel(tier: Tier, opts: TierOptions = {}): RoutedLlm {
  const keys: string[] = CHAINS[tier].map((k) => k);
  const models: Record<string, BaseLlm> = {};
  const timeout = TIMEOUT_MS[tier];
  // Escalation exists to think harder; routine reads should not.
  const thinking: Thinking = tier === "fast" ? "low" : "default";
  if (opts.chaos) {
    keys.unshift("chaos");
    models.chaos = gemini(CHAOS_MODEL_ID, timeout, thinking);
  }
  // The strong models get the longer deadline wherever they sit in a chain.
  for (const k of CHAINS[tier]) {
    models[k] = gemini(MODEL_IDS[k], k === "strong" || k === "stable" ? TIMEOUT_MS.strong : timeout, thinking);
  }

  const idOf = (k: string) => (k === "chaos" ? CHAOS_MODEL_ID : MODEL_IDS[k as keyof typeof MODEL_IDS]);

  return new RoutedLlm({
    models,
    router: (_models, _request, errorContext) => {
      const next = keys.find((k) => !errorContext?.failedKeys.has(k));
      if (next) opts.onRoute?.(idOf(next));
      if (errorContext && opts.log) {
        const failed = [...errorContext.failedKeys].map(idOf);
        const reason =
          errorContext.lastError instanceof Error
            ? errorContext.lastError.message.slice(0, 160)
            : String(errorContext.lastError ?? "unknown error").slice(0, 160);
        opts.log.emit(
          "healer",
          "heal",
          next
            ? `${failed[failed.length - 1]} failed — failing over to ${idOf(next)}.`
            : `Every model in the ${tier} chain failed.`,
          { strategy: "model_failover", tier, failed, next: next ? idOf(next) : null, reason }
        );
      }
      return next;
    },
  });
}
