import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin/guard";

/**
 * Platform-admin reads. Every function re-runs requirePlatformAdmin() before
 * touching the service-role client, so these are safe to call from any admin
 * page or action — the guard, not the caller, is the security boundary.
 */

export interface PlatformStats {
  users: number;
  workspaces: number;
  companies: number;
  assessments: number;
  documents: number;
  signups_by_week: { week: string; n: number }[];
}

export async function getPlatformStats(): Promise<PlatformStats> {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_platform_stats");
  if (error) throw new Error(`admin_platform_stats: ${error.message}`);
  return data as PlatformStats;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  workspace_count: number;
}

export async function listAllUsers(
  search?: string,
  limit = 50,
  offset = 0
): Promise<AdminUserRow[]> {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_list_users", {
    search: search?.trim() || null,
    lim: limit,
    off: offset,
  });
  if (error) throw new Error(`admin_list_users: ${error.message}`);
  return (data ?? []) as AdminUserRow[];
}

export interface AdminWorkspaceRow {
  id: string;
  name: string;
  workspace_type: string;
  created_at: string;
  member_count: number;
  company_count: number;
}

export async function listAllWorkspaces(): Promise<AdminWorkspaceRow[]> {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, workspace_type, created_at, workspace_members(count), companies(count)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listAllWorkspaces: ${error.message}`);
  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    workspace_type: w.workspace_type,
    created_at: w.created_at,
    member_count: w.workspace_members?.[0]?.count ?? 0,
    company_count: w.companies?.[0]?.count ?? 0,
  }));
}

export interface AdminAuditRow {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  user_name: string | null;
  workspace_name: string | null;
}

export async function listAuditEvents(opts: {
  eventType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: AdminAuditRow[]; eventTypes: string[] }> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("audit_events")
    .select("id, event_type, event_data, created_at, profiles(full_name), workspaces(name)")
    .order("created_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);
  if (opts.eventType) query = query.eq("event_type", opts.eventType);

  const [{ data, error }, { data: types }] = await Promise.all([
    query,
    admin.from("audit_events").select("event_type"),
  ]);
  if (error) throw new Error(`listAuditEvents: ${error.message}`);

  const rows = (data ?? []).map((e) => {
    const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
    const workspace = Array.isArray(e.workspaces) ? e.workspaces[0] : e.workspaces;
    return {
      id: e.id,
      event_type: e.event_type,
      event_data: (e.event_data ?? {}) as Record<string, unknown>,
      created_at: e.created_at,
      user_name: profile?.full_name ?? null,
      workspace_name: workspace?.name ?? null,
    };
  });
  const eventTypes = [...new Set((types ?? []).map((t) => t.event_type))].sort();
  return { rows, eventTypes };
}

export interface AiOpsStats {
  documentsByStatus: Record<string, number>;
  extractionFailures: number;
  extracted30d: number;
  failed30d: number;
  ragChunks: number;
  ragPendingEmbeds: number;
  ragLastIngest: string | null;
}

const DOCUMENT_STATUSES = ["uploaded", "parsed", "needs_review", "accepted", "rejected"];

export async function getAiOpsStats(): Promise<AiOpsStats> {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const countDocs = (status: string) =>
    admin.from("documents").select("id", { count: "exact", head: true }).eq("status", status);
  const countAudit = (eventType: string) =>
    admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", eventType)
      .gte("created_at", since30d);

  const [statusCounts, failures, extracted, failed, chunks, pending, lastChunk] =
    await Promise.all([
      Promise.all(DOCUMENT_STATUSES.map(countDocs)),
      admin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "needs_review")
        .eq("parse_confidence", 0),
      countAudit("document_extracted"),
      countAudit("document_extraction_failed"),
      admin.from("docs_chunks").select("id", { count: "exact", head: true }),
      admin
        .from("docs_chunks")
        .select("id", { count: "exact", head: true })
        .is("embedding", null),
      admin
        .from("docs_chunks")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  const documentsByStatus = Object.fromEntries(
    DOCUMENT_STATUSES.map((s, i) => [s, statusCounts[i].count ?? 0])
  );
  return {
    documentsByStatus,
    extractionFailures: failures.count ?? 0,
    extracted30d: extracted.count ?? 0,
    failed30d: failed.count ?? 0,
    ragChunks: chunks.count ?? 0,
    ragPendingEmbeds: pending.count ?? 0,
    ragLastIngest: lastChunk.data?.[0]?.updated_at ?? null,
  };
}
