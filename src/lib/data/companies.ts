import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyOwner, CompanySummary } from "@/lib/types";

export async function getWorkspaceCompanies(
  workspaceId: string
): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Companies plus report count and latest assessment score — for the consultant dashboard. */
export async function getWorkspaceCompanySummaries(
  workspaceId: string
): Promise<CompanySummary[]> {
  const companies = await getWorkspaceCompanies(workspaceId);
  if (companies.length === 0) return [];

  const companyIds = companies.map((c) => c.id);
  const supabase = await createClient();

  const [{ data: reports }, { data: assessments }] = await Promise.all([
    supabase.from("reports").select("company_id").in("company_id", companyIds),
    supabase
      .from("readiness_assessments")
      .select("company_id, overall_score, created_at")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false }),
  ]);

  const reportCounts = new Map<string, number>();
  for (const r of reports ?? []) {
    reportCounts.set(r.company_id, (reportCounts.get(r.company_id) ?? 0) + 1);
  }

  const latestScores = new Map<string, number>();
  for (const a of assessments ?? []) {
    if (!latestScores.has(a.company_id)) latestScores.set(a.company_id, a.overall_score);
  }

  return companies.map((company) => ({
    ...company,
    reportCount: reportCounts.get(company.id) ?? 0,
    latestScore: latestScores.get(company.id) ?? null,
  }));
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCompanyOwners(
  companyId: string
): Promise<CompanyOwner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_owners")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
