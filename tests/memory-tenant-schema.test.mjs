import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static checks only. PostgreSQL execution is required to close MV-G3-02.
const read = name => readFileSync(new URL(`../supabase/canonical/migrations/${name}`, import.meta.url), 'utf8').replace(/--[^\n]*/g, '');
const core = read('0005_conecta_memory_core.sql');
const sql = read('0006_conecta_memory_tenant_integrity_rls.sql');
const tables = [...core.matchAll(/create table public\.(\w+) \(\r?\n([\s\S]*?)\r?\n\);/g)];
const policies = [...sql.matchAll(/create policy (\w+) on public\.(\w+)\s+as (restrictive|permissive) for (\w+) to (\w+)\s+([\s\S]*?);/g)];

test('all 30 non-company edges get tenant-aware declarative FK coverage', () => {
  let count = 0;
  for (const [, table, body] of tables) {
    for (const [, , cols, target, dest] of body.matchAll(/constraint (\w+) foreign key \(([^)]+)\) references public\.(\w+) \(([^)]+)\)/g)) {
      if (target === 'companies') continue;
      const expected = `foreign key (company_id, ${cols})\n  references public.${target} (company_id, ${dest})`;
      const statements = sql.split(';').filter(s => s.includes(`alter table public.${table}\n`));
      assert.ok(statements.some(s => s.includes(expected)), `${table} -> ${target} (${dest})`);
      count++;
    }
  }
  assert.equal(count, 30);
  assert.equal([...sql.matchAll(/foreign key/g)].length, count);
  assert.equal([...sql.matchAll(/match simple on update restrict on delete restrict/g)].length, count);
  assert.doesNotMatch(sql, /not valid|disable trigger|drop constraint/i);
});

test('every new FK target has an exact unique key in 0005/0006 or a legacy extension', () => {
  const unique = new Set();
  for (const [, table, body] of tables) {
    for (const [, cols] of body.matchAll(/unique \(([^)]+)\)/g)) unique.add(`${table}:${cols}`);
  }
  for (const [, table, cols] of sql.matchAll(/alter table public\.(\w+)\s+add constraint \w+ unique \(([^)]+)\)/g)) unique.add(`${table}:${cols}`);
  for (const [, table, cols] of sql.matchAll(/references public\.(\w+) \(([^)]+)\)/g)) assert.ok(unique.has(`${table}:${cols}`), `${table}:${cols}`);
  const existing = [...sql.matchAll(/alter table public\.(meeting_events|user_profiles|positions)\s+add constraint \w+ unique \(([^)]+)\)/g)];
  assert.equal(existing.length, 3);
  assert.ok(existing.every(m => m[2] === 'company_id, id'));
});

test('13 tables retain RLS and each has all four operations plus restrictive guard', () => {
  assert.equal(policies.length, 65);
  for (const [, table] of tables) {
    assert.ok(core.includes(`alter table public.${table} enable row level security;`));
    assert.ok(sql.includes(`alter table public.${table} enable row level security;`));
    const group = policies.filter(p => p[2] === table);
    assert.deepEqual(group.map(p => p[4]).sort(), ['all', 'delete', 'insert', 'select', 'update']);
    assert.equal(group.find(p => p[4] === 'all')[3], 'restrictive');
    assert.ok(group.filter(p => p[4] !== 'all').every(p => p[3] === 'permissive'));
  }
});

test('every policy derives tenant from session, active profile and active company', () => {
  for (const [, name, table, , , role, expression] of policies) {
    assert.equal(role, 'authenticated');
    for (const required of ['p.auth_user_id = (select auth.uid())', 'p.is_active = true', "c.status = 'active'", `p.company_id = ${table}.company_id`, 'join public.companies as c on c.id = p.company_id']) {
      assert.ok(expression.includes(required), `${table}.${name}: ${required}`);
    }
    assert.doesNotMatch(expression, /access_role|superadmin|user_metadata|jwt\(/i);
  }
  assert.doesNotMatch(sql, /(?:using|with check)\s*\(\s*true\s*\)/i);
});

test('UPDATE and guard inspect both old and new rows; INSERT checks new tenant', () => {
  for (const [, , , , op, , expression] of policies) {
    if (op !== 'insert') assert.match(expression, /^using \(exists/);
    if (['all', 'insert', 'update'].includes(op)) assert.match(expression, /with check \(exists/);
    if (['select', 'delete'].includes(op)) assert.doesNotMatch(expression, /with check/);
  }
});

test('grants fence prevents tenant-only policies from exposing functional access before MV-G3A', () => {
  for (const [, table] of tables) assert.ok(sql.includes(`revoke all privileges on table public.${table} from public, anon, authenticated, service_role;`));
  assert.doesNotMatch(sql, /\bgrant\b/i);
  assert.equal([...sql.matchAll(/revoke all privileges on table/g)].length, 13);
});

test('additive security-only migration: no DML, lifecycle, audit, functions or auth changes', () => {
  assert.match(sql, /^\s*begin;/);
  assert.match(sql, /commit;\s*$/);
  assert.doesNotMatch(sql, /\b(insert into|update public|delete from|truncate|drop|create table|create type|create function|create trigger|security definer)\b/i);
  assert.doesNotMatch(sql, /\b(draft|submitted|approved|closed|void|report_reviews|outbox|storage)\b/i);
  const altered = [...sql.matchAll(/alter table public\.(\w+)/g)].map(m => m[1]);
  const allowed = new Set([...tables.map(t => t[1]), 'meeting_events', 'user_profiles', 'positions']);
  assert.ok(altered.every(t => allowed.has(t)));
  for (const [, name] of sql.matchAll(/add constraint (\w+)/g)) assert.ok(Buffer.byteLength(name) <= 63, name);
});

test('runtime suite is opt-in, rollback-only and separates grants/RLS/FK/BYPASSRLS', () => {
  const suite = readFileSync(new URL('../supabase/canonical/tests/memory-tenant.runtime.sql', import.meta.url), 'utf8');
  assert.match(suite, /\\if :\{\?conecta_disposable\}/);
  assert.match(suite, /\\set ON_ERROR_STOP on/);
  assert.match(suite, /rollback;\s*$/);
  assert.doesNotMatch(suite.replace(/--[^\n]*/g, ''), /\bcommit\s*;/i);
  assert.match(suite, /set local role authenticated/i);
  assert.match(suite, /set local role service_role/i);
  for (const state of ['42501', '23503', '23505', '23514']) assert.ok(suite.includes(state));
  assert.match(suite, /row_security_active/);
  assert.match(suite, /diagnostic-only grants/i);
});
