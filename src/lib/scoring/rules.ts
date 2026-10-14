import type {
  Company,
  CompanyDocument,
  CompanyOwner,
  RiskLevel,
} from "@/lib/types";

/**
 * Declarative catalog of the deterministic readiness scoring rules (TECH_SPEC.md §6).
 *
 * This file is the single source of truth for BOTH the runtime engine
 * (`engine.ts`) AND the generated reference doc (`docs/reference/scoring-engine.md`,
 * produced by `scripts/docs/gen-scoring-docs.mjs`). Keep every rule's metadata
 * (category, points, severity, issue, fix) accurate and human-readable — it is
 * published verbatim.
 *
 * Only `import type` is used here so the file can be imported directly by the
 * Node generator (type-only imports are erased at runtime).
 */

export interface ScoringInput {
  company: Company;
  owners: CompanyOwner[];
  documents: CompanyDocument[];
  answers: Record<string, unknown>;
}

export type CategoryId =
  | "document_completeness"
  | "ownership_consistency"
  | "source_of_funds"
  | "business_activity"
  | "bank_fit"
  | "uae_history"
  | "compliance_readiness";

export interface ScoringCategory {
  id: CategoryId;
  label: string;
  max: number;
}

export interface ScoringRule {
  /** Stable identifier, unique across all rules. */
  id: string;
  category: CategoryId;
  /** Points deducted from the category when `when` is true. */
  points: number;
  severity: "high" | "medium";
  /** Static, catalog description of the issue (published in docs). */
  issue: string;
  /** The exact action the founder should take. */
  fix: string;
  /** Runtime predicate: does this rule fire for the given input? */
  when: (input: ScoringInput) => boolean;
  /** Optional dynamic issue text used at runtime instead of `issue`. */
  issueFor?: (input: ScoringInput) => string;
}

export const RISK_BANDS: { level: RiskLevel; min: number; max: number }[] = [
  { level: "low", min: 80, max: 100 },
  { level: "medium", min: 55, max: 79 },
  { level: "high", min: 0, max: 54 },
];

export const SCORING_CATEGORIES: ScoringCategory[] = [
  { id: "document_completeness", label: "Document completeness", max: 25 },
  { id: "ownership_consistency", label: "Identity & ownership consistency", max: 15 },
  { id: "source_of_funds", label: "Source-of-funds strength", max: 15 },
  { id: "business_activity", label: "Business activity clarity", max: 15 },
  { id: "bank_fit", label: "Bank fit", max: 10 },
  { id: "uae_history", label: "UAE founder/company history", max: 10 },
  { id: "compliance_readiness", label: "Compliance readiness", max: 10 },
];

// ---- helpers ----

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasDoc(documents: CompanyDocument[], type: string): boolean {
  return documents.some((d) => d.document_type === type && d.status !== "rejected");
}

function monthsSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30);
}

function totalOwnership(owners: CompanyOwner[]): number {
  return owners.reduce((sum, o) => sum + (o.ownership_percentage ?? 0), 0);
}

function uboOwner(owners: CompanyOwner[]): CompanyOwner | undefined {
  return owners.find((o) => (o.ownership_percentage ?? 0) >= 25);
}

export const HIGH_MIN_BALANCE_BANKS = new Set(["Mashreq", "Emirates NBD", "FAB", "ADCB"]);
const GENERIC_ACTIVITY_PHRASES = ["general trading", "trading", "consulting", "services"];

/**
 * Bank-specific document additions — LIVING DATA refined from research and
 * discovery calls. Single source of truth: the checklist UI consumes this via
 * `src/lib/checklist.ts`, and the `bank_required_doc_missing` rule scores
 * against it, so the interface and the score cannot diverge.
 * (Defined here, not imported: this catalog must stay loadable in plain Node
 * for the docs generator.)
 */
export const BANK_ADDITIONAL_REQUIRED: Record<string, string[]> = {
  "Wio Bank": [],
  Mashreq: ["bank_statement", "invoice_or_contract"],
  "Emirates NBD": ["moa_aoa", "bank_statement"],
  RAKBANK: ["invoice_or_contract"],
  ADCB: ["moa_aoa", "bank_statement"],
  FAB: ["moa_aoa", "bank_statement", "source_of_funds_evidence"],
  ADIB: ["moa_aoa", "source_of_funds_evidence"],
};

function missingBankDocs(i: ScoringInput): string[] {
  const bank = i.company.target_bank;
  if (!bank) return [];
  const extra = BANK_ADDITIONAL_REQUIRED[bank] ?? [];
  return extra.filter((t) => !hasDoc(i.documents, t));
}

// ---- AI-extracted data helpers (inlined; this catalog must stay free of
// value imports so the docs generator can load it in plain Node) ----

interface ExtractedFields {
  doc?: string;
  legal_name?: string | null;
  full_name?: string | null;
  expiry_date?: string | null;
  [key: string]: unknown;
}

/** First non-rejected document of a type that has parsed extraction data. */
function extractedDoc(
  documents: CompanyDocument[],
  type: string
): ExtractedFields | null {
  for (const d of documents) {
    if (d.document_type !== type || d.status === "rejected" || !d.extracted_text)
      continue;
    try {
      const obj = JSON.parse(d.extracted_text);
      if (obj && typeof obj === "object" && obj.doc === type)
        return obj as ExtractedFields;
    } catch {
      /* unparseable extraction — ignore */
    }
  }
  return null;
}

/**
 * Loose, order-tolerant name comparison. True unless a clear disagreement.
 * Exported for the agentic Verifier, which uses it as its deterministic first
 * pass before asking a model about transliteration.
 */
export function namesRoughlyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return true;
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

function isPastDate(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

// ---- rules (evaluation order per category preserved from the original engine) ----

export const SCORING_RULES: ScoringRule[] = [
  // Document completeness — 25 points
  {
    id: "doc_trade_license_missing",
    category: "document_completeness",
    points: 10,
    severity: "high",
    issue: "Trade license not uploaded.",
    fix: "Upload a clear copy of your current trade license.",
    when: (i) => !hasDoc(i.documents, "trade_license"),
  },
  {
    id: "doc_owner_passport_missing",
    category: "document_completeness",
    points: 6,
    severity: "high",
    issue: "Owner passport not uploaded.",
    fix: "Upload a passport copy for each owner.",
    when: (i) => !hasDoc(i.documents, "owner_passport"),
  },
  {
    id: "doc_emirates_id_missing_for_resident",
    category: "document_completeness",
    points: 5,
    severity: "medium",
    issue: "Emirates ID missing for a UAE-resident owner.",
    fix: "Upload the Emirates ID for each UAE-resident owner.",
    when: (i) =>
      /resident/i.test(i.company.owner_uae_residency_status ?? "") &&
      !hasDoc(i.documents, "owner_emirates_id"),
  },
  {
    id: "doc_moa_missing_multi_owner",
    category: "document_completeness",
    points: 5,
    severity: "medium",
    issue: "MOA/AOA missing for a multi-owner entity.",
    fix: "Upload the Memorandum/Articles of Association.",
    when: (i) => i.owners.length > 1 && !hasDoc(i.documents, "moa_aoa"),
  },
  {
    id: "doc_ubo_declaration_missing",
    category: "document_completeness",
    points: 6,
    severity: "high",
    issue: "UBO declaration not uploaded.",
    fix: "Upload a signed UBO (Ultimate Beneficial Owner) declaration.",
    when: (i) => !hasDoc(i.documents, "ubo_declaration"),
  },
  {
    id: "doc_tenancy_missing",
    category: "document_completeness",
    points: 4,
    severity: "medium",
    issue: "Tenancy or office agreement not uploaded.",
    fix: "Upload your Ejari or free-zone office agreement.",
    when: (i) => !hasDoc(i.documents, "tenancy_or_office_agreement"),
  },
  {
    id: "doc_business_plan_missing",
    category: "document_completeness",
    points: 4,
    severity: "medium",
    issue: "No business plan or company profile uploaded.",
    fix: "Upload a business plan or company profile document.",
    when: (i) =>
      !hasDoc(i.documents, "business_plan") && !hasDoc(i.documents, "company_profile"),
  },

  // Identity and ownership consistency — 15 points
  {
    id: "own_no_owners",
    category: "ownership_consistency",
    points: 8,
    severity: "high",
    issue: "No ownership information added.",
    fix: "Add every shareholder in the questionnaire's ownership section.",
    when: (i) => i.owners.length === 0,
  },
  {
    id: "own_percentages_not_100",
    category: "ownership_consistency",
    points: 8,
    severity: "high",
    issue: "Ownership percentages do not sum to 100%.",
    fix: "Correct owner shareholding percentages so they total 100%.",
    when: (i) => i.owners.length > 0 && totalOwnership(i.owners) !== 100,
    issueFor: (i) => `Ownership percentages sum to ${totalOwnership(i.owners)}%, not 100%.`,
  },
  {
    id: "own_ubo_over_threshold_no_declaration",
    category: "ownership_consistency",
    points: 8,
    severity: "high",
    issue: "An owner controls 25%+ but no UBO declaration is on file.",
    fix: "Upload a UBO declaration naming this owner.",
    when: (i) => i.owners.length > 0 && !!uboOwner(i.owners) && !hasDoc(i.documents, "ubo_declaration"),
    issueFor: (i) =>
      `${uboOwner(i.owners)!.full_name} owns 25%+ but no UBO declaration is on file.`,
  },
  {
    id: "own_nationality_missing",
    category: "ownership_consistency",
    points: 4,
    severity: "medium",
    issue: "Owner nationality is missing for one or more owners.",
    fix: "Add nationality for every owner.",
    when: (i) =>
      i.owners.length > 0 &&
      (!i.company.owner_nationality || i.owners.some((o) => !o.nationality)),
  },

  // Source-of-funds strength — 15 points
  {
    id: "sof_no_explanation",
    category: "source_of_funds",
    points: 10,
    severity: "high",
    issue: "No source-of-funds explanation on file.",
    fix: "Answer the source-of-funds question in the questionnaire.",
    when: (i) => !str(i.answers.source_of_funds_explanation).trim(),
  },
  {
    id: "sof_no_evidence",
    category: "source_of_funds",
    points: 8,
    severity: "high",
    issue: "No supporting evidence for source of funds.",
    fix: "Upload savings statements, sale proceeds, or prior salary evidence.",
    when: (i) => str(i.answers.source_of_funds_evidence_available) === "no",
  },
  {
    id: "sof_high_risk_corridor_no_narrative",
    category: "source_of_funds",
    points: 5,
    severity: "high",
    issue: "High-risk corridor exposure with no explanation.",
    fix: "Explain the business reason for transacting with this jurisdiction.",
    when: (i) =>
      str(i.answers.high_risk_corridor) === "yes" &&
      !str(i.answers.high_risk_corridor_narrative).trim(),
  },
  {
    id: "sof_large_turnover_no_contracts",
    category: "source_of_funds",
    points: 5,
    severity: "medium",
    issue: "Large expected turnover with no supporting contracts or invoices.",
    fix: "Upload sample invoices or contracts that support your expected turnover.",
    when: (i) =>
      (i.company.expected_monthly_turnover_aed ?? 0) > 100_000 &&
      !hasDoc(i.documents, "invoice_or_contract"),
  },

  // Business activity clarity — 15 points
  {
    id: "act_license_code_missing",
    category: "business_activity",
    points: 7,
    severity: "medium",
    issue: "License activity code missing.",
    fix: "Add your trade license activity code(s) to the company profile.",
    when: (i) =>
      !i.company.license_activity_codes || i.company.license_activity_codes.length === 0,
  },
  {
    id: "act_conflicts_with_license",
    category: "business_activity",
    points: 8,
    severity: "high",
    issue: "Actual business activity conflicts with the trade license.",
    fix: "Amend your trade license activity or align your operations with the licensed activity before applying.",
    when: (i) => str(i.answers.activity_matches_license) === "no",
  },
  {
    id: "act_high_risk_activity",
    category: "business_activity",
    points: 5,
    severity: "medium",
    issue:
      "Business activity may be classified as high-risk by banks (crypto, money exchange, precious metals, arms, or gambling).",
    fix: "Prepare a detailed compliance narrative and expect enhanced due diligence from the bank.",
    when: (i) => str(i.answers.high_risk_activity) === "yes",
  },
  {
    id: "act_description_too_generic",
    category: "business_activity",
    points: 4,
    severity: "medium",
    issue: "Business activity description is too generic.",
    fix: "Describe specifically what your business does, who it sells to, and how.",
    when: (i) => {
      const d = str(i.answers.actual_activity_description).trim();
      return !!d && (d.length < 40 || GENERIC_ACTIVITY_PHRASES.includes(d.toLowerCase()));
    },
  },

  // Bank fit — 10 points
  {
    id: "bank_no_target",
    category: "bank_fit",
    points: 3,
    severity: "medium",
    issue: "No target bank selected.",
    fix: "Choose a target bank so the checklist can be tailored to their requirements.",
    when: (i) => !i.company.target_bank,
  },
  {
    id: "bank_min_balance_mismatch",
    category: "bank_fit",
    points: 3,
    severity: "medium",
    issue: "Target bank expects a higher minimum balance than expected turnover supports.",
    fix: "Consider a digital-first bank (e.g. Wio) or plan for a higher minimum balance.",
    when: (i) =>
      !!i.company.target_bank &&
      HIGH_MIN_BALANCE_BANKS.has(i.company.target_bank) &&
      (i.company.expected_monthly_turnover_aed ?? 0) < 50_000,
    issueFor: (i) =>
      `${i.company.target_bank} typically expects a higher minimum balance than your expected turnover supports.`,
  },
  {
    id: "bank_company_under_3_months",
    category: "bank_fit",
    points: 3,
    severity: "medium",
    issue: "Company is under 3 months old.",
    fix: "Some banks are stricter with very new companies — apply with a strong business plan and source-of-funds narrative.",
    when: (i) => {
      const m = monthsSince(i.company.incorporation_date);
      return m !== null && m < 3;
    },
  },
  {
    id: "bank_required_doc_missing",
    category: "bank_fit",
    points: 4,
    severity: "medium",
    issue: "The selected bank expects additional documents that are not uploaded yet.",
    fix: "Upload the documents your target bank specifically expects — they are marked as required on your checklist.",
    when: (i) => missingBankDocs(i).length > 0,
    issueFor: (i) =>
      `${i.company.target_bank} additionally expects: ${missingBankDocs(i)
        .map((t) => t.replace(/_/g, " "))
        .join(", ")}.`,
  },

  // UAE founder/company history — 10 points
  {
    id: "uae_limited_residency",
    category: "uae_history",
    points: 5,
    severity: "medium",
    issue: "Owner has limited or no UAE residency history.",
    fix: "Add UAE residency details, or expect additional bank scrutiny as a non-resident applicant.",
    when: (i) => {
      const r = i.company.owner_uae_residency_status ?? "";
      return !r || /non-resident/i.test(r);
    },
  },
  {
    id: "uae_previously_rejected",
    category: "uae_history",
    points: 3,
    severity: "medium",
    issue: "Previously rejected by a bank.",
    fix: "Address the prior rejection reason directly in your resubmission narrative.",
    when: (i) => str(i.answers.previously_rejected) === "yes",
    issueFor: (i) => {
      const reason = str(i.answers.rejection_reason).trim();
      return reason ? `Previously rejected by a bank: ${reason}` : "Previously rejected by a bank.";
    },
  },
  {
    id: "uae_company_under_6_months",
    category: "uae_history",
    points: 2,
    severity: "medium",
    issue: "Company has under 6 months of operating history.",
    fix: "Strengthen your file with a detailed business plan and any early contracts or invoices.",
    when: (i) => {
      const m = monthsSince(i.company.incorporation_date);
      return m !== null && m < 6;
    },
  },

  // Compliance readiness — 10 points
  {
    id: "comp_corporate_tax_unknown",
    category: "compliance_readiness",
    points: 4,
    severity: "medium",
    issue: "Corporate tax status unknown.",
    fix: "Confirm your corporate tax registration status with the FTA.",
    when: (i) => {
      const s = str(i.answers.corporate_tax_status);
      return !s || s === "unknown";
    },
  },
  {
    id: "comp_vat_unknown_near_threshold",
    category: "compliance_readiness",
    points: 3,
    severity: "medium",
    issue: "VAT status unknown while turnover is near the registration threshold.",
    fix: "Confirm whether VAT registration is required at your expected turnover.",
    when: (i) => {
      const annual = (i.company.expected_monthly_turnover_aed ?? 0) * 12;
      const v = str(i.answers.vat_status);
      return annual >= 300_000 && (!v || v === "unknown");
    },
  },
  {
    id: "comp_wps_unknown",
    category: "compliance_readiness",
    points: 3,
    severity: "medium",
    issue: "WPS setup status unknown despite having employees.",
    fix: "Confirm WPS (Wage Protection System) registration before your first payroll run.",
    when: (i) => {
      const hasEmployees = str(i.answers.has_employees) === "yes";
      const w = str(i.answers.wps_status);
      return hasEmployees && (!w || w === "unknown");
    },
  },

  // AI cross-document consistency — deterministic comparisons over
  // AI-extracted document fields. Fire only when extraction data exists.
  {
    id: "xdoc_license_name_mismatch",
    category: "ownership_consistency",
    points: 6,
    severity: "high",
    issue: "The company name on the uploaded trade license does not match the profile.",
    fix: "Make the company profile's legal name match the trade license exactly, or upload the correct license.",
    when: (i) => {
      const tl = extractedDoc(i.documents, "trade_license");
      return !!tl?.legal_name && !namesRoughlyMatch(tl.legal_name, i.company.legal_name);
    },
    issueFor: (i) => {
      const tl = extractedDoc(i.documents, "trade_license");
      return `Trade license reads "${tl?.legal_name}" but the profile says "${i.company.legal_name}" — banks reject on exactly this inconsistency.`;
    },
  },
  {
    id: "xdoc_passport_name_mismatch",
    category: "ownership_consistency",
    points: 5,
    severity: "high",
    issue: "The uploaded passport's name does not match any listed owner.",
    fix: "Add the passport holder as an owner, or correct the owner's name to match the passport exactly.",
    when: (i) => {
      const pp = extractedDoc(i.documents, "owner_passport");
      if (!pp?.full_name || i.owners.length === 0) return false;
      return !i.owners.some((o) => namesRoughlyMatch(pp.full_name, o.full_name));
    },
  },
  {
    id: "xdoc_license_expired",
    category: "document_completeness",
    points: 6,
    severity: "high",
    issue: "The uploaded trade license has expired.",
    fix: "Renew the trade license and upload the current one — banks will not open an account against an expired license.",
    when: (i) => isPastDate(extractedDoc(i.documents, "trade_license")?.expiry_date),
  },
  {
    id: "xdoc_passport_expired",
    category: "document_completeness",
    points: 5,
    severity: "high",
    issue: "The uploaded owner passport has expired.",
    fix: "Renew the passport and upload the current copy before applying.",
    when: (i) => isPastDate(extractedDoc(i.documents, "owner_passport")?.expiry_date),
  },
];
