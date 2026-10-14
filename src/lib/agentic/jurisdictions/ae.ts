import { SCORING_CATEGORIES, SCORING_RULES } from "@/lib/scoring/rules";
import type { JurisdictionPack } from "./types";

/**
 * United Arab Emirates — the complete pack. Scoring is Kredal's published
 * 32-rule catalog, unchanged. The fields mirror the extraction contracts in
 * `src/lib/ai/extraction.ts`, plus the bank-statement figures the Fraud
 * Sentinel needs.
 */
export const AE: JurisdictionPack = {
  id: "ae",
  name: "United Arab Emirates",
  status: "complete",
  categories: SCORING_CATEGORIES,
  rules: SCORING_RULES,
  docTypes: [
    {
      id: "trade_license",
      label: "Trade licence",
      recognise: "Commercial / professional / industrial licence; DED, free-zone authority; licence no.; activities",
      fields: [
        { name: "legal_name", description: "Company legal name exactly as printed", critical: true },
        { name: "license_number", description: "Licence number" },
        { name: "activity_codes", description: "Licensed activity codes, separated by '; '" },
        { name: "activity_descriptions", description: "Licensed activity descriptions, separated by '; '" },
        { name: "issue_date", description: "Issue date", format: "date" },
        { name: "expiry_date", description: "Expiry date", format: "date", critical: true },
        { name: "authority", description: "Issuing authority" },
      ],
    },
    {
      id: "owner_passport",
      label: "Passport",
      recognise: "Passport identity page; MRZ lines; nationality; date of birth",
      fields: [
        { name: "full_name", description: "Holder's full name, surname and given names", critical: true },
        { name: "nationality", description: "Nationality" },
        { name: "passport_number", description: "Document number" },
        { name: "date_of_birth", description: "Date of birth", format: "date" },
        { name: "expiry_date", description: "Date of expiry", format: "date", critical: true },
      ],
    },
    {
      id: "owner_emirates_id",
      label: "Emirates ID",
      recognise: "United Arab Emirates identity card; ID number 784-",
      fields: [
        { name: "full_name", description: "Holder's full name" },
        { name: "id_last4", description: "Last 4 digits of the ID number" },
        { name: "expiry_date", description: "Expiry date", format: "date" },
      ],
    },
    {
      id: "tenancy_or_office_agreement",
      label: "Tenancy / Ejari",
      recognise: "Tenancy contract; Ejari; lease; flexi-desk / office agreement",
      fields: [
        { name: "tenant_name", description: "Tenant or company name" },
        { name: "premises_address", description: "Premises address" },
        { name: "expiry_date", description: "Contract end date", format: "date" },
      ],
    },
    {
      id: "bank_statement",
      label: "Bank statement",
      recognise: "Account statement; opening / closing balance; transactions; IBAN",
      fields: [
        { name: "account_holder", description: "Account holder name" },
        { name: "bank_name", description: "Bank name" },
        { name: "period_start", description: "Statement period start", format: "date" },
        { name: "period_end", description: "Statement period end", format: "date" },
        { name: "opening_balance", description: "Opening balance", format: "amount" },
        { name: "closing_balance", description: "Closing balance", format: "amount" },
        { name: "total_credits", description: "Total credits (money in) for the period", format: "amount" },
        { name: "total_debits", description: "Total debits (money out) for the period", format: "amount" },
        { name: "currency", description: "Currency code" },
      ],
    },
    // Recognised and counted for completeness, but nothing is read off them:
    // the rules only need to know they are present.
    { id: "ubo_declaration", label: "UBO declaration", recognise: "Ultimate beneficial owner declaration; ownership percentage; signature", fields: [] },
    { id: "moa_aoa", label: "MOA / AOA", recognise: "Memorandum or articles of association; shareholders; capital", fields: [] },
    { id: "invoice_or_contract", label: "Invoice / contract", recognise: "Invoice, supply agreement, purchase order, service contract", fields: [] },
    { id: "business_plan", label: "Business plan", recognise: "Business plan or company profile; market; customers; projections", fields: [] },
    { id: "source_of_funds_evidence", label: "Source-of-funds evidence", recognise: "Sale agreement, salary letter, investment proof, transfer receipts", fields: [] },
  ],
};
