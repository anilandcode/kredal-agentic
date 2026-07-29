/**
 * The demo workspace the marketing site renders.
 *
 * This is the same fictional company `scripts/seed-demo.mjs` seeds into a real
 * database — Al Barakah Foods Trading LLC, deliberately imperfect so the
 * assessment produces a rich set of flags rather than a flat 100.
 *
 * The point of this file is that the landing page shows the ACTUAL product:
 * the numbers below are not written by hand, they come out of the real scoring
 * engine (`@/lib/scoring/engine`) evaluating these fixtures. Every one of the
 * libraries used here is pure and deterministic — no Supabase, no `server-only`,
 * no I/O — so this is safe to import from a public page.
 *
 * Dates are pinned absolute on purpose. Several scoring rules measure company
 * age and document expiry against `Date.now()`; relative offsets would make the
 * landing page's score drift silently as months pass. `demo-fixture.test.ts`
 * asserts the resulting score so a rules change surfaces as a failed test
 * rather than a quietly different marketing page.
 */
import { buildComplianceRadar, type RadarItem } from "@/lib/compliance";
import { buildReport, type ReportData } from "@/lib/reports/templates";
import { matchBanks, type BankMatch } from "@/lib/scoring/bank-match";
import { calculateReadiness, SCORING_VERSION } from "@/lib/scoring/engine";
import type { ScoringInput } from "@/lib/scoring/rules";
import type {
  Company,
  CompanyDocument,
  CompanyOwner,
  CompanySummary,
  ReadinessAssessment,
} from "@/lib/types";

/** Pinned so company-age and expiry rules evaluate identically forever. */
const INCORPORATED = "2026-02-20";
/** Stable stand-in for `created_at` columns the UI displays. */
const SEEDED_AT = "2026-07-01T09:00:00.000Z";

const COMPANY_ID = "demo-company-al-barakah";

export const DEMO_COMPANY: Company = {
  id: COMPANY_ID,
  workspace_id: "demo-workspace",
  legal_name: "Al Barakah Foods Trading LLC",
  trade_license_number: "DED-778234",
  emirate: "Dubai",
  jurisdiction_type: "mainland",
  authority_name: "Dubai Economic Department (DED)",
  license_activity_codes: ["4630"],
  incorporation_date: INCORPORATED,
  office_status: "Ejari registered — flexi-desk in Deira",
  owner_nationality: "Pakistani",
  owner_uae_residency_status: "UAE resident visa",
  expected_monthly_turnover_aed: 40000,
  target_bank: "Mashreq",
  target_account_type: "Business current account",
  status: "draft",
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT,
};

export const DEMO_OWNERS: CompanyOwner[] = [
  {
    id: "demo-owner-1",
    company_id: COMPANY_ID,
    full_name: "Founder One",
    nationality: "Pakistani",
    ownership_percentage: 60,
    is_ubo: true,
    uae_residency_status: "resident",
    emirates_id_last4: null,
    passport_country: "Pakistan",
    created_at: SEEDED_AT,
  },
  {
    id: "demo-owner-2",
    company_id: COMPANY_ID,
    full_name: "Founder Two",
    nationality: "Pakistani",
    ownership_percentage: 40,
    is_ubo: true,
    uae_residency_status: "resident",
    emirates_id_last4: null,
    passport_country: "Pakistan",
    created_at: SEEDED_AT,
  },
];

/** 4 of 6 required types. UBO declaration and tenancy agreement are missing. */
export const DEMO_DOCUMENTS: CompanyDocument[] = (
  [
    ["trade_license", "trade_license.pdf"],
    ["owner_passport", "owner_passport.pdf"],
    ["owner_emirates_id", "owner_emirates_id.pdf"],
    ["business_plan", "business_plan.pdf"],
  ] as const
).map(([document_type, original_filename], i) => ({
  id: `demo-doc-${i + 1}`,
  company_id: COMPANY_ID,
  uploaded_by: "demo-user",
  document_type,
  storage_path: `demo/${original_filename}`,
  original_filename,
  mime_type: "application/pdf",
  file_size_bytes: 42_000 + i * 1_100,
  expiry_date: null,
  status: "uploaded",
  extracted_text: null,
  parse_confidence: null,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT,
}));

/** Flattened the way the scoring engine reads answers: keyed by question. */
export const DEMO_ANSWERS: Record<string, unknown> = {
  actual_activity_description:
    "We import packaged food products from Pakistan and distribute them to supermarkets and restaurants across Dubai and Sharjah.",
  activity_matches_license: "yes",
  high_risk_activity: "no",
  expected_monthly_transaction_count: "100_500",
  average_transaction_size_aed: "2000",
  cash_heavy: "no",
  // Deliberately blank — the two highest-value demo flags.
  source_of_funds_explanation: "",
  source_of_funds_evidence_available: "no",
  high_risk_corridor: "no",
  ownership_structure_notes:
    "Two co-founders, both Pakistani nationals, no corporate shareholders.",
  major_customer_countries: "UAE",
  major_supplier_countries: "Pakistan",
  import_export: "yes",
  corporate_tax_status: "not_yet_registered",
  vat_status: "not_yet_registered",
  has_employees: "yes",
  employee_count: "4",
  wps_status: "unknown",
  previously_applied: "yes",
  previously_rejected: "yes",
  rejection_bank_name: "Emirates NBD",
  rejection_reason:
    "They said our business plan was too generic and asked for clearer source-of-funds documentation.",
};

export const DEMO_INPUT: ScoringInput = {
  company: DEMO_COMPANY,
  owners: DEMO_OWNERS,
  documents: DEMO_DOCUMENTS,
  answers: DEMO_ANSWERS,
};

/** The real engine's verdict — not a hand-written number. */
export const DEMO_RESULT = calculateReadiness(DEMO_INPUT);

export const DEMO_ASSESSMENT: ReadinessAssessment = {
  id: "demo-assessment",
  company_id: COMPANY_ID,
  overall_score: DEMO_RESULT.overallScore,
  risk_level: DEMO_RESULT.riskLevel,
  category_scores: DEMO_RESULT.categoryScores,
  flags: DEMO_RESULT.flags,
  recommendations: DEMO_RESULT.recommendations,
  scoring_version: SCORING_VERSION,
  created_by: "demo-user",
  created_at: SEEDED_AT,
};

export const DEMO_BANK_MATCHES: BankMatch[] = matchBanks(DEMO_INPUT);

export const DEMO_RADAR: RadarItem[] = buildComplianceRadar({
  company: DEMO_COMPANY,
  documents: DEMO_DOCUMENTS,
  answers: DEMO_ANSWERS,
});

const DEMO_REPORT_DATA: ReportData = {
  company: DEMO_COMPANY,
  owners: DEMO_OWNERS,
  documents: DEMO_DOCUMENTS,
  assessment: DEMO_ASSESSMENT,
  answers: DEMO_ANSWERS,
};

/** The genuine generated pack, from the shipping report templates. */
export const DEMO_PACK_MARKDOWN = buildReport(
  "bank_application_pack",
  DEMO_REPORT_DATA
);

/**
 * A consultant's portfolio. Al Barakah carries its real computed score; the
 * others are additional fictional demo companies that exist only to show the
 * multi-company view. None of these are customers.
 */
export const DEMO_PORTFOLIO: CompanySummary[] = [
  {
    ...DEMO_COMPANY,
    reportCount: 2,
    latestScore: DEMO_RESULT.overallScore,
  },
  {
    ...DEMO_COMPANY,
    id: "demo-company-2",
    legal_name: "Gulf Line Logistics FZ-LLC",
    trade_license_number: "SHAMS-114902",
    emirate: "Sharjah",
    jurisdiction_type: "free_zone",
    authority_name: "Sharjah Media City (Shams)",
    target_bank: "Wio",
    status: "ready",
    reportCount: 3,
    latestScore: 86,
  },
  {
    ...DEMO_COMPANY,
    id: "demo-company-3",
    legal_name: "Nadia Interiors LLC",
    trade_license_number: "DED-901554",
    emirate: "Dubai",
    jurisdiction_type: "mainland",
    authority_name: "Dubai Economic Department (DED)",
    target_bank: "Emirates NBD",
    status: "in_review",
    reportCount: 1,
    latestScore: 71,
  },
  {
    ...DEMO_COMPANY,
    id: "demo-company-4",
    legal_name: "Crescent Metals Trading LLC",
    trade_license_number: "ADDED-330871",
    emirate: "Abu Dhabi",
    jurisdiction_type: "mainland",
    authority_name: "Abu Dhabi Department of Economic Development",
    target_bank: "Mashreq",
    status: "high_risk",
    reportCount: 1,
    latestScore: 43,
  },
];
