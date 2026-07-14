-- Kredal — docs RAG: pgvector hybrid search over documentation chunks.
-- Powers semantic + full-text retrieval used by the docs MCP server and a future
-- "Ask AI" widget. Embeddings are gte-small (384-dim), produced by the embed-docs
-- Edge Function (Supabase's built-in model — no external API key).

create extension if not exists vector;

create table if not exists docs_chunks (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  heading text not null,
  content text not null,
  content_hash text not null unique,
  embedding vector(384),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_docs_chunks_fts on docs_chunks using gin (fts);
create index if not exists idx_docs_chunks_embedding
  on docs_chunks using hnsw (embedding vector_cosine_ops);

-- Docs are public, so reads are open. Writes have no policy and are therefore
-- allowed only via the service role (used by the embed-docs Edge Function).
alter table docs_chunks enable row level security;

drop policy if exists "docs_chunks_public_read" on docs_chunks;
create policy "docs_chunks_public_read" on docs_chunks for select using (true);

-- Reciprocal Rank Fusion of full-text and vector search. Mirrors Supabase's own
-- hybrid-search reference implementation.
create or replace function hybrid_search_docs(
  query_text text,
  query_embedding vector(384),
  match_count int default 5,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns table (path text, heading text, content text, score float)
language sql
stable
as $$
  with fts as (
    select
      id,
      row_number() over (
        order by ts_rank_cd(fts, websearch_to_tsquery('english', query_text)) desc
      ) as rank
    from docs_chunks
    where fts @@ websearch_to_tsquery('english', query_text)
    limit 30
  ),
  vec as (
    select
      id,
      row_number() over (order by embedding <=> query_embedding) as rank
    from docs_chunks
    where embedding is not null
    order by embedding <=> query_embedding
    limit 30
  )
  select
    d.path,
    d.heading,
    d.content,
    coalesce(full_text_weight / (rrf_k + fts.rank), 0.0)
      + coalesce(semantic_weight / (rrf_k + vec.rank), 0.0) as score
  from docs_chunks d
  left join fts on fts.id = d.id
  left join vec on vec.id = d.id
  where fts.id is not null or vec.id is not null
  order by score desc
  limit match_count;
$$;
