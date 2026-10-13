-- 0006_fix_workspace_creation.sql
-- Workspace creation never worked under RLS (demo data was seeded via the
-- service role, masking it). Two defects:
--   1. The app's `.insert().select()` needs the new workspaces row to pass the
--      SELECT policy (is_workspace_member) — impossible before the membership
--      row exists.
--   2. workspace_members_insert's bootstrap clause read `workspaces` under the
--      caller's RLS, so the (invisible) new workspace made it always false.
-- Fix: a security-definer owner check for the policy, and an atomic
-- security-definer RPC that creates workspace + owner membership together.

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from workspaces
    where id = ws and owner_user_id = auth.uid()
  );
$$;

drop policy if exists "workspace_members_insert" on workspace_members;
create policy "workspace_members_insert"
  on workspace_members for insert
  with check (
    (user_id = auth.uid() and public.is_workspace_owner(workspace_id))
    or public.is_workspace_admin(workspace_id)
  );

create or replace function public.create_workspace_with_owner(
  ws_name text,
  ws_type text default 'single_company'
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if ws_name is null or length(trim(ws_name)) = 0 then
    raise exception 'workspace name required';
  end if;
  if ws_type is distinct from 'consultant' then
    ws_type := 'single_company';
  end if;

  insert into workspaces (name, workspace_type, owner_user_id)
  values (trim(ws_name), ws_type, auth.uid())
  returning id into new_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

revoke execute on function public.create_workspace_with_owner(text, text) from public, anon;
grant execute on function public.create_workspace_with_owner(text, text) to authenticated;
