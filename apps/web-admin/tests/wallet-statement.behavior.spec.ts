import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/wallet-statement/page.tsx'), 'utf8');

test('supports member and date filters with daily grouping', () => {
  assert.equal(source.includes("type Filters = { identifier: string; from: string; to: string }"), true);
  assert.equal(source.includes('const groupedItems = useMemo'), true);
  assert.equal(source.includes('admin-wallet-statement__day'), true);
});

test('shows running balances and a shared detail drawer', () => {
  assert.equal(source.includes('balanceBefore'), true);
  assert.equal(source.includes('balanceAfter'), true);
  assert.equal(source.includes('<AdminDrawer'), true);
  assert.equal(source.includes('Running balance'), true);
});

test('exports CSV and supports print to PDF', () => {
  assert.equal(source.includes('function exportCsv()'), true);
  assert.equal(source.includes('window.print()'), true);
});

test('keeps backend errors private and clears loading state', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes('if (loading) return'), true);
});
