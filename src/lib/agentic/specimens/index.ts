import data from "./cases.json";
import type { CaseProfile, FoundDocument } from "../assemble";

/**
 * Specimen cases: fictional companies with generated, watermarked documents
 * (see `scripts/specimens/generate.mjs`). Because the generator printed every
 * value, each document carries its ground truth — which is how the Learner can
 * *measure* extraction accuracy instead of asserting it.
 */

export interface SpecimenDocument {
  id: string;
  type: string;
  file: string;
  render: "pdf" | "scan";
  truth: Record<string, string>;
}

export interface SpecimenCase extends CaseProfile {
  id: string;
  title: string;
  summary: string;
  expect: string;
  jurisdiction: string;
  documents: SpecimenDocument[];
}

export const SPECIMEN_CASES = data.cases as unknown as SpecimenCase[];

export function specimenCase(id: string): SpecimenCase | undefined {
  return SPECIMEN_CASES.find((c) => c.id === id);
}

/** Public URL of a specimen document. */
export const specimenUrl = (caseId: string, file: string) => `/specimens/${caseId}/${file}`;

/** The documents as a perfect extractor would have read them. */
export function groundTruthDocuments(c: SpecimenCase): FoundDocument[] {
  return c.documents.map((d) => ({ id: d.id, type: d.type, fileName: d.file, fields: { ...d.truth } }));
}
