import { describe, expect, it } from "vitest";
import { calculateReadiness, type ScoringInput } from "@/lib/scoring/engine";
import type { Company, CompanyDocument, CompanyOwner } from "@/lib/types";

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
    incorporation_date: new Date(
      Date.now() - 400 * 24 * 60 * 60 * 1000
    ).toISOString(),
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

function makeOwners(overrides?: Partial<CompanyOwner>[]): CompanyOwner[] {
  if (overrides) {
    return overrides.map((o, i) => ({
      id: `owner-${i}`,
      company_id: "company-1",
      full_name: `Owner ${i}`,
      nationality: "Pakistani",
      ownership_percentage: 100,
      is_ubo: true,
      uae_residency_status: "resident",
      emirates_id_last4: null,
      passport_country: "Pakistan",
      created_at: new Date().toISOString(),
      ...o,
    }));
  }
  return [
    {
      id: "owner-1",
      company_id: "company-1",
      full_name: "Anil Founder",
      nationality: "Pakistani",
      ownership_percentage: 100,
      is_ubo: true,
      uae_residency_status: "resident",
      emirates_id_last4: "1234",
      passport_country: "Pakistan",
      created_at: new Date().toISOString(),
    },
  ];
}

function makeDocuments(types: readonly string[] = ALL_DOC_TYPES): CompanyDocument[] {
  return types.map((t, i) => ({
    id: `doc-${i}`,
    company_id: "company-1",
    uploaded_by: "user-1",
    document_type: t as CompanyDocument["document_type"],
    storage_path: `path/${t}`,
    original_filename: `${t}.pdf`,
    mime_type: "application/pdf",
    file_size_bytes: 1000,
    expiry_date: null,
    status: "uploaded",
    extracted_text: null,
    parse_confidence: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function makeAnswers(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    actual_activity_description:
      "We import packaged food from Pakistan and distribute it to supermarkets in Dubai and Sharjah.",
    activity_matches_license: "yes",
    high_risk_activity: "no",
    source_of_funds_explanation: "Personal savings from 8 years working in logistics.",
    source_of_funds_evidence_available: "yes",
    high_risk_corridor: "no",
    corporate_tax_status: "registered",
    vat_status: "not_required",
    has_employees: "no",
    previously_applied: "no",
    ...overrides,
  };
}

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    company: makeCompany(),
    owners: makeOwners(),
    documents: makeDocuments(),
    answers: makeAnswers(),
    ...overrides,
  };
}

describe("calculateReadiness", () => {
  it("scores a complete, clean file near the top of each category", () => {
    const result = calculateReadiness(makeInput());

    expect(result.categoryScores.document_completeness.score).toBe(25);
    expect(result.categoryScores.ownership_consistency.score).toBe(15);
    expect(result.categoryScores.source_of_funds.score).toBe(15);
    expect(result.categoryScores.business_activity.score).toBe(15);
    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.riskLevel).toBe("low");
  });

  it("flags a missing trade license as high severity and deducts points", () => {
    const documents = makeDocuments(ALL_DOC_TYPES.filter((t) => t !== "trade_license"));
    const result = calculateReadiness(makeInput({ documents }));

    const flag = result.flags.find((f) => f.issue.includes("Trade license"));
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("high");
    expect(result.categoryScores.document_completeness.score).toBe(15);
  });

  it("flags a missing UBO declaration", () => {
    const documents = makeDocuments(ALL_DOC_TYPES.filter((t) => t !== "ubo_declaration"));
    const result = calculateReadiness(makeInput({ documents }));

    const flag = result.flags.find((f) => f.issue.toLowerCase().includes("ubo"));
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("high");
  });

  it("lowers the source-of-funds score when the explanation is missing", () => {
    const withExplanation = calculateReadiness(makeInput());
    const withoutExplanation = calculateReadiness(
      makeInput({ answers: makeAnswers({ source_of_funds_explanation: "" }) })
    );

    expect(withoutExplanation.categoryScores.source_of_funds.score).toBeLessThan(
      withExplanation.categoryScores.source_of_funds.score
    );
    expect(
      withoutExplanation.flags.some((f) => f.issue.includes("source-of-funds explanation"))
    ).toBe(true);
  });

  it("triggers a warning when the business activity is flagged high-risk", () => {
    const result = calculateReadiness(
      makeInput({ answers: makeAnswers({ high_risk_activity: "yes" }) })
    );

    const flag = result.flags.find((f) => f.issue.toLowerCase().includes("high-risk"));
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("medium");
  });

  it("classifies risk levels using the TECH_SPEC thresholds", () => {
    const empty = calculateReadiness({
      company: makeCompany({
        license_activity_codes: null,
        target_bank: null,
        owner_uae_residency_status: null,
        expected_monthly_turnover_aed: null,
      }),
      owners: [],
      documents: [],
      answers: {},
    });

    expect(empty.overallScore).toBeLessThan(55);
    expect(empty.riskLevel).toBe("high");
  });
});
