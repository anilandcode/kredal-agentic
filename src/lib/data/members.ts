import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceMemberRole } from "@/lib/types";

export interface WorkspaceMemberInfo {
  id: string;
  userId: string;
  role: WorkspaceMemberRole;
  email: string | null;
  fullName: string | null;
  isSelf: boolean;
}

/**
 * Members of a workspace with email/name. The RLS-scoped read proves the caller
 * is a member; the admin client is then used read-only to resolve emails/names
 * (profiles are self-readable only by design).
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberInfo[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error || !rows) return [];

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", rows.map((r) => r.user_id));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const members: WorkspaceMemberInfo[] = [];
  for (const row of rows) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
    members.push({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      email: authUser?.user?.email ?? null,
      fullName: nameById.get(row.user_id) ?? null,
      isSelf: row.user_id === user.id,
    });
  }
  return members;
}

/** The caller's role in a workspace, or null if not a member. */
export async function getMyWorkspaceRole(
  workspaceId: string
): Promise<WorkspaceMemberRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.role as WorkspaceMemberRole) ?? null;
}
