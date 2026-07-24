import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const reconciliationSource = readFileSync(path.join(process.cwd(), 'app/(admin)/reconciliation-center/page.tsx'), 'utf8');
const reportsSource = readFileSync(path.join(process.cwd(), 'app/(admin)/reports/page.tsx'), 'utf8');

test('exports only reconciliation exceptions as CSV', () => {
  assert.equal(reconciliationSource.includes("item.status !== 'MATCHED'"), true);
  assert.equal(reconciliationSource.includes('function exportExceptions()'), true);
  assert.equal(reconciliationSource.includes('reconciliation-exceptions-'), true);
  assert.equal(reconciliationSource.includes('ส่งออกข้อผิดปกติ CSV'), true);
});

test('keeps reconciliation controls protected while loading', () => {
  assert.equal(reconciliationSource.includes('if (loading) return'), true);
  assert.equal(reconciliationSource.includes('disabled={loading}'), true);
  assert.equal(reconciliationSource.includes('busy={loading}'), true);
});

test('provides a shared report date-range contract', () => {
  assert.equal(reportsSource.includes("const [range, setRange]"), true);
  assert.equal(reportsSource.includes('type="date"'), true);
  assert.equal(reportsSource.includes("dailyParams.set('from'"), true);
  assert.equal(reportsSource.includes("dailyParams.set('to'"), true);
  assert.equal(reportsSource.includes('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด'), true);
});
