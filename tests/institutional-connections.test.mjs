import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);
const source = read('../src/components/InstitutionalConnections.tsx');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const compiledModule = { exports: {} };
new Function('require', 'module', 'exports', code)(require, compiledModule, compiledModule.exports);

test('institutional navigation reaches existing surfaces without fabricating operational relations', () => {
  const html = renderToStaticMarkup(createElement(compiledModule.exports.InstitutionalConnections));
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(hrefs.length, 6);
  for (const href of hrefs) {
    const [path, anchor] = href.split('#');
    assert.ok(existsSync(new URL(`../src/app${path}/page.tsx`, import.meta.url)), href);
    if (anchor) assert.ok(read('../src/components/OrgExperience.tsx').includes(`id="${anchor}"`));
  }
  for (const text of ['demostrativos y no se almacenan', 'seguimiento local', 'atribución validada', 'RSVP no acredita asistencia', 'No hay servicio de IA']) assert.ok(html.includes(text), text);
  assert.ok(!/fetch\(|createSupabase|localStorage|\.insert\(/.test(source));
});

test('memory, meetings and agent preserve shared navigation; map uses its module cards', () => {
  for (const path of ['../src/components/memory/MemoryDemoExperience.tsx', '../src/app/convocatorias/page.tsx', '../src/components/agent/AgentWorkspace.tsx']) assert.ok(read(path).includes('<InstitutionalConnections />'), path);
  assert.ok(!read('../src/components/OrgExperience.tsx').includes('<InstitutionalConnections />'));
});
