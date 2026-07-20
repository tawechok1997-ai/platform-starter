import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function assertSharedSurface(pageSource: string, required: RegExp[]) {
  assert.match(pageSource, /AdminPage/);
  assert.match(pageSource, /AdminMetricGrid/);
  assert.match(pageSource, /AdminNotice|AdminCard/);
  for (const pattern of required) assert.match(pageSource, pattern);
  assert.doesNotMatch(pageSource, /window\.(?:alert|confirm|prompt)\s*\(/);
}

test('wallet operations use shared metrics, notice, empty, loading and confirmation surfaces', () => {
  const wallets = source('../../../app/(admin)/wallets/page.tsx');
  assertSharedSurface(wallets, [/AdminMetric/, /AdminEmpty/, /AdminSkeleton/, /AdminConfirmDialog/, /aria-busy/]);
});

test('promotion operations cover campaign, banner, bonus, coupon and reward workflows', () => {
  const promotion = source('../../cms/promotion-operations-page.tsx');
  assertSharedSurface(promotion, [/AdminEmpty/, /PromotionCategory/, /campaign/, /banner/, /bonus/, /coupon/, /reward/, /promotion-claims/]);
  assert.match(promotion, /<label>/);
  assert.match(promotion, /aria-busy/);
});

test('risk operations expose dashboard, AML, blacklist, alerts, timeline and investigation', () => {
  const risk = source('../../../app/(admin)/risk-operations/page.tsx');
  assertSharedSurface(risk, [/AdminStack/, /Risk Dashboard/, /AML/, /Blacklist/, /Alerts/, /Timeline/, /Investigation/]);
  assert.match(risk, /AREAS\.map/);
});

test('reports provide filters, export state, loading, empty states and accessible chart semantics', () => {
  const reports = source('../../../app/(admin)/reports/page.tsx');
  assertSharedSurface(reports, [/AdminFilterBar/, /AdminEmpty/, /downloadCsv/, /exporting/, /loading/, /role="img"/, /aria-label="กราฟเงินเข้าสุทธิรายวัน"/]);
  assert.match(reports, /type="date"/);
  assert.match(reports, /URL\.revokeObjectURL/);
});

test('critical admin UI pages declare mobile-safe layout hooks', () => {
  const pages = [
    source('../../../app/(admin)/wallets/page.tsx'),
    source('../../cms/promotion-operations-page.tsx'),
    source('../../../app/(admin)/risk-operations/page.tsx'),
    source('../../../app/(admin)/reports/page.tsx'),
  ];

  for (const page of pages) {
    assert.match(page, /className="admin-[^"]+"/);
    assert.match(page, /AdminPage/);
  }
});
