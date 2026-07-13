import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** TECH_SPEC.md §10 — logAuditEvent. Append-only; failures are swallowed so a
 * logging hiccup never blocks the user's actual action. */
export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    eventType: string;
    workspaceId?: string | null;
    companyId?: string | null;
    eventData?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("audit_events").insert({
      user_id: event.userId,
      event_type: event.eventType,
      workspace_id: event.workspaceId ?? null,
      company_id: event.companyId ?? null,
      event_data: event.eventData ?? {},
    });
  } catch {
    // Non-fatal — never block the primary action on audit logging.
  }
}
