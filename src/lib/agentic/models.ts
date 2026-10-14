import "server-only";
import { Gemini, RoutedLlm } from "@google/adk";
import type { RunLog } from "./events";

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
  /** Generally available: the last resort when every preview is down. */
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

function gemini(model: string): Gemini {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set.");
  return new Gemini({
    model,
    vertexai: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  });
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
  const models: Record<string, Gemini> = {};
  if (opts.chaos) {
    keys.unshift("chaos");
    models.chaos = gemini(CHAOS_MODEL_ID);
  }
  for (const k of CHAINS[tier]) models[k] = gemini(MODEL_IDS[k]);

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
