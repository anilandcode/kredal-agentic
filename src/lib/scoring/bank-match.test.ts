import { describe, expect, it } from "vitest";
import { matchBanks } from "@/lib/scoring/bank-match";
import type { ScoringInput } from "@/lib/scoring/rules";
import type { Company, CompanyDocument } from "@/lib/types";

const ALL_DOC_TYPES = [
  "trade_license",
  "owner_passport",
  "owner_emirates_id",
  "moa_aoa",
  "ubo_declaration",
  "tenancy_or_office_agreement",
  "business_plan",
  "invoice_or_contract",
  "bank_statement",
  "source_of_funds_evidence",
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
    expected_monthly_turnover_aed: 75_000,
    target_bank: "Wio Bank",
    target_account_type: "Business account",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeDoc(type: string): CompanyDocument {
  return {
    id: `doc-${type}`,
    company_id: "company-1",
    uploaded_by: "user-1",
    document_type: type as CompanyDocument["document_type"],
    storage_path: `ws/company-1/${type}.pdf`,
    original_filename: `${type}.pdf`,
    mime_type: "application/pdf",
    file_size_bytes: 1000,
    expiry_date: null,
    status: "uploaded",
    extracted_text: null,
    parse_confidence: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    company: makeCompany(),
    owners: [],
    documents: ALL_DOC_TYPES.map(makeDoc),
    answers: { source_of_funds_evidence_available: "yes" },
    ...overrides,
  };
}

describe("matchBanks", () => {
  it("returns all seven banks ranked by score descending", () => {
    const matches = matchBanks(makeInput());
    expect(matches).toHaveLength(7);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });

  it("scores a complete file at 100 for every bank", () => {
    const matches = matchBanks(makeInput());
    for (const m of matches) {
      expect(m.score).toBe(100);
      expect(m.blockers).toHaveLength(0);
    }
  });

  it("penalises high-min-balance banks when turnover is low", () => {
    const matches = matchBanks(
      makeInput({ company: makeCompany({ expected_monthly_turnover_aed: 20_000 }) })
    );
    const wio = matches.find((m) => m.bank === "Wio Bank")!;
    const fab = matches.find((m) => m.bank === "FAB")!;
    expect(wio.score).toBeGreaterThan(fab.score);
    expect(fab.blockers.join(" ")).toMatch(/higher balances/i);
  });

  it("flags missing bank-specific documents as blockers", () => {
    const docs = ALL_DOC_TYPES.filter((t) => t !== "bank_statement").map(makeDoc);
    const matches = matchBanks(makeInput({ documents: docs }));
    const mashreq = matches.find((m) => m.bank === "Mashreq")!;
    const rak = matches.find((m) => m.bank === "RAKBANK")!;
    expect(mashreq.blockers.join(" ")).toMatch(/Bank statement/);
    expect(rak.blockers.join(" ")).not.toMatch(/Bank statement/);
    expect(rak.score).toBeGreaterThan(mashreq.score);
  });

  it("penalises very young companies across banks", () => {
    const matches = matchBanks(
      makeInput({
        company: makeCompany({
          incorporation_date: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
      })
    );
    for (const m of matches) {
      expect(m.blockers.join(" ")).toMatch(/younger than 3 months/i);
    }
  });

  it("extra-penalises SoF-scrutiny banks when no evidence is available", () => {
    const docs = ALL_DOC_TYPES.filter((t) => t !== "source_of_funds_evidence").map(makeDoc);
    const matches = matchBanks(
      makeInput({
        documents: docs,
        answers: { source_of_funds_evidence_available: "no" },
      })
    );
    const adib = matches.find((m) => m.bank === "ADIB")!;
    expect(adib.blockers.join(" ")).toMatch(/source of funds/i);
  });

  it("never returns scores outside 0-100", () => {
    const matches = matchBanks(
      makeInput({
        documents: [],
        company: makeCompany({
          expected_monthly_turnover_aed: 1000,
          incorporation_date: new Date().toISOString(),
        }),
        answers: { source_of_funds_evidence_available: "no" },
      })
    );
    for (const m of matches) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });
});
