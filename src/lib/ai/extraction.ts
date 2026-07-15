import "server-only";
import { geminiGenerate, parseGeminiJson } from "@/lib/ai/gemini";
import type { ExtractedDocument } from "@/lib/ai/extracted";
import type { DocumentType } from "@/lib/types";

export { isExtractable, EXTRACTABLE_TYPES } from "@/lib/ai/extracted";
export type { ExtractedDocument } from "@/lib/ai/extracted";

/**
 * AI document extraction (server-side, Gemini). Each supported document type
 * has a strict JSON contract; extracted fields feed the deterministic
 * cross-document consistency rules — extraction is AI, the scoring comparisons
 * stay deterministic and auditable (ADR 0003/0009).
 */

export interface ExtractionResult {
  data: ExtractedDocument;
  /** 0..1 — model's own field-level certainty. */
  confidence: number;
}

const FIELD_SPECS: Record<string, { fields: string; docLabel: string }> = {
  trade_license: {
    docLabel: "UAE trade license",
    fields: `{
  "doc": "trade_license",
  "legal_name": "the company legal name exactly as printed, or null",
  "license_number": "the license number, or null",
  "activity_codes": ["licensed activity codes as strings"],
  "activity_descriptions": ["licensed activity descriptions"],
  "issue_date": "yyyy-mm-dd or null",
  "expiry_date": "yyyy-mm-dd or null",
  "authority": "issuing authority name, or null"
}`,
  },
  owner_passport: {
    docLabel: "passport identity page",
    fields: `{
  "doc": "owner_passport",
  "full_name": "holder full name as printed (surname + given names), or null",
  "nationality": "nationality as printed, or null",
  "passport_number": "document number, or null",
  "expiry_date": "yyyy-mm-dd or null"
}`,
  },
  owner_emirates_id: {
    docLabel: "UAE Emirates ID card",
    fields: `{
  "doc": "owner_emirates_id",
  "full_name": "holder full name as printed, or null",
  "id_last4": "last 4 digits of the ID number, or null",
  "expiry_date": "yyyy-mm-dd or null"
}`,
  },
  tenancy_or_office_agreement: {
    docLabel: "tenancy contract / Ejari / office agreement",
    fields: `{
  "doc": "tenancy_or_office_agreement",
  "tenant_name": "tenant/company name, or null",
  "premises_address": "premises address, or null",
  "expiry_date": "contract end date yyyy-mm-dd, or null"
}`,
  },
  bank_statement: {
    docLabel: "bank statement",
    fields: `{
  "doc": "bank_statement",
  "account_holder": "account holder name, or null",
  "bank_name": "bank name, or null",
  "period_end": "statement period end yyyy-mm-dd, or null"
}`,
  },
};

interface RawExtraction {
  [key: string]: unknown;
  confidence?: number;
}

export async function extractFromFile(
  documentType: DocumentType,
  mimeType: string,
  base64Data: string
): Promise<ExtractionResult> {
  const spec = FIELD_SPECS[documentType];
  if (!spec) {
    throw new Error(`Extraction not supported for document type: ${documentType}`);
  }

  const prompt = `You are a precise document data extractor for a UAE SME bank-readiness platform.
The attached file should be a ${spec.docLabel}.

Return ONLY a JSON object with exactly this shape (use null when a field is not
clearly legible — never guess):
${spec.fields}

Additionally include a top-level "confidence" number between 0 and 1 reflecting
how certain you are the extracted values are correct (0 if the document is not
actually a ${spec.docLabel}).`;

  const raw = await geminiGenerate(
    [
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: base64Data } },
    ],
    { json: true, temperature: 0 }
  );

  const parsed = parseGeminiJson<RawExtraction>(raw);
  const confidence = clamp01(Number(parsed.confidence ?? 0));
  delete parsed.confidence;
  parsed.doc = documentType;

  return { data: parsed as unknown as ExtractedDocument, confidence };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
