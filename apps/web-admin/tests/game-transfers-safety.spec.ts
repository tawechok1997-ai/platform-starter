import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/game-transfers/page.tsx'), 'utf8');

test('guards transfer actions and requires a useful note', () => {
  assert.equal(source.includes('if (!pendingAction || working) return'), true);
  assert.equal(source.includes('reason.length < 5'), true);
  assert.equal(source.includes('disabled={Boolean(working)}'), true);
});

test('uses fixed safe errors with async cleanup', () => {
  assert.equal(source.includes('finally {'), true);
  assert.equal(source.includes("setWorking('')"), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('data?.errorMessage'), false);
});

test('redacts technical payloads and uses shared confirmation', () => {
  assert.equal(source.includes('stringifyAdminPayload'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
});
