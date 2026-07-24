import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/games/page.tsx'), 'utf8');

test('supports provider status category and keyword filters', () => {
  assert.equal(source.includes("providerFilter === 'ALL'"), true);
  assert.equal(source.includes("statusFilter === 'ALL'"), true);
  assert.equal(source.includes("categoryFilter === 'ALL'"), true);
  assert.equal(source.includes('query.trim().toLowerCase()'), true);
});

test('uses confirmation for single and bulk status changes', () => {
  assert.equal(source.includes('PendingStatus'), true);
  assert.equal(source.includes('PendingBulkStatus'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('confirmBulkStatus'), true);
});

test('supports media overrides and multi-selection', () => {
  assert.equal(source.includes("isOverride: true"), true);
  assert.equal(source.includes('selectedIds'), true);
  assert.equal(source.includes('toggleAllVisible'), true);
});
