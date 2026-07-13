-- Kredal — Supabase schema migration
-- Implements TECH_SPEC.md §4 (data model) and §5 (row-level security).
-- Apply with: supabase db push   (or paste into the SQL editor of a linked project)

create extension if not exists "uuid-ossp";

------------------------------------------------------------------
-- PROFILES
------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'founder' check (role in ('founder','consultant','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------
-- WORKSPACES
------------------------------------------------------------------
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  workspace_type text not null default 'single_company'
    check (workspace_type in ('single_company','consultant')),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------------
-- WORKSPACE_MEMBERS
------------------------------------------------------------------
create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Security-definer helpers so policies below don't recurse into
-- workspace_members' own RLS (standard Supabase multi-tenant pattern).
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from workspace_members
  where workspace_id = ws_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role in ('owner','admin')
  );
$$;

-- Everyone except 'viewer' can create/edit records. Viewers are read-only —
-- distinct from is_workspace_member (used for SELECT policies everywhere).
create or replace function public.is_workspace_writer(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role in ('owner','admin','member')
  );
$$;

alter table workspaces enable row level security;

create policy "workspaces_select_member"
  on workspaces for select
  using (public.is_workspace_member(id));

create policy "workspaces_insert_self"
  on workspaces for insert
  with check (owner_user_id = auth.uid());

create policy "workspaces_update_admin"
  on workspaces for update
  using (public.is_workspace_admin(id));

create policy "workspaces_delete_owner"
  on workspaces for delete
  using (owner_user_id = auth.uid());

alter table workspace_members enable row level security;

create policy "workspace_members_select_member"
  on workspace_members for select
  using (public.is_workspace_member(workspace_id));

-- Allow the workspace creator to seed the first (owner) membership row,
-- and existing owners/admins to add further members.
create policy "workspace_members_insert"
  on workspace_members for insert
  with check (
    (user_id = auth.uid() and exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    ))
    or public.is_workspace_admin(workspace_id)
  );

create policy "workspace_members_update_admin"
  on workspace_members for update
  using (public.is_workspace_admin(workspace_id));

create policy "workspace_members_delete_admin"
  on workspace_members for delete
  using (public.is_workspace_admin(workspace_id));

------------------------------------------------------------------
-- COMPANIES
------------------------------------------------------------------
create table companies (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  legal_name text not null,
  trade_license_number text,
  emirate text,
  jurisdiction_type text not null default 'unknown'
    check (jurisdiction_type in ('mainland','free_zone','financial_free_zone','unknown')),
  authority_name text,
  license_activity_codes text[],
  incorporation_date date,
  office_status text,
  owner_nationality text,
  owner_uae_residency_status text,
  expected_monthly_turnover_aed numeric,
  target_bank text,
  target_account_type text,
  status text not null default 'draft'
    check (status in ('draft','in_review','ready','high_risk','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies enable row level security;

create policy "companies_select_member"
  on companies for select
  using (public.is_workspace_member(workspace_id));

create policy "companies_insert_member"
  on companies for insert
  with check (public.is_workspace_writer(workspace_id));

create policy "companies_update_member"
  on companies for update
  using (public.is_workspace_writer(workspace_id));

create policy "companies_delete_admin"
  on companies for delete
  using (public.is_workspace_admin(workspace_id));

------------------------------------------------------------------
-- COMPANY_OWNERS (UBO / shareholders)
------------------------------------------------------------------
create table company_owners (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  nationality text,
  ownership_percentage numeric,
  is_ubo boolean not null default false,
  uae_residency_status text,
  emirates_id_last4 text,
  passport_country text,
  created_at timestamptz not null default now()
);

alter table company_owners enable row level security;

create policy "company_owners_select_member"
  on company_owners for select
  using (exists (
    select 1 from companies c
    where c.id = company_owners.company_id and public.is_workspace_member(c.workspace_id)
  ));

create policy "company_owners_write_member"
  on company_owners for all
  using (exists (
    select 1 from companies c
    where c.id = company_owners.company_id and public.is_workspace_writer(c.workspace_id)
  ))
  with check (exists (
    select 1 from companies c
    where c.id = company_owners.company_id and public.is_workspace_writer(c.workspace_id)
  ));

------------------------------------------------------------------
-- DOCUMENTS (metadata only — files live in private Storage)
------------------------------------------------------------------
create table documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  document_type text not null check (document_type in (
    'trade_license','moa_aoa','shareholder_register','ubo_declaration',
    'owner_passport','owner_emirates_id','owner_visa','proof_of_address',
    'tenancy_or_office_agreement','invoice_or_contract','bank_statement',
    'source_of_funds_evidence','business_plan','company_profile','other'
  )),
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  expiry_date date,
  status text not null default 'uploaded'
    check (status in ('uploaded','parsed','needs_review','accepted','rejected')),
  extracted_text text,
  parse_confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "documents_select_member"
  on documents for select
  using (exists (
    select 1 from companies c
    where c.id = documents.company_id and public.is_workspace_member(c.workspace_id)
  ));

create policy "documents_write_member"
  on documents for all
  using (exists (
    select 1 from companies c
    where c.id = documents.company_id and public.is_workspace_writer(c.workspace_id)
  ))
  with check (exists (
    select 1 from companies c
    where c.id = documents.company_id and public.is_workspace_writer(c.workspace_id)
  ));

------------------------------------------------------------------
-- QUESTIONNAIRE_RESPONSES
------------------------------------------------------------------
create table questionnaire_responses (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  section text not null,
  question_key text not null,
  answer_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, question_key)
);

alter table questionnaire_responses enable row level security;

create policy "questionnaire_select_member"
  on questionnaire_responses for select
  using (exists (
    select 1 from companies c
    where c.id = questionnaire_responses.company_id and public.is_workspace_member(c.workspace_id)
  ));

create policy "questionnaire_write_member"
  on questionnaire_responses for all
  using (exists (
    select 1 from companies c
    where c.id = questionnaire_responses.company_id and public.is_workspace_writer(c.workspace_id)
  ))
  with check (exists (
    select 1 from companies c
    where c.id = questionnaire_responses.company_id and public.is_workspace_writer(c.workspace_id)
  ));

------------------------------------------------------------------
-- READINESS_ASSESSMENTS (score snapshots)
------------------------------------------------------------------
create table readiness_assessments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
  risk_level text not null check (risk_level in ('low','medium','high')),
  category_scores jsonb not null default '{}'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  scoring_version text not null default 'v0',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table readiness_assessments enable row level security;

create policy "assessments_select_member"
  on readiness_assessments for select
  using (exists (
    select 1 from companies c
    where c.id = readiness_assessments.company_id and public.is_workspace_member(c.workspace_id)
  ));

create policy "assessments_insert_member"
  on readiness_assessments for insert
  with check (exists (
    select 1 from companies c
    where c.id = readiness_assessments.company_id and public.is_workspace_writer(c.workspace_id)
  ));

------------------------------------------------------------------
-- REPORTS
------------------------------------------------------------------
create table reports (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  assessment_id uuid not null references readiness_assessments(id) on delete cascade,
  report_type text not null check (report_type in (
    'founder_readiness','consultant_checklist','bank_application_pack','rejection_recovery_pack'
  )),
  title text not null,
  content_markdown text not null,
  storage_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "reports_select_member"
  on reports for select
  using (exists (
    select 1 from companies c
    where c.id = reports.company_id and public.is_workspace_member(c.workspace_id)
  ));

create policy "reports_insert_member"
  on reports for insert
  with check (exists (
    select 1 from companies c
    where c.id = reports.company_id and public.is_workspace_writer(c.workspace_id)
  ));

------------------------------------------------------------------
-- AUDIT_EVENTS (append-only)
------------------------------------------------------------------
create table audit_events (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  user_id uuid not null references profiles(id),
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table audit_events enable row level security;

-- Append-only: insert policy only, no update/delete policy is defined for
-- any role, so RLS denies mutation by default per TECH_SPEC §5 rule 6.
create policy "audit_events_insert_member"
  on audit_events for insert
  with check (
    user_id = auth.uid()
    and (workspace_id is null or public.is_workspace_member(workspace_id))
  );

create policy "audit_events_select_admin"
  on audit_events for select
  using (workspace_id is not null and public.is_workspace_admin(workspace_id));

------------------------------------------------------------------
-- updated_at maintenance
------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on workspaces
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on companies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on questionnaire_responses
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- Indexes
------------------------------------------------------------------
create index idx_workspace_members_user on workspace_members(user_id);
create index idx_workspace_members_workspace on workspace_members(workspace_id);
create index idx_companies_workspace on companies(workspace_id);
create index idx_companies_status on companies(status);
create index idx_company_owners_company on company_owners(company_id);
create index idx_documents_company on documents(company_id);
create index idx_documents_status on documents(status);
create index idx_documents_type on documents(document_type);
create index idx_questionnaire_company on questionnaire_responses(company_id);
create index idx_assessments_company on readiness_assessments(company_id);
create index idx_assessments_created on readiness_assessments(created_at desc);
create index idx_reports_company on reports(company_id);
create index idx_audit_events_workspace on audit_events(workspace_id);
create index idx_audit_events_company on audit_events(company_id);
create index idx_audit_events_created on audit_events(created_at desc);

------------------------------------------------------------------
-- Storage: private document bucket
-- Path convention: {workspace_id}/{company_id}/{document_id}/{original_filename}
------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do nothing;

create policy "storage_insert_workspace_member"
  on storage.objects for insert
  with check (
    bucket_id = 'company-documents'
    and public.is_workspace_writer(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_select_workspace_member"
  on storage.objects for select
  using (
    bucket_id = 'company-documents'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_delete_workspace_member"
  on storage.objects for delete
  using (
    bucket_id = 'company-documents'
    and public.is_workspace_writer(((storage.foldername(name))[1])::uuid)
  );
