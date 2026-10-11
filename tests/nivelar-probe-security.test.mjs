import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/api/nivelar/probe/route.ts', import.meta.url), 'utf8');
function fixture({ user = { id: 'synthetic-auth-a' }, authError = null, failure = null } = {}) {
  let providerCalls = 0;
  let tableCalls = 0;
  const compiledModule = { exports: {} };
  const requireModule = key => {
    if (key === 'next/server') return { NextResponse: { json: (body, options) => ({ body, ...options }) } };
    if (key.endsWith('/supabase/server')) return { createSupabaseServerClient: async () => {
      if (failure) throw failure;
      return {
        auth: { getUser: async () => ({ data: { user }, error: authError }) },
        from() { tableCalls++; throw new Error('No resource query authorized'); },
      };
    } };
    if (key.endsWith('/conecta/nivelar')) return {
      fetchNivelarEmployees: async () => { providerCalls++; return [{ cedula: 'synthetic-other-company' }]; },
    };
    if (key.endsWith('/access-policy')) return { canAccess: () => true };
    throw new Error('Unexpected import');
  };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(requireModule, compiledModule, compiledModule.exports);
  return { GET: compiledModule.exports.GET, get providerCalls() { return providerCalls; }, get tableCalls() { return tableCalls; } };
}
async function check(options, status, body, request) {
  const f = fixture(options);
  const response = await f.GET(request);
  assert.equal(response.status, status);
  assert.deepEqual(response.body, { ok: false, status: body });
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.equal(f.providerCalls, 0);
  assert.equal(f.tableCalls, 0);
}

for (const role of ['superadmin', 'direccion', 'gerencia', 'responsable', 'cultura_conecta', 'lector']) {
  test(`probe denies ${role}, including previously permitted sessions, without provider or table access`, async () => {
    await check({ user: { id: 'synthetic-auth-a', app_metadata: { role, company_id: 'synthetic-company-a' } } }, 403, 'forbidden');
  });
}
test('probe rejects absent session and auth errors without disclosing identifiers', async () => {
  await check({ user: null }, 401, 'unauthenticated');
  await check({ authError: new Error('synthetic-secret') }, 401, 'unauthenticated');
});
test('client identifiers and synthetic provider credentials cannot open the closed gate', async () => {
  await check({}, 403, 'forbidden', {
    get nextUrl() { throw new Error('Client scope must not be read'); },
    get headers() { throw new Error('Client credentials must not be read'); },
  });
  assert.ok(!/fetch\s*\(|fetchNivelarEmployees|process\.env|employeeCount/.test(source));
});
test('technical failure returns 503 and logs only a fixed code', async () => {
  const logs = [];
  const original = console.error;
  console.error = (...values) => logs.push(values);
  try { await check({ failure: new Error('synthetic-secret-and-personal-data') }, 503, 'unavailable'); }
  finally { console.error = original; }
  assert.deepEqual(logs, [['NIVELAR_PROBE_FAILED']]);
});
