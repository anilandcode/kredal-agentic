import "server-only";
import { z } from "zod";
import type { RunLog } from "../events";
import { supervise } from "../healer/supervisor";
import type { DocTypeSpec } from "../jurisdictions/types";
import type { DocFile } from "./intake";
import { runTypedAgent } from "./run-agent";

/**
 * Extractor: read every field the pack defines for this document type, with a
 * confidence and the exact printed text for each. The quote is the evidence a
 * reviewer checks against the page; the confidence is what the Judge
 * calibrates.
 *
 * The supervisor escalates to the strong tier when any *critical* field — one a
 * published rule depends on — comes back unsure, and asks the stronger model to
 * focus on exactly those fields.
 */

const FieldReading = z.object({
  value: z.string().nullable().describe("Value as printed; null if the field is absent"),
  confidence: z.number().min(0).max(1).describe("Probability that `value` is correct"),
  quote: z.string().nullable().describe("The exact characters read from the page"),
});
export type FieldReading = z.infer<typeof FieldReading>;

const schemaFor = (spec: DocTypeSpec) =>
  z.object({
    fields: z.object(
      Object.fromEntries(spec.fields.map((f) => [f.name, FieldReading.describe(f.description)]))
    ),
  });

/** Below this, a critical field triggers a stronger second reading. */
const CRITICAL_FIELD_FLOOR = 0.75;

export interface Extraction {
  docType: string;
  fields: Record<string, FieldReading>;
  model: string | null;
  attempts: number;
  healed: boolean;
  /** Set when every repair was exhausted; the Judge asks a person. */
  unresolved?: string;
}

function formatRules(spec: DocTypeSpec): string {
  return spec.fields
    .map((f) => {
      const fmt =
        f.format === "date"
          ? " (normalise to yyyy-mm-dd)"
          : f.format === "amount"
            ? " (digits and decimal point only; no currency, no thousands separators)"
            : "";
      return `- ${f.name}: ${f.description}${fmt}`;
    })
    .join("\n");
}

export async function extract(
  file: DocFile,
  spec: DocTypeSpec,
  log: RunLog,
  opts: { chaos?: boolean; memory?: string } = {}
): Promise<Extraction> {
  const schema = schemaFor(spec);
  const critical = spec.fields.filter((f) => f.critical).map((f) => f.name);
  let model: string | null = null;

  const result = await supervise({
    agent: "extractor",
    label: `Read ${spec.label}`,
    log,
    run: async (attempt) => {
      const answer = await runTypedAgent({
        name: "extractor",
        tier: attempt.tier,
        log,
        chaos: opts.chaos && attempt.number === 1,
        schema,
        instruction:
          `You are the Extractor agent. The attached document is a ${spec.label}. ` +
          `Read these fields:\n${formatRules(spec)}\n\n` +
          "For each: the value exactly as printed (normalised only as instructed), the exact " +
          "characters you read as `quote`, and `confidence` — the probability your value is " +
          "correct. Be honest: blurred, cropped, overwritten or ambiguous text means low " +
          "confidence. Never invent a value; use null when absent." +
          (opts.memory ? `\n\nLessons from past human corrections:\n${opts.memory}` : "") +
          (attempt.repairHint ? `\n\n${attempt.repairHint}` : ""),
        parts: [{ inlineData: { mimeType: file.mimeType, data: file.base64 } }],
      });
      model = answer.model;
      return answer;
    },
    check: (a) => {
      if (!a.ok) return { kind: "schema_invalid", detail: a.schemaError };
      const fields = a.value.fields as Record<string, FieldReading>;
      const unsure = critical.filter(
        (n) => fields[n]?.value !== null && (fields[n]?.confidence ?? 0) < CRITICAL_FIELD_FLOOR
      );
      return unsure.length
        ? {
            kind: "low_confidence",
            detail: unsure.map((n) => `${n} at ${Math.round((fields[n]?.confidence ?? 0) * 100)}%`).join(", "),
            fields: unsure,
          }
        : null;
    },
  });

  const answer = result.ok ? result.value : result.lastValue;
  const fields = answer?.ok ? (answer.value.fields as Record<string, FieldReading>) : {};
  return {
    docType: spec.id,
    fields,
    model,
    attempts: result.attempts,
    healed: result.ok ? result.healed : false,
    ...(result.ok ? {} : { unresolved: result.problem.detail }),
  };
}
