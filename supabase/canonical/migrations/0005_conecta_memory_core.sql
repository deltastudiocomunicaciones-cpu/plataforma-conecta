-- MV-F3-01: structural extension of the local canonical candidate chain 0001-0004.
-- NOT a reconstruction of remote migration history. Not applied by this task.
-- Requires companies, user_profiles, positions, meeting_events and gen_random_uuid().
-- No functional writes until MV-G3A. No lifecycle, authorization or audit engine.
-- F3-02 MUST harden every company/actor/reference edge before functional use.
-- Identity tables + version rows preserve item IDs across full revision snapshots.
-- Latest revision = greatest revision_number for minute_id, NOT latest approved.
-- No current_revision_id / is_current / supersedes pointer: no competing truth.
-- No CASCADE deletes, no automatic RSVP conversion, no business seeds.

begin;

create table public.meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mm_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mm_company_id_key unique (company_id, id),
  meeting_event_id uuid not null,
  created_by_profile_id uuid not null,
  constraint mm_event_fk foreign key (meeting_event_id) references public.meeting_events (id) on delete restrict,
  constraint mm_creator_fk foreign key (created_by_profile_id) references public.user_profiles (id) on delete restrict,
  constraint mm_event_key unique (meeting_event_id)
);

create table public.minute_revisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mr_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mr_company_id_key unique (company_id, id),
  minute_id uuid not null,
  revision_number integer not null,
  created_by_profile_id uuid not null,
  title text not null,
  context text,
  held_started_at timestamptz,
  held_ended_at timestamptz,
  meeting_timezone text,
  constraint mr_minute_fk foreign key (minute_id) references public.meeting_minutes (id) on delete restrict,
  constraint mr_creator_fk foreign key (created_by_profile_id) references public.user_profiles (id) on delete restrict,
  constraint mr_number_positive check (revision_number > 0),
  constraint mr_title_nonempty check (length(btrim(title)) > 0),
  constraint mr_held_interval check (held_ended_at is null or (held_started_at is not null and held_ended_at >= held_started_at)),
  constraint mr_timezone_nonempty check (meeting_timezone is null or length(btrim(meeting_timezone)) > 0),
  constraint mr_number_key unique (minute_id, revision_number),
  constraint mr_minute_id_key unique (minute_id, id)
);

create table public.minute_participants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mp_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mp_company_id_key unique (company_id, id),
  minute_id uuid not null,
  constraint mp_minute_fk foreign key (minute_id) references public.meeting_minutes (id) on delete restrict,
  constraint mp_minute_id_key unique (minute_id, id)
);

create table public.minute_agenda_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint ma_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint ma_company_id_key unique (company_id, id),
  minute_id uuid not null,
  constraint ma_minute_fk foreign key (minute_id) references public.meeting_minutes (id) on delete restrict,
  constraint ma_minute_id_key unique (minute_id, id)
);

create table public.minute_findings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mf_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mf_company_id_key unique (company_id, id),
  minute_id uuid not null,
  constraint mf_minute_fk foreign key (minute_id) references public.meeting_minutes (id) on delete restrict,
  constraint mf_minute_id_key unique (minute_id, id)
);

create table public.minute_decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint md_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint md_company_id_key unique (company_id, id),
  minute_id uuid not null,
  constraint md_minute_fk foreign key (minute_id) references public.meeting_minutes (id) on delete restrict,
  constraint md_minute_id_key unique (minute_id, id)
);

create table public.minute_participant_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mpv_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mpv_company_id_key unique (company_id, id),
  minute_id uuid not null,
  revision_id uuid not null,
  participant_id uuid not null,
  profile_id uuid not null,
  position_id uuid,
  display_name text not null,
  position_title text,
  invited boolean,
  eligible boolean,
  attended boolean,
  participation_modality text,
  attendance_confirmed_at timestamptz,
  attendance_confirmed_by_profile_id uuid,
  constraint mpv_revision_fk foreign key (minute_id, revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mpv_identity_fk foreign key (minute_id, participant_id) references public.minute_participants (minute_id, id) on delete restrict,
  constraint mpv_revision_item_key unique (revision_id, participant_id),
  constraint mpv_profile_fk foreign key (profile_id) references public.user_profiles (id) on delete restrict,
  constraint mpv_position_fk foreign key (position_id) references public.positions (id) on delete restrict,
  constraint mpv_confirmer_fk foreign key (attendance_confirmed_by_profile_id) references public.user_profiles (id) on delete restrict,
  constraint mpv_name_nonempty check (length(btrim(display_name)) > 0),
  constraint mpv_modality check (participation_modality in ('presencial', 'virtual', 'hibrida')),
  constraint mpv_attendance_fact check ((attended is null and attendance_confirmed_at is null and attendance_confirmed_by_profile_id is null) or (attended is not null and attendance_confirmed_at is not null and attendance_confirmed_by_profile_id is not null))
);

create table public.minute_agenda_item_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mav_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mav_company_id_key unique (company_id, id),
  minute_id uuid not null,
  revision_id uuid not null,
  agenda_item_id uuid not null,
  ordinal integer not null,
  title text not null,
  context text,
  constraint mav_revision_fk foreign key (minute_id, revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mav_identity_fk foreign key (minute_id, agenda_item_id) references public.minute_agenda_items (minute_id, id) on delete restrict,
  constraint mav_revision_item_key unique (revision_id, agenda_item_id),
  constraint mav_ordinal_positive check (ordinal > 0),
  constraint mav_title_nonempty check (length(btrim(title)) > 0),
  constraint mav_ordinal_key unique (revision_id, ordinal)
);

create table public.minute_finding_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mfv_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mfv_company_id_key unique (company_id, id),
  minute_id uuid not null,
  revision_id uuid not null,
  finding_id uuid not null,
  agenda_item_id uuid,
  description text not null,
  context text,
  constraint mfv_revision_fk foreign key (minute_id, revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mfv_identity_fk foreign key (minute_id, finding_id) references public.minute_findings (minute_id, id) on delete restrict,
  constraint mfv_revision_item_key unique (revision_id, finding_id),
  constraint mfv_agenda_fk foreign key (revision_id, agenda_item_id) references public.minute_agenda_item_versions (revision_id, agenda_item_id) on delete restrict,
  constraint mfv_content_nonempty check (length(btrim(description)) > 0)
);

create table public.minute_decision_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mdv_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mdv_company_id_key unique (company_id, id),
  minute_id uuid not null,
  revision_id uuid not null,
  decision_id uuid not null,
  agenda_item_id uuid,
  decision_text text not null,
  context text,
  constraint mdv_revision_fk foreign key (minute_id, revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mdv_identity_fk foreign key (minute_id, decision_id) references public.minute_decisions (minute_id, id) on delete restrict,
  constraint mdv_revision_item_key unique (revision_id, decision_id),
  constraint mdv_agenda_fk foreign key (revision_id, agenda_item_id) references public.minute_agenda_item_versions (revision_id, agenda_item_id) on delete restrict,
  constraint mdv_content_nonempty check (length(btrim(decision_text)) > 0)
);

create table public.minute_commitments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mc_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mc_company_id_key unique (company_id, id),
  minute_id uuid not null,
  origin_revision_id uuid not null,
  origin_decision_id uuid,
  action text not null,
  expected_result text,
  due_date date,
  responsible_position_id uuid not null,
  responsible_profile_id uuid,
  responsible_position_title text not null,
  responsible_profile_name text,
  constraint mc_revision_fk foreign key (minute_id, origin_revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mc_minute_id_key unique (minute_id, id),
  constraint mc_decision_fk foreign key (origin_revision_id, origin_decision_id) references public.minute_decision_versions (revision_id, decision_id) on delete restrict,
  constraint mc_position_fk foreign key (responsible_position_id) references public.positions (id) on delete restrict,
  constraint mc_profile_fk foreign key (responsible_profile_id) references public.user_profiles (id) on delete restrict,
  constraint mc_action_nonempty check (length(btrim(action)) > 0),
  constraint mc_position_title_nonempty check (length(btrim(responsible_position_title)) > 0),
  constraint mc_profile_snapshot check ((responsible_profile_id is null and responsible_profile_name is null) or (responsible_profile_id is not null and responsible_profile_name is not null and length(btrim(responsible_profile_name)) > 0))
);

create table public.minute_risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint mk_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint mk_company_id_key unique (company_id, id),
  minute_id uuid not null,
  origin_revision_id uuid not null,
  description text not null,
  context text,
  owner_position_id uuid,
  owner_profile_id uuid,
  constraint mk_revision_fk foreign key (minute_id, origin_revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint mk_minute_id_key unique (minute_id, id),
  constraint mk_position_fk foreign key (owner_position_id) references public.positions (id) on delete restrict,
  constraint mk_profile_fk foreign key (owner_profile_id) references public.user_profiles (id) on delete restrict,
  constraint mk_description_nonempty check (length(btrim(description)) > 0)
);

create table public.minute_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  created_at timestamptz not null default now(),
  constraint ms_company_fk foreign key (company_id) references public.companies (id) on delete restrict,
  constraint ms_company_id_key unique (company_id, id),
  minute_id uuid not null,
  origin_revision_id uuid not null,
  description text not null,
  target_date date,
  achieved_at timestamptz,
  verified_by_profile_id uuid,
  verification_note text,
  constraint ms_revision_fk foreign key (minute_id, origin_revision_id) references public.minute_revisions (minute_id, id) on delete restrict,
  constraint ms_minute_id_key unique (minute_id, id),
  constraint ms_verifier_fk foreign key (verified_by_profile_id) references public.user_profiles (id) on delete restrict,
  constraint ms_description_nonempty check (length(btrim(description)) > 0),
  constraint ms_achievement_fact check ((achieved_at is null and verified_by_profile_id is null and verification_note is null) or (achieved_at is not null and verified_by_profile_id is not null and verification_note is not null and length(btrim(verification_note)) > 0))
);

-- FK lookups not already covered by a leading PK/UNIQUE index.
create index mm_creator_idx on public.meeting_minutes (created_by_profile_id);
create index mr_creator_idx on public.minute_revisions (created_by_profile_id);
create index mpv_revision_idx on public.minute_participant_versions (minute_id, revision_id);
create index mpv_identity_idx on public.minute_participant_versions (minute_id, participant_id);
create index mpv_profile_idx on public.minute_participant_versions (profile_id);
create index mpv_position_idx on public.minute_participant_versions (position_id);
create index mpv_confirmer_idx on public.minute_participant_versions (attendance_confirmed_by_profile_id);
create index mav_revision_idx on public.minute_agenda_item_versions (minute_id, revision_id);
create index mav_identity_idx on public.minute_agenda_item_versions (minute_id, agenda_item_id);
create index mfv_revision_idx on public.minute_finding_versions (minute_id, revision_id);
create index mfv_identity_idx on public.minute_finding_versions (minute_id, finding_id);
create index mfv_agenda_idx on public.minute_finding_versions (revision_id, agenda_item_id);
create index mdv_revision_idx on public.minute_decision_versions (minute_id, revision_id);
create index mdv_identity_idx on public.minute_decision_versions (minute_id, decision_id);
create index mdv_agenda_idx on public.minute_decision_versions (revision_id, agenda_item_id);
create index mc_origin_idx on public.minute_commitments (minute_id, origin_revision_id);
create index mc_decision_idx on public.minute_commitments (origin_revision_id, origin_decision_id);
create index mc_position_idx on public.minute_commitments (responsible_position_id);
create index mc_profile_idx on public.minute_commitments (responsible_profile_id);
create index mk_origin_idx on public.minute_risks (minute_id, origin_revision_id);
create index mk_position_idx on public.minute_risks (owner_position_id);
create index mk_profile_idx on public.minute_risks (owner_profile_id);
create index ms_origin_idx on public.minute_milestones (minute_id, origin_revision_id);
create index ms_verifier_idx on public.minute_milestones (verified_by_profile_id);

-- Defensive posture only. No policies or grants; not full tenant integrity.
-- Owners / BYPASSRLS remain privileged; do not expose service-role writes.
alter table public.meeting_minutes enable row level security;
alter table public.minute_revisions enable row level security;
alter table public.minute_participants enable row level security;
alter table public.minute_agenda_items enable row level security;
alter table public.minute_findings enable row level security;
alter table public.minute_decisions enable row level security;
alter table public.minute_participant_versions enable row level security;
alter table public.minute_agenda_item_versions enable row level security;
alter table public.minute_finding_versions enable row level security;
alter table public.minute_decision_versions enable row level security;
alter table public.minute_commitments enable row level security;
alter table public.minute_risks enable row level security;
alter table public.minute_milestones enable row level security;

commit;
