import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/risk-alerts/page.tsx'), 'utf8');

test('sends provider context through applied risk filters', () => {
  assert.equal(source.includes("query.set('provider', filters.provider.trim())"), true);
  assert.equal(source.includes('value={draftFilters.provider}'), true);
  assert.equal(source.includes('รหัสค่าย'), true);
});

test('limits bulk dismissal to active low and medium alerts', () => {
  assert.equal(source.includes("['LOW', 'MEDIUM'].includes(item.severity)"), true);
  assert.equal(source.includes("['OPEN', 'REVIEWING'].includes(item.status)"), true);
  assert.equal(source.includes('/admin/risk-alerts/bulk-dismiss'), true);
  assert.equal(source.includes('dismissReason.trim().length < 5'), true);
  assert.equal(source.includes('AdminConfirmDialog'), true);
});

test('keeps auto-close suggestions review-only before dismissal', () => {
  assert.equal(source.includes('/admin/risk-alerts/auto-close-suggestions?limit=20'), true);
  assert.equal(source.includes('ปลายทางของรายการเหล่านี้สิ้นสุดแล้ว ควรเปิดตรวจรายละเอียดก่อนปิด'), true);
  assert.equal(source.includes('href={`/risk-alerts/${item.id}`}'), true);
  assert.equal(source.includes('autoCloseSuggestions.map'), true);
});

test('matches the backend risk status transition contract', () => {
  assert.equal(source.includes("OPEN: ['REVIEWING', 'DISMISSED']"), true);
  assert.equal(source.includes("REVIEWING: ['OPEN', 'RESOLVED', 'DISMISSED']"), true);
  assert.equal(source.includes("RESOLVED: ['REVIEWING']"), true);
  assert.equal(source.includes("DISMISSED: ['OPEN', 'REVIEWING']"), true);
  assert.equal(source.includes("!canTransition(item.status, 'RESOLVED')"), true);
});

test('uses latest-request-wins and locks active controls', () => {
  assert.equal(source.includes('const latestRequestRef = useRef(0)'), true);
  assert.equal(source.includes('latestRequestRef.current !== requestId'), true);
  assert.equal(source.includes('const pageBusy = loading || Boolean(busyKey)'), true);
  assert.equal(source.includes("busy={busyKey === 'bulk-dismiss'}"), true);
});
