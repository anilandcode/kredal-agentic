import type { ScoringInput } from "@/lib/scoring/rules";
import type {
  Company,
  CompanyDocument,
  CompanyOwner,
  DocumentType,
  JurisdictionType,
} from "@/lib/types";

/**
 * Turn what the agents found into the `ScoringInput` the published engine
 * scores. This is the seam between the agentic layer and Kredal's 32 rules:
 * agents decide *what the documents say*; this shapes it so the rules — which
 * never change — can score it.
 */

export interface CaseProfile {
  company: Omit<
    Company,
    "id" | "workspace_id" | "status" | "created_at" | "updated_at" | "jurisdiction_type"
  > & { jurisdiction_type: string };
  owners: Omit<CompanyOwner, "id" | "company_id" | "created_at" | "emirates_id_last4">[];
  answers: Record<string, unknown>;
}

export interface FoundDocument {
  id: string;
  type: string;
  fileName: string;
  /** Field values as read; null when the field was not found. */
  fields: Record<string, string | null>;
}

const LIST_FIELDS = new Set(["activity_codes", "activity_descriptions"]);

/** The JSON shape the rules' `extractedDoc` helper reads from `extracted_text`. */
export function toExtractedText(doc: FoundDocument): string | null {
  const entries = Object.entries(doc.fields);
  if (entries.length === 0) return null;
  const out: Record<string, unknown> = { doc: doc.type };
  for (const [k, v] of entries) {
    out[k] = LIST_FIELDS.has(k) && v ? v.split(/\s*;\s*/).filter(Boolean) : v;
  }
  return JSON.stringify(out);
}

const STAMP = "2026-10-01T00:00:00.000Z";

export function assembleScoringInput(
  caseId: string,
  profile: CaseProfile,
  documents: FoundDocument[]
): ScoringInput {
  const company: Company = {
    ...profile.company,
    jurisdiction_type: profile.company.jurisdiction_type as JurisdictionType,
    id: caseId,
    workspace_id: "agentic",
    status: "draft",
    created_at: STAMP,
    updated_at: STAMP,
  };
  const owners: CompanyOwner[] = profile.owners.map((o, i) => ({
    ...o,
    id: `${caseId}-owner-${i + 1}`,
    company_id: caseId,
    emirates_id_last4: null,
    created_at: STAMP,
  }));
  const docs: CompanyDocument[] = documents.map((d) => ({
    id: d.id,
    company_id: caseId,
    uploaded_by: "agentic",
    document_type: d.type as DocumentType,
    storage_path: d.fileName,
    original_filename: d.fileName,
    mime_type: d.fileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
    file_size_bytes: 0,
    expiry_date: d.fields.expiry_date ?? null,
    status: "parsed",
    extracted_text: toExtractedText(d),
    parse_confidence: null,
    created_at: STAMP,
    updated_at: STAMP,
  }));
  return { company, owners, documents: docs, answers: profile.answers };
}
