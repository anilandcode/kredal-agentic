import { describe, expect, it } from "vitest";
import {
  buildBankApplicationPackReport,
  buildFounderReadinessReport,
  type ReportData,
} from "@/lib/reports/templates";
import { KREDAL_DISCLAIMER } from "@/lib/constants";
import type { Company, ReadinessAssessment } from "@/lib/types";

function makeData(): ReportData {
  const company: Company = {
    id: "company-1",
    workspace_id: "workspace-1",
    legal_name: "Al Falah General Trading LLC",
    trade_license_number: "12345",
    emirate: "Dubai",
    jurisdiction_type: "mainland",
    authority_name: "DED",
    license_activity_codes: ["4610"],
    incorporation_date: "2025-01-01",
    office_status: "Ejari registered",
    owner_nationality: "Pakistani",
    owner_uae_residency_status: "resident",
    expected_monthly_turnover_aed: 40000,
    target_bank: "Wio Bank",
    target_account_type: "Business account",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const assessment: ReadinessAssessment = {
    id: "assessment-1",
    company_id: "company-1",
    overall_score: 72,
    risk_level: "medium",
    category_scores: {},
    flags: [
      {
        severity: "high",
        category: "document_completeness",
        issue: "Trade license not uploaded.",
        fix: "Upload a clear copy of your current trade license.",
      },
    ],
    recommendations: ["Upload a clear copy of your current trade license."],
    scoring_version: "v0",
    created_by: "user-1",
    created_at: new Date().toISOString(),
  };

  return { company, owners: [], documents: [], assessment, answers: {} };
}

describe("report templates", () => {
  it("founder readiness report includes the mandatory disclaimer", () => {
    const report = buildFounderReadinessReport(makeData());
    expect(report).toContain(KREDAL_DISCLAIMER);
  });

  it("bank application pack report includes the mandatory disclaimer", () => {
    const report = buildBankApplicationPackReport(makeData());
    expect(report).toContain(KREDAL_DISCLAIMER);
  });

  it("includes the company name and score in the founder report", () => {
    const report = buildFounderReadinessReport(makeData());
    expect(report).toContain("Al Falah General Trading LLC");
    expect(report).toContain("72 / 100");
  });
});
