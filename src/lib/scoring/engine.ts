import { riskLevel } from "@/lib/scoring/risk";
import type {
  CategoryScore,
  Company,
  CompanyDocument,
  CompanyOwner,
  ReadinessFlag,
  RiskLevel,
} from "@/lib/types";

export const SCORING_VERSION = "v0";

export interface ScoringInput {
  company: Company;
  owners: CompanyOwner[];
  documents: CompanyDocument[];
  answers: Record<string, unknown>;
}

export interface ScoringResult {
  overallScore: number;
  riskLevel: RiskLevel;
  categoryScores: Record<string, CategoryScore>;
  flags: ReadinessFlag[];
  recommendations: string[];
}

interface CategoryOutcome {
  deductions: number;
  flags: ReadinessFlag[];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasDoc(documents: CompanyDocument[], type: string) {
  return documents.some((d) => d.document_type === type && d.status !== "rejected");
}

function monthsSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30);
}

/** Document completeness — 25 points. TECH_SPEC.md §6. */
function scoreDocumentCompleteness(input: ScoringInput): CategoryOutcome {
  const { company, owners, documents } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "document_completeness";

  if (!hasDoc(documents, "trade_license")) {
    deductions += 10;
    flags.push({
      severity: "high",
      category,
      issue: "Trade license not uploaded.",
      fix: "Upload a clear copy of your current trade license.",
    });
  }
  if (!hasDoc(documents, "owner_passport")) {
    deductions += 6;
    flags.push({
      severity: "high",
      category,
      issue: "Owner passport not uploaded.",
      fix: "Upload a passport copy for each owner.",
    });
  }
  const residentOwner = /resident/i.test(company.owner_uae_residency_status ?? "");
  if (residentOwner && !hasDoc(documents, "owner_emirates_id")) {
    deductions += 5;
    flags.push({
      severity: "medium",
      category,
      issue: "Emirates ID missing for a UAE-resident owner.",
      fix: "Upload the Emirates ID for each UAE-resident owner.",
    });
  }
  if (owners.length > 1 && !hasDoc(documents, "moa_aoa")) {
    deductions += 5;
    flags.push({
      severity: "medium",
      category,
      issue: "MOA/AOA missing for a multi-owner entity.",
      fix: "Upload the Memorandum/Articles of Association.",
    });
  }
  if (!hasDoc(documents, "ubo_declaration")) {
    deductions += 6;
    flags.push({
      severity: "high",
      category,
      issue: "UBO declaration not uploaded.",
      fix: "Upload a signed UBO (Ultimate Beneficial Owner) declaration.",
    });
  }
  if (!hasDoc(documents, "tenancy_or_office_agreement")) {
    deductions += 4;
    flags.push({
      severity: "medium",
      category,
      issue: "Tenancy or office agreement not uploaded.",
      fix: "Upload your Ejari or free-zone office agreement.",
    });
  }
  if (!hasDoc(documents, "business_plan") && !hasDoc(documents, "company_profile")) {
    deductions += 4;
    flags.push({
      severity: "medium",
      category,
      issue: "No business plan or company profile uploaded.",
      fix: "Upload a business plan or company profile document.",
    });
  }

  return { deductions, flags };
}

/** Identity and ownership consistency — 15 points. TECH_SPEC.md §6. */
function scoreOwnershipConsistency(input: ScoringInput): CategoryOutcome {
  const { company, owners, documents } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "ownership_consistency";

  if (owners.length === 0) {
    deductions += 8;
    flags.push({
      severity: "high",
      category,
      issue: "No ownership information added.",
      fix: "Add every shareholder in the questionnaire's ownership section.",
    });
    return { deductions, flags };
  }

  const totalOwnership = owners.reduce((sum, o) => sum + (o.ownership_percentage ?? 0), 0);
  if (totalOwnership !== 100) {
    deductions += 8;
    flags.push({
      severity: "high",
      category,
      issue: `Ownership percentages sum to ${totalOwnership}%, not 100%.`,
      fix: "Correct owner shareholding percentages so they total 100%.",
    });
  }

  const uboOwner = owners.find((o) => (o.ownership_percentage ?? 0) >= 25);
  if (uboOwner && !hasDoc(documents, "ubo_declaration")) {
    deductions += 8;
    flags.push({
      severity: "high",
      category,
      issue: `${uboOwner.full_name} owns 25%+ but no UBO declaration is on file.`,
      fix: "Upload a UBO declaration naming this owner.",
    });
  }

  const missingNationality = !company.owner_nationality || owners.some((o) => !o.nationality);
  if (missingNationality) {
    deductions += 4;
    flags.push({
      severity: "medium",
      category,
      issue: "Owner nationality is missing for one or more owners.",
      fix: "Add nationality for every owner.",
    });
  }

  return { deductions, flags };
}

/** Source-of-funds strength — 15 points. TECH_SPEC.md §6. */
function scoreSourceOfFunds(input: ScoringInput): CategoryOutcome {
  const { company, documents, answers } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "source_of_funds";

  const explanation = str(answers.source_of_funds_explanation).trim();
  if (!explanation) {
    deductions += 10;
    flags.push({
      severity: "high",
      category,
      issue: "No source-of-funds explanation on file.",
      fix: "Answer the source-of-funds question in the questionnaire.",
    });
  }

  if (str(answers.source_of_funds_evidence_available) === "no") {
    deductions += 8;
    flags.push({
      severity: "high",
      category,
      issue: "No supporting evidence for source of funds.",
      fix: "Upload savings statements, sale proceeds, or prior salary evidence.",
    });
  }

  const highRiskCorridor = str(answers.high_risk_corridor) === "yes";
  const corridorNarrative = str(answers.high_risk_corridor_narrative).trim();
  if (highRiskCorridor && !corridorNarrative) {
    deductions += 5;
    flags.push({
      severity: "high",
      category,
      issue: "High-risk corridor exposure with no explanation.",
      fix: "Explain the business reason for transacting with this jurisdiction.",
    });
  }

  const turnover = company.expected_monthly_turnover_aed ?? 0;
  if (turnover > 100_000 && !hasDoc(documents, "invoice_or_contract")) {
    deductions += 5;
    flags.push({
      severity: "medium",
      category,
      issue: "Large expected turnover with no supporting contracts or invoices.",
      fix: "Upload sample invoices or contracts that support your expected turnover.",
    });
  }

  return { deductions, flags };
}

/** Business activity clarity — 15 points. TECH_SPEC.md §6. */
function scoreBusinessActivity(input: ScoringInput): CategoryOutcome {
  const { company, answers } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "business_activity";

  if (!company.license_activity_codes || company.license_activity_codes.length === 0) {
    deductions += 7;
    flags.push({
      severity: "medium",
      category,
      issue: "License activity code missing.",
      fix: "Add your trade license activity code(s) to the company profile.",
    });
  }

  if (str(answers.activity_matches_license) === "no") {
    deductions += 8;
    flags.push({
      severity: "high",
      category,
      issue: "Actual business activity conflicts with the trade license.",
      fix: "Amend your trade license activity or align your operations with the licensed activity before applying.",
    });
  }

  if (str(answers.high_risk_activity) === "yes") {
    deductions += 5;
    flags.push({
      severity: "medium",
      category,
      issue: "Business activity may be classified as high-risk by banks (crypto, money exchange, precious metals, arms, or gambling).",
      fix: "Prepare a detailed compliance narrative and expect enhanced due diligence from the bank.",
    });
  }

  const description = str(answers.actual_activity_description).trim();
  const genericPhrases = ["general trading", "trading", "consulting", "services"];
  if (
    description &&
    (description.length < 40 || genericPhrases.includes(description.toLowerCase()))
  ) {
    deductions += 4;
    flags.push({
      severity: "medium",
      category,
      issue: "Business activity description is too generic.",
      fix: "Describe specifically what your business does, who it sells to, and how.",
    });
  }

  return { deductions, flags };
}

const HIGH_MIN_BALANCE_BANKS = new Set(["Mashreq", "Emirates NBD", "FAB", "ADCB"]);

/** Bank fit — 10 points. TECH_SPEC.md §6. */
function scoreBankFit(input: ScoringInput): CategoryOutcome {
  const { company } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "bank_fit";

  if (!company.target_bank) {
    deductions += 3;
    flags.push({
      severity: "medium",
      category,
      issue: "No target bank selected.",
      fix: "Choose a target bank so the checklist can be tailored to their requirements.",
    });
  } else if (
    HIGH_MIN_BALANCE_BANKS.has(company.target_bank) &&
    (company.expected_monthly_turnover_aed ?? 0) < 50_000
  ) {
    deductions += 3;
    flags.push({
      severity: "medium",
      category,
      issue: `${company.target_bank} typically expects a higher minimum balance than your expected turnover supports.`,
      fix: "Consider a digital-first bank (e.g. Wio) or plan for a higher minimum balance.",
    });
  }

  const ageMonths = monthsSince(company.incorporation_date);
  if (ageMonths !== null && ageMonths < 3) {
    deductions += 3;
    flags.push({
      severity: "medium",
      category,
      issue: "Company is under 3 months old.",
      fix: "Some banks are stricter with very new companies — apply with a strong business plan and source-of-funds narrative.",
    });
  }

  return { deductions, flags };
}

/** UAE founder/company history — 10 points. TECH_SPEC.md §6. */
function scoreUaeHistory(input: ScoringInput): CategoryOutcome {
  const { company, answers } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "uae_history";

  const residency = company.owner_uae_residency_status ?? "";
  if (!residency || /non-resident/i.test(residency)) {
    deductions += 5;
    flags.push({
      severity: "medium",
      category,
      issue: "Owner has limited or no UAE residency history.",
      fix: "Add UAE residency details, or expect additional bank scrutiny as a non-resident applicant.",
    });
  }

  if (str(answers.previously_rejected) === "yes") {
    deductions += 3;
    const reason = str(answers.rejection_reason).trim();
    flags.push({
      severity: "medium",
      category,
      issue: reason
        ? `Previously rejected by a bank: ${reason}`
        : "Previously rejected by a bank.",
      fix: "Address the prior rejection reason directly in your resubmission narrative.",
    });
  }

  const ageMonths = monthsSince(company.incorporation_date);
  if (ageMonths !== null && ageMonths < 6) {
    deductions += 2;
    flags.push({
      severity: "medium",
      category,
      issue: "Company has under 6 months of operating history.",
      fix: "Strengthen your file with a detailed business plan and any early contracts or invoices.",
    });
  }

  return { deductions, flags };
}

/** Compliance readiness — 10 points. TECH_SPEC.md §6. */
function scoreComplianceReadiness(input: ScoringInput): CategoryOutcome {
  const { company, answers } = input;
  const flags: ReadinessFlag[] = [];
  let deductions = 0;
  const category = "compliance_readiness";

  const taxStatus = str(answers.corporate_tax_status);
  if (!taxStatus || taxStatus === "unknown") {
    deductions += 4;
    flags.push({
      severity: "medium",
      category,
      issue: "Corporate tax status unknown.",
      fix: "Confirm your corporate tax registration status with the FTA.",
    });
  }

  const annualTurnover = (company.expected_monthly_turnover_aed ?? 0) * 12;
  const vatStatus = str(answers.vat_status);
  if (annualTurnover >= 300_000 && (!vatStatus || vatStatus === "unknown")) {
    deductions += 3;
    flags.push({
      severity: "medium",
      category,
      issue: "VAT status unknown while turnover is near the registration threshold.",
      fix: "Confirm whether VAT registration is required at your expected turnover.",
    });
  }

  const hasEmployees = str(answers.has_employees) === "yes";
  const wpsStatus = str(answers.wps_status);
  if (hasEmployees && (!wpsStatus || wpsStatus === "unknown")) {
    deductions += 3;
    flags.push({
      severity: "medium",
      category,
      issue: "WPS setup status unknown despite having employees.",
      fix: "Confirm WPS (Wage Protection System) registration before your first payroll run.",
    });
  }

  return { deductions, flags };
}

const CATEGORIES: {
  id: string;
  label: string;
  max: number;
  score: (input: ScoringInput) => CategoryOutcome;
}[] = [
  { id: "document_completeness", label: "Document completeness", max: 25, score: scoreDocumentCompleteness },
  { id: "ownership_consistency", label: "Identity & ownership consistency", max: 15, score: scoreOwnershipConsistency },
  { id: "source_of_funds", label: "Source-of-funds strength", max: 15, score: scoreSourceOfFunds },
  { id: "business_activity", label: "Business activity clarity", max: 15, score: scoreBusinessActivity },
  { id: "bank_fit", label: "Bank fit", max: 10, score: scoreBankFit },
  { id: "uae_history", label: "UAE founder/company history", max: 10, score: scoreUaeHistory },
  { id: "compliance_readiness", label: "Compliance readiness", max: 10, score: scoreComplianceReadiness },
];

function categoryLabelFor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Fair";
  if (pct >= 20) return "Needs work";
  return "Insufficient";
}

export function calculateReadiness(input: ScoringInput): ScoringResult {
  const categoryScores: Record<string, CategoryScore> = {};
  const flags: ReadinessFlag[] = [];
  let overallScore = 0;

  for (const category of CATEGORIES) {
    const { deductions, flags: categoryFlags } = category.score(input);
    const score = Math.max(0, category.max - deductions);
    categoryScores[category.id] = {
      score,
      max: category.max,
      label: categoryLabelFor(score, category.max),
      detail: categoryFlags.map((f) => f.issue).join(" ") || "No issues found.",
    };
    overallScore += score;
    flags.push(...categoryFlags);
  }

  const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const recommendations = [...new Set(flags.map((f) => f.fix))].slice(0, 7);
  if (recommendations.length === 0) {
    recommendations.push(
      "Your file looks bank-ready. Keep documents current and re-run this assessment before you apply."
    );
  }

  return {
    overallScore: Math.round(overallScore),
    riskLevel: riskLevel(overallScore),
    categoryScores,
    flags,
    recommendations,
  };
}
