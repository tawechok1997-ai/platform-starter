import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = read('./mobile-p7-p9-closure-runtime.tsx');
const home = read('../../member-home.tsx');
const chrome = read('../../member-chrome.tsx');
const promotionsRoute = read('../../mobile/member/promotions/page.tsx');
const promotionsPage = read('./mobile-member-promotions-live-page.tsx');
const newsPage = read('./mobile-member-news-page.tsx');
const activityRoute = read('../../mobile/member/activity/page.tsx');
const activityPage = read('./mobile-member-activity-page.tsx');
const guidePage = read('./mobile-member-guide-page.tsx');

const p8Layouts = [
  read('../../mobile/member/promotions/layout.tsx'),
  read('../../mobile/member/news/layout.tsx'),
  read('../../mobile/member/activity/layout.tsx'),
  read('../../mobile/member/guide/layout.tsx'),
];

const p9Layouts = [
  read('../../deposit/layout.tsx'),
  read('../../withdraw/layout.tsx'),
  read('../../bank-accounts/layout.tsx'),
  read('../../transactions/layout.tsx'),
];

test('P7 mounts one Mobile popup and auth closure owner', () => {
  assert.match(home, /import MobileP7P9ClosureRuntime from '.\/components\/mobile-home\/mobile-p7-p9-closure-runtime'/);
  assert.equal((home.match(/<MobileP7P9ClosureRuntime phase="p7" route="\/"\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /AUTH_OVERLAY_SELECTOR = '\.member-auth-overlay\[data-state="open"\]'/);
  assert.match(runtime, /html\.dataset\.mobileP7P9Ready = 'true'/);
  assert.match(runtime, /body\.style\.overflow = 'hidden'/);
  assert.match(runtime, /body\.style\.overscrollBehavior = 'none'/);
});

test('P7 owns keyboard containment, focus return and auth query cleanup', () => {
  assert.match(runtime, /event\.key === 'Escape'/);
  assert.match(runtime, /event\.key !== 'Tab'/);
  assert.match(runtime, /last\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /first\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /focusTarget\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /url\.searchParams\.delete\('auth'\)/);
  assert.match(runtime, /url\.searchParams\.delete\('next'\)/);
  assert.match(chrome, /url\.searchParams\.delete\('auth'\)/);
  assert.match(chrome, /url\.searchParams\.delete\('next'\)/);
});

test('P8 mounts the closure owner on every content route', () => {
  for (const layout of p8Layouts) {
    assert.match(layout, /MobileP7P9ClosureRuntime/);
    assert.match(layout, /phase="p8"/);
  }
  assert.match(runtime, /P8_ROUTES = new Set/);
  assert.match(runtime, /'\/mobile\/member\/promotions'/);
  assert.match(runtime, /'\/mobile\/member\/news'/);
  assert.match(runtime, /'\/mobile\/member\/activity'/);
  assert.match(runtime, /'\/mobile\/member\/guide'/);
});

test('P8 promotions are API-owned with honest loading, error and empty states', () => {
  assert.match(promotionsRoute, /memberApiFetch\('\/public\/site-settings'/);
  assert.doesNotMatch(promotionsRoute, /SOURCE_PROMOTION_PAYLOAD/);
  assert.doesNotMatch(promotionsPage, /SOURCE_PROMOTIONS/);
  assert.match(promotionsPage, /data-content-source="api"/);
  assert.match(promotionsPage, /ยังไม่มีโปรโมชั่นที่เผยแพร่/);
  assert.match(promotionsPage, /aria-busy=\{loading\}/);
});

test('P8 news is CMS-owned and activity is API-owned without hardcoded rows', () => {
  assert.match(newsPage, /cmsContentSetting\(settings\)/);
  assert.match(newsPage, /item\.kind === 'news'/);
  assert.match(newsPage, /data-content-source="cms"/);
  assert.match(newsPage, /ไม่มีข้อความใหม่/);

  assert.match(activityRoute, /memberApiFetch\('\/public\/activities'/);
  assert.match(activityPage, /data-content-source="api"/);
  assert.match(activityPage, /ยังไม่มีกิจกรรม/);
  assert.doesNotMatch(activityPage, /SOURCE_ACTIVITIES/);
});

test('P8 guide remains client-owned and hydration-safe', () => {
  assert.match(guidePage, /^'use client';/);
  assert.match(guidePage, /data-mobile-member-page="guide"/);
  assert.match(guidePage, /useMemo/);
  assert.doesNotMatch(guidePage, /typeof window !== 'undefined'\s*\?/);
});

test('P9 mounts one read-only layout owner on finance routes', () => {
  for (const layout of p9Layouts) {
    assert.match(layout, /MobileP7P9ClosureRuntime/);
    assert.match(layout, /phase="p9"/);
    assert.doesNotMatch(layout, /method:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/);
  }
  assert.match(runtime, /P9_ROUTES = new Set/);
  assert.match(runtime, /'\/deposit'/);
  assert.match(runtime, /'\/withdraw'/);
  assert.match(runtime, /'\/bank-accounts'/);
  assert.match(runtime, /'\/transactions'/);
});

test('P9 closes Mobile finance overflow without changing transaction mutations', () => {
  assert.match(runtime, /max-width:\s*100vw\s*!important/);
  assert.match(runtime, /grid-template-columns:\s*minmax\(0, 1fr\)\s*!important/);
  assert.match(runtime, /\.member-finance-page input/);
  assert.match(runtime, /width:\s*100%\s*!important/);
  assert.match(runtime, /overflow-x:\s*clip\s*!important/);
  assert.doesNotMatch(runtime, /memberApiFetch/);
  assert.doesNotMatch(runtime, /fetch\(/);
});

function read(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}
