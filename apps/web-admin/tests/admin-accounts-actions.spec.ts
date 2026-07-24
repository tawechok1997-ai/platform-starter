import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-accounts/page.tsx'), 'utf8');

test('guards account and session mutations', () => {
  assert.equal(source.includes("if (!pendingAction) return"), true);
  assert.equal(source.includes('reason.length < 5'), true);
  assert.equal(source.includes("finally { setBusyId(''); setPendingAction(null); }"), true);
});

test('uses safe fixed errors instead of backend messages', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('errorMessage'), false);
  assert.equal(source.includes('เปลี่ยนสถานะบัญชีไม่สำเร็จ กรุณาลองใหม่'), true);
  assert.equal(source.includes('ยกเลิก session ไม่สำเร็จ กรุณาลองใหม่'), true);
});

test('requires confirmation for destructive actions', () => {
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes("type: 'session'"), true);
  assert.equal(source.includes("type: 'status'"), true);
});
