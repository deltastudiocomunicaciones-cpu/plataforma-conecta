-- Plataforma Conecta - Convocatorias y respuestas RSVP
-- Ruta segura: los enlaces publicos usan token y escriben por API server-side.
-- No se exponen funciones SECURITY DEFINER ni politicas anonimas de escritura.

create table if not exists public.meeting_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_profile_id uuid references public.user_profiles(id) on delete set null,
  token_hash text not null unique,
  name text not null,
  event_date date not null,
  start_time time not null,
  end_time time,
  owner_label text not null,
  audience_label text not null,
  modality text not null default 'presencial' check (modality in ('presencial', 'virtual', 'hibrida')),
  address text,
  phone text,
  location_url text,
  topics text[] not null default '{}',
  public_note text,
  expected_guests integer not null default 0 check (expected_guests >= 0),
  quorum_percent integer not null default 70 check (quorum_percent between 1 and 100),
  food_plan text not null default 'refrigerio' check (food_plan in ('refrigerio', 'almuerzo', 'completo', 'ninguno')),
  venue_cost numeric(14, 2) not null default 0 check (venue_cost >= 0),
  equipment_cost numeric(14, 2) not null default 0 check (equipment_cost >= 0),
  other_cost numeric(14, 2) not null default 0 check (other_cost >= 0),
  logistics_notes text,
  status text not null default 'open' check (status in ('draft', 'open', 'closed', 'cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_responses (
  id uuid primary key default gen_random_uuid(),
  meeting_event_id uuid not null references public.meeting_events(id) on delete cascade,
  full_name text not null,
  role_label text not null,
  answer text not null check (answer in ('confirmada', 'virtual', 'pendiente', 'rechazada')),
  requirements text,
  source text not null default 'public_link',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meeting_events_company_created_idx on public.meeting_events(company_id, created_at desc);
create index if not exists meeting_events_token_hash_idx on public.meeting_events(token_hash);
create index if not exists meeting_responses_event_created_idx on public.meeting_responses(meeting_event_id, created_at desc);

alter table public.meeting_events enable row level security;
alter table public.meeting_responses enable row level security;

drop policy if exists "Internal users can read meeting events" on public.meeting_events;
create policy "Internal users can read meeting events"
on public.meeting_events
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists "Internal leaders can create meeting events" on public.meeting_events;
create policy "Internal leaders can create meeting events"
on public.meeting_events
for insert
to authenticated
with check (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
);

drop policy if exists "Internal leaders can update meeting events" on public.meeting_events;
create policy "Internal leaders can update meeting events"
on public.meeting_events
for update
to authenticated
using (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
)
with check (
  company_id = public.current_company_id()
  and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
);

drop policy if exists "Internal users can read meeting responses" on public.meeting_responses;
create policy "Internal users can read meeting responses"
on public.meeting_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.meeting_events e
    where e.id = meeting_responses.meeting_event_id
      and e.company_id = public.current_company_id()
  )
);

drop policy if exists "Internal leaders can manage meeting responses" on public.meeting_responses;
create policy "Internal leaders can manage meeting responses"
on public.meeting_responses
for all
to authenticated
using (
  exists (
    select 1
    from public.meeting_events e
    where e.id = meeting_responses.meeting_event_id
      and e.company_id = public.current_company_id()
      and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
  )
)
with check (
  exists (
    select 1
    from public.meeting_events e
    where e.id = meeting_responses.meeting_event_id
      and e.company_id = public.current_company_id()
      and public.current_access_role() in ('superadmin', 'direccion', 'gerencia', 'cultura_conecta')
  )
);
