import type { DocumentType } from "@/lib/types";

/**
 * Pure types + helpers for AI-extracted document data. NO server-only imports —
 * this module is consumed by the scoring rules catalog (`src/lib/scoring/rules.ts`),
 * which the docs generator loads in plain Node.
 */

export interface ExtractedTradeLicense {
  doc: "trade_license";
  legal_name: string | null;
  license_number: string | null;
  activity_codes: string[];
  activity_descriptions: string[];
  issue_date: string | null; // ISO yyyy-mm-dd
  expiry_date: string | null;
  authority: string | null;
}

export interface ExtractedPassport {
  doc: "owner_passport";
  full_name: string | null;
  nationality: string | null;
  passport_number: string | null;
  expiry_date: string | null;
}

export interface ExtractedEmiratesId {
  doc: "owner_emirates_id";
  full_name: string | null;
  id_last4: string | null;
  expiry_date: string | null;
}

export interface ExtractedTenancy {
  doc: "tenancy_or_office_agreement";
  tenant_name: string | null;
  premises_address: string | null;
  expiry_date: string | null;
}

export interface ExtractedBankStatement {
  doc: "bank_statement";
  account_holder: string | null;
  bank_name: string | null;
  period_end: string | null;
}

export type ExtractedDocument =
  | ExtractedTradeLicense
  | ExtractedPassport
  | ExtractedEmiratesId
  | ExtractedTenancy
  | ExtractedBankStatement;

export const EXTRACTABLE_TYPES: DocumentType[] = [
  "trade_license",
  "owner_passport",
  "owner_emirates_id",
  "tenancy_or_office_agreement",
  "bank_statement",
];

export function isExtractable(type: DocumentType): boolean {
  return EXTRACTABLE_TYPES.includes(type);
}

/** Safe parse of a stored `documents.extracted_text` payload. */
export function parseStoredExtraction(
  text: string | null
): ExtractedDocument | null {
  if (!text) return null;
  try {
    const obj = JSON.parse(text);
    return obj && typeof obj === "object" && "doc" in obj
      ? (obj as ExtractedDocument)
      : null;
  } catch {
    return null;
  }
}

/**
 * Loose name comparison for cross-document checks: case/diacritic/punctuation
 * insensitive, order-tolerant token overlap. Returns true when names plausibly
 * refer to the same entity — mismatch flags fire only on a clear disagreement.
 */
export function namesRoughlyMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return true; // missing data is handled by other rules, not this one
  const tokens = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\b(llc|l\.l\.c|fzc|fze|fz-llc|ltd|limited|est|establishment|trading|general)\b/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return true;
  const smaller = ta.size <= tb.size ? ta : tb;
  const larger = ta.size <= tb.size ? tb : ta;
  let overlap = 0;
  for (const t of smaller) if (larger.has(t)) overlap++;
  return overlap / smaller.size >= 0.5;
}

/** True when the ISO date string is strictly in the past. */
export function isPastDate(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t < Date.now();
}
