import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const bulkAction = fs.readFileSync(new URL('../_components/admin-bulk-action.tsx', import.meta.url), 'utf8');

test('keeps raw backend messages out of the bulk queue UI', () => {
  assert.equal(source.includes('data?.message ??'), false);
  assert.equal(source.includes('safeQueueMessage'), true);
  assert.equal(source.includes("throw new Error('ทำรายการไม่สำเร็จ')"), true);
});

test('keeps queue loading state guarded', () => {
  assert.equal(source.includes('finally {\n      setLoading(false);'), true);
  assert.equal(source.includes('disabled={!ready || loading}'), true);
});

test('keeps the dedicated preview confirmation dialog', () => {
  assert.equal(bulkAction.includes('<AdminConfirmDialog'), true);
  assert.equal(bulkAction.includes('<strong>จำนวน:</strong>'), true);
  assert.equal(bulkAction.includes('<strong>เหตุผล:</strong>'), true);
  assert.equal(bulkAction.includes('<strong>2FA:</strong> ระบุแล้ว'), true);
});
