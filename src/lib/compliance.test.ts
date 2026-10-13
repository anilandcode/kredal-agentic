import { describe, expect, it } from "vitest";
import { buildComplianceRadar } from "@/lib/compliance";
import type { Company, CompanyDocument } from "@/lib/types";

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "company-1",
    workspace_id: "workspace-1",
    legal_name: "Test LLC",
    trade_license_number: "12345",
    emirate: "Dubai",
    jurisdiction_type: "mainland",
    authority_name: "DED",
    license_activity_codes: ["4610"],
    incorporation_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    office_status: "Ejari",
    owner_nationality: "Pakistani",
    owner_uae_residency_status: "resident",
    expected_monthly_turnover_aed: 75_000,
    target_bank: "Wio Bank",
    target_account_type: "Business",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeDoc(
  type: string,
  overrides: Partial<CompanyDocument> = {}
): CompanyDocument {
  return {
    id: `doc-${type}`,
    company_id: "company-1",
    uploaded_by: "user-1",
    document_type: type as CompanyDocument["document_type"],
    storage_path: `p/${type}.pdf`,
    original_filename: `${type}.pdf`,
    mime_type: "application/pdf",
    file_size_bytes: 1000,
    expiry_date: null,
    status: "uploaded",
    extracted_text: null,
    parse_confidence: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const ALL_BASE = [
  "trade_license",
  "ubo_declaration",
  "owner_passport",
  "owner_emirates_id",
  "tenancy_or_office_agreement",
  "business_plan",
];

const CLEAN_ANSWERS = {
  corporate_tax_status: "registered",
  vat_status: "registered",
  has_employees: "no",
};

describe("buildComplianceRadar", () => {
  it("returns no items for a clean, current file", () => {
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: ALL_BASE.map((t) => makeDoc(t)),
      answers: CLEAN_ANSWERS,
    });
    expect(items).toHaveLength(0);
  });

  it("flags an expired document as high severity", () => {
    const docs = ALL_BASE.map((t) => makeDoc(t));
    docs[0] = makeDoc("trade_license", {
      expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: docs,
      answers: CLEAN_ANSWERS,
    });
    expect(items[0].severity).toBe("high");
    expect(items[0].label).toMatch(/expired/i);
  });

  it("reads expiry from AI-extracted JSON when the column is empty", () => {
    const docs = ALL_BASE.map((t) => makeDoc(t));
    docs[0] = makeDoc("trade_license", {
      extracted_text: JSON.stringify({
        expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      }),
    });
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: docs,
      answers: CLEAN_ANSWERS,
    });
    expect(items.some((i) => /expires in/i.test(i.label))).toBe(true);
  });

  it("raises the corporate-tax item when status is unresolved", () => {
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: ALL_BASE.map((t) => makeDoc(t)),
      answers: { ...CLEAN_ANSWERS, corporate_tax_status: "not_yet_registered" },
    });
    expect(items.some((i) => /corporate tax/i.test(i.label))).toBe(true);
  });

  it("raises VAT only when turnover is at/above the threshold", () => {
    const base = {
      documents: ALL_BASE.map((t) => makeDoc(t)),
      answers: { ...CLEAN_ANSWERS, vat_status: "unknown" },
    };
    const above = buildComplianceRadar({ ...base, company: makeCompany() });
    const below = buildComplianceRadar({
      ...base,
      company: makeCompany({ expected_monthly_turnover_aed: 10_000 }),
    });
    expect(above.some((i) => /vat/i.test(i.label))).toBe(true);
    expect(below.some((i) => /vat/i.test(i.label))).toBe(false);
  });

  it("flags WPS when there are employees and it is not set up", () => {
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: ALL_BASE.map((t) => makeDoc(t)),
      answers: { ...CLEAN_ANSWERS, has_employees: "yes", wps_status: "not_set_up" },
    });
    const wps = items.find((i) => /wps/i.test(i.label));
    expect(wps?.severity).toBe("high");
  });

  it("aggregates missing required documents and sorts high before medium", () => {
    const items = buildComplianceRadar({
      company: makeCompany(),
      documents: [],
      answers: { ...CLEAN_ANSWERS, has_employees: "yes", wps_status: "not_set_up" },
    });
    expect(items.some((i) => /required document/i.test(i.label))).toBe(true);
    const sevs = items.map((i) => i.severity);
    expect(sevs.indexOf("high")).toBeLessThan(sevs.lastIndexOf("medium"));
  });
});
