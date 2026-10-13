// Kredal docs RAG — embed-docs Edge Function.
//
// Uses Supabase's built-in gte-small model (384-dim, no external API key) to:
//   - mode "ingest": embed chunks and upsert into docs_chunks (by content_hash).
//     Requires header `x-ingest-secret` === env INGEST_SECRET.
//   - mode "query":  embed a query and return hybrid (FTS + vector) results via
//     the hybrid_search_docs() SQL function. Public.
//
// Deploy: supabase functions deploy embed-docs --no-verify-jwt
// Secret:  supabase secrets set INGEST_SECRET=<random>

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// deno-lint-ignore no-explicit-any
const model = new (globalThis as any).Supabase.ai.Session("gte-small");

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function embed(text: string): Promise<number[]> {
  return (await model.run(text, { mean_pool: true, normalize: true })) as number[];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const mode = payload.mode ?? "query";

  if (mode === "ingest") {
    const secret = req.headers.get("x-ingest-secret");
    if (!secret || secret !== Deno.env.get("INGEST_SECRET")) {
      return json({ error: "unauthorized" }, 401);
    }
    const chunks = (payload.chunks ?? []) as Array<{
      path: string;
      heading: string;
      content: string;
      content_hash: string;
    }>;
    let upserted = 0;
    for (const c of chunks) {
      // Skip if this exact chunk (by hash) already has an embedding.
      const { data: existing } = await admin
        .from("docs_chunks")
        .select("id, embedding")
        .eq("content_hash", c.content_hash)
        .maybeSingle();
      if (existing?.embedding) continue;

      const embedding = await embed(c.content);
      const { error } = await admin.from("docs_chunks").upsert(
        {
          path: c.path,
          heading: c.heading,
          content: c.content,
          content_hash: c.content_hash,
          embedding: JSON.stringify(embedding),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "content_hash" },
      );
      if (error) return json({ error: error.message }, 500);
      upserted++;
    }
    return json({ ok: true, received: chunks.length, upserted });
  }

  // query mode
  const query = String(payload.query ?? "").trim();
  if (!query) return json({ error: "query required" }, 400);
  const matchCount = Number(payload.match_count ?? 5);

  const embedding = await embed(query);
  const { data, error } = await admin.rpc("hybrid_search_docs", {
    query_text: query,
    query_embedding: JSON.stringify(embedding),
    match_count: matchCount,
  });
  if (error) return json({ error: error.message }, 500);
  return json({ results: data });
});
