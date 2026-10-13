"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { calculateReadiness, SCORING_VERSION } from "@/lib/scoring/engine";
import { getCompany, getCompanyOwners } from "@/lib/data/companies";
import { getCompanyDocuments } from "@/lib/data/documents";
import { getQuestionnaireAnswers } from "@/lib/data/questionnaire";
import type { CompanyStatus, RiskLevel } from "@/lib/types";

const STATUS_BY_RISK: Record<RiskLevel, CompanyStatus> = {
  low: "ready",
  medium: "in_review",
  high: "high_risk",
};

/** TECH_SPEC.md §10 — runReadinessAssessment. */
export async function runReadinessAssessment(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = await getCompany(companyId);
  if (!company) redirect("/app");

  const [owners, documents, answers] = await Promise.all([
    getCompanyOwners(companyId),
    getCompanyDocuments(companyId),
    getQuestionnaireAnswers(companyId),
  ]);

  const result = calculateReadiness({ company, owners, documents, answers });

  const { error } = await supabase.from("readiness_assessments").insert({
    company_id: companyId,
    overall_score: result.overallScore,
    risk_level: result.riskLevel,
    category_scores: result.categoryScores,
    flags: result.flags,
    recommendations: result.recommendations,
    scoring_version: SCORING_VERSION,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  await supabase
    .from("companies")
    .update({ status: STATUS_BY_RISK[result.riskLevel] })
    .eq("id", companyId);

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId: company.workspace_id,
    companyId,
    eventType: "assessment_run",
    eventData: { overall_score: result.overallScore, risk_level: result.riskLevel },
  });

  revalidatePath(`/app/companies/${companyId}/assessment`);
  revalidatePath(`/app/companies/${companyId}`);
  revalidatePath("/app");
  redirect(`/app/companies/${companyId}/assessment`);
}
