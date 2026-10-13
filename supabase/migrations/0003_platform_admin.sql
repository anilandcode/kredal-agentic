-- 0003_platform_admin.sql
-- Platform administrator system: allowlist table, helper, and admin-only RPCs.
-- Access model: same Supabase login; only user ids present in platform_admins
-- can enter /admin. Rows are granted solely via SQL (no client write policies):
--
--   insert into platform_admins (user_id, note)
--     select id, 'founder' from auth.users where email = '<admin-email>';

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  note text
);

alter table public.platform_admins enable row level security;

-- Users may check only their own membership; there are intentionally no
-- insert/update/delete policies — client sessions can never grant admin.
create policy "platform_admins_select_self" on public.platform_admins
  for select using (user_id = auth.uid());

-- Called under the caller's JWT (user-scoped rpc) by requirePlatformAdmin().
create or replace function public.is_platform_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- Platform-wide KPIs for /admin overview.
create or replace function public.admin_platform_stats()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'workspaces', (select count(*) from workspaces),
    'companies', (select count(*) from companies),
    'assessments', (select count(*) from readiness_assessments),
    'documents', (select count(*) from documents),
    'signups_by_week', (
      select coalesce(jsonb_agg(jsonb_build_object('week', wk, 'n', n) order by wk), '[]'::jsonb)
      from (
        select date_trunc('week', created_at) as wk, count(*) as n
        from profiles
        group by 1
      ) s
    )
  );
$$;

-- auth.users is not exposed through PostgREST and auth.admin.listUsers() has
-- no search, so the admin Users page reads through this RPC instead.
create or replace function public.admin_list_users(
  search text default null,
  lim int default 50,
  off int default 0
)
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  workspace_count bigint
)
language sql stable security definer
set search_path = public
as $$
  select
    u.id,
    u.email::text,
    p.full_name,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until,
    (select count(*) from workspace_members m where m.user_id = u.id) as workspace_count
  from auth.users u
  left join profiles p on p.id = u.id
  where search is null
     or u.email ilike '%' || search || '%'
     or p.full_name ilike '%' || search || '%'
  order by u.created_at desc
  limit lim offset off;
$$;

-- The stats/user-listing RPCs are service-role only: the admin UI calls them
-- through the server-side admin client after requirePlatformAdmin().
revoke execute on function public.admin_platform_stats() from public, anon, authenticated;
revoke execute on function public.admin_list_users(text, int, int) from public, anon, authenticated;
grant execute on function public.admin_platform_stats() to service_role;
grant execute on function public.admin_list_users(text, int, int) to service_role;
