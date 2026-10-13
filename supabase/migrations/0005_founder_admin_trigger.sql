-- 0005_founder_admin_trigger.sql
-- Auto-grants platform admin to the founder email on signup (see ADR 0011).
-- Complements 0004, which only granted if the account already existed — it
-- didn't: the sole auth user at the time was the seeded demo account.

create or replace function public.handle_founder_admin()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'founder@example.com' then
    insert into public.platform_admins (user_id, note)
    values (new.id, 'founder (auto-grant)')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_founder_signup on auth.users;
create trigger on_founder_signup
  after insert on auth.users
  for each row execute function public.handle_founder_admin();

-- Also grant immediately in case the account exists by the time this runs.
insert into public.platform_admins (user_id, note)
select id, 'founder'
from auth.users
where lower(email) = 'founder@example.com'
on conflict (user_id) do nothing;
