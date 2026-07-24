import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/game-transfers/[id]/page.tsx'), 'utf8');

test('guards transfer detail mutations', () => {
  assert.equal(source.includes('if (!pendingAction || loading) return'), true);
  assert.equal(source.includes('reason.length < 5'), true);
  assert.equal(source.includes('finally {\n      setLoading(false);'), true);
  assert.equal(source.includes('if (!loading) { setPendingAction(null);'), true);
});

test('uses safe fixed errors and redacted payloads', () => {
  assert.equal(source.includes('transferErrorLabel(item.errorCode)'), true);
  assert.equal(source.includes('stringifyAdminPayload(payload)'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('item.errorMessage ??'), false);
});

test('removes untyped response payloads', () => {
  assert.equal(source.includes('type TransferResponse ='), true);
  assert.equal(source.includes('responsePayload?: any'), false);
});