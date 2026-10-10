import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
function compile(path, requireModule = () => { throw new Error('Unexpected import'); }) {
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(requireModule, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const policy = compile('../src/lib/conecta/access-policy.ts');
function fixture(overrides = {}) {
  const state = {
    user: { id: 'auth-a' },
    user_profiles: { access_role: 'gerencia', company_id: 'company-a' },
    companies: { id: 'company-a' },
    // These are deliberately insufficient: active is not verified identity.
    nivelar_employee_links: { company_id: 'company-a', user_profile_id: 'profile-a', cedula: 'synthetic-a', status: 'active' },
    summaries: [{ company_id: 'company-b', cedula: 'synthetic-b', fecha: '2026-10-01', total_conexion: '07:00:00' }],
    ...overrides,
  };
  const queries = []; let providerCalls = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: state.user }, error: state.authError ?? null }) },
    from(table) {
      const record = { table, filters: [] }; queries.push(record);
      const query = {
        select(columns) { record.columns = columns; return query; },
        eq(key, value) { record.filters.push([key, value]); return query; },
        async maybeSingle() { return { data: state[table], error: state[`${table}Error`] ?? null }; },
      };
      return query;
    },
  };
  const { GET } = compile('../src/app/api/nivelar/daily-probe/route.ts', key => {
    if (key === 'next/server') return { NextResponse: { json: (body, options) => ({ body, ...options }) } };
    if (key.endsWith('/access-policy')) return state.forcePermission ? { canAccess: () => true } : policy;
    if (key.endsWith('/supabase/server')) return { createSupabaseServerClient: async () => {
      if (state.clientError) throw state.clientError;
      return client;
    } };
    if (key.endsWith('/conecta/nivelar')) return {
      fetchNivelarDailySummaries: async () => { providerCalls++; return state.summaries; },
      normalizeNivelarDailySummary: record => record,
    };
    throw new Error(`Unexpected import: ${key}`);
  });
  return { queries, get providerCalls() { return providerCalls; }, GET };
}
async function forbidden(overrides = {}, request = {}) {
  const f = fixture(overrides);
  const response = await f.GET(request);
  assert.equal(response.status, 403);
  assert.deepEqual(response.body, { ok: false, status: 'forbidden' });
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.equal(f.providerCalls, 0, 'denial must precede the provider call');
  assert.ok(f.queries.every(q => ['user_profiles', 'companies'].includes(q.table)), 'no link, summary or identity data is read');
  return f;
}

test('company A cannot obtain a provider record from company B, even with a future permission grant', async () => {
  const f = await forbidden({ forcePermission: true });
  assert.deepEqual(f.queries[0].filters, [['auth_user_id', 'auth-a'], ['is_active', true]]);
  assert.deepEqual(f.queries[1].filters, [['id', 'company-a'], ['status', 'active']]);
});
for (const role of Object.keys(policy.accessRolePermissions)) {
  test(`${role} has no unapproved Nivelar permission and receives denial`, async () => {
    assert.equal(policy.canAccess(role, 'view:nivelar-evidence'), false);
    await forbidden({ user_profiles: { company_id: 'company-a', access_role: role } });
  });
}
test('missing and merely active links do not establish verified employee identity', async () => {
  for (const link of [null, {}, { status: 'pending' }, { status: 'active', cedula: 'synthetic-a', company_id: 'company-a' }]) {
    await forbidden({ forcePermission: true, nivelar_employee_links: link });
  }
});
test('client query/header identifiers cannot override session scope or invent verification', async () => {
  await forbidden({ forcePermission: true }, {
    nextUrl: new URL('http://local/api/nivelar/daily-probe?date=2026-10-01&company_id=company-b&cedula=synthetic-b&user_profile_id=profile-b&verified=true'),
    headers: new Headers({ 'x-company-id': 'company-b', 'x-user-id': 'auth-b', 'x-nivelar-verified': 'true' }),
  });
  await forbidden({ forcePermission: true }, { get nextUrl() { throw new Error('Client identity must not be consulted'); } });
});
test('empty, ambiguous and malformed upstream data cannot produce any disclosure', async () => {
  for (const summaries of [[], null, {}, 'synthetic-sensitive-payload', [null], [{}, {}], [{ cedula: 'synthetic-a' }, { cedula: 'synthetic-a' }]]) {
    await forbidden({ forcePermission: true, summaries });
  }
});
test('a legitimate session still gets denial until sufficient binding evidence exists', async () => {
  // This contract has no verified-by/verified-at or provider-company binding.
  // Do not fabricate a successful path by treating active or a matching ID as verification.
  await forbidden({ forcePermission: true, summaries: [{ company_id: 'company-a', cedula: 'synthetic-a', fecha: '2026-10-01' }] });
});
test('missing/inactive/malformed session resources cannot leak data', async () => {
  for (const access_role of [null, 'unknown', '__proto__', 'constructor']) {
    await forbidden({ user_profiles: { company_id: 'company-a', access_role } });
  }
  for (const user_profiles of [null, {}, { company_id: '' }, { company_id: null }]) await forbidden({ user_profiles });
  for (const companies of [null, {}, { id: 'company-b' }]) await forbidden({ companies });
  for (const auth of [{ user: null }, { authError: new Error('synthetic-auth-error') }]) {
    const f = fixture(auth); const response = await f.GET({});
    assert.equal(response.status, 401); assert.deepEqual(response.body, { ok: false, status: 'unauthenticated' });
    assert.equal(f.queries.length, 0); assert.equal(f.providerCalls, 0);
  }
});
test('technical failures log only a fixed code, never exception payloads or credentials', async () => {
  const original = console.error; const logs = []; console.error = (...args) => logs.push(args);
  try {
    for (const errors of [
      { clientError: new Error('TOKEN-SYNTHETIC SECRET-PAYLOAD') },
      { user_profilesError: new Error('TOKEN-SYNTHETIC SECRET-PAYLOAD') },
      { companiesError: new Error('TOKEN-SYNTHETIC SECRET-PAYLOAD') },
    ]) {
      const f = fixture(errors); const response = await f.GET({});
      assert.equal(response.status, 503);
      assert.deepEqual(response.body, { ok: false, status: 'unavailable' });
      assert.equal(f.providerCalls, 0);
    }
    assert.deepEqual(logs, Array.from({ length: 3 }, () => ['NIVELAR_DAILY_PROBE_FAILED']));
  } finally { console.error = original; }
});
