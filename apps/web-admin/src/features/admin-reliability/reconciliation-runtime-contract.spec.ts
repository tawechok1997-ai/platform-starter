import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(
  new URL('../../../app/(admin)/reconciliation-center/page.tsx', import.meta.url),
  'utf8',
);

test('reconciliation mutations force a fresh snapshot load while the action is busy', () => {
  assert.match(page, /async function load\(force = false\)/);
  assert.match(page, /if \(busy && !force\) return/);
  assert.equal((page.match(/await load\(true\)/g) ?? []).length, 2);
});

test('reconciliation blocks export until validated data is available', () => {
  assert.match(page, /loadState === 'error' \|\| loadState === 'loading'/);
  assert.match(page, /normalizeReconciliationPayload\(rawPayload\)/);
  assert.match(page, /safeMoneyValue\(item\.difference\)/);
});
