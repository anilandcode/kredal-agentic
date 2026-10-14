import type { ScoringCategory, ScoringRule } from "@/lib/scoring/rules";

/**
 * A jurisdiction pack: everything country-specific, as data. The agents and the
 * decision engine never mention a country; a pack tells them which documents
 * exist, what to read off each, and which rules score the result.
 */

export interface FieldSpec {
  name: string;
  /** What to read, phrased for the model. */
  description: string;
  /** Dates are normalised to yyyy-mm-dd; amounts to plain numbers. */
  format?: "date" | "amount" | "text";
  /** A wrong value here fails a published rule, so it is held to a higher bar. */
  critical?: boolean;
}

export interface DocTypeSpec {
  id: string;
  label: string;
  /** Hints for Intake: words that appear on this kind of document. */
  recognise: string;
  fields: FieldSpec[];
}

export interface JurisdictionPack {
  id: string;
  name: string;
  /** Shown beside the pack; a preview pack has fewer rules and says so. */
  status: "complete" | "preview";
  docTypes: DocTypeSpec[];
  categories: ScoringCategory[];
  rules: readonly ScoringRule[];
}
