"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/data/workspaces";
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

  // Atomic security-definer RPC: a plain insert + select can't work here —
  // the new row isn't visible to the caller until the membership row exists.
  const { data: workspaceId, error: workspaceError } = await supabase.rpc(
    "create_workspace_with_owner",
    {
      ws_name: name,
      ws_type: workspaceType === "consultant" ? "consultant" : "single_company",
    }
  );

  if (workspaceError || !workspaceId) {
    return { error: workspaceError?.message ?? "Could not create the workspace." };
  }

  const workspace = { id: workspaceId as string };

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId: workspace.id,
    eventType: "workspace_created",
    eventData: { name },
  });

  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/app");
  redirect("/app");
}

/** Switch the active workspace (cookie-persisted) and return to the dashboard. */
export async function setActiveWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS-scoped read proves membership before trusting the id.
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!data) redirect("/app");

  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/app");
  redirect("/app");
}

export interface RenameWorkspaceState {
  error?: string;
  message?: string;
}

export async function renameWorkspace(
  workspaceId: string,
  _prevState: RenameWorkspaceState,
  formData: FormData
): Promise<RenameWorkspaceState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a workspace name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // RLS restricts updates to owner/admin.
  const { error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId);
  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    eventType: "workspace_renamed",
    eventData: { name },
  });

  revalidatePath("/app");
  revalidatePath("/app/workspace/settings");
  return { message: "Workspace renamed." };
}
