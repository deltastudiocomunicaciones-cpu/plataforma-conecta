import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const source = JSON.parse(read('../src/data/sdx-institutional-source.json'));
const legacy = JSON.parse(read('../src/data/pymes-functional-profiles.json'));
const org = JSON.parse(read('../src/data/grupo-ac-org.json'));
const gpySource = JSON.parse(read('../src/data/gpy-institutional-source.json'));
const code = read('../src/lib/conecta/institutional-profile.ts')
  .replace(/import source from [^;]+;/, `const source = ${JSON.stringify(source)};`)
  .replace(/import gpySource from [^;]+;/, `const gpySource = ${JSON.stringify(gpySource)};`)
  .replace(/import \{ getFunctionalProfile, type FunctionalProfile \} from [^;]+;/, `const legacy = ${JSON.stringify(legacy)}; const getFunctionalProfile = key => legacy[key] ?? null;`);
const compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { cargoCero, getInstitutionalProfile, NIVELAR_EVIDENCE_DOCTRINE } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('master dimensions are retained verbatim alongside structured institutional data', () => {
  assert.equal(cargoCero.dimensions.length, 14);
  assert.deepEqual(cargoCero.dimensions, source.dimensions);
  assert.equal(cargoCero.processes.length, 6);
  assert.deepEqual(cargoCero.indicators.map(k => k.code), ['K01','K02','K03','K04','K05','K06']);
  assert.equal(cargoCero.risks.length, 6);
  assert.ok(cargoCero.risks.every(r => r.control));
  assert.equal(cargoCero.deliverables.length, 6);
  assert.equal(cargoCero.gate.criteria.length, 9);
  assert.equal(cargoCero.gate.status, 'NOT_EVALUATED');
  assert.equal(cargoCero.raci.length, 8);
  assert.deepEqual(cargoCero.raci[0].accountable, ['SUBDIR.']);
  assert.equal(cargoCero.raci[3].assignments[2].designation, 'R/A*');
  assert.ok(cargoCero.raci[3].notes.includes('políticas de autorización'));
  assert.equal(cargoCero.governance.length, 4);
  assert.ok(cargoCero.indicators.every(k => k.baseline === null && k.target === null));
  assert.equal(cargoCero.reviewStatus, 'pendingReview');
  assert.ok(!('isoCertified' in cargoCero));
});
test('PYMES adaptation preserves every legacy module and never inherits SDX-specific doctrine', () => {
  for (const label of ['Contador Auditor','Analista Integrador']) {
    const role = org.nodes.find(n => n.positionLabel === label);
    assert.ok(role, label);
    const profile = getInstitutionalProfile(role);
    assert.equal(profile.name, label);
    assert.deepEqual(profile.processes.map(({code,name,responsibilities}) => ({code,name,responsibilities})), legacy[role.functionalProfile].modules);
    assert.equal(profile.purpose, role.purpose);
    for (const field of ['raci','gate','governance','normativeReference','boundaries','deliverables','evaluation','doctrines']) assert.equal(profile[field], null);
    assert.ok(profile.fieldMapping.some(f => f.category === 'A'));
    assert.ok(profile.fieldMapping.some(f => f.category === 'B'));
    assert.ok(profile.fieldMapping.some(f => f.category === 'C'));
    assert.ok(profile.indicators.every(k => k.target === null && k.formula === null));
  }
});

test('GPY-001 uses its own institutional content and retains the complete functional catalog', () => {
  const role = org.nodes.find(n => n.id === 'gerencia-09');
  const before = JSON.stringify(role);
  const masterBefore = JSON.stringify(cargoCero);
  const profile = getInstitutionalProfile(role);
  assert.equal(profile.code, 'GPY-001');
  assert.equal(profile.name, 'Gerente PYMES');
  assert.deepEqual(profile.person, { positionId: 'gerencia-09', name: 'José Fernando Palacios' });
  assert.equal(profile.dependency, 'Dirección');
  assert.equal(profile.documentVersion, '1.0');
  assert.equal(profile.documentStatus, 'Aprobación institucional pendiente');
  assert.ok(profile.purpose.startsWith('Dirigir, gobernar, asegurar y mejorar'));
  assert.deepEqual(profile.authority, role.authority);
  assert.deepEqual(profile.processes.map(({ code, name, responsibilities }) => ({ code, name, responsibilities })), legacy['gerente-pymes'].modules);
  const responsibilities = profile.processes.flatMap(p => p.responsibilities);
  const subactivities = responsibilities.flatMap(r => r.subactivities);
  assert.equal(responsibilities.length, 7);
  assert.equal(subactivities.length, 14);
  assert.equal(subactivities.flatMap(s => s.tasks).length, 85);
  assert.equal(profile.institutionalContext.systemicRole, 'GOVERN');
  assert.equal(profile.institutionalContext.functionalLevel, 'Gerencial');
  assert.deepEqual(profile.institutionalContext.relatedProcesses.map(p => p.code), ['MP01','MP02','MP03','MP04','MP05','MP06']);
  assert.deepEqual(profile.institutionalContext.relatedProcesses.map(p => p.name.toUpperCase()), role.processes);
  assert.deepEqual(profile.institutionalContext.macroResponsibilities.map(r => r.code), ['R01','R02','R03','R04','R05','R06','R07','R08']);
  for (const field of ['dimensions','preamble','normativeReference','evidence','gate']) assert.equal(profile[field], null);
  assert.deepEqual(profile.indicators.slice(0, 5).map(i => i.name), role.kpis);
  for (const indicator of profile.indicators) for (const field of ['interpretation','source','frequency','responsible','baseline','target']) assert.equal(indicator[field], null);
  assert.ok(profile.indicators.slice(0, 5).every(i => i.formula === null));
  assert.ok(profile.risks.every(r => r.control === null));
  assert.equal(profile.institutionalContext.fieldStates.find(s => s.field === 'raci').state, 'PROPUESTO');
  assert.equal(profile.institutionalContext.fieldStates.find(s => s.field === 'approval').state, 'PENDIENTE');
  assert.ok(profile.fieldMapping.some(f => f.field === 'indicators.*.interpretation' && f.category === 'C'));
  assert.equal(JSON.stringify(role), before);
  assert.equal(JSON.stringify(cargoCero), masterBefore);
});

test('SDX additions cannot leak into PYMES and names cannot grant GPY identity', () => {
  cargoCero.__inheritanceProbe = 'SDX-only';
  try {
    assert.equal(getInstitutionalProfile(org.nodes.find(n => n.id === 'gerencia-09')).__inheritanceProbe, undefined);
    assert.equal(getInstitutionalProfile(org.nodes.find(n => n.positionLabel === 'Contador Auditor')).__inheritanceProbe, undefined);
  } finally { delete cargoCero.__inheritanceProbe; }
  assert.equal(getInstitutionalProfile({ ...org.nodes[0], title: 'Gerente PYMES', positionLabel: 'Gerente PYMES' }), null);
  const alias = getInstitutionalProfile({ ...org.nodes.find(n => n.id === 'gerencia-09'), id: 'other-id' });
  assert.equal(alias.code, null);
  assert.equal(alias.institutionalContext, undefined);
});

test('Word source is projected literally while proposals and missing associations remain unapproved', () => {
  const profile = getInstitutionalProfile(org.nodes.find(n => n.id === 'gerencia-09'));
  const tables = code => gpySource.sections.find(s => s.code === code).blocks.filter(b => b.kind === 'table').map(b => b.rows);
  assert.deepEqual(profile.documentarySource.sections, gpySource.sections);
  assert.equal(profile.documentarySource.sha256, '7fa59205176bf3b40c8e2c4636c77355ba1d17dc6b000d38de04b16991d45b77');
  assert.deepEqual(profile.deliverables.map(e => [e.family, e.deliverable, e.requiredEvidence, e.documentaryState]), tables('8')[0].slice(1));
  assert.equal(profile.deliverables.length, 7);
  assert.deepEqual(profile.indicators.slice(5).map(i => [i.code, i.name, i.formula, i.documentaryState]), tables('9')[1].slice(1));
  assert.ok(profile.indicators.every(i => i.status === 'pendingDefinition' && i.baseline === null && i.target === null && i.source === null && i.frequency === null && i.responsible === null));
  assert.deepEqual(profile.designRisks.map(r => [r.code, r.risk, r.proposedTreatment]), tables('10')[0].slice(1));
  assert.ok(profile.designRisks.every(r => r.control === null && r.evidence === null && r.responsible === null && r.alert === null));
  assert.deepEqual(profile.risks.map(r => r.risk), org.nodes.find(n => n.id === 'gerencia-09').risks);
  assert.deepEqual(profile.raci.map(r => [r.activity, ...r.assignments.map(a => a.designation)]), tables('11')[0].slice(1));
  assert.equal(profile.raci.length, 15);
  assert.equal(profile.documentarySource.comparisons[0].rows.length, 17);
  assert.equal(profile.documentarySource.comparisons[0].conflicts.length, 4);
  assert.ok(profile.documentarySource.comparisons[0].conflicts[0].includes('A/R al Gerente'));
  assert.ok(profile.raci.every(r => r.notes.includes('PROPUESTA PARA VALIDACIÓN')));
  assert.deepEqual(profile.competencies.map(c => [c.name, c.behavior]), tables('12')[0].slice(1));
  assert.equal(profile.competencies.length, 12);
  assert.deepEqual(profile.traceability.map(r => [r.responsibility, r.function, r.result, r.deliverable, r.indicator, r.escalation]), tables('15')[0].slice(1));
  assert.equal(profile.traceability.length, 8);
  assert.ok(profile.traceability.every(r => r.evidence === null && r.risk === null && r.control === null && r.state === 'PROPUESTO'));
  assert.deepEqual(profile.governance.map(g => [g.review, g.objective, g.frequency]), tables('13')[0].slice(1));
  assert.equal(profile.governance.filter(g => g.frequency === 'PENDIENTE').length, 5);
  assert.ok(profile.evaluation.includes('Organización → Proceso → Cargo → Persona'));
  assert.deepEqual(profile.doctrines.map(d => d.principle.split(' · ')[0]), ['D01','D02','D03','D04','D05']);
  assert.ok(profile.approval.every(a => a.name === null && a.decision === null && a.date === null));
  assert.equal(profile.evidence, null);
  assert.equal(profile.evidenceContract.length, 13);
  assert.deepEqual(profile.evidenceContract.filter(e => e.function === null).map(e => e.field), ['Tipo','Productor','Validador','Fecha de validación']);
});

test('universal institutional view renders GPY sections and preserves the SDX view', () => {
  const require = createRequire(import.meta.url);
  const compileComponent = (path, dependencies) => {
    const output = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    const compiledModule = { exports: {} };
    const load = name => name in dependencies ? dependencies[name] : name.endsWith('.css') ? { default: {} } : require(name);
    new Function('require', 'module', 'exports', output)(load, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  };
  const functional = compileComponent('../src/components/FunctionalResponsibilities.tsx', {});
  const { InstitutionalRoleProfile } = compileComponent('../src/components/InstitutionalRoleProfile.tsx', {
    './FunctionalResponsibilities': functional,
    '@/lib/conecta/institutional-profile': { NORMATIVE_NOTE: 'Normative note' },
  });
  const profile = getInstitutionalProfile(org.nodes.find(n => n.id === 'gerencia-09'));
  const html = renderToStaticMarkup(createElement(InstitutionalRoleProfile, { profile }));
  for (const text of ['GPY-001','José Fernando Palacios','Identidad institucional','Propósito y resultado superior','GOVERN','MP06','R08','Autoridad y fronteras','Entregables / evidencia','Indicadores','Riesgos / controles','RACI','Competencias','Gobierno / evaluación / mejora','Estado documental','EXISTENTE','PROPUESTO','PENDIENTE','E01–E07']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('Documento Maestro SDX-001'), 'GPY does not render the SDX master identity');
  for (const section of gpySource.sections) {
    assert.ok(html.includes(`Fuente Word · ${section.title}`));
    for (const block of section.blocks) for (const text of block.text ? [block.text] : block.rows.flat().filter(Boolean)) {
      const escaped = renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);
      assert.ok(html.includes(escaped), `${section.title}: ${text}`);
    }
  }
  for (const title of ['Identidad del cargo', 'Arquitectura de gestión', 'Gobierno institucional']) {
    assert.ok(html.includes(`aria-label="${title}"`));
    assert.ok(html.includes(`Profundizar · ${title}`));
  }
  const pendingCount = profile.fieldMapping.filter(f => f.category === 'C').length;
  assert.ok(html.includes(`Definición institucional pendiente · ${pendingCount}`));
  assert.ok(html.includes('Pendientes documentales; no equivalen a una calificación'));
  const legacyHtml = renderToStaticMarkup(createElement(functional.FunctionalResponsibilities, { profile: legacy['gerente-pymes'] }));
  for (const responsibility of legacy['gerente-pymes'].modules[0].responsibilities) for (const sub of responsibility.subactivities) {
    assert.ok(legacyHtml.includes(sub.name));
    assert.ok(legacyHtml.includes(sub.control));
    assert.ok(legacyHtml.includes(sub.result));
  }
  const sdxHtml = renderToStaticMarkup(createElement(InstitutionalRoleProfile, { profile: cargoCero }));
  assert.ok(sdxHtml.includes('SDX-001'));
  assert.ok(!sdxHtml.includes('GPY-001'));
  const { ExecutiveRoleProfile } = compileComponent('../src/components/ExecutiveRoleProfile.tsx', {
    './FunctionalResponsibilities': functional,
    './InstitutionalRoleProfile': { InstitutionalRoleProfile },
    './AiAgentSpace': { AiAgentSpace: () => null },
    './AssignedCompanies': { AssignedCompanies: () => null },
    '@/lib/conecta/functional-profile': { getFunctionalProfile: key => legacy[key] ?? null },
    '@/lib/conecta/institutional-profile': { getInstitutionalProfile, NIVELAR_EVIDENCE_DOCTRINE },
  });
  const role = org.nodes.find(n => n.id === 'gerencia-09');
  const props = { role, parentTitle: 'Dirección', initials: 'JP', protectedDocument: '', protectedPhone: '', canViewSensitiveData: false, showSensitiveData: false, onToggleSensitiveData() {}, onOpenReports() {}, onSelectRole() {}, directReports: [], nivelar: { productive: '82%', connection: '7h 42m', unproductive: '6%', unclassified: '12%', workWindow: '08:00 a 17:30', statusLabel: 'Listo', interpretation: 'Legacy interpretation', conectaReading: 'Legacy evaluation', recommendedAction: 'Legacy recommendation' } };
  const executiveHtml = renderToStaticMarkup(createElement(ExecutiveRoleProfile, props));
  const secondary = executiveHtml.match(/<details\b[^>]*><summary[^>]*>Contexto digital · Nivelar[\s\S]*?<\/details>/)?.[0];
  assert.ok(secondary, 'digital context remains accessible through a disclosure');
  assert.ok(!/^<details[^>]*\bopen\b/.test(secondary), 'second layer starts closed');
  for (const value of ['82%', '7h 42m', '6%', '12%', '08:00 a 17:30']) assert.ok(secondary.includes(value));
  assert.ok(!executiveHtml.replace(secondary, '').includes('82%'), 'no percentage in the first layer');
  assert.ok(executiveHtml.replace(secondary, '').includes(NIVELAR_EVIDENCE_DOCTRINE), 'doctrine remains visible outside the disclosure');
  assert.ok(secondary.includes('Datos ilustrativos'));
  assert.ok(executiveHtml.replace(secondary, '').includes('Lectura contextual Nivelar'));
  assert.ok(executiveHtml.replace(secondary, '').includes('Señales digitales del período'));
  assert.ok(executiveHtml.replace(secondary, '').includes('Contexto digital. No constituye por sí solo una evaluación del desempeño.'));
  assert.ok(!executiveHtml.includes('Legacy evaluation'));
  assert.ok(!executiveHtml.includes('Legacy recommendation'));
  const emptyHtml = renderToStaticMarkup(createElement(ExecutiveRoleProfile, { ...props, nivelar: null }));
  assert.ok(emptyHtml.includes('Sin señales digitales disponibles'));
  assert.ok(!emptyHtml.includes('Sin evaluación conectada'));
});
test('unmapped roles do not acquire an institutional template', () => {
  assert.equal(getInstitutionalProfile(org.nodes[0]), null);
});
const enrichSource = read('../src/lib/conecta/agent/institutional-context.ts')
  .replace(/import orgData from [^;]+;/, `const orgData = ${JSON.stringify(org)};`)
  .replace(/import \{ getInstitutionalProfile \} from [^;]+;/, `const getInstitutionalProfile = globalThis.__institutionalTestAdapter;`);
globalThis.__institutionalTestAdapter = getInstitutionalProfile;
const enrichCode = ts.transpileModule(enrichSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { enrichInstitutionalContext } = await import(`data:text/javascript;base64,${Buffer.from(enrichCode).toString('base64')}`);
delete globalThis.__institutionalTestAdapter;
test('agent enrichment preserves permissions and requires an existing authorized position', () => {
  const context = { user: { full_name: 'Session user' }, role: null, permissions: [] };
  assert.equal(enrichInstitutionalContext(context).institutionalProfile, null);
  assert.equal(enrichInstitutionalContext({ ...context, role: { id: 'unknown' } }).institutionalProfile, null);
  const enriched = enrichInstitutionalContext({ ...context, user: { ...context.user, position_id: 'subdirector-desarrollo-expansion' }, role: { id: 'subdirector-desarrollo-expansion' } });
  assert.equal(enriched.institutionalProfile.code, 'SDX-001');
  assert.equal(enriched.institutionalProfile.person.name, 'Session user');
  assert.equal(enriched.permissions, context.permissions);
  assert.equal(context.role, null);
});

test('agent uses the assigned UUID and exact external key without extending permissions or name matching', () => {
  const permissions = [];
  const input = { user: { full_name: 'USER_A', position_id: 'position-uuid-a' }, role: { id: 'position-uuid-a', external_key: 'gerencia-09', title: 'Database position' }, permissions };
  const result = enrichInstitutionalContext(input);
  assert.equal(result.institutionalProfile.code, 'GPY-001');
  assert.equal(result.institutionalProfile.person.positionId, 'gerencia-09');
  assert.equal(result.institutionalProfile.person.name, 'USER_A');
  assert.equal(result.role, input.role);
  assert.equal(result.role.id, 'position-uuid-a');
  assert.equal(result.permissions, permissions);
  assert.equal(enrichInstitutionalContext({ ...input, user: { ...input.user, position_id: 'other-position' } }).institutionalProfile, null);
  assert.equal(enrichInstitutionalContext({ ...input, role: { ...input.role, external_key: 'unknown', title: 'Gerente PYMES' } }).institutionalProfile, null);
  assert.equal(enrichInstitutionalContext({ ...input, role: { ...input.role, external_key: '' } }).institutionalProfile, null);
  const sdx = enrichInstitutionalContext({ ...input, role: { ...input.role, external_key: 'subdirector-desarrollo-expansion' } });
  assert.equal(sdx.institutionalProfile.code, 'SDX-001');
});
