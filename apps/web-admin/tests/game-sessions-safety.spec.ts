import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/game-sessions/page.tsx'), 'utf8');

test('guards reconciliation and cleans async state', () => {
  assert.equal(source.includes('if (!pendingReconcile || reconciling) return'), true);
  assert.equal(source.includes('finally {'), true);
  assert.equal(source.includes("setReconciling('')"), true);
});

test('uses fixed errors instead of backend messages', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('โหลดเซสชันเกมไม่สำเร็จ กรุณาลองใหม่'), true);
  assert.equal(source.includes('ตรวจยอดเซสชันไม่สำเร็จ กรุณาลองใหม่'), true);
});

test('locks shared drawer and confirmation while reconciling', () => {
  assert.equal(source.includes('busy={Boolean(reconciling)}'), true);
  assert.equal(source.includes('if (!reconciling) setSelectedSession(null)'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
});
