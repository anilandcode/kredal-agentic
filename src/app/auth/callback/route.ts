import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for Supabase email links (password recovery, email confirmation).
 * The email link verifies on Supabase's side, then redirects here with a `code`
 * that must be exchanged for a session before the user can act.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/app";
  const next = nextParam.startsWith("/") ? nextParam : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_link_invalid", url.origin)
  );
}
