import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('growth center remains read only and uses shared controls', () => {
  assert.equal(source.includes('AdminButton'), true);
  assert.equal(source.includes('AdminLinkButton'), true);
  assert.equal(source.includes('read-only'), true);
  assert.equal(source.includes('adminApiFetch(path, { method:'), false);
});

test('growth center reports partial source failures', () => {
  assert.equal(source.includes('failedSources'), true);
  assert.equal(source.includes('โหลดข้อมูลบางส่วนไม่สำเร็จ'), true);
  assert.equal(source.includes('error={data.promotionClaims.error}'), true);
  assert.equal(source.includes('error={data.kyc.error}'), true);
});

test('growth center protects loading and status variants', () => {
  assert.equal(source.includes('disabled={loading}'), true);
  assert.equal(source.includes("'PENDING_REVIEW'"), true);
  assert.equal(source.includes("'TURNOVER_COMPLETED'"), true);
  assert.equal(source.includes('AdminSkeleton'), true);
});
