"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import {
  buildBankApplicationPackReport,
  buildFounderReadinessReport,
  reportTitle,
} from "@/lib/reports/templates";
import { getCompany, getCompanyOwners } from "@/lib/data/companies";
import { getCompanyDocuments } from "@/lib/data/documents";
import { getQuestionnaireAnswers } from "@/lib/data/questionnaire";
import { getLatestAssessment } from "@/lib/data/assessments";

export type GeneratableReportType = "founder_readiness" | "bank_application_pack";

/** TECH_SPEC.md §10 — generateReport. */
export async function generateReport(
  companyId: string,
  reportType: GeneratableReportType
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = await getCompany(companyId);
  if (!company) redirect("/app");

  const assessment = await getLatestAssessment(companyId);
  if (!assessment) redirect(`/app/companies/${companyId}/assessment`);

  const [owners, documents, answers] = await Promise.all([
    getCompanyOwners(companyId),
    getCompanyDocuments(companyId),
    getQuestionnaireAnswers(companyId),
  ]);

  const data = { company, owners, documents, assessment, answers };
  const content =
    reportType === "bank_application_pack"
      ? buildBankApplicationPackReport(data)
      : buildFounderReadinessReport(data);

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      company_id: companyId,
      assessment_id: assessment.id,
      report_type: reportType,
      title: `${reportTitle(reportType)} — ${company.legal_name}`,
      content_markdown: content,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId: company.workspace_id,
    companyId,
    eventType: "report_generated",
    eventData: { report_type: reportType },
  });

  revalidatePath(`/app/companies/${companyId}/reports`);
  redirect(`/app/companies/${companyId}/reports/${report.id}`);
}
