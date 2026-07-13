import {
  ALL_DOCUMENT_TYPES,
  BASE_REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  JURISDICTION_LABELS,
  KREDAL_DISCLAIMER,
} from "@/lib/constants";
import { RISK_LABEL } from "@/lib/scoring/risk";
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

export function reportTitle(reportType: "founder_readiness" | "bank_application_pack"): string {
  return reportType === "bank_application_pack"
    ? "Bank application pack"
    : "Founder readiness report";
}
