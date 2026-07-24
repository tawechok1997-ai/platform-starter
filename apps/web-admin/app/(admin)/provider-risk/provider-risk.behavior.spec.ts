import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/provider-risk/page.tsx'), 'utf8');

test('uses shared confirmation instead of browser confirm', () => {
  assert.equal(source.includes('AdminConfirmDialog'), true);
  assert.equal(source.includes('window.confirm'), false);
  assert.equal(source.includes('pendingGate'), true);
});

test('guards provider mutations with safe async cleanup', () => {
  assert.equal(source.includes('async function confirmGate'), true);
  assert.equal(source.includes('async function runPreflight'), true);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('disabled={loading}'), true);
});
