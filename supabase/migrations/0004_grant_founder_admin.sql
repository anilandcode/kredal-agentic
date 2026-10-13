-- 0004_grant_founder_admin.sql
-- Grants the founder account platform-admin access (see ADR 0011).
-- Idempotent: safe to re-run; no-op if the account is already listed or the
-- auth user does not exist yet in this environment.

insert into public.platform_admins (user_id, note)
select id, 'founder'
from auth.users
where email = 'founder@example.com'
on conflict (user_id) do nothing;
