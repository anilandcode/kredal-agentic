"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdminAction } from "@/lib/admin/guard";
import { logAuditEvent } from "@/lib/audit";

export interface AdminActionState {
  error?: string;
  message?: string;
}

const BUCKET = "company-documents";
// "Deactivate" = an effectively permanent auth ban. Active access tokens keep
// working until they expire (~1h); the ban blocks refresh and re-login.
const BAN_FOREVER = "876000h";

export async function deactivateUser(userId: string): Promise<AdminActionState> {
  const { user, error } = await requirePlatformAdminAction();
  if (error !== null) return { error };
  if (userId === user.id) return { error: "You cannot deactivate your own account." };

  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: BAN_FOREVER,
  });
  if (banError) return { error: banError.message };

  await logAuditEvent(await createClient(), {
    userId: user.id,
    eventType: "admin_user_deactivated",
    eventData: { target_user_id: userId },
  });
  revalidatePath("/admin/users");
  return { message: "User deactivated." };
}

export async function reactivateUser(userId: string): Promise<AdminActionState> {
  const { user, error } = await requirePlatformAdminAction();
  if (error !== null) return { error };

  const admin = createAdminClient();
  const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (unbanError) return { error: unbanError.message };

  await logAuditEvent(await createClient(), {
    userId: user.id,
    eventType: "admin_user_reactivated",
    eventData: { target_user_id: userId },
  });
  revalidatePath("/admin/users");
  return { message: "User reactivated." };
}

/**
 * Permanently deletes a workspace: Storage objects first (they do NOT cascade),
 * then the workspace row (DB cascades members/companies/documents/responses/
 * assessments/reports; audit rows survive with a nulled workspace FK).
 */
export async function deleteWorkspace(
  workspaceId: string,
  confirmName: string
): Promise<AdminActionState> {
  const { user, error } = await requirePlatformAdminAction();
  if (error !== null) return { error };

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) return { error: "Workspace not found." };
  if (confirmName.trim() !== workspace.name) {
    return { error: "The name you typed does not match the workspace name." };
  }

  const { data: docs } = await admin
    .from("documents")
    .select("storage_path, companies!inner(workspace_id)")
    .eq("companies.workspace_id", workspaceId);
  const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean);
  for (let i = 0; i < paths.length; i += 100) {
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove(paths.slice(i, i + 100));
    if (removeError) return { error: `Storage cleanup failed: ${removeError.message}` };
  }

  const { error: deleteError } = await admin
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);
  if (deleteError) return { error: deleteError.message };

  await logAuditEvent(await createClient(), {
    userId: user.id,
    eventType: "admin_workspace_deleted",
    eventData: {
      workspace_id: workspaceId,
      workspace_name: workspace.name,
      documents_removed: paths.length,
    },
  });
  revalidatePath("/admin/workspaces");
  return { message: `Workspace "${workspace.name}" deleted.` };
}
