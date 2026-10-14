import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const load = path => {
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', code)(compiledModule, compiledModule.exports);
  return compiledModule.exports;
};

const orgData = JSON.parse(read('../src/data/grupo-ac-org.json'));
const { projectOrganizationalUnits } = load('../src/lib/conecta/organizational-catalog.ts');
const { demoDirectory } = load('../src/lib/conecta/memory-demo-data.ts');
const units = projectOrganizationalUnits(orgData.nodes);


test('projection includes classified institutional instances and organizational units with stable IDs and parents', () => {
  assert.equal(units.length, 44);

  assert.deepEqual(
    Object.fromEntries(
      [
        'Gobierno corporativo',
        'Dirección',
        'Subdirección',
        'Gerencia',
        'Área / gestión',
        'Unidad operativa',
      ].map(category => [
        category,
        units.filter(unit => unit.category === category).length,
      ]),
    ),
    {
      'Gobierno corporativo': 2,
      'Dirección': 1,
      'Subdirección': 2,
      'Gerencia': 10,
      'Área / gestión': 9,
      'Unidad operativa': 20,
    },
  );

  assert.equal(new Set(units.map(unit => unit.id)).size, units.length);

  for (const unit of units) {
    const source = orgData.nodes.find(node => node.id === unit.id);
    assert.ok(source, `source node exists for ${unit.id}`);
    assert.equal(unit.name, source.title);
    assert.equal(unit.parentId, source.reportsTo);
  }
});

test('governance and executive hierarchy are preserved without duplicating source nodes', () => {
  const byId = new Map(units.map(unit => [unit.id, unit]));

  const expected = [
    ['junta-socios', 'Gobierno corporativo', null],
    ['junta-directiva', 'Gobierno corporativo', 'junta-socios'],
    ['ceo', 'Dirección', 'junta-directiva'],
    ['subdirector-desarrollo-expansion', 'Subdirección', 'ceo'],
    ['subdirector-efectividad-operativa', 'Subdirección', 'ceo'],
  ];

  for (const [id, category, parentId] of expected) {
    const unit = byId.get(id);
    assert.ok(unit, `${id} is projected`);
    assert.equal(unit.category, category);
    assert.equal(unit.parentId, parentId);
  }
});

test('unapproved positions, external relationships and person-name labels remain excluded', () => {
  const ids = new Set(units.map(unit => unit.id));

  for (const id of [
    'coordinacion-gestion-comercial',
    'unidad-proyectos-kwel',
    'unidad-proyectos-lobos',
    'unidad-lobos-wolves-territory',
    'unidad-proyectos-aguacate',
    'unidad-proyectos-respirar-t-ips',
    'unidad-proyectos-madext',
    'unidad-pymes-01',
    'unidad-pymes-02',
    'unidad-pymes-04',
    'unidad-pymes-05',
    'unidad-pymes-06',
    'unidad-pymes-07',
  ]) {
    assert.equal(ids.has(id), false, `${id} is not projected`);
  }
});


test('all DEMO fixture unit IDs resolve to the shared catalog without copied unit labels', () => {
  const byId = new Map(units.map(unit => [unit.id, unit]));
  for (const person of demoDirectory) {
    assert.ok(byId.has(person.unitId), `DEMO unit ${person.unitId} resolves`);
    assert.equal(Object.hasOwn(person, 'unit'), false, 'unit label is not duplicated in the fixture');
  }
});
