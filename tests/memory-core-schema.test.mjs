import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static contract checks, NOT PostgreSQL execution or proof of RLS/tenant isolation.
const raw = readFileSync(new URL('../supabase/canonical/migrations/0005_conecta_memory_core.sql', import.meta.url), 'utf8');
const sql = raw.replace(/--[^\n]*/g, '');
const tables = new Map([...sql.matchAll(/create table public\.(\w+) \(\n([\s\S]*?)\n\);/g)].map(([, name, body]) => [name, body]));
const body = name => { assert.ok(tables.has(name), name); return tables.get(name); };
const columns = text => new Map([...text.matchAll(/^  (\w+) (uuid|integer|text|boolean|date|timestamptz)\b([^\n]*)/gm)].map(([, name, type, rest]) => [name, { type, required: /not null|primary key/.test(rest) }]));
const keys = text => ['id', ...[...text.matchAll(/unique \(([^)]+)\)/g)].map(m => m[1])];

test('scope: only the 13 approved core physical tables, no destructive or functional SQL', () => {
  assert.deepEqual([...tables.keys()].sort(), [
    'meeting_minutes', 'minute_revisions', 'minute_participants', 'minute_participant_versions',
    'minute_agenda_items', 'minute_agenda_item_versions', 'minute_findings', 'minute_finding_versions',
    'minute_decisions', 'minute_decision_versions', 'minute_commitments', 'minute_risks', 'minute_milestones',
  ].sort());
  assert.match(sql, /^\s*begin;/);
  assert.match(sql, /commit;\s*$/);
  assert.doesNotMatch(sql, /\b(drop|truncate|insert|update|delete from|grant|create policy|create function|create trigger|create type)\b/i);
  const remainder = sql.replace(/create table public\.\w+ \(\n[\s\S]*?\n\);/g, '')
    .replace(/create index \w+ on public\.\w+ \([\w, ]+\);/g, '')
    .replace(/alter table public\.\w+ enable row level security;/g, '')
    .replace(/\b(begin|commit);/g, '').trim();
  assert.equal(remainder, '', 'unreviewed statement in migration');
});

test('A: event identity has a mandatory FK and unconditional uniqueness', () => {
  assert.match(body('meeting_minutes'), /meeting_event_id uuid not null/);
  assert.match(body('meeting_minutes'), /foreign key \(meeting_event_id\) references public\.meeting_events \(id\) on delete restrict/);
  assert.ok(keys(body('meeting_minutes')).includes('meeting_event_id'));
});

test('B/C: each revision has one required root and positive unique numbering', () => {
  const revision = body('minute_revisions');
  assert.match(revision, /minute_id uuid not null/);
  assert.match(revision, /foreign key \(minute_id\) references public\.meeting_minutes \(id\)/);
  assert.match(revision, /check \(revision_number > 0\)/);
  assert.ok(keys(revision).includes('minute_id, revision_number'));
  assert.doesNotMatch(sql, /current_revision_id|is_current|supersedes_revision_id/);
});

test('D: agenda ordinal is mandatory, positive and unique per revision', () => {
  const agenda = body('minute_agenda_item_versions');
  assert.match(agenda, /ordinal integer not null/);
  assert.match(agenda, /check \(ordinal > 0\)/);
  assert.ok(keys(agenda).includes('revision_id, ordinal'));
});

test('E: commitments require a position but allow unassigned person and due date', () => {
  const commitment = columns(body('minute_commitments'));
  assert.equal(commitment.get('responsible_position_id').required, true);
  assert.equal(commitment.get('responsible_profile_id').required, false);
  assert.equal(commitment.get('due_date').required, false);
  assert.match(body('minute_commitments'), /responsible_profile_id is null and responsible_profile_name is null/);
  assert.doesNotMatch(body('minute_commitments'), /\bstatus\b/);
});

test('F: every dependent table has a required path to the event; no cascading deletion', () => {
  const reachesEvent = (name, seen = new Set()) => {
    if (name === 'meeting_events') return true;
    if (seen.has(name) || !tables.has(name)) return false;
    const nextSeen = new Set([...seen, name]);
    const text = body(name);
    const cols = columns(text);
    return [...text.matchAll(/foreign key \(([^)]+)\) references public\.(\w+) \(([^)]+)\)/g)]
      .some(([, source, target]) => source.split(', ').every(c => cols.get(c)?.required) && reachesEvent(target, nextSeen));
  };
  for (const name of tables.keys()) assert.ok(reachesEvent(name), name);
  assert.doesNotMatch(sql, /on delete (cascade|set null)|on update cascade/);
});

test('G: explicit tenant and candidate key on every table; no claim of tenant-aware FKs', () => {
  for (const [name, text] of tables) {
    assert.match(text, /company_id uuid not null/, name);
    assert.match(text, /foreign key \(company_id\) references public\.companies \(id\)/, name);
    assert.ok(keys(text).includes('company_id, id'), name);
    assert.match(sql, new RegExp(`alter table public\\.${name} enable row level security;`));
  }
  assert.doesNotMatch(sql, /create policy/i);
});

test('versioned items retain an identity and references to the same minute/revision', () => {
  for (const [version, anchor, id] of [
    ['minute_participant_versions', 'minute_participants', 'participant_id'],
    ['minute_agenda_item_versions', 'minute_agenda_items', 'agenda_item_id'],
    ['minute_finding_versions', 'minute_findings', 'finding_id'],
    ['minute_decision_versions', 'minute_decisions', 'decision_id'],
  ]) {
    assert.ok(body(version).includes(`foreign key (minute_id, ${id}) references public.${anchor} (minute_id, id)`));
    assert.ok(body(version).includes('foreign key (minute_id, revision_id) references public.minute_revisions (minute_id, id)'));
    assert.ok(keys(body(version)).includes(`revision_id, ${id}`));
  }
  assert.doesNotMatch(sql, /meeting_responses|token_hash/);
  assert.match(body('minute_participant_versions'), /invited boolean,\s+eligible boolean,\s+attended boolean,/);
  assert.match(body('minute_milestones'), /achieved_at is null/);
  assert.match(body('minute_milestones'), /achieved_at is not null and verified_by_profile_id is not null/);
});

test('all FK endpoints exist, have compatible types and reference a declared candidate key', () => {
  const legacy = readFileSync(new URL('../supabase/canonical/migrations/0001_conecta_local_baseline.sql', import.meta.url), 'utf8')
    + readFileSync(new URL('../supabase/canonical/migrations/0003_conecta_meetings.sql', import.meta.url), 'utf8');
  const catalogue = new Map([...legacy.matchAll(/create table (?:if not exists )?public\.(\w+) \(\r?\n([\s\S]*?)\r?\n\);/g)].map(([, name, text]) => [name, text]));
  for (const [name, text] of tables) catalogue.set(name, text);
  for (const [name, text] of tables) {
    for (const [, source, target, targetCols] of text.matchAll(/foreign key \(([^)]+)\) references public\.(\w+) \(([^)]+)\)/g)) {
      assert.ok(catalogue.has(target), `${name} -> ${target}`);
      const targetBody = catalogue.get(target);
      assert.ok(keys(targetBody).includes(targetCols), `${target} (${targetCols}) is not unique`);
      const srcCols = source.split(', '), dstCols = targetCols.split(', ');
      assert.equal(srcCols.length, dstCols.length);
      srcCols.forEach((col, i) => {
        assert.ok(columns(text).has(col), `${name}.${col}`);
        assert.ok(columns(targetBody).has(dstCols[i]), `${target}.${dstCols[i]}`);
        assert.equal(columns(text).get(col).type, columns(targetBody).get(dstCols[i]).type);
      });
    }
  }
});

test('index/constraint identifiers fit PostgreSQL and index columns exist', () => {
  const names = [...sql.matchAll(/(?:constraint|create index) (\w+)/g)].map(m => m[1]);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) assert.ok(Buffer.byteLength(name) <= 63, name);
  for (const [, , table, cols] of sql.matchAll(/create index (\w+) on public\.(\w+) \(([^)]+)\)/g)) {
    for (const col of cols.split(', ')) assert.ok(columns(body(table)).has(col), `${table}.${col}`);
  }
});
