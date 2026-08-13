create extension if not exists "pgcrypto";

create type public.access_role as enum (
  'superadmin',
  'direccion',
  'gerencia',
  'responsable',
  'cultura_conecta',
  'lector'
);

create type public.report_status as enum (
  'borrador',
  'enviado',
  'recibido',
  'en_revision',
  'aprobado',
  'observado',
  'ajuste_solicitado',
  'escalado',
  'vencido'
);

create type public.priority_level as enum (
  'baja',
  'media',
  'alta',
  'critica'
);

create type public.assignment_kind as enum (
  'principal',
  'transversal',
  'apoyo',
  'temporal'
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  external_key text not null,
  title text not null,
  area text not null,
  business_unit text not null,
  reports_to_position_id uuid references public.positions(id) on delete set null,
  responsible_name text,
  identity_document text,
  phone text,
  professional_profile text,
  purpose text not null default '',
  responsibilities text[] not null default '{}',
  activities jsonb not null default '[]'::jsonb,
  kpis text[] not null default '{}',
  authority text[] not null default '{}',
  processes text[] not null default '{}',
  documents text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'actual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, external_key)
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  document_id text,
  access_role public.access_role not null default 'responsable',
  position_id uuid references public.positions(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.operational_fronts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  external_key text not null,
  name text not null,
  description text,
  default_recipient_position_id uuid references public.positions(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (company_id, external_key)
);

create table public.user_position_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  operational_front_id uuid references public.operational_fronts(id) on delete set null,
  assignment_kind public.assignment_kind not null default 'principal',
  label text,
  report_frequency text not null default 'semanal',
  is_primary boolean not null default false,
  starts_at date not null default current_date,
  ends_at date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (user_profile_id, position_id, operational_front_id)
);

create table public.management_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  operational_front_id uuid references public.operational_fronts(id) on delete set null,
  assignment_id uuid references public.user_position_assignments(id) on delete set null,
  submitted_by_profile_id uuid references public.user_profiles(id) on delete set null,
  recipient_profile_id uuid references public.user_profiles(id) on delete set null,
  week_label text not null,
  period_start date,
  period_end date,
  status public.report_status not null default 'enviado',
  priority public.priority_level not null default 'media',
  approval_deadline date,
  progress_summary text not null,
  completed_tasks text,
  pending_tasks text,
  risks text,
  decisions_required text,
  next_actions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.management_reports(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_by_profile_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.report_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.management_reports(id) on delete cascade,
  reviewer_profile_id uuid not null references public.user_profiles(id) on delete restrict,
  decision text not null check (decision in ('aprobado', 'observado', 'ajuste_solicitado', 'escalado')),
  comment text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_profile_id uuid references public.user_profiles(id) on delete cascade,
  position_id uuid references public.positions(id) on delete cascade,
  report_id uuid references public.management_reports(id) on delete cascade,
  channel text not null default 'platform' check (channel in ('platform', 'email', 'whatsapp')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'read', 'failed')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index companies_slug_idx on public.companies(slug);
create index positions_company_idx on public.positions(company_id);
create index positions_reports_to_idx on public.positions(reports_to_position_id);
create index profiles_auth_user_idx on public.user_profiles(auth_user_id);
create index operational_fronts_company_idx on public.operational_fronts(company_id);
create index assignments_user_profile_idx on public.user_position_assignments(user_profile_id, status);
create index assignments_position_idx on public.user_position_assignments(position_id, status);
create index reports_company_position_idx on public.management_reports(company_id, position_id);
create index reports_operational_front_idx on public.management_reports(operational_front_id);
create index reports_status_idx on public.management_reports(status);
create index notifications_recipient_idx on public.notifications(recipient_profile_id, status);

alter table public.companies enable row level security;
alter table public.positions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.operational_fronts enable row level security;
alter table public.user_position_assignments enable row level security;
alter table public.management_reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.report_reviews enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_profile()
returns public.user_profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.user_profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.user_profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_access_role()
returns public.access_role
language sql
stable
security definer
set search_path = public
as $$
  select access_role
  from public.user_profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create policy "read own company"
on public.companies for select
using (id = public.current_company_id());

create policy "read positions by company"
on public.positions for select
using (company_id = public.current_company_id());

create policy "read profiles by company"
on public.user_profiles for select
using (company_id = public.current_company_id());

create policy "read operational fronts by company"
on public.operational_fronts for select
using (company_id = public.current_company_id());

create policy "read assignments by company"
on public.user_position_assignments for select
using (company_id = public.current_company_id());

create policy "manage assignments by catalog roles"
on public.user_position_assignments for all
using (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
)
with check (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
);

create policy "users update own profile"
on public.user_profiles for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "read reports by company"
on public.management_reports for select
using (company_id = public.current_company_id());

create policy "responsibles create reports for company"
on public.management_reports for insert
with check (company_id = public.current_company_id());

create policy "reviewers update reports by company"
on public.management_reports for update
using (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
)
with check (company_id = public.current_company_id());

create policy "read evidence through company reports"
on public.report_evidence for select
using (
  exists (
    select 1
    from public.management_reports r
    where r.id = report_id
      and r.company_id = public.current_company_id()
  )
);

create policy "insert evidence through company reports"
on public.report_evidence for insert
with check (
  exists (
    select 1
    from public.management_reports r
    where r.id = report_id
      and r.company_id = public.current_company_id()
  )
);

create policy "review reports by company"
on public.report_reviews for select
using (
  exists (
    select 1
    from public.management_reports r
    where r.id = report_id
      and r.company_id = public.current_company_id()
  )
);

create policy "insert reviews by reviewer roles"
on public.report_reviews for insert
with check (
  public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
);

create policy "read own notifications"
on public.notifications for select
using (
  company_id = public.current_company_id()
  and (
    recipient_profile_id = (select id from public.current_profile())
    or public.current_access_role() in ('superadmin', 'direccion')
  )
);

create policy "system users create notifications"
on public.notifications for insert
with check (company_id = public.current_company_id());
