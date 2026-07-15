import {
  ALL_DOCUMENT_TYPES,
  BASE_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  JURISDICTION_LABELS,
  KREDAL_DISCLAIMER,
} from "@/lib/constants";
import { RISK_LABEL } from "@/lib/scoring/risk";
import { requiredDocsFor } from "@/lib/checklist";
import type {
  Company,
  CompanyDocument,
  CompanyOwner,
  ReadinessAssessment,
  ReadinessFlag,
} from "@/lib/types";

export interface ReportData {
  company: Company;
  owners: CompanyOwner[];
  documents: CompanyDocument[];
  assessment: ReadinessAssessment;
  answers: Record<string, unknown>;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasDoc(documents: CompanyDocument[], type: string) {
  return documents.some((d) => d.document_type === type && d.status !== "rejected");
}

function disclaimerSection(): string {
  return `> ${KREDAL_DISCLAIMER}`;
}

function companySummarySection({ company }: ReportData): string {
  return [
    "## Company summary",
    "",
    `- **Legal name:** ${company.legal_name}`,
    `- **Trade license number:** ${company.trade_license_number ?? "Not provided"}`,
    `- **Emirate:** ${company.emirate ?? "Not provided"}`,
    `- **Jurisdiction:** ${JURISDICTION_LABELS[company.jurisdiction_type]}`,
    `- **Authority / free zone:** ${company.authority_name ?? "Not provided"}`,
    `- **Incorporation date:** ${company.incorporation_date ?? "Not provided"}`,
    `- **Expected monthly turnover:** ${
      company.expected_monthly_turnover_aed
        ? `AED ${Number(company.expected_monthly_turnover_aed).toLocaleString("en-AE")}`
        : "Not provided"
    }`,
    `- **Target bank:** ${company.target_bank ?? "Not selected"}`,
  ].join("\n");
}

function scoreSection({ assessment }: ReportData): string {
  return [
    "## Overall readiness score",
    "",
    `**${assessment.overall_score} / 100**`,
    "",
    "## Risk level",
    "",
    `**${RISK_LABEL[assessment.risk_level]}**`,
  ].join("\n");
}

function topRisksSection({ assessment }: ReportData): string {
  const flags = (assessment.flags as ReadinessFlag[]).slice(0, 5);
  if (flags.length === 0) {
    return ["## Top rejection risks", "", "No material risks found."].join("\n");
  }
  return [
    "## Top rejection risks",
    "",
    ...flags.map((f, i) => `${i + 1}. **[${f.severity.toUpperCase()}]** ${f.issue}`),
  ].join("\n");
}

function fixesSection({ assessment }: ReportData): string {
  const fixes = [...new Set((assessment.flags as ReadinessFlag[]).map((f) => f.fix))];
  if (fixes.length === 0) {
    return ["## Required fixes", "", "No fixes required."].join("\n");
  }
  return ["## Required fixes", "", ...fixes.map((f) => `- [ ] ${f}`)].join("\n");
}

function documentChecklistSection({ documents }: ReportData): string {
  const lines = ALL_DOCUMENT_TYPES.map((type) => {
    const required = (BASE_REQUIRED_DOCUMENT_TYPES as readonly string[]).includes(type);
    const uploaded = hasDoc(documents, type);
    const mark = uploaded ? "✅" : required ? "❌" : "—";
    return `- ${mark} ${DOCUMENT_TYPE_LABELS[type]}${required ? " (required)" : ""}`;
  });
  return ["## Document checklist", "", ...lines].join("\n");
}

function sourceOfFundsNarrativeSection({ answers }: ReportData): string {
  const explanation = str(answers.source_of_funds_explanation);
  const corridorNarrative = str(answers.high_risk_corridor_narrative);
  if (!explanation) {
    return [
      "## Source-of-funds narrative draft",
      "",
      "_Not yet provided — complete the \"Source of funds\" section of the questionnaire._",
    ].join("\n");
  }
  const parts = [explanation];
  if (corridorNarrative) parts.push(corridorNarrative);
  return ["## Source-of-funds narrative draft", "", parts.join(" ")].join("\n");
}

function businessActivityNarrativeSection({ company, answers }: ReportData): string {
  const description = str(answers.actual_activity_description);
  const codes = company.license_activity_codes?.join(", ") ?? "not on file";
  if (!description) {
    return [
      "## Business activity narrative draft",
      "",
      "_Not yet provided — complete the \"Business activity\" section of the questionnaire._",
    ].join("\n");
  }
  return [
    "## Business activity narrative draft",
    "",
    `${description} (Licensed activity code(s): ${codes}.)`,
  ].join("\n");
}

function uboSummarySection({ owners }: ReportData): string {
  if (owners.length === 0) {
    return ["## UBO summary", "", "No owners have been added yet."].join("\n");
  }
  const rows = owners.map(
    (o) =>
      `| ${o.full_name} | ${o.nationality ?? "—"} | ${o.ownership_percentage ?? "—"}% | ${
        o.is_ubo ? "Yes" : "No"
      } |`
  );
  return [
    "## UBO summary",
    "",
    "| Owner | Nationality | Ownership | UBO |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function bankPrepSection({ company }: ReportData): string {
  const bank = company.target_bank ?? "your chosen bank";
  return [
    "## Target-bank preparation checklist",
    "",
    `- [ ] Confirm ${bank}'s current minimum balance and account fees`,
    "- [ ] Bring original trade license, MOA/AOA, and passports to the branch appointment",
    "- [ ] Prepare a one-page verbal summary of your business activity and source of funds",
    "- [ ] Bring proof of office address (Ejari or free-zone agreement)",
    "- [ ] Have 3-6 months of any prior bank statements ready, if available",
  ].join("\n");
}

function actionPlanSection({ assessment }: ReportData): string {
  const actions = assessment.recommendations.slice(0, 7) as string[];
  return [
    "## Next 7-day action plan",
    "",
    ...actions.map((a, i) => `${i + 1}. ${a}`),
  ].join("\n");
}

function buildSections(data: ReportData): string[] {
  return [
    disclaimerSection(),
    companySummarySection(data),
    scoreSection(data),
    topRisksSection(data),
    fixesSection(data),
    documentChecklistSection(data),
    sourceOfFundsNarrativeSection(data),
    businessActivityNarrativeSection(data),
    uboSummarySection(data),
    bankPrepSection(data),
    actionPlanSection(data),
  ];
}

export function buildFounderReadinessReport(data: ReportData): string {
  return [
    `# Bank-readiness report — ${data.company.legal_name}`,
    "",
    ...buildSections(data),
  ].join("\n\n");
}

export function buildBankApplicationPackReport(data: ReportData): string {
  return [
    `# Bank application pack — ${data.company.legal_name}`,
    "",
    "_Prepared for submission to a UAE bank. Review every section before sending._",
    "",
    ...buildSections(data),
  ].join("\n\n");
}

export function buildConsultantChecklistReport(data: ReportData): string {
  const { company, documents, assessment, owners } = data;
  const checklist = requiredDocsFor(company);

  const docRows = [...checklist.required, ...checklist.optional].map((type) => {
    const uploaded = hasDoc(documents, type);
    const doc = documents.find((d) => d.document_type === type);
    const required = checklist.required.includes(type) ? "Required" : "Optional";
    const status = uploaded ? (doc?.status ?? "uploaded") : "missing";
    return `| ${DOCUMENT_TYPE_LABELS[type]} | ${required} | ${uploaded ? "✅" : "❌"} | ${status} |`;
  });

  const highFlags = (assessment.flags as ReadinessFlag[]).filter(
    (f) => f.severity === "high"
  );

  return [
    `# Consultant checklist — ${company.legal_name}`,
    "",
    disclaimerSection(),
    companySummarySection(data),
    scoreSection(data),
    [
      "## Document checklist" +
        (company.target_bank ? ` (tailored to ${company.target_bank})` : ""),
      "",
      "| Document | Requirement | Uploaded | Status |",
      "|---|---|---|---|",
      ...docRows,
    ].join("\n"),
    [
      "## Client blockers (high severity)",
      "",
      ...(highFlags.length
        ? highFlags.map((f, i) => `${i + 1}. ${f.issue} — _${f.fix}_`)
        : ["No high-severity blockers."]),
    ].join("\n"),
    uboSummarySection(data),
    [
      "## Suggested client engagement steps",
      "",
      "1. Send the client the missing required documents list above.",
      "2. Resolve every high-severity blocker before contacting the bank.",
      `3. Confirm ownership records for ${owners.length || "the"} listed owner(s) match passports exactly.`,
      "4. Re-run the assessment after fixes, then generate the bank application pack.",
    ].join("\n"),
  ].join("\n\n");
}

export function buildRejectionRecoveryPackReport(data: ReportData): string {
  const { company, answers, assessment } = data;
  const rejectedBank = str(answers.rejection_bank_name) || "the bank";
  const rejectionReason = str(answers.rejection_reason);

  return [
    `# Rejection recovery pack — ${company.legal_name}`,
    "",
    disclaimerSection(),
    [
      "## What happened",
      "",
      `- **Previous application:** ${str(answers.previously_applied) === "yes" ? "Yes" : "Not recorded"}`,
      `- **Bank:** ${rejectedBank}`,
      `- **Stated reason:** ${rejectionReason || "_Not recorded — ask the bank for specifics in writing._"}`,
    ].join("\n"),
    scoreSection(data),
    topRisksSection(data),
    fixesSection(data),
    sourceOfFundsNarrativeSection(data),
    businessActivityNarrativeSection(data),
    [
      "## Resubmission letter skeleton",
      "",
      "> Dear Sir/Madam,",
      ">",
      `> We previously applied to open a business account for ${company.legal_name}` +
        (rejectionReason ? `, and understand the application was declined (${rejectionReason.toLowerCase()}).` : "."),
      "> Since then we have addressed the following points:",
      ">",
      "> - [List each fix completed, matching the Required fixes section above]",
      ">",
      "> Enclosed is our updated application pack, including [list key documents].",
      "> We would welcome the opportunity to discuss any remaining questions.",
      ">",
      "> Sincerely,",
      "> [Authorised signatory]",
    ].join("\n"),
    actionPlanSection(data),
  ].join("\n\n");
}

export type BuildableReportType =
  | "founder_readiness"
  | "bank_application_pack"
  | "consultant_checklist"
  | "rejection_recovery_pack";

const TITLES: Record<BuildableReportType, string> = {
  founder_readiness: "Founder readiness report",
  bank_application_pack: "Bank application pack",
  consultant_checklist: "Consultant checklist",
  rejection_recovery_pack: "Rejection recovery pack",
};

export function reportTitle(reportType: BuildableReportType): string {
  return TITLES[reportType];
}

export function buildReport(reportType: BuildableReportType, data: ReportData): string {
  switch (reportType) {
    case "bank_application_pack":
      return buildBankApplicationPackReport(data);
    case "consultant_checklist":
      return buildConsultantChecklistReport(data);
    case "rejection_recovery_pack":
      return buildRejectionRecoveryPackReport(data);
    default:
      return buildFounderReadinessReport(data);
  }
}
