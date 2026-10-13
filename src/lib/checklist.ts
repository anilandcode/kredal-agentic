import {
  BASE_REQUIRED_DOCUMENT_TYPES,
  OPTIONAL_DOCUMENT_TYPES,
} from "@/lib/constants";
import { BANK_ADDITIONAL_REQUIRED } from "@/lib/scoring/rules";
import type { Company, DocumentType } from "@/lib/types";

/**
 * Per-bank checklist assembly. The bank → extra-documents data lives in the
 * scoring rules catalog (`BANK_ADDITIONAL_REQUIRED`) so the checklist UI and
 * the `bank_required_doc_missing` scoring rule can never diverge. UI-only
 * notes live here.
 */
const BANK_NOTES: Record<string, string> = {
  "Wio Bank":
    "Digital-first; fastest onboarding for straightforward mainland/free-zone SMEs.",
  Mashreq: "Expects activity evidence and prior statements where available.",
  "Emirates NBD": "Requests constitutional documents for most entity types.",
  RAKBANK: "SME-focused; supporting contracts strengthen the file.",
  FAB: "Enhanced source-of-funds scrutiny at account opening.",
  ADIB: "Islamic bank; sharia-compliant activity descriptions help.",
};

export interface CompanyChecklist {
  required: DocumentType[];
  optional: DocumentType[];
  bankNote?: string;
}

/**
 * The document checklist for a company: base requirements plus the target
 * bank's additions (which move items out of "optional").
 */
export function requiredDocsFor(
  company: Pick<Company, "target_bank">
): CompanyChecklist {
  const bank = company.target_bank ?? "";
  const additions = (BANK_ADDITIONAL_REQUIRED[bank] ?? []) as DocumentType[];

  const required: DocumentType[] = [
    ...BASE_REQUIRED_DOCUMENT_TYPES,
    ...additions.filter(
      (t) => !(BASE_REQUIRED_DOCUMENT_TYPES as readonly DocumentType[]).includes(t)
    ),
  ];

  const optional = OPTIONAL_DOCUMENT_TYPES.filter((t) => !required.includes(t));

  return { required, optional, bankNote: BANK_NOTES[bank] };
}
