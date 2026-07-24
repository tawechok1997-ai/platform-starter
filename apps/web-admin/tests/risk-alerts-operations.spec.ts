import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/risk-alerts/page.tsx'), 'utf8');

test('sends provider context through the risk alert filter', () => {
  assert.equal(source.includes("query.set('provider', provider.trim())"), true);
  assert.equal(source.includes('value={provider}'), true);
  assert.equal(source.includes('รหัสค่าย'), true);
});

test('limits bulk dismissal selection to low and medium alerts', () => {
  assert.equal(source.includes("item.severity !== 'LOW' && item.severity !== 'MEDIUM'"), true);
  assert.equal(source.includes("/admin/risk-alerts/bulk-dismiss"), true);
  assert.equal(source.includes('dismissReason.trim().length < 5'), true);
  assert.equal(source.includes('AdminConfirmDialog'), true);
});

test('keeps auto-close suggestions review-only before dismissal', () => {
  assert.equal(source.includes('/admin/risk-alerts/auto-close-suggestions?limit=20'), true);
  assert.equal(source.includes('ปลายทางของรายการเหล่านี้สิ้นสุดแล้ว ควรเปิดตรวจรายละเอียดก่อนปิด'), true);
  assert.equal(source.includes('href={`/risk-alerts/${item.id}`}'), true);
  assert.equal(source.includes('autoCloseSuggestions.map'), true);
});

test('locks risk controls while a request is active', () => {
  assert.equal(source.includes('const pageBusy = loading || Boolean(busyKey)'), true);
  assert.equal(source.includes('disabled={pageBusy}'), true);
  assert.equal(source.includes("busy={busyKey === 'bulk-dismiss'}"), true);
});
