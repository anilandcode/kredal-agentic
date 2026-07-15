import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReadinessAssessment } from "@/lib/types";

export async function getLatestAssessment(
  companyId: string
): Promise<ReadinessAssessment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_assessments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** All assessment snapshots for a company, newest first. */
export async function getAssessments(
  companyId: string
): Promise<ReadinessAssessment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_assessments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAssessment(
  assessmentId: string
): Promise<ReadinessAssessment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_assessments")
    .select("*")
    .eq("id", assessmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
