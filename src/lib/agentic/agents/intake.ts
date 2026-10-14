import "server-only";
import { z } from "zod";
import type { RunLog } from "../events";
import { supervise } from "../healer/supervisor";
import type { JurisdictionPack } from "../jurisdictions/types";
import { runTypedAgent } from "./run-agent";

/**
 * Intake: what is this file? Classifies each upload into one of the pack's
 * document types, judges whether it is legible enough to read, and spots a
 * document from another jurisdiction before anything tries to score it.
 */

export interface DocFile {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
}

const schemaFor = (pack: JurisdictionPack) =>
  z.object({
    doc_type: z.enum(["unknown", ...pack.docTypes.map((d) => d.id)]),
    confidence: z.number().min(0).max(1).describe("Probability that doc_type is correct"),
    legibility: z.enum(["clear", "partly_legible", "illegible"]),
    issuing_country: z.string().describe("Country that issued the document, or 'unknown'"),
    is_specimen: z.boolean().describe("True if the document is marked SPECIMEN or SAMPLE"),
    note: z.string().describe("One short sentence a reviewer would find useful"),
  });

export type IntakeResult = z.infer<ReturnType<typeof schemaFor>> & { model: string | null };

export async function classify(
  file: DocFile,
  pack: JurisdictionPack,
  log: RunLog,
  chaos = false
): Promise<IntakeResult | null> {
  const schema = schemaFor(pack);
  const catalogue = pack.docTypes.map((d) => `- ${d.id}: ${d.label} (${d.recognise})`).join("\n");
  let model: string | null = null;

  const result = await supervise({
    agent: "intake",
    label: `Classify ${file.name}`,
    log,
    run: async (attempt) => {
      const answer = await runTypedAgent({
        name: "intake",
        tier: attempt.tier,
        log,
        chaos: chaos && attempt.number === 1,
        schema,
        instruction:
          `You are the Intake agent of a bank-readiness system for ${pack.name}. ` +
          `Classify the attached document as exactly one of these types, or "unknown":\n${catalogue}\n` +
          "Judge legibility honestly. Do not extract fields." +
          (attempt.repairHint ? `\n\n${attempt.repairHint}` : ""),
        parts: [
          { text: `File name: ${file.name}` },
          { inlineData: { mimeType: file.mimeType, data: file.base64 } },
        ],
      });
      model = answer.model;
      return answer;
    },
    check: (a) =>
      a.ok
        ? a.value.confidence < 0.6
          ? { kind: "low_confidence", detail: `classified ${a.value.doc_type} at ${Math.round(a.value.confidence * 100)}%` }
          : null
        : { kind: "schema_invalid", detail: a.schemaError },
  });

  const answer = result.ok ? result.value : result.lastValue;
  if (!answer?.ok) return null;
  return { ...answer.value, model };
}
