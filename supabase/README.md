# Kredal — Supabase setup

1. Create a Supabase project (Postgres 17, any region close to UAE users — `us-east-1`/`eu` are fine for MVP).
2. Apply `migrations/0001_kredal_schema.sql` — either:
   - `supabase link --project-ref <ref>` then `supabase db push`, or
   - paste the file into the project's SQL editor and run it once.
3. Copy `.env.local.example` to `.env.local` in the app root and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never prefix with `NEXT_PUBLIC_`)
4. In Authentication settings, enable Email auth. Disable public signups later if you move to invite-only pilots.
5. Verify after running: `company-documents` storage bucket exists and is **private**, and RLS is enabled on every table (Database → Tables → each table should show a lock icon).

See `TECH_SPEC.md` §4-5 for the data model and RLS rationale, and `MASTER_EXECUTION_PLAN.md` for how this fits the build sprint.
