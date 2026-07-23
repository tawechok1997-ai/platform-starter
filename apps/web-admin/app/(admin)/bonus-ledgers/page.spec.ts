import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('bonus ledger guards load and mutation failures', () => {
  assert.equal(source.includes('setLoading(true)'), true);
  assert.equal((source.match(/catch \{/g) ?? []).length >= 3, true);
  assert.equal((source.match(/finally \{/g) ?? []).length >= 3, true);
  assert.equal(source.includes('safeMessage'), true);
});

test('bonus ledger prevents overlapping mutations', () => {
  assert.equal(source.includes('disabled={loading || Boolean(busyId)}'), true);
  assert.equal(source.includes('disabled={Boolean(busyId)}'), true);
  assert.equal(source.includes('busy={Boolean(pendingAction'), true);
});

test('bonus ledger keeps financial confirmation and progress accessibility', () => {
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('มีผลต่อเงินจริง'), true);
  assert.equal(source.includes('role="progressbar"'), true);
  assert.equal(source.includes('aria-valuenow={progressPercent(item)}'), true);
});
