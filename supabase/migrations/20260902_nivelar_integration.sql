create table if not exists public.nivelar_employee_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_profile_id uuid references public.user_profiles(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  cedula text not null,
  nivelar_email text,
  grupo_empleado text,
  cargo_empleado text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, cedula),
  unique (company_id, user_profile_id)
);

create table if not exists public.nivelar_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_link_id uuid references public.nivelar_employee_links(id) on delete set null,
  user_profile_id uuid references public.user_profiles(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  cedula text not null,
  employee_name text,
  employee_email text,
  employee_group text,
  employee_role text,
  summary_date date not null,
  calendar_start time,
  calendar_end time,
  work_start time,
  work_end time,
  total_connection interval,
  productive_time interval,
  unproductive_time interval,
  unclassified_time interval,
  neutral_time interval,
  inactivity_5_10 interval,
  inactivity_10_15 interval,
  inactivity_15_30 interval,
  inactivity_30_45 interval,
  inactivity_45_60 interval,
  inactivity_over_60 interval,
  dynamic_categories jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, cedula, summary_date)
);

create table if not exists public.nivelar_sync_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  requested_by_profile_id uuid references public.user_profiles(id) on delete set null,
  sync_scope text not null default 'pymes-pilot',
  date_from date,
  date_to date,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'skipped')),
  employees_received integer not null default 0,
  summaries_received integer not null default 0,
  message text,
  error_detail text,
  created_at timestamptz not null default now()
);

create index if not exists nivelar_links_company_idx on public.nivelar_employee_links(company_id, status);
create index if not exists nivelar_links_profile_idx on public.nivelar_employee_links(user_profile_id);
create index if not exists nivelar_summaries_company_date_idx on public.nivelar_daily_summaries(company_id, summary_date);
create index if not exists nivelar_summaries_profile_date_idx on public.nivelar_daily_summaries(user_profile_id, summary_date);
create index if not exists nivelar_sync_runs_company_idx on public.nivelar_sync_runs(company_id, created_at desc);

alter table public.nivelar_employee_links enable row level security;
alter table public.nivelar_daily_summaries enable row level security;
alter table public.nivelar_sync_runs enable row level security;

drop policy if exists "read nivelar links by company" on public.nivelar_employee_links;
create policy "read nivelar links by company"
on public.nivelar_employee_links for select
using (company_id = public.current_company_id());

drop policy if exists "manage nivelar links by leadership" on public.nivelar_employee_links;
create policy "manage nivelar links by leadership"
on public.nivelar_employee_links for all
using (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
)
with check (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
);

drop policy if exists "read nivelar summaries by role" on public.nivelar_daily_summaries;
create policy "read nivelar summaries by role"
on public.nivelar_daily_summaries for select
using (
  company_id = public.current_company_id()
  and (
    public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
    or user_profile_id = (select id from public.current_profile())
  )
);

drop policy if exists "read nivelar sync runs by leadership" on public.nivelar_sync_runs;
create policy "read nivelar sync runs by leadership"
on public.nivelar_sync_runs for select
using (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'cultura_conecta')
);
