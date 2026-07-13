import type {
  CompanyStatus,
  DocumentType,
  JurisdictionType,
} from "@/lib/types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  trade_license: "Trade license",
  moa_aoa: "MOA / AOA",
  shareholder_register: "Shareholder register",
  ubo_declaration: "UBO declaration",
  owner_passport: "Owner passport",
  owner_emirates_id: "Owner Emirates ID",
  owner_visa: "Owner visa",
  proof_of_address: "Proof of address",
  tenancy_or_office_agreement: "Tenancy / office agreement",
  invoice_or_contract: "Sample invoice or contract",
  bank_statement: "Bank statement",
  source_of_funds_evidence: "Source-of-funds evidence",
  business_plan: "Business plan",
  company_profile: "Company profile",
  other: "Other document",
};

/** Base checklist: TECH_SPEC §4 document types, always shown. */
export const BASE_REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  "trade_license",
  "ubo_declaration",
  "owner_passport",
  "owner_emirates_id",
  "tenancy_or_office_agreement",
  "business_plan",
];

export const OPTIONAL_DOCUMENT_TYPES: DocumentType[] = [
  "moa_aoa",
  "shareholder_register",
  "owner_visa",
  "proof_of_address",
  "invoice_or_contract",
  "bank_statement",
  "source_of_funds_evidence",
  "company_profile",
  "other",
];

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  ...BASE_REQUIRED_DOCUMENT_TYPES,
  ...OPTIONAL_DOCUMENT_TYPES,
];

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  ready: "Ready for assessment",
  high_risk: "High risk — fixes required",
  archived: "Archived",
};

export const JURISDICTION_LABELS: Record<JurisdictionType, string> = {
  mainland: "Mainland",
  free_zone: "Free zone",
  financial_free_zone: "Financial free zone",
  unknown: "Not sure yet",
};

export const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export const TARGET_BANKS = [
  "Wio Bank",
  "Mashreq",
  "Emirates NBD",
  "RAKBANK",
  "ADCB",
  "FAB",
  "ADIB",
  "Not sure yet",
] as const;

export const KREDAL_DISCLAIMER =
  "Kredal is not a bank, lender, law firm, auditor, or tax advisor. This report is a readiness assessment and document-preparation aid. It does not guarantee bank approval.";

export const QUESTIONNAIRE_SECTIONS = [
  { key: "business_activity", title: "Business activity" },
  { key: "expected_transactions", title: "Expected transactions" },
  { key: "source_of_funds", title: "Source of funds / wealth" },
  { key: "ubo_ownership", title: "UBO and ownership" },
  { key: "counterparties", title: "Customers, suppliers, countries" },
  { key: "tax_status", title: "Tax / VAT / corporate tax status" },
  { key: "payroll_wps", title: "Payroll / WPS needs" },
  { key: "banking_history", title: "Banking history / rejections" },
] as const;

export type QuestionnaireSectionKey =
  (typeof QUESTIONNAIRE_SECTIONS)[number]["key"];
