do $$
begin
  create type public.assignment_kind as enum (
    'principal',
    'transversal',
    'apoyo',
    'temporal'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.operational_fronts (
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

create table if not exists public.user_position_assignments (
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

alter table public.management_reports
add column if not exists operational_front_id uuid references public.operational_fronts(id) on delete set null,
add column if not exists assignment_id uuid references public.user_position_assignments(id) on delete set null;

create index if not exists operational_fronts_company_idx
on public.operational_fronts(company_id);

create index if not exists assignments_user_profile_idx
on public.user_position_assignments(user_profile_id, status);

create index if not exists assignments_position_idx
on public.user_position_assignments(position_id, status);

create index if not exists reports_operational_front_idx
on public.management_reports(operational_front_id);

alter table public.operational_fronts enable row level security;
alter table public.user_position_assignments enable row level security;

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
