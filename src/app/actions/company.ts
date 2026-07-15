"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import type { CompanyStatus, JurisdictionType } from "@/lib/types";

export interface CompanyActionState {
  error?: string;
}

function readCompanyFields(formData: FormData) {
  const turnoverRaw = String(formData.get("expected_monthly_turnover_aed") ?? "").trim();
  const activityCodesRaw = String(formData.get("license_activity_codes") ?? "").trim();

  return {
    legal_name: String(formData.get("legal_name") ?? "").trim(),
    trade_license_number:
      String(formData.get("trade_license_number") ?? "").trim() || null,
    emirate: String(formData.get("emirate") ?? "").trim() || null,
    jurisdiction_type: (String(formData.get("jurisdiction_type") ?? "unknown") ||
      "unknown") as JurisdictionType,
    authority_name: String(formData.get("authority_name") ?? "").trim() || null,
    license_activity_codes: activityCodesRaw
      ? activityCodesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    incorporation_date: String(formData.get("incorporation_date") ?? "").trim() || null,
    office_status: String(formData.get("office_status") ?? "").trim() || null,
    owner_nationality: String(formData.get("owner_nationality") ?? "").trim() || null,
    owner_uae_residency_status:
      String(formData.get("owner_uae_residency_status") ?? "").trim() || null,
    expected_monthly_turnover_aed: turnoverRaw ? Number(turnoverRaw) : null,
    target_bank: String(formData.get("target_bank") ?? "").trim() || null,
    target_account_type: String(formData.get("target_account_type") ?? "").trim() || null,
  };
}

export async function createCompany(
  workspaceId: string,
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const fields = readCompanyFields(formData);
  if (!fields.legal_name) {
    return { error: "Enter the company's legal name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ ...fields, workspace_id: workspaceId, status: "draft" as CompanyStatus })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    companyId: company.id,
    eventType: "company_created",
    eventData: { legal_name: fields.legal_name },
  });

  revalidatePath("/app");
  redirect(`/app/companies/${company.id}`);
}

export async function updateCompany(
  companyId: string,
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const fields = readCompanyFields(formData);
  if (!fields.legal_name) {
    return { error: "Enter the company's legal name." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update(fields)
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/app/companies/${companyId}`);
  revalidatePath("/app");
  redirect(`/app/companies/${companyId}`);
}

export async function archiveCompany(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company, error } = await supabase
    .from("companies")
    .update({ status: "archived" as CompanyStatus })
    .eq("id", companyId)
    .select("workspace_id, legal_name")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId: company.workspace_id,
    companyId,
    eventType: "company_archived",
    eventData: { legal_name: company.legal_name },
  });

  revalidatePath("/app");
  redirect("/app");
}
