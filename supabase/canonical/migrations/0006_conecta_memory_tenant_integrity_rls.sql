-- MV-F3-02 candidate. Apply only after canonical 0001 -> 0005 in an authorized clean lab.
-- Not executed/verified in PostgreSQL by this task. No functional use before MV-G3A.
-- Existing rows are never repaired. A validation failure aborts the transaction: STOP.
-- Additive constraints retain 0005 FKs; every tenant edge gets a validated composite FK.
-- PUBLIC/client/service grants are revoked on Core until resource authorization + audit.
-- Test-only grants belong exclusively to the rollback-only runtime suite, not here.

begin;

-- Existing globally unique UUIDs make these extra UNIQUE keys non-destructive.
alter table public.meeting_events
  add constraint meeting_events_memory_tenant_key unique (company_id, id);

alter table public.user_profiles
  add constraint user_profiles_memory_tenant_key unique (company_id, id);

alter table public.positions
  add constraint positions_memory_tenant_key unique (company_id, id);

alter table public.minute_revisions
  add constraint memory_target_1_tenant_key unique (company_id, minute_id, id);

alter table public.minute_participants
  add constraint memory_target_2_tenant_key unique (company_id, minute_id, id);

alter table public.minute_agenda_items
  add constraint memory_target_3_tenant_key unique (company_id, minute_id, id);

alter table public.minute_findings
  add constraint memory_target_4_tenant_key unique (company_id, minute_id, id);

alter table public.minute_agenda_item_versions
  add constraint memory_target_5_tenant_key unique (company_id, revision_id, agenda_item_id);

alter table public.minute_decisions
  add constraint memory_target_6_tenant_key unique (company_id, minute_id, id);

alter table public.minute_decision_versions
  add constraint memory_target_7_tenant_key unique (company_id, revision_id, decision_id);

alter table public.meeting_minutes
  add constraint mm_event_tenant_fk
  foreign key (company_id, meeting_event_id)
  references public.meeting_events (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.meeting_minutes
  add constraint mm_creator_tenant_fk
  foreign key (company_id, created_by_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_revisions
  add constraint mr_minute_tenant_fk
  foreign key (company_id, minute_id)
  references public.meeting_minutes (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_revisions
  add constraint mr_creator_tenant_fk
  foreign key (company_id, created_by_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participants
  add constraint mp_minute_tenant_fk
  foreign key (company_id, minute_id)
  references public.meeting_minutes (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_agenda_items
  add constraint ma_minute_tenant_fk
  foreign key (company_id, minute_id)
  references public.meeting_minutes (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_findings
  add constraint mf_minute_tenant_fk
  foreign key (company_id, minute_id)
  references public.meeting_minutes (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_decisions
  add constraint md_minute_tenant_fk
  foreign key (company_id, minute_id)
  references public.meeting_minutes (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participant_versions
  add constraint mpv_revision_tenant_fk
  foreign key (company_id, minute_id, revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participant_versions
  add constraint mpv_identity_tenant_fk
  foreign key (company_id, minute_id, participant_id)
  references public.minute_participants (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participant_versions
  add constraint mpv_profile_tenant_fk
  foreign key (company_id, profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participant_versions
  add constraint mpv_position_tenant_fk
  foreign key (company_id, position_id)
  references public.positions (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_participant_versions
  add constraint mpv_confirmer_tenant_fk
  foreign key (company_id, attendance_confirmed_by_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_agenda_item_versions
  add constraint mav_revision_tenant_fk
  foreign key (company_id, minute_id, revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_agenda_item_versions
  add constraint mav_identity_tenant_fk
  foreign key (company_id, minute_id, agenda_item_id)
  references public.minute_agenda_items (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_finding_versions
  add constraint mfv_revision_tenant_fk
  foreign key (company_id, minute_id, revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_finding_versions
  add constraint mfv_identity_tenant_fk
  foreign key (company_id, minute_id, finding_id)
  references public.minute_findings (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_finding_versions
  add constraint mfv_agenda_tenant_fk
  foreign key (company_id, revision_id, agenda_item_id)
  references public.minute_agenda_item_versions (company_id, revision_id, agenda_item_id)
  match simple on update restrict on delete restrict;

alter table public.minute_decision_versions
  add constraint mdv_revision_tenant_fk
  foreign key (company_id, minute_id, revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_decision_versions
  add constraint mdv_identity_tenant_fk
  foreign key (company_id, minute_id, decision_id)
  references public.minute_decisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_decision_versions
  add constraint mdv_agenda_tenant_fk
  foreign key (company_id, revision_id, agenda_item_id)
  references public.minute_agenda_item_versions (company_id, revision_id, agenda_item_id)
  match simple on update restrict on delete restrict;

alter table public.minute_commitments
  add constraint mc_revision_tenant_fk
  foreign key (company_id, minute_id, origin_revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_commitments
  add constraint mc_decision_tenant_fk
  foreign key (company_id, origin_revision_id, origin_decision_id)
  references public.minute_decision_versions (company_id, revision_id, decision_id)
  match simple on update restrict on delete restrict;

alter table public.minute_commitments
  add constraint mc_position_tenant_fk
  foreign key (company_id, responsible_position_id)
  references public.positions (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_commitments
  add constraint mc_profile_tenant_fk
  foreign key (company_id, responsible_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_risks
  add constraint mk_revision_tenant_fk
  foreign key (company_id, minute_id, origin_revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_risks
  add constraint mk_position_tenant_fk
  foreign key (company_id, owner_position_id)
  references public.positions (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_risks
  add constraint mk_profile_tenant_fk
  foreign key (company_id, owner_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_milestones
  add constraint ms_revision_tenant_fk
  foreign key (company_id, minute_id, origin_revision_id)
  references public.minute_revisions (company_id, minute_id, id)
  match simple on update restrict on delete restrict;

alter table public.minute_milestones
  add constraint ms_verifier_tenant_fk
  foreign key (company_id, verified_by_profile_id)
  references public.user_profiles (company_id, id)
  match simple on update restrict on delete restrict;

-- Four tenant-only operation policies plus a restrictive guard per table.
-- The guard is AND-combined with future permissive policies; do not remove it in F3-03.
-- No SECURITY DEFINER helper: identity is auth.uid(), profiles/companies remain under RLS.
-- The existing current_company_id helper is used indirectly by their legacy policies.

alter table public.meeting_minutes enable row level security;
revoke all privileges on table public.meeting_minutes from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.meeting_minutes
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ));

create policy memory_tenant_select on public.meeting_minutes
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ));

create policy memory_tenant_insert on public.meeting_minutes
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ));

create policy memory_tenant_update on public.meeting_minutes
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ));

create policy memory_tenant_delete on public.meeting_minutes
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = meeting_minutes.company_id
  ));


alter table public.minute_revisions enable row level security;
revoke all privileges on table public.minute_revisions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_revisions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ));

create policy memory_tenant_select on public.minute_revisions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ));

create policy memory_tenant_insert on public.minute_revisions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ));

create policy memory_tenant_update on public.minute_revisions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ));

create policy memory_tenant_delete on public.minute_revisions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_revisions.company_id
  ));


alter table public.minute_participants enable row level security;
revoke all privileges on table public.minute_participants from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_participants
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ));

create policy memory_tenant_select on public.minute_participants
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ));

create policy memory_tenant_insert on public.minute_participants
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ));

create policy memory_tenant_update on public.minute_participants
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ));

create policy memory_tenant_delete on public.minute_participants
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participants.company_id
  ));


alter table public.minute_agenda_items enable row level security;
revoke all privileges on table public.minute_agenda_items from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_agenda_items
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ));

create policy memory_tenant_select on public.minute_agenda_items
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ));

create policy memory_tenant_insert on public.minute_agenda_items
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ));

create policy memory_tenant_update on public.minute_agenda_items
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ));

create policy memory_tenant_delete on public.minute_agenda_items
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_items.company_id
  ));


alter table public.minute_findings enable row level security;
revoke all privileges on table public.minute_findings from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_findings
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ));

create policy memory_tenant_select on public.minute_findings
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ));

create policy memory_tenant_insert on public.minute_findings
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ));

create policy memory_tenant_update on public.minute_findings
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ));

create policy memory_tenant_delete on public.minute_findings
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_findings.company_id
  ));


alter table public.minute_decisions enable row level security;
revoke all privileges on table public.minute_decisions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_decisions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ));

create policy memory_tenant_select on public.minute_decisions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ));

create policy memory_tenant_insert on public.minute_decisions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ));

create policy memory_tenant_update on public.minute_decisions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ));

create policy memory_tenant_delete on public.minute_decisions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decisions.company_id
  ));


alter table public.minute_participant_versions enable row level security;
revoke all privileges on table public.minute_participant_versions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_participant_versions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ));

create policy memory_tenant_select on public.minute_participant_versions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ));

create policy memory_tenant_insert on public.minute_participant_versions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ));

create policy memory_tenant_update on public.minute_participant_versions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ));

create policy memory_tenant_delete on public.minute_participant_versions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_participant_versions.company_id
  ));


alter table public.minute_agenda_item_versions enable row level security;
revoke all privileges on table public.minute_agenda_item_versions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_agenda_item_versions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ));

create policy memory_tenant_select on public.minute_agenda_item_versions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ));

create policy memory_tenant_insert on public.minute_agenda_item_versions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ));

create policy memory_tenant_update on public.minute_agenda_item_versions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ));

create policy memory_tenant_delete on public.minute_agenda_item_versions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_agenda_item_versions.company_id
  ));


alter table public.minute_finding_versions enable row level security;
revoke all privileges on table public.minute_finding_versions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_finding_versions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ));

create policy memory_tenant_select on public.minute_finding_versions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ));

create policy memory_tenant_insert on public.minute_finding_versions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ));

create policy memory_tenant_update on public.minute_finding_versions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ));

create policy memory_tenant_delete on public.minute_finding_versions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_finding_versions.company_id
  ));


alter table public.minute_decision_versions enable row level security;
revoke all privileges on table public.minute_decision_versions from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_decision_versions
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ));

create policy memory_tenant_select on public.minute_decision_versions
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ));

create policy memory_tenant_insert on public.minute_decision_versions
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ));

create policy memory_tenant_update on public.minute_decision_versions
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ));

create policy memory_tenant_delete on public.minute_decision_versions
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_decision_versions.company_id
  ));


alter table public.minute_commitments enable row level security;
revoke all privileges on table public.minute_commitments from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_commitments
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ));

create policy memory_tenant_select on public.minute_commitments
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ));

create policy memory_tenant_insert on public.minute_commitments
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ));

create policy memory_tenant_update on public.minute_commitments
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ));

create policy memory_tenant_delete on public.minute_commitments
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_commitments.company_id
  ));


alter table public.minute_risks enable row level security;
revoke all privileges on table public.minute_risks from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_risks
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ));

create policy memory_tenant_select on public.minute_risks
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ));

create policy memory_tenant_insert on public.minute_risks
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ));

create policy memory_tenant_update on public.minute_risks
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ));

create policy memory_tenant_delete on public.minute_risks
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_risks.company_id
  ));


alter table public.minute_milestones enable row level security;
revoke all privileges on table public.minute_milestones from public, anon, authenticated, service_role;

create policy memory_tenant_guard on public.minute_milestones
as restrictive for all to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ));

create policy memory_tenant_select on public.minute_milestones
as permissive for select to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ));

create policy memory_tenant_insert on public.minute_milestones
as permissive for insert to authenticated
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ));

create policy memory_tenant_update on public.minute_milestones
as permissive for update to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ))
with check (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ));

create policy memory_tenant_delete on public.minute_milestones
as permissive for delete to authenticated
using (exists (
    select 1
    from public.user_profiles as p
    join public.companies as c on c.id = p.company_id
    where p.auth_user_id = (select auth.uid())
      and p.is_active = true
      and c.status = 'active'
      and p.company_id = minute_milestones.company_id
  ));

commit;

