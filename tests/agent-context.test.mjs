import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
// Compile the actual resolver without installing a second TypeScript runtime.
const source = readFileSync(new URL('../src/lib/conecta/agent/context.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { resolveAgentContext } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function fixture(overrides = {}) {
  const calls = [];
  const data = {
    user: { id: 'auth-a' },
    user_profiles: { id: 'profile-a', full_name: 'Example', company_id: 'company-a', position_id: 'position-a', access_role: 'responsable' },
    companies: { id: 'company-a' },
    positions: { id: 'position-a', title: 'Accountant', purpose: 'Review work', responsibilities: ['Review evidence'], activities: [], authority: [], processes: [], documents: [], business_unit: 'Pymes' },
    ...overrides,
  };
  return { calls, client: {
    auth: { getUser: async () => ({ data: { user: data.user }, error: data.authError ?? null }) },
    from: table => {
      const call = { table, filters: [], columns: '' }; calls.push(call);
      const query = {
        select: columns => { call.columns = columns; return query; },
        eq: (key, value) => { call.filters.push([key, value]); return query; },
        maybeSingle: async () => ({ data: data[table], error: data[`${table}Error`] ?? null }),
      }; return query;
    },
  } };
}
test('unauthenticated requests cannot read any table', async () => {
  const f = fixture({ user: null }); assert.equal((await resolveAgentContext(f.client)).status, 'unauthenticated'); assert.equal(f.calls.length, 0);
});
test('auth failure rejects even if a user object is returned', async () => {
  const f = fixture({ authError: new Error('expired') }); assert.equal((await resolveAgentContext(f.client)).status, 'unauthenticated'); assert.equal(f.calls.length, 0);
});
test('missing profile or inactive company denies context', async () => {
  for (const override of [{ user_profiles: null }, { companies: null }]) {
    const f = fixture(override); assert.deepEqual(await resolveAgentContext(f.client), { status: 'forbidden', context: null }); assert.ok(!f.calls.some(c => c.table === 'positions'));
  }
});
test('scope comes from authenticated profile and company; no sensitive columns', async () => {
  const f = fixture(); const result = await resolveAgentContext(f.client);
  assert.equal(result.status, 'ready'); assert.deepEqual(result.context.permissions, []);
  assert.deepEqual(f.calls[0].filters, [['auth_user_id','auth-a'],['is_active',true]]);
  assert.deepEqual(f.calls[1].filters, [['id','company-a'],['status','active']]);
  assert.deepEqual(f.calls[2].filters, [['id','position-a'],['company_id','company-a']]);
  assert.ok(f.calls.every(c => !/phone|email|identity_document|document_id|\*/.test(c.columns)));
});
test('absent position is explicit; no fallback to local catalogue', async () => {
  const f = fixture({ positions: null }); const r = await resolveAgentContext(f.client); assert.equal(r.status, 'missing_position'); assert.equal(r.context.role, null);
});
test('empty functional context is not marked ready', async () => {
  const f = fixture({ positions: { purpose: ' ', responsibilities: [] } }); assert.equal((await resolveAgentContext(f.client)).status, 'incomplete_position');
});
test('database errors do not become empty or ready context', async () => {
  for (const table of ['user_profiles','companies','positions']) {
    const f = fixture({ [`${table}Error`]: new Error('database unavailable') }); await assert.rejects(() => resolveAgentContext(f.client));
  }
});
