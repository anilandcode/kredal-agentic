"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export interface WorkspaceActionState {
  error?: string;
}

export async function createWorkspace(
  _prevState: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const workspaceType = String(formData.get("workspace_type") ?? "single_company");

  if (!name) {
    return { error: "Give your workspace a name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name,
      workspace_type: workspaceType === "consultant" ? "consultant" : "single_company",
      owner_user_id: user.id,
    })
    .select("id")
    .single();

  if (workspaceError) {
    return { error: workspaceError.message };
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId: workspace.id,
    eventType: "workspace_created",
    eventData: { name },
  });

  revalidatePath("/app");
  redirect("/app");
}
