import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('public blank template preserves the institutional source and documented SHA-256', () => {
  const source = readFileSync(new URL('../docs/templates/conecta-acta-v1-en-blanco.pdf', import.meta.url));
  const published = readFileSync(new URL('../public/templates/conecta-acta-v1-en-blanco.pdf', import.meta.url));
  const expected = '21f939af6ab8c7cb870b9afe4487389a55e425a1f9d9691180a9475bdeb2a5ed';
  assert.deepEqual(published, source);
  assert.equal(createHash('sha256').update(published).digest('hex'), expected);
  const provenance = readFileSync(new URL('../docs/rel-clean-01-provenance.md', import.meta.url), 'utf8');
  assert.ok(provenance.includes(expected));
});
