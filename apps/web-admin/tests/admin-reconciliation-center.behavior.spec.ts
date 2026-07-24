import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/reconciliation-center/page.tsx'), 'utf8');

test('exports only reconciliation exceptions', () => {
  assert.equal(source.includes("item.status !== 'MATCHED'"), true);
  assert.equal(source.includes('reconciliation-exceptions-'), true);
  assert.equal(source.includes('ส่งออกรายการผิดปกติ'), true);
});

test('requires review confirmation and a note', () => {
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('reviewNote.trim()'), true);
  assert.equal(source.includes('กรุณาระบุหมายเหตุการตรวจสอบก่อน'), true);
});

test('uses fixed safe errors and async cleanup', () => {
  assert.equal(source.includes('finally { setLoading(false); }'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('disabled={loading}'), true);
});
