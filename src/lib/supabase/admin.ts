import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely — use only inside
 * Server Actions / Route Handlers for privileged operations (signed URL
 * generation, audit log writes) and always re-check workspace membership
 * manually before using it. Never import this from a Client Component;
 * the `server-only` import throws a build error if that happens.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
