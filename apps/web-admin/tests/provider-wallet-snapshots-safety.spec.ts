import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.join(process.cwd(), 'app/(admin)/provider-wallet-snapshots/page.tsx'), 'utf8');

test('uses shared confirmation instead of native prompts', () => {
  assert.equal(source.includes('AdminConfirmDialog'), true);
  assert.equal(source.includes('window.prompt'), false);
  assert.equal(source.includes('window.confirm'), false);
});

test('guards async work and cleans busy state', () => {
  assert.equal(source.includes('try {'), true);
  assert.equal(source.includes('catch {'), true);
  assert.equal(source.includes('finally {'), true);
  assert.equal(source.includes('if (!pendingReview || loading || reviewing) return'), true);
  assert.equal(source.includes("setReviewing('')"), true);
});

test('requires a meaningful review note', () => {
  assert.equal(source.includes('note.length < 5'), true);
  assert.equal(source.includes('อย่างน้อย 5 ตัวอักษร'), true);
});

test('redacts payloads and avoids backend messages', () => {
  assert.equal(source.includes('stringifyAdminPayload'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('JSON.stringify({ rawPayload'), false);
});

test('locks controls while requests are active', () => {
  assert.equal(source.includes('const busy = loading || Boolean(reviewing)'), true);
  assert.equal(source.includes('disabled={busy}'), true);
  assert.equal(source.includes('busy={Boolean(reviewing)}'), true);
});
