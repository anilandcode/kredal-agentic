"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import type { WorkspaceMemberRole } from "@/lib/types";

export interface MemberActionState {
  error?: string;
  message?: string;
}

const INVITABLE_ROLES: WorkspaceMemberRole[] = ["admin", "member", "viewer"];

/** True when the signed-in user is owner/admin of the workspace (RLS-backed). */
async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "owner" || data?.role === "admin";
}

/**
 * Invite a member by email. Uses the service-role client for the auth invite —
 * the ONLY privileged step — strictly after re-verifying the caller is a
 * workspace owner/admin. The membership row insert runs as the user (RLS).
 */
export async function inviteMember(
  workspaceId: string,
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as WorkspaceMemberRole;

  if (!email) return { error: "Enter an email address." };
  if (!INVITABLE_ROLES.includes(role)) return { error: "Choose a valid role." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };
  if (!(await requireAdmin(supabase, workspaceId, user.id))) {
    return { error: "Only workspace owners and admins can invite members." };
  }

  const admin = createAdminClient();
  const origin = (await headers()).get("origin") ?? "";

  // Find an existing user by email, or send an invite email that creates one.
  let invitedUserId: string | null = null;
  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

  if (inviteError) {
    // Most common: the user already exists — look them up and just add membership.
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!existing) return { error: inviteError.message };
    invitedUserId = existing.id;
  } else {
    invitedUserId = invited.user.id;
  }

  // Ensure a profile row exists (signup trigger covers normal flow; invites may race it).
  await admin
    .from("profiles")
    .upsert({ id: invitedUserId }, { onConflict: "id", ignoreDuplicates: true });

  // Membership insert as the calling user — RLS enforces owner/admin again.
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: invitedUserId,
    role,
  });
  if (memberError) {
    if (memberError.code === "23505") {
      return { error: "That person is already a member of this workspace." };
    }
    return { error: memberError.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    eventType: "member_invited",
    eventData: { email, role },
  });

  revalidatePath("/app/workspace/settings");
  return { message: `Invited ${email} as ${role}.` };
}

export async function changeMemberRole(
  workspaceId: string,
  memberId: string,
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const role = String(formData.get("role") ?? "") as WorkspaceMemberRole;
  if (!INVITABLE_ROLES.includes(role)) return { error: "Choose a valid role." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // RLS allows updates only for owner/admin; owners' rows are protected below.
  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .maybeSingle();
  if (!target) return { error: "Member not found." };
  if (target.role === "owner") return { error: "The owner's role cannot be changed." };

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId);
  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    eventType: "member_role_changed",
    eventData: { member_id: memberId, role },
  });

  revalidatePath("/app/workspace/settings");
  return { message: "Role updated." };
}

export async function removeMember(workspaceId: string, memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .maybeSingle();
  if (!target || target.role === "owner") return; // never remove the owner

  await supabase.from("workspace_members").delete().eq("id", memberId);

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    eventType: "member_removed",
    eventData: { member_id: memberId },
  });

  revalidatePath("/app/workspace/settings");
}
