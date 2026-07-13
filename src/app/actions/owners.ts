"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export interface OwnerActionState {
  error?: string;
}

export async function addOwner(
  companyId: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) return { error: "Enter the owner's full name." };

  const ownershipRaw = String(formData.get("ownership_percentage") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("company_owners").insert({
    company_id: companyId,
    full_name,
    nationality: String(formData.get("nationality") ?? "").trim() || null,
    ownership_percentage: ownershipRaw ? Number(ownershipRaw) : null,
    is_ubo: formData.get("is_ubo") === "on",
    uae_residency_status: String(formData.get("uae_residency_status") ?? "").trim() || null,
    passport_country: String(formData.get("passport_country") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    userId: user.id,
    companyId,
    eventType: "owner_added",
    eventData: { full_name },
  });

  revalidatePath(`/app/companies/${companyId}/questionnaire`);
  return {};
}

export async function deleteOwner(companyId: string, ownerId: string) {
  const supabase = await createClient();
  await supabase.from("company_owners").delete().eq("id", ownerId);
  revalidatePath(`/app/companies/${companyId}/questionnaire`);
}
