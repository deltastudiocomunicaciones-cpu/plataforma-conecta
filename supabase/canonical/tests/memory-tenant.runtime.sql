-- PREPARED ONLY. Never run on a shared/remote/business database.
-- Requires fresh isolated Supabase lab, canonical 0001..0006 already applied, owner session.
-- Explicit opt-in: psql variable conecta_disposable=MV-F3-02 (not a proof of isolation).
-- Preflight/loopback and lab identity must be approved outside this script first.
-- Temporary fixtures and diagnostic-only grants are ALWAYS rolled back.
\set ON_ERROR_STOP on
\if :{?conecta_disposable}
\else
  \echo 'STOP: explicit disposable-lab opt-in is required'
  \quit 3
\endif

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
select set_config('conecta.test_opt_in', :'conecta_disposable', true);

do $preflight$
declare t text; test_has_rows boolean; r text;
begin
  if current_setting('conecta.test_opt_in') <> 'MV-F3-02' then
    raise exception 'Wrong disposable-lab opt-in';
  end if;
  if not exists (select 1 from pg_roles where rolname = current_user and rolsuper) then
    raise exception 'Disposable suite requires an explicitly authorized local superuser for role simulation';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role' and rolbypassrls) then
    raise exception 'Expected Supabase service_role BYPASSRLS missing';
  end if;
  foreach t in array array['meeting_minutes', 'minute_revisions', 'minute_participants', 'minute_agenda_items', 'minute_findings', 'minute_decisions', 'minute_participant_versions', 'minute_agenda_item_versions', 'minute_finding_versions', 'minute_decision_versions', 'minute_commitments', 'minute_risks', 'minute_milestones'] loop
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public' and c.relname = t and c.relrowsecurity) then
      raise exception 'RLS/catalog missing: %', t;
    end if;
    if (select count(*) from pg_policies where schemaname = 'public' and tablename = t) <> 5 then
      raise exception 'Unexpected policy inventory: %', t;
    end if;
    execute format('select exists (select 1 from public.%I)', t) into strict test_has_rows;
    if test_has_rows then raise exception 'Core table is not empty: %; no cleanup authorized', t; end if;
    foreach r in array array['anon', 'authenticated', 'service_role'] loop
      if has_table_privilege(r, 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         or has_any_column_privilege(r, 'public.' || t, 'SELECT,INSERT,UPDATE,REFERENCES') then
        raise exception 'Unexpected effective table/column grant for % on %; STOP', r, t;
      end if;
    end loop;
  end loop;
  if (select count(*) from pg_constraint k
      join pg_class t on t.oid = k.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
      join pg_attribute b on b.attrelid = k.confrelid and b.attnum = k.confkey[1]
      where n.nspname = 'public' and k.conname like '%\_tenant\_fk' escape '\'
        and k.contype = 'f' and k.convalidated and k.confupdtype = 'r' and k.confdeltype = 'r'
        and a.attname = 'company_id' and b.attname = 'company_id') <> 30 then
    raise exception 'Expected 30 validated tenant FKs in PostgreSQL catalogue';
  end if;
end;
$preflight$;

create temporary table runtime_probe_guard (unused boolean) on commit drop;
create function pg_temp.fixture_id(tenant text, entity text)
returns uuid language sql immutable security invoker
set search_path = pg_catalog
as $$ select md5('conecta-mvf302-fixture:' || tenant || ':' || entity)::uuid $$;

create function pg_temp.assert_true(ok boolean, label text)
returns void language plpgsql security invoker
set search_path = pg_catalog
as $$
begin
  if ok is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if;
  raise notice 'PASS: %', label;
end; $$;

create function pg_temp.expect_error(statement text, expected_state text, label text)
returns void language plpgsql security invoker
set search_path = pg_catalog
as $$
declare observed_state text; observed_constraint text;
begin
  begin
    execute statement;
  exception when others then
    get stacked diagnostics observed_state = returned_sqlstate, observed_constraint = constraint_name;
    if observed_state <> expected_state then
      raise exception 'Wrong SQLSTATE for %: expected %, observed %, constraint %',
        label, expected_state, observed_state, observed_constraint;
    end if;
    raise notice 'PASS: %; SQLSTATE=%; constraint=%', label, observed_state, observed_constraint;
    return;
  end;
  raise exception 'Expected rejection did not occur: %', label;
end; $$;

-- Session-local helper visibility; no persistent helper or SECURITY DEFINER is installed.
do $temp_access$
begin
  execute format('grant usage on schema %I to authenticated, service_role', (select nspname from pg_namespace where oid = pg_my_temp_schema()));
end; $temp_access$;

-- Fixture-only identities, never real accounts or seeds of business data.

insert into public.companies (id, name, slug) values (pg_temp.fixture_id('a', 'company'), 'Disposable tenant a', 'mvf302-disposable-a');
insert into auth.users (id) values (pg_temp.fixture_id('a', 'auth'));
insert into public.positions (id, company_id, external_key, title, area, business_unit)
values (pg_temp.fixture_id('a', 'position'), pg_temp.fixture_id('a', 'company'), 'fixture', 'Fixture', 'Fixture', 'Fixture');
insert into public.user_profiles (id, company_id, auth_user_id, full_name, email, position_id)
values (pg_temp.fixture_id('a', 'profile'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'auth'), 'Fixture a', 'a@example.invalid', pg_temp.fixture_id('a', 'position'));
insert into public.meeting_events (id, company_id, created_by_profile_id, token_hash, name, event_date, start_time, owner_label, audience_label)
values (pg_temp.fixture_id('a', 'event'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'profile'), 'non-authenticating-fixture-a', 'Fixture', date '2026-10-01', time '10:00', 'Fixture', 'Fixture');
insert into public.meeting_minutes (id, company_id, meeting_event_id, created_by_profile_id)
values (pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'event'), pg_temp.fixture_id('a', 'profile'));
insert into public.minute_revisions (id, company_id, minute_id, revision_number, created_by_profile_id, title)
values (pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), 1, pg_temp.fixture_id('a', 'profile'), 'Fixture');
insert into public.minute_participants (id, company_id, minute_id) values (pg_temp.fixture_id('a', 'minute_participants'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'));
insert into public.minute_agenda_items (id, company_id, minute_id) values (pg_temp.fixture_id('a', 'minute_agenda_items'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'));
insert into public.minute_findings (id, company_id, minute_id) values (pg_temp.fixture_id('a', 'minute_findings'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'));
insert into public.minute_decisions (id, company_id, minute_id) values (pg_temp.fixture_id('a', 'minute_decisions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'));
insert into public.minute_participant_versions (id, company_id, minute_id, revision_id, participant_id, profile_id, display_name)
values (pg_temp.fixture_id('a', 'minute_participant_versions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'minute_participants'), pg_temp.fixture_id('a', 'profile'), 'Fixture');
insert into public.minute_agenda_item_versions (id, company_id, minute_id, revision_id, agenda_item_id, ordinal, title)
values (pg_temp.fixture_id('a', 'minute_agenda_item_versions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'minute_agenda_items'), 1, 'Fixture');
insert into public.minute_finding_versions (id, company_id, minute_id, revision_id, finding_id, agenda_item_id, description)
values (pg_temp.fixture_id('a', 'minute_finding_versions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'minute_findings'), pg_temp.fixture_id('a', 'minute_agenda_items'), 'Fixture');
insert into public.minute_decision_versions (id, company_id, minute_id, revision_id, decision_id, agenda_item_id, decision_text)
values (pg_temp.fixture_id('a', 'minute_decision_versions'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'minute_decisions'), pg_temp.fixture_id('a', 'minute_agenda_items'), 'Fixture');
insert into public.minute_commitments (id, company_id, minute_id, origin_revision_id, origin_decision_id, action, responsible_position_id, responsible_position_title)
values (pg_temp.fixture_id('a', 'minute_commitments'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'minute_decisions'), 'Fixture', pg_temp.fixture_id('a', 'position'), 'Fixture');
insert into public.minute_risks (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('a', 'minute_risks'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), 'Fixture');
insert into public.minute_milestones (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('a', 'minute_milestones'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), 'Fixture');

insert into public.companies (id, name, slug) values (pg_temp.fixture_id('b', 'company'), 'Disposable tenant b', 'mvf302-disposable-b');
insert into auth.users (id) values (pg_temp.fixture_id('b', 'auth'));
insert into public.positions (id, company_id, external_key, title, area, business_unit)
values (pg_temp.fixture_id('b', 'position'), pg_temp.fixture_id('b', 'company'), 'fixture', 'Fixture', 'Fixture', 'Fixture');
insert into public.user_profiles (id, company_id, auth_user_id, full_name, email, position_id)
values (pg_temp.fixture_id('b', 'profile'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'auth'), 'Fixture b', 'b@example.invalid', pg_temp.fixture_id('b', 'position'));
insert into public.meeting_events (id, company_id, created_by_profile_id, token_hash, name, event_date, start_time, owner_label, audience_label)
values (pg_temp.fixture_id('b', 'event'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'profile'), 'non-authenticating-fixture-b', 'Fixture', date '2026-10-01', time '10:00', 'Fixture', 'Fixture');
insert into public.meeting_minutes (id, company_id, meeting_event_id, created_by_profile_id)
values (pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'event'), pg_temp.fixture_id('b', 'profile'));
insert into public.minute_revisions (id, company_id, minute_id, revision_number, created_by_profile_id, title)
values (pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), 1, pg_temp.fixture_id('b', 'profile'), 'Fixture');
insert into public.minute_participants (id, company_id, minute_id) values (pg_temp.fixture_id('b', 'minute_participants'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'));
insert into public.minute_agenda_items (id, company_id, minute_id) values (pg_temp.fixture_id('b', 'minute_agenda_items'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'));
insert into public.minute_findings (id, company_id, minute_id) values (pg_temp.fixture_id('b', 'minute_findings'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'));
insert into public.minute_decisions (id, company_id, minute_id) values (pg_temp.fixture_id('b', 'minute_decisions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'));
insert into public.minute_participant_versions (id, company_id, minute_id, revision_id, participant_id, profile_id, display_name)
values (pg_temp.fixture_id('b', 'minute_participant_versions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'minute_participants'), pg_temp.fixture_id('b', 'profile'), 'Fixture');
insert into public.minute_agenda_item_versions (id, company_id, minute_id, revision_id, agenda_item_id, ordinal, title)
values (pg_temp.fixture_id('b', 'minute_agenda_item_versions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'minute_agenda_items'), 1, 'Fixture');
insert into public.minute_finding_versions (id, company_id, minute_id, revision_id, finding_id, agenda_item_id, description)
values (pg_temp.fixture_id('b', 'minute_finding_versions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'minute_findings'), pg_temp.fixture_id('b', 'minute_agenda_items'), 'Fixture');
insert into public.minute_decision_versions (id, company_id, minute_id, revision_id, decision_id, agenda_item_id, decision_text)
values (pg_temp.fixture_id('b', 'minute_decision_versions'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'minute_decisions'), pg_temp.fixture_id('b', 'minute_agenda_items'), 'Fixture');
insert into public.minute_commitments (id, company_id, minute_id, origin_revision_id, origin_decision_id, action, responsible_position_id, responsible_position_title)
values (pg_temp.fixture_id('b', 'minute_commitments'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), pg_temp.fixture_id('b', 'minute_decisions'), 'Fixture', pg_temp.fixture_id('b', 'position'), 'Fixture');
insert into public.minute_risks (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('b', 'minute_risks'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), 'Fixture');
insert into public.minute_milestones (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('b', 'minute_milestones'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), 'Fixture');

-- Real PostgreSQL checks of 0005, after successful fixture construction.
-- Unused events ensure the cross-tenant event probe fails on FK, not mm_event_key.
insert into public.meeting_events (id, company_id, token_hash, name, event_date, start_time, owner_label, audience_label)
select pg_temp.fixture_id(t, 'event-unlinked'), pg_temp.fixture_id(t, 'company'), 'non-authenticating-unused-' || t,
       'Fixture', date '2026-10-01', time '10:00', 'Fixture', 'Fixture'
from (values ('a'), ('b')) as tenants(t);
select pg_temp.expect_error(
  'insert into public.meeting_minutes (company_id, meeting_event_id, created_by_profile_id) select company_id, meeting_event_id, created_by_profile_id from public.meeting_minutes limit 1',
  '23505', '0005 A: duplicate logical minute');
select pg_temp.expect_error(
  'insert into public.minute_revisions (company_id, minute_id, revision_number, created_by_profile_id, title) select company_id, minute_id, revision_number, created_by_profile_id, title from public.minute_revisions limit 1',
  '23505', '0005 C: duplicate revision number');
select pg_temp.expect_error(
  'update public.minute_revisions set revision_number = 0',
  '23514', '0005 revision number positive');
select pg_temp.expect_error(
  'update public.minute_agenda_item_versions set ordinal = 0',
  '23514', '0005 D: positive agenda ordinal');
select pg_temp.expect_error(
  format('update public.minute_revisions set minute_id = %L', pg_temp.fixture_id('absent','minute')),
  '23503', '0005 B/F: no orphan revision');
select pg_temp.expect_error(
  'delete from public.meeting_minutes',
  '23503', '0005 F: referenced aggregate root cannot be deleted');
select pg_temp.assert_true(
  (select count(*) = 2 from public.minute_commitments where responsible_profile_id is null),
  '0005 E: valid position without a person');

-- Production posture is fenced: error 42501 here is ACL, NOT evidence of RLS.
set local role authenticated;
select pg_temp.assert_true(
  not has_table_privilege(current_user, 'public.meeting_minutes', 'SELECT'),
  'application grants withheld before MV-G3A');
select pg_temp.expect_error('select * from public.meeting_minutes', '42501', 'ACL fence, not RLS');
reset role;

-- Diagnostic-only grants: rolled back, never part of 0006 or application authorization.
grant select on public.companies, public.user_profiles to authenticated;
grant select, insert, update, delete on public.meeting_minutes to authenticated, service_role;
grant select, insert, update, delete on public.minute_revisions to authenticated, service_role;
grant select, insert, update, delete on public.minute_participants to authenticated, service_role;
grant select, insert, update, delete on public.minute_agenda_items to authenticated, service_role;
grant select, insert, update, delete on public.minute_findings to authenticated, service_role;
grant select, insert, update, delete on public.minute_decisions to authenticated, service_role;
grant select, insert, update, delete on public.minute_participant_versions to authenticated, service_role;
grant select, insert, update, delete on public.minute_agenda_item_versions to authenticated, service_role;
grant select, insert, update, delete on public.minute_finding_versions to authenticated, service_role;
grant select, insert, update, delete on public.minute_decision_versions to authenticated, service_role;
grant select, insert, update, delete on public.minute_commitments to authenticated, service_role;
grant select, insert, update, delete on public.minute_risks to authenticated, service_role;
grant select, insert, update, delete on public.minute_milestones to authenticated, service_role;

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.fixture_id('a', 'auth')::text, true);
select set_config('request.jwt.claims', json_build_object('sub', pg_temp.fixture_id('a', 'auth')::text, 'role', 'authenticated')::text, true);
select pg_temp.assert_true(row_security_active('public.meeting_minutes'::regclass), 'a: RLS active meeting_minutes');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.meeting_minutes), 'a: own row visible / other tenant filtered meeting_minutes');
select pg_temp.expect_error(
  format('insert into public.meeting_minutes select (jsonb_populate_record(null::public.meeting_minutes, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.meeting_minutes t',
    pg_temp.fixture_id('a', 'rejected-meeting_minutes'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS meeting_minutes');
select pg_temp.expect_error(
  format('update public.meeting_minutes set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS meeting_minutes');
select pg_temp.assert_true(row_security_active('public.minute_revisions'::regclass), 'a: RLS active minute_revisions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_revisions), 'a: own row visible / other tenant filtered minute_revisions');
select pg_temp.expect_error(
  format('insert into public.minute_revisions select (jsonb_populate_record(null::public.minute_revisions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_revisions t',
    pg_temp.fixture_id('a', 'rejected-minute_revisions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_revisions');
select pg_temp.expect_error(
  format('update public.minute_revisions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_revisions');
select pg_temp.assert_true(row_security_active('public.minute_participants'::regclass), 'a: RLS active minute_participants');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_participants), 'a: own row visible / other tenant filtered minute_participants');
select pg_temp.expect_error(
  format('insert into public.minute_participants select (jsonb_populate_record(null::public.minute_participants, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_participants t',
    pg_temp.fixture_id('a', 'rejected-minute_participants'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_participants');
select pg_temp.expect_error(
  format('update public.minute_participants set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_participants');
select pg_temp.assert_true(row_security_active('public.minute_agenda_items'::regclass), 'a: RLS active minute_agenda_items');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_agenda_items), 'a: own row visible / other tenant filtered minute_agenda_items');
select pg_temp.expect_error(
  format('insert into public.minute_agenda_items select (jsonb_populate_record(null::public.minute_agenda_items, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_agenda_items t',
    pg_temp.fixture_id('a', 'rejected-minute_agenda_items'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_agenda_items');
select pg_temp.expect_error(
  format('update public.minute_agenda_items set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_agenda_items');
select pg_temp.assert_true(row_security_active('public.minute_findings'::regclass), 'a: RLS active minute_findings');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_findings), 'a: own row visible / other tenant filtered minute_findings');
select pg_temp.expect_error(
  format('insert into public.minute_findings select (jsonb_populate_record(null::public.minute_findings, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_findings t',
    pg_temp.fixture_id('a', 'rejected-minute_findings'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_findings');
select pg_temp.expect_error(
  format('update public.minute_findings set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_findings');
select pg_temp.assert_true(row_security_active('public.minute_decisions'::regclass), 'a: RLS active minute_decisions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_decisions), 'a: own row visible / other tenant filtered minute_decisions');
select pg_temp.expect_error(
  format('insert into public.minute_decisions select (jsonb_populate_record(null::public.minute_decisions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_decisions t',
    pg_temp.fixture_id('a', 'rejected-minute_decisions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_decisions');
select pg_temp.expect_error(
  format('update public.minute_decisions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_decisions');
select pg_temp.assert_true(row_security_active('public.minute_participant_versions'::regclass), 'a: RLS active minute_participant_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_participant_versions), 'a: own row visible / other tenant filtered minute_participant_versions');
select pg_temp.expect_error(
  format('insert into public.minute_participant_versions select (jsonb_populate_record(null::public.minute_participant_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_participant_versions t',
    pg_temp.fixture_id('a', 'rejected-minute_participant_versions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_participant_versions');
select pg_temp.expect_error(
  format('update public.minute_participant_versions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_participant_versions');
select pg_temp.assert_true(row_security_active('public.minute_agenda_item_versions'::regclass), 'a: RLS active minute_agenda_item_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_agenda_item_versions), 'a: own row visible / other tenant filtered minute_agenda_item_versions');
select pg_temp.expect_error(
  format('insert into public.minute_agenda_item_versions select (jsonb_populate_record(null::public.minute_agenda_item_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_agenda_item_versions t',
    pg_temp.fixture_id('a', 'rejected-minute_agenda_item_versions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_agenda_item_versions');
select pg_temp.expect_error(
  format('update public.minute_agenda_item_versions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_agenda_item_versions');
select pg_temp.assert_true(row_security_active('public.minute_finding_versions'::regclass), 'a: RLS active minute_finding_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_finding_versions), 'a: own row visible / other tenant filtered minute_finding_versions');
select pg_temp.expect_error(
  format('insert into public.minute_finding_versions select (jsonb_populate_record(null::public.minute_finding_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_finding_versions t',
    pg_temp.fixture_id('a', 'rejected-minute_finding_versions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_finding_versions');
select pg_temp.expect_error(
  format('update public.minute_finding_versions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_finding_versions');
select pg_temp.assert_true(row_security_active('public.minute_decision_versions'::regclass), 'a: RLS active minute_decision_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_decision_versions), 'a: own row visible / other tenant filtered minute_decision_versions');
select pg_temp.expect_error(
  format('insert into public.minute_decision_versions select (jsonb_populate_record(null::public.minute_decision_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_decision_versions t',
    pg_temp.fixture_id('a', 'rejected-minute_decision_versions'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_decision_versions');
select pg_temp.expect_error(
  format('update public.minute_decision_versions set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_decision_versions');
select pg_temp.assert_true(row_security_active('public.minute_commitments'::regclass), 'a: RLS active minute_commitments');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_commitments), 'a: own row visible / other tenant filtered minute_commitments');
select pg_temp.expect_error(
  format('insert into public.minute_commitments select (jsonb_populate_record(null::public.minute_commitments, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_commitments t',
    pg_temp.fixture_id('a', 'rejected-minute_commitments'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_commitments');
select pg_temp.expect_error(
  format('update public.minute_commitments set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_commitments');
select pg_temp.assert_true(row_security_active('public.minute_risks'::regclass), 'a: RLS active minute_risks');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_risks), 'a: own row visible / other tenant filtered minute_risks');
select pg_temp.expect_error(
  format('insert into public.minute_risks select (jsonb_populate_record(null::public.minute_risks, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_risks t',
    pg_temp.fixture_id('a', 'rejected-minute_risks'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_risks');
select pg_temp.expect_error(
  format('update public.minute_risks set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_risks');
select pg_temp.assert_true(row_security_active('public.minute_milestones'::regclass), 'a: RLS active minute_milestones');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('a', 'company')) from public.minute_milestones), 'a: own row visible / other tenant filtered minute_milestones');
select pg_temp.expect_error(
  format('insert into public.minute_milestones select (jsonb_populate_record(null::public.minute_milestones, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_milestones t',
    pg_temp.fixture_id('a', 'rejected-minute_milestones'), pg_temp.fixture_id('b', 'company')),
  '42501', 'a: INSERT spoof tenant rejected by RLS minute_milestones');
select pg_temp.expect_error(
  format('update public.minute_milestones set company_id = %L', pg_temp.fixture_id('b', 'company')),
  '42501', 'a: UPDATE tenant relocation rejected by RLS minute_milestones');

-- Same-tenant positive INSERT/UPDATE/DELETE; no business authority is claimed.
insert into public.minute_risks (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('a', 'transient-risk'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), 'Transient');
update public.minute_risks set description = 'Updated' where id = pg_temp.fixture_id('a', 'transient-risk');
select pg_temp.assert_true((select description = 'Updated' from public.minute_risks where id = pg_temp.fixture_id('a', 'transient-risk')), 'a: own UPDATE works under tenant policy');
delete from public.minute_risks where id = pg_temp.fixture_id('a', 'transient-risk');
select pg_temp.assert_true(not exists (select 1 from public.minute_risks where id = pg_temp.fixture_id('a', 'transient-risk')), 'a: own DELETE works under tenant policy');
do $hidden_mutations$
declare n integer;
begin
  update public.minute_risks set description = 'Wrong tenant' where id = pg_temp.fixture_id('b', 'minute_risks');
  get diagnostics n = row_count;
  perform pg_temp.assert_true(n = 0, 'a: UPDATE other tenant filtered by RLS');
  delete from public.minute_risks where id = pg_temp.fixture_id('b', 'minute_risks');
  get diagnostics n = row_count;
  perform pg_temp.assert_true(n = 0, 'a: DELETE other tenant filtered by RLS');
end; $hidden_mutations$;
select pg_temp.expect_error(format('update public.meeting_minutes set meeting_event_id = %L', pg_temp.fixture_id('b', 'event-unlinked')), '23503', 'a: valid foreign-tenant event blocked by FK, not RLS');
select pg_temp.expect_error(format('update public.meeting_minutes set created_by_profile_id = %L', pg_temp.fixture_id('b', 'profile')), '23503', 'a: valid foreign-tenant profile blocked by FK, not RLS');
select pg_temp.expect_error(format('update public.minute_commitments set responsible_position_id = %L', pg_temp.fixture_id('b', 'position')), '23503', 'a: valid foreign-tenant position blocked by FK, not RLS');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.fixture_id('b', 'auth')::text, true);
select set_config('request.jwt.claims', json_build_object('sub', pg_temp.fixture_id('b', 'auth')::text, 'role', 'authenticated')::text, true);
select pg_temp.assert_true(row_security_active('public.meeting_minutes'::regclass), 'b: RLS active meeting_minutes');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.meeting_minutes), 'b: own row visible / other tenant filtered meeting_minutes');
select pg_temp.expect_error(
  format('insert into public.meeting_minutes select (jsonb_populate_record(null::public.meeting_minutes, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.meeting_minutes t',
    pg_temp.fixture_id('b', 'rejected-meeting_minutes'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS meeting_minutes');
select pg_temp.expect_error(
  format('update public.meeting_minutes set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS meeting_minutes');
select pg_temp.assert_true(row_security_active('public.minute_revisions'::regclass), 'b: RLS active minute_revisions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_revisions), 'b: own row visible / other tenant filtered minute_revisions');
select pg_temp.expect_error(
  format('insert into public.minute_revisions select (jsonb_populate_record(null::public.minute_revisions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_revisions t',
    pg_temp.fixture_id('b', 'rejected-minute_revisions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_revisions');
select pg_temp.expect_error(
  format('update public.minute_revisions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_revisions');
select pg_temp.assert_true(row_security_active('public.minute_participants'::regclass), 'b: RLS active minute_participants');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_participants), 'b: own row visible / other tenant filtered minute_participants');
select pg_temp.expect_error(
  format('insert into public.minute_participants select (jsonb_populate_record(null::public.minute_participants, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_participants t',
    pg_temp.fixture_id('b', 'rejected-minute_participants'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_participants');
select pg_temp.expect_error(
  format('update public.minute_participants set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_participants');
select pg_temp.assert_true(row_security_active('public.minute_agenda_items'::regclass), 'b: RLS active minute_agenda_items');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_agenda_items), 'b: own row visible / other tenant filtered minute_agenda_items');
select pg_temp.expect_error(
  format('insert into public.minute_agenda_items select (jsonb_populate_record(null::public.minute_agenda_items, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_agenda_items t',
    pg_temp.fixture_id('b', 'rejected-minute_agenda_items'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_agenda_items');
select pg_temp.expect_error(
  format('update public.minute_agenda_items set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_agenda_items');
select pg_temp.assert_true(row_security_active('public.minute_findings'::regclass), 'b: RLS active minute_findings');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_findings), 'b: own row visible / other tenant filtered minute_findings');
select pg_temp.expect_error(
  format('insert into public.minute_findings select (jsonb_populate_record(null::public.minute_findings, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_findings t',
    pg_temp.fixture_id('b', 'rejected-minute_findings'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_findings');
select pg_temp.expect_error(
  format('update public.minute_findings set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_findings');
select pg_temp.assert_true(row_security_active('public.minute_decisions'::regclass), 'b: RLS active minute_decisions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_decisions), 'b: own row visible / other tenant filtered minute_decisions');
select pg_temp.expect_error(
  format('insert into public.minute_decisions select (jsonb_populate_record(null::public.minute_decisions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_decisions t',
    pg_temp.fixture_id('b', 'rejected-minute_decisions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_decisions');
select pg_temp.expect_error(
  format('update public.minute_decisions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_decisions');
select pg_temp.assert_true(row_security_active('public.minute_participant_versions'::regclass), 'b: RLS active minute_participant_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_participant_versions), 'b: own row visible / other tenant filtered minute_participant_versions');
select pg_temp.expect_error(
  format('insert into public.minute_participant_versions select (jsonb_populate_record(null::public.minute_participant_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_participant_versions t',
    pg_temp.fixture_id('b', 'rejected-minute_participant_versions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_participant_versions');
select pg_temp.expect_error(
  format('update public.minute_participant_versions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_participant_versions');
select pg_temp.assert_true(row_security_active('public.minute_agenda_item_versions'::regclass), 'b: RLS active minute_agenda_item_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_agenda_item_versions), 'b: own row visible / other tenant filtered minute_agenda_item_versions');
select pg_temp.expect_error(
  format('insert into public.minute_agenda_item_versions select (jsonb_populate_record(null::public.minute_agenda_item_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_agenda_item_versions t',
    pg_temp.fixture_id('b', 'rejected-minute_agenda_item_versions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_agenda_item_versions');
select pg_temp.expect_error(
  format('update public.minute_agenda_item_versions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_agenda_item_versions');
select pg_temp.assert_true(row_security_active('public.minute_finding_versions'::regclass), 'b: RLS active minute_finding_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_finding_versions), 'b: own row visible / other tenant filtered minute_finding_versions');
select pg_temp.expect_error(
  format('insert into public.minute_finding_versions select (jsonb_populate_record(null::public.minute_finding_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_finding_versions t',
    pg_temp.fixture_id('b', 'rejected-minute_finding_versions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_finding_versions');
select pg_temp.expect_error(
  format('update public.minute_finding_versions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_finding_versions');
select pg_temp.assert_true(row_security_active('public.minute_decision_versions'::regclass), 'b: RLS active minute_decision_versions');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_decision_versions), 'b: own row visible / other tenant filtered minute_decision_versions');
select pg_temp.expect_error(
  format('insert into public.minute_decision_versions select (jsonb_populate_record(null::public.minute_decision_versions, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_decision_versions t',
    pg_temp.fixture_id('b', 'rejected-minute_decision_versions'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_decision_versions');
select pg_temp.expect_error(
  format('update public.minute_decision_versions set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_decision_versions');
select pg_temp.assert_true(row_security_active('public.minute_commitments'::regclass), 'b: RLS active minute_commitments');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_commitments), 'b: own row visible / other tenant filtered minute_commitments');
select pg_temp.expect_error(
  format('insert into public.minute_commitments select (jsonb_populate_record(null::public.minute_commitments, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_commitments t',
    pg_temp.fixture_id('b', 'rejected-minute_commitments'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_commitments');
select pg_temp.expect_error(
  format('update public.minute_commitments set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_commitments');
select pg_temp.assert_true(row_security_active('public.minute_risks'::regclass), 'b: RLS active minute_risks');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_risks), 'b: own row visible / other tenant filtered minute_risks');
select pg_temp.expect_error(
  format('insert into public.minute_risks select (jsonb_populate_record(null::public.minute_risks, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_risks t',
    pg_temp.fixture_id('b', 'rejected-minute_risks'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_risks');
select pg_temp.expect_error(
  format('update public.minute_risks set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_risks');
select pg_temp.assert_true(row_security_active('public.minute_milestones'::regclass), 'b: RLS active minute_milestones');
select pg_temp.assert_true((select count(*) = 1 and bool_and(company_id = pg_temp.fixture_id('b', 'company')) from public.minute_milestones), 'b: own row visible / other tenant filtered minute_milestones');
select pg_temp.expect_error(
  format('insert into public.minute_milestones select (jsonb_populate_record(null::public.minute_milestones, to_jsonb(t) || jsonb_build_object(''id'', %L, ''company_id'', %L))).* from public.minute_milestones t',
    pg_temp.fixture_id('b', 'rejected-minute_milestones'), pg_temp.fixture_id('a', 'company')),
  '42501', 'b: INSERT spoof tenant rejected by RLS minute_milestones');
select pg_temp.expect_error(
  format('update public.minute_milestones set company_id = %L', pg_temp.fixture_id('a', 'company')),
  '42501', 'b: UPDATE tenant relocation rejected by RLS minute_milestones');

-- Same-tenant positive INSERT/UPDATE/DELETE; no business authority is claimed.
insert into public.minute_risks (id, company_id, minute_id, origin_revision_id, description)
values (pg_temp.fixture_id('b', 'transient-risk'), pg_temp.fixture_id('b', 'company'), pg_temp.fixture_id('b', 'meeting_minutes'), pg_temp.fixture_id('b', 'minute_revisions'), 'Transient');
update public.minute_risks set description = 'Updated' where id = pg_temp.fixture_id('b', 'transient-risk');
select pg_temp.assert_true((select description = 'Updated' from public.minute_risks where id = pg_temp.fixture_id('b', 'transient-risk')), 'b: own UPDATE works under tenant policy');
delete from public.minute_risks where id = pg_temp.fixture_id('b', 'transient-risk');
select pg_temp.assert_true(not exists (select 1 from public.minute_risks where id = pg_temp.fixture_id('b', 'transient-risk')), 'b: own DELETE works under tenant policy');
do $hidden_mutations$
declare n integer;
begin
  update public.minute_risks set description = 'Wrong tenant' where id = pg_temp.fixture_id('a', 'minute_risks');
  get diagnostics n = row_count;
  perform pg_temp.assert_true(n = 0, 'b: UPDATE other tenant filtered by RLS');
  delete from public.minute_risks where id = pg_temp.fixture_id('a', 'minute_risks');
  get diagnostics n = row_count;
  perform pg_temp.assert_true(n = 0, 'b: DELETE other tenant filtered by RLS');
end; $hidden_mutations$;
select pg_temp.expect_error(format('update public.meeting_minutes set meeting_event_id = %L', pg_temp.fixture_id('a', 'event-unlinked')), '23503', 'b: valid foreign-tenant event blocked by FK, not RLS');
select pg_temp.expect_error(format('update public.meeting_minutes set created_by_profile_id = %L', pg_temp.fixture_id('a', 'profile')), '23503', 'b: valid foreign-tenant profile blocked by FK, not RLS');
select pg_temp.expect_error(format('update public.minute_commitments set responsible_position_id = %L', pg_temp.fixture_id('a', 'position')), '23503', 'b: valid foreign-tenant position blocked by FK, not RLS');
reset role;

-- Inactive identity/company and missing session are fail-closed under actual RLS.
update public.user_profiles set is_active = false where id = pg_temp.fixture_id('a', 'profile');
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.fixture_id('a', 'auth')::text, true);
select set_config('request.jwt.claims', json_build_object('sub', pg_temp.fixture_id('a', 'auth')::text, 'role', 'authenticated')::text, true);
select pg_temp.assert_true((select count(*) = 0 from public.meeting_minutes), 'inactive profile denied');
reset role;
update public.user_profiles set is_active = true where id = pg_temp.fixture_id('a', 'profile');
update public.companies set status = 'inactive' where id = pg_temp.fixture_id('a', 'company');
set local role authenticated;
select pg_temp.assert_true((select count(*) = 0 from public.meeting_minutes), 'inactive company denied');
reset role;
update public.companies set status = 'active' where id = pg_temp.fixture_id('a', 'company');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.assert_true((select count(*) = 0 from public.meeting_minutes), 'missing session denied');
reset role;

-- BYPASSRLS is a separate experiment. The test grants do not exist after rollback.
set local role service_role;
select pg_temp.assert_true(not row_security_active('public.meeting_minutes'::regclass), 'service_role bypasses RLS meeting_minutes');
select pg_temp.assert_true((select count(*) = 2 from public.meeting_minutes), 'service_role sees both tenants meeting_minutes');
select pg_temp.expect_error(
  format('update public.meeting_minutes set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'meeting_minutes')),
  '23503', 'BYPASSRLS cannot bypass tenant FK meeting_minutes');
select pg_temp.assert_true(not row_security_active('public.minute_revisions'::regclass), 'service_role bypasses RLS minute_revisions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_revisions), 'service_role sees both tenants minute_revisions');
select pg_temp.expect_error(
  format('update public.minute_revisions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_revisions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_revisions');
select pg_temp.assert_true(not row_security_active('public.minute_participants'::regclass), 'service_role bypasses RLS minute_participants');
select pg_temp.assert_true((select count(*) = 2 from public.minute_participants), 'service_role sees both tenants minute_participants');
select pg_temp.expect_error(
  format('update public.minute_participants set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_participants')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_participants');
select pg_temp.assert_true(not row_security_active('public.minute_agenda_items'::regclass), 'service_role bypasses RLS minute_agenda_items');
select pg_temp.assert_true((select count(*) = 2 from public.minute_agenda_items), 'service_role sees both tenants minute_agenda_items');
select pg_temp.expect_error(
  format('update public.minute_agenda_items set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_agenda_items')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_agenda_items');
select pg_temp.assert_true(not row_security_active('public.minute_findings'::regclass), 'service_role bypasses RLS minute_findings');
select pg_temp.assert_true((select count(*) = 2 from public.minute_findings), 'service_role sees both tenants minute_findings');
select pg_temp.expect_error(
  format('update public.minute_findings set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_findings')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_findings');
select pg_temp.assert_true(not row_security_active('public.minute_decisions'::regclass), 'service_role bypasses RLS minute_decisions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_decisions), 'service_role sees both tenants minute_decisions');
select pg_temp.expect_error(
  format('update public.minute_decisions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_decisions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_decisions');
select pg_temp.assert_true(not row_security_active('public.minute_participant_versions'::regclass), 'service_role bypasses RLS minute_participant_versions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_participant_versions), 'service_role sees both tenants minute_participant_versions');
select pg_temp.expect_error(
  format('update public.minute_participant_versions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_participant_versions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_participant_versions');
select pg_temp.assert_true(not row_security_active('public.minute_agenda_item_versions'::regclass), 'service_role bypasses RLS minute_agenda_item_versions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_agenda_item_versions), 'service_role sees both tenants minute_agenda_item_versions');
select pg_temp.expect_error(
  format('update public.minute_agenda_item_versions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_agenda_item_versions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_agenda_item_versions');
select pg_temp.assert_true(not row_security_active('public.minute_finding_versions'::regclass), 'service_role bypasses RLS minute_finding_versions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_finding_versions), 'service_role sees both tenants minute_finding_versions');
select pg_temp.expect_error(
  format('update public.minute_finding_versions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_finding_versions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_finding_versions');
select pg_temp.assert_true(not row_security_active('public.minute_decision_versions'::regclass), 'service_role bypasses RLS minute_decision_versions');
select pg_temp.assert_true((select count(*) = 2 from public.minute_decision_versions), 'service_role sees both tenants minute_decision_versions');
select pg_temp.expect_error(
  format('update public.minute_decision_versions set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_decision_versions')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_decision_versions');
select pg_temp.assert_true(not row_security_active('public.minute_commitments'::regclass), 'service_role bypasses RLS minute_commitments');
select pg_temp.assert_true((select count(*) = 2 from public.minute_commitments), 'service_role sees both tenants minute_commitments');
select pg_temp.expect_error(
  format('update public.minute_commitments set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_commitments')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_commitments');
select pg_temp.assert_true(not row_security_active('public.minute_risks'::regclass), 'service_role bypasses RLS minute_risks');
select pg_temp.assert_true((select count(*) = 2 from public.minute_risks), 'service_role sees both tenants minute_risks');
select pg_temp.expect_error(
  format('update public.minute_risks set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_risks')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_risks');
select pg_temp.assert_true(not row_security_active('public.minute_milestones'::regclass), 'service_role bypasses RLS minute_milestones');
select pg_temp.assert_true((select count(*) = 2 from public.minute_milestones), 'service_role sees both tenants minute_milestones');
select pg_temp.expect_error(
  format('update public.minute_milestones set company_id = %L where id = %L', pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('b', 'minute_milestones')),
  '23503', 'BYPASSRLS cannot bypass tenant FK minute_milestones');
reset role;
-- Verify failed cross-tenant DELETE/UPDATE did not mutate the hidden rows.
select pg_temp.assert_true((select count(*) = 2 and bool_and(description = 'Fixture') from public.minute_risks), 'hidden rows preserved');
-- Separate item: avoid mistaking duplicate item-version identity for ordinal uniqueness.
insert into public.minute_agenda_items (id, company_id, minute_id)
values (pg_temp.fixture_id('a', 'second-agenda'), pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'));
select pg_temp.expect_error(
  format('insert into public.minute_agenda_item_versions (company_id, minute_id, revision_id, agenda_item_id, ordinal, title) values (%L, %L, %L, %L, 1, ''Duplicate ordinal'')',
    pg_temp.fixture_id('a', 'company'), pg_temp.fixture_id('a', 'meeting_minutes'), pg_temp.fixture_id('a', 'minute_revisions'), pg_temp.fixture_id('a', 'second-agenda')),
  '23505', '0005 D: duplicate ordinal within a revision');
rollback;
