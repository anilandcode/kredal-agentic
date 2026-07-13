import { QUESTIONNAIRE_SECTIONS, type QuestionnaireSectionKey } from "@/lib/constants";

export type QuestionType = "text" | "textarea" | "number" | "select" | "radio";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  key: string;
  label: string;
  type: QuestionType;
  helpText?: string;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
  /** Only rendered when the field with this key in the same section equals `equals`. */
  showIf?: { key: string; equals: string };
}

const YES_NO: QuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const QUESTIONNAIRE_SCHEMA: Record<QuestionnaireSectionKey, QuestionDef[]> = {
  business_activity: [
    {
      key: "actual_activity_description",
      label: "Describe what your business actually does, day to day",
      type: "textarea",
      required: true,
      placeholder: "e.g. We import packaged food from Pakistan and distribute it to supermarkets in Dubai and Sharjah.",
      helpText: "Be specific — generic descriptions like \"general trading\" are a common bank rejection trigger.",
    },
    {
      key: "activity_matches_license",
      label: "Does this match your trade license activity exactly?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
    {
      key: "high_risk_activity",
      label:
        "Does your business involve crypto/virtual assets, money exchange, precious metals, arms, or gambling?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
  ],
  expected_transactions: [
    {
      key: "expected_monthly_transaction_count",
      label: "Expected number of transactions per month",
      type: "select",
      options: [
        { value: "under_20", label: "Under 20" },
        { value: "20_100", label: "20–100" },
        { value: "100_500", label: "100–500" },
        { value: "over_500", label: "Over 500" },
      ],
      required: true,
    },
    {
      key: "average_transaction_size_aed",
      label: "Average transaction size (AED)",
      type: "number",
    },
    {
      key: "cash_heavy",
      label: "Will a significant share of transactions be in cash?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
  ],
  source_of_funds: [
    {
      key: "source_of_funds_explanation",
      label: "Where does the money funding this business come from?",
      type: "textarea",
      placeholder: "e.g. Personal savings from 8 years working in logistics in Dubai, plus a AED 150,000 investment from a co-founder.",
    },
    {
      key: "source_of_funds_evidence_available",
      label: "Do you have documents proving this (bank statements, sale of asset, prior salary)?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
    {
      key: "high_risk_corridor",
      label: "Do you regularly send or receive funds to/from higher-risk jurisdictions?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
    {
      key: "high_risk_corridor_narrative",
      label: "Explain the business reason for this corridor",
      type: "textarea",
      showIf: { key: "high_risk_corridor", equals: "yes" },
    },
  ],
  ubo_ownership: [
    {
      key: "ownership_structure_notes",
      label: "Anything unusual about your ownership structure a bank should know?",
      type: "textarea",
      placeholder: "e.g. One shareholder is a corporate entity registered in the UK.",
    },
  ],
  counterparties: [
    {
      key: "major_customer_countries",
      label: "Main countries your customers are in",
      type: "text",
      placeholder: "Comma-separated, e.g. UAE, Saudi Arabia, UK",
    },
    {
      key: "major_supplier_countries",
      label: "Main countries your suppliers are in",
      type: "text",
      placeholder: "Comma-separated, e.g. Pakistan, China",
    },
    {
      key: "import_export",
      label: "Does your business import or export physical goods?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
  ],
  tax_status: [
    {
      key: "corporate_tax_status",
      label: "Corporate tax status",
      type: "select",
      options: [
        { value: "registered", label: "Registered" },
        { value: "exempt_small_business", label: "Exempt (Small Business Relief)" },
        { value: "not_yet_registered", label: "Not yet registered" },
        { value: "unknown", label: "Not sure" },
      ],
      required: true,
    },
    {
      key: "vat_status",
      label: "VAT status",
      type: "select",
      options: [
        { value: "registered", label: "Registered" },
        { value: "not_required", label: "Not required (below threshold)" },
        { value: "not_yet_registered", label: "Not yet registered" },
        { value: "unknown", label: "Not sure" },
      ],
      required: true,
    },
  ],
  payroll_wps: [
    {
      key: "has_employees",
      label: "Do you have or plan to have employees on payroll?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
    {
      key: "employee_count",
      label: "Number of employees",
      type: "number",
      showIf: { key: "has_employees", equals: "yes" },
    },
    {
      key: "wps_status",
      label: "WPS (Wage Protection System) setup status",
      type: "select",
      options: [
        { value: "set_up", label: "Set up" },
        { value: "in_progress", label: "In progress" },
        { value: "not_set_up", label: "Not set up" },
        { value: "unknown", label: "Not sure" },
      ],
      showIf: { key: "has_employees", equals: "yes" },
    },
  ],
  banking_history: [
    {
      key: "previously_applied",
      label: "Have you applied for a UAE business bank account before?",
      type: "radio",
      options: YES_NO,
      required: true,
    },
    {
      key: "previously_rejected",
      label: "Was that application rejected or significantly delayed?",
      type: "radio",
      options: YES_NO,
      showIf: { key: "previously_applied", equals: "yes" },
    },
    {
      key: "rejection_bank_name",
      label: "Which bank?",
      type: "text",
      showIf: { key: "previously_rejected", equals: "yes" },
    },
    {
      key: "rejection_reason",
      label: "What reason did the bank give, if any?",
      type: "textarea",
      showIf: { key: "previously_rejected", equals: "yes" },
    },
  ],
};

export function getSectionQuestions(section: QuestionnaireSectionKey): QuestionDef[] {
  return QUESTIONNAIRE_SCHEMA[section];
}

export function getSectionTitle(section: QuestionnaireSectionKey): string {
  return QUESTIONNAIRE_SECTIONS.find((s) => s.key === section)?.title ?? section;
}
