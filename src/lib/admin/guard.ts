import "server-only";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Platform-admin gate. Membership lives in the platform_admins allowlist
 * table (granted via SQL only); is_platform_admin() runs under the caller's
 * own JWT, so a forged or non-admin session can never pass.
 */
async function checkPlatformAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  return isAdmin === true ? user : null;
}

/** For layouts/pages: non-admins get a 404 so /admin's existence stays hidden. */
export async function requirePlatformAdmin(): Promise<{ user: User }> {
  const user = await checkPlatformAdmin();
  if (!user) notFound();
  return { user };
}

/** For server actions: returns an error result instead of throwing notFound. */
export async function requirePlatformAdminAction(): Promise<
  { user: User; error: null } | { user: null; error: string }
> {
  const user = await checkPlatformAdmin();
  if (!user) return { user: null, error: "Not authorized." };
  return { user, error: null };
}

/** Cheap boolean check for conditional UI (e.g. the Admin item in UserMenu). */
export async function isPlatformAdmin(): Promise<boolean> {
  return (await checkPlatformAdmin()) !== null;
}
