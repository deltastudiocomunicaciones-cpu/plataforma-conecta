import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const load = path => {
  const mod = { exports: {} };
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', code)(mod, mod.exports);
  return mod.exports;
};
const { initialMinuteDraft } = load('../src/lib/conecta/memory-demo-data.ts');
const { decodeMemoryBackup, isMemoryMinuteDocument, serializeMemoryBackup, upsertMemoryDocument } = load('../src/lib/conecta/memory-local-store.ts');
const create = (draft = initialMinuteDraft, id = 'ACT-DEMO-test-0001') => ({ id, code: 'ACT-DEMO-0001', draft: structuredClone(draft), createdAt: '2026-10-14T10:00:00.000Z', updatedAt: '2026-10-14T10:00:00.000Z', demoVersion: 1, provenance: 'DEMO_LOCAL' });

test('1. la plantilla de creación propone Comité de Dirección sin prellenar resultados', () => {
  assert.equal(initialMinuteDraft.kind, 'Comité'); assert.equal(initialMinuteDraft.date, '2026-10-15');
  assert.equal(initialMinuteDraft.participants.length, 0); assert.equal(initialMinuteDraft.decisions.length, 0);
  assert.equal(initialMinuteDraft.commitments.length, 0); assert.equal(initialMinuteDraft.risks.length, 0);
  assert.equal(initialMinuteDraft.agenda.length, 10);
});
test('2. guardado local se serializa como documento tipado DEMO', () => {
  const doc = create(); assert.ok(isMemoryMinuteDocument(doc));
  assert.deepEqual(decodeMemoryBackup(serializeMemoryBackup([doc])), [doc]);
});
test('3. recuperar el respaldo tras recarga conserva la misma identidad y contenido', () => {
  const doc = create(); const restored = decodeMemoryBackup(serializeMemoryBackup([doc]));
  assert.equal(restored[0].id, doc.id); assert.equal(restored[0].draft.subject, doc.draft.subject);
});
test('4. editar reemplaza por ID estable sin duplicar el acta', () => {
  const original = create(); const edited = create({ ...initialMinuteDraft, subject: 'Actualizada' }, original.id);
  const docs = upsertMemoryDocument([original], edited);
  assert.equal(docs.length, 1); assert.equal(docs[0].draft.subject, 'Actualizada');
});
test('5. Archivo incluye código, asunto, fecha y unidad de cada documento local', () => {
  const source = read('../src/components/memory/MemoryArchive.tsx');
  assert.match(source, /documents\.map/); assert.match(source, /doc\.code/); assert.match(source, /doc\.draft\.date/); assert.match(source, /doc\.draft\.unitId/);
  assert.match(source, /Buscar por código, título o asunto/); assert.match(source, /Unidad productora/); assert.match(source, /Tipo/);
});
test('6. Inteligencia presenta decisiones, compromisos, funciones, fechas y riesgos guardados', () => {
  const source = read('../src/components/memory/MemoryDemoExperience.tsx');
  for (const phrase of ['draft.decisions', 'draft.commitments', 'draft.risks', 'item.responsibleFunction', 'item.due']) assert.ok(source.includes(phrase), phrase);
});
test('7. las vistas guardadas abren el acta de origen para edición', () => {
  const source = read('../src/components/memory/MemoryDemoExperience.tsx');
  assert.match(source, /function openDocument/); assert.match(source, /setDraft\(structuredClone\(document\.draft\)\)/);
  assert.match(source, /Abrir acta de origen para edición/);
});
test('8. identidad de participante es única y sus cargos o funciones pueden coexistir', () => {
  const types = read('../src/lib/conecta/memory-demo-types.ts'); const editor = read('../src/components/memory/MemoryMinutes.tsx');
  assert.match(types, /interface DemoParticipant[\s\S]*?id: string/); assert.match(editor, /Cargos \/ funciones \(puede agregar varios\)/);
  assert.match(editor, /no se crean identidades por cada cargo/);
});
test('9. respaldo JSON valida tamaño, estructura e IDs duplicados', () => {
  const doc = create(); assert.equal(decodeMemoryBackup(serializeMemoryBackup([doc])).length, 1);
  assert.throws(() => decodeMemoryBackup('{malformed'), SyntaxError);
  assert.throws(() => decodeMemoryBackup(serializeMemoryBackup([doc, doc])), /duplicados/);
  assert.throws(() => decodeMemoryBackup(' '.repeat(2_000_001)), /2 MB/);
});
test('10. PDF representa los campos actuales y listas repetibles', () => {
  const source = read('../src/lib/conecta/memory-minute-pdf.ts');
  for (const phrase of ['draft.convener', 'draft.institutionalResponsible', 'draft.decisions', 'draft.commitments', 'draft.risks', 'draft.development']) assert.ok(source.includes(phrase), phrase);
});
test('11. recuperación no sobrescribe datos corruptos y los errores de cuota son visibles', () => {
  assert.throws(() => decodeMemoryBackup('{bad json'), SyntaxError);
  const parent = read('../src/components/memory/MemoryDemoExperience.tsx');
  assert.match(parent, /No se pudo leer el almacenamiento local/); assert.match(parent, /No se pudo guardar \(permiso o cuota/);
});
test('12. los documentos locales están separados inequívocamente del archivo institucional', () => {
  const types = read('../src/lib/conecta/memory-demo-types.ts'); const parent = read('../src/components/memory/MemoryDemoExperience.tsx');
  assert.match(types, /provenance: "DEMO_LOCAL"/); assert.match(parent, /No constituye archivo institucional ni sincronización en Supabase/);
  assert.match(parent, /MEMORY_STORE_KEY/); assert.doesNotMatch(parent, /supabase\.from\(/);
});
