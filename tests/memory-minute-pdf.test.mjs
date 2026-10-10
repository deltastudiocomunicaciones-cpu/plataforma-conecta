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
const { renderMinutePages, encodeMinutePdf, minutePdfFilename, downloadMinutePdf } = load('../src/lib/conecta/memory-minute-pdf.ts');
const { initialMinuteDraft, demoParticipants } = load('../src/lib/conecta/memory-demo-data.ts');
function canvasFactory(records) {
  return () => ({ width: 0, height: 0, toDataURL: () => 'data:image/jpeg;base64,/9j/2Q==', getContext: () => ({ font: '', fillStyle: '', strokeStyle: '', scale() {}, fillRect() {}, strokeRect() {}, measureText: text => ({ width: Array.from(text).length * 5 }), fillText(text, x, y) { records.push({ text, x, y }); assert.ok(y >= 0 && y < 842); assert.ok(x >= 0 && x < 596); } }) });
}
test('current draft, blanks and documentary status remain faithful and unmodified', () => {
  const draft = structuredClone(initialMinuteDraft);
  draft.subject = 'INSTANCIA ACTUAL'; draft.decision = 'DECISIÓN ESCRITA';
  const before = JSON.stringify(draft);
  const records = [];
  const pages = renderMinutePages(draft, demoParticipants, true, canvasFactory(records));
  const text = records.map(r => r.text).join(' ');
  for (const expected of ['Documento de demostración', 'Estado: Borrador', 'Vista: Revisión', 'INSTANCIA ACTUAL', 'DECISIÓN ESCRITA', 'No diligenciado', 'Sin validación real acreditada', 'Página 1 de']) assert.ok(text.toLowerCase().includes(expected.toLowerCase()), expected);
  assert.equal(JSON.stringify(draft), before);
  assert.ok(pages.length > 1);
  assert.equal(minutePdfFilename(draft), 'conecta-acta-demo-002-2026-10-04.pdf');
  assert.ok(!minutePdfFilename(draft).includes(demoParticipants[0].name));
});
test('long text and table rows paginate without losing their final content', () => {
  const draft = { ...initialMinuteDraft, narrative: 'Párrafo largo '.repeat(3000) + 'FINAL-NARRATIVA', participants: [{ ...demoParticipants[0], role: 'ROL '.repeat(1500) + 'FINAL-ROL' }] };
  const records = [];
  const pages = renderMinutePages(draft, demoParticipants, false, canvasFactory(records));
  assert.ok(pages.length > 8);
  const text = records.map(r => r.text).join(' ');
  assert.ok(text.includes('FINAL-NARRATIVA')); assert.ok(text.includes('FINAL-ROL'));
  assert.ok(records.filter(r => r.text === 'Participante').length > 1);
  const bytes = encodeMinutePdf(pages);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 8)), '%PDF-1.4');
  assert.ok(new TextDecoder().decode(bytes).includes(` /Count ${pages.length} `));
});
test('download uses only the given instance and local Blob; no resource endpoint', async () => {
  const records = []; let clicked = false; let download = ''; let blob;
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL, originalTimeout = globalThis.setTimeout;
  globalThis.document = { fonts: { ready: Promise.resolve() }, body: { appendChild() {} }, createElement: tag => tag === 'canvas' ? canvasFactory(records)() : { href: '', set download(value) { download = value; }, click() { clicked = true; }, remove() {} } };
  URL.createObjectURL = value => { blob = value; return 'blob:local-test'; };
  URL.revokeObjectURL = () => {};
  globalThis.setTimeout = callback => { callback(); return 0; };
  try {
    await downloadMinutePdf(initialMinuteDraft, demoParticipants, false);
    assert.ok(clicked); assert.equal(blob.type, 'application/pdf'); assert.equal(download, minutePdfFilename(initialMinuteDraft));
    assert.ok(!/fetch\(|supabase|localStorage|window\.print/.test(read('../src/lib/conecta/memory-minute-pdf.ts')));
  } finally { globalThis.document = originalDocument; URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; globalThis.setTimeout = originalTimeout; }
});
