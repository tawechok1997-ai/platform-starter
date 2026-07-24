import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/game-transfers/page.tsx'), 'utf8');

test('uses safe async cleanup for transfer loading and mutations', () => {
  assert.equal(source.includes('async function loadTransfers'), true);
  assert.equal(source.includes('async function confirmAction'), true);
  assert.equal((source.match(/finally/g) ?? []).length >= 2, true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('data?.errorMessage'), false);
});

test('prevents duplicate transfer actions while busy', () => {
  assert.equal(source.includes('if (!pendingAction || working) return'), true);
  assert.equal(source.includes('disabled={busy}'), true);
  assert.equal(source.includes('disabled={Boolean(working)}'), true);
  assert.equal(source.includes('reason.length < 5'), true);
});
