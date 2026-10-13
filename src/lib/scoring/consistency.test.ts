import { describe, expect, it } from "vitest";
import { calculateReadiness, type ScoringInput } from "@/lib/scoring/engine";
import type { Company, CompanyDocument, CompanyOwner } from "@/lib/types";

/**
 * Cross-document consistency rules: deterministic comparisons over AI-extracted
 * fields stored in documents.extracted_text. These tests use canned extraction
 * payloads — no AI is involved at scoring time.
 */

const ALL_DOC_TYPES = [
  "trade_license",
  "owner_passport",
  "owner_emirates_id",
  "moa_aoa",
  "ubo_declaration",
  "tenancy_or_office_agreement",
  "business_plan",
  "invoice_or_contract",
] as const;

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "company-1",
    workspace_id: "workspace-1",
    legal_name: "Al Falah General Trading LLC",
    trade_license_number: "12345",
    emirate: "Dubai",
    jurisdiction_type: "mainland",
    authority_name: "DED",
    license_activity_codes: ["4610"],
    incorporation_date: new Date(Date.now() - 400 * 86_400_000).toISOString(),
    office_status: "Ejari registered",
    owner_nationality: "Pakistani",
    owner_uae_residency_status: "UAE resident visa",
    expected_monthly_turnover_aed: 40_000,
    target_bank: "Wio Bank",
    target_account_type: "Business account",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeOwner(name = "Anil Founder"): CompanyOwner {
  return {
    id: "owner-1",
    company_id: "company-1",
    full_name: name,
    nationality: "Pakistani",
    ownership_percentage: 100,
    is_ubo: true,
    uae_residency_status: "resident",
    emirates_id_last4: "1234",
    passport_country: "Pakistan",
    created_at: new Date().toISOString(),
  };
}

function makeDocuments(
  extractions: Partial<Record<string, object>> = {}
): CompanyDocument[] {
  return ALL_DOC_TYPES.map((t, i) => ({
    id: `doc-${i}`,
    company_id: "company-1",
    uploaded_by: "user-1",
    document_type: t as CompanyDocument["document_type"],
    storage_path: `path/${t}`,
    original_filename: `${t}.pdf`,
    mime_type: "application/pdf",
    file_size_bytes: 1000,
    expiry_date: null,
    status: extractions[t] ? "parsed" : "uploaded",
    extracted_text: extractions[t] ? JSON.stringify(extractions[t]) : null,
    parse_confidence: extractions[t] ? 0.95 : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    company: makeCompany(),
    owners: [makeOwner()],
    documents: makeDocuments(),
    answers: {
      actual_activity_description:
        "We import packaged food from Pakistan and distribute it to supermarkets in Dubai.",
      activity_matches_license: "yes",
      high_risk_activity: "no",
      source_of_funds_explanation: "Personal savings from prior employment.",
      source_of_funds_evidence_available: "yes",
      high_risk_corridor: "no",
      corporate_tax_status: "registered",
      vat_status: "not_required",
      has_employees: "no",
      previously_applied: "no",
    },
    ...overrides,
  };
}

const FUTURE = "2030-01-01";
const PAST = "2020-01-01";

describe("cross-document consistency rules", () => {
  it("does not fire any xdoc rule when no extraction data exists", () => {
    const result = calculateReadiness(makeInput());
    expect(result.flags.some((f) => f.issue.toLowerCase().includes("trade license reads"))).toBe(false);
    expect(result.overallScore).toBeGreaterThanOrEqual(90);
  });

  it("stays silent when extracted names match the profile", () => {
    const result = calculateReadiness(
      makeInput({
        documents: makeDocuments({
          trade_license: {
            doc: "trade_license",
            legal_name: "AL FALAH GENERAL TRADING L.L.C",
            expiry_date: FUTURE,
          },
          owner_passport: {
            doc: "owner_passport",
            full_name: "FOUNDER, ANIL",
            expiry_date: FUTURE,
          },
        }),
      })
    );
    const xdocFlags = result.flags.filter((f) => f.issue.includes("does not match") || f.issue.includes("expired"));
    expect(xdocFlags).toHaveLength(0);
  });

  it("flags a trade-license name mismatch with a dynamic issue", () => {
    const result = calculateReadiness(
      makeInput({
        documents: makeDocuments({
          trade_license: {
            doc: "trade_license",
            legal_name: "Desert Rose Logistics LLC",
            expiry_date: FUTURE,
          },
        }),
      })
    );
    const flag = result.flags.find((f) => f.issue.includes("Desert Rose Logistics"));
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("high");
    expect(result.categoryScores.ownership_consistency.score).toBeLessThan(15);
  });

  it("flags an expired trade license", () => {
    const result = calculateReadiness(
      makeInput({
        documents: makeDocuments({
          trade_license: {
            doc: "trade_license",
            legal_name: "Al Falah General Trading LLC",
            expiry_date: PAST,
          },
        }),
      })
    );
    const flag = result.flags.find((f) => f.issue.includes("trade license has expired"));
    expect(flag).toBeDefined();
    expect(result.categoryScores.document_completeness.score).toBeLessThan(25);
  });

  it("flags a passport whose name matches no owner, and an expired passport", () => {
    const result = calculateReadiness(
      makeInput({
        documents: makeDocuments({
          owner_passport: {
            doc: "owner_passport",
            full_name: "Someone Else Entirely",
            expiry_date: PAST,
          },
        }),
      })
    );
    expect(
      result.flags.some((f) => f.issue.includes("passport's name does not match"))
    ).toBe(true);
    expect(
      result.flags.some((f) => f.issue.includes("passport has expired"))
    ).toBe(true);
  });
});
