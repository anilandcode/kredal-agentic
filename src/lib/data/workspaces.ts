import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/lib/types";

export const ACTIVE_WORKSPACE_COOKIE = "kredal_ws";

/** The workspace(s) the current user belongs to, newest first. */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * The user's active workspace: the cookie-selected one when still a member,
 * otherwise the most recent. Null when the user has no workspaces yet.
 */
export async function getActiveWorkspace(): Promise<Workspace | null> {
  const workspaces = await getUserWorkspaces();
  if (workspaces.length === 0) return null;
  const cookieId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  return workspaces.find((w) => w.id === cookieId) ?? workspaces[0];
}

export async function getWorkspace(
  workspaceId: string
): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
