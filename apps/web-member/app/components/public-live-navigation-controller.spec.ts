import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controller = readFileSync(new URL('./public-live-navigation-controller.tsx', import.meta.url), 'utf8');
const desktopHome = readFileSync(new URL('./member-home/desktop-home-scaffold.tsx', import.meta.url), 'utf8');
const mobileLive = readFileSync(new URL('./mobile-home/mobile-live-schedule-page.tsx', import.meta.url), 'utf8');
const livePage = readFileSync(new URL('../live/page.tsx', import.meta.url), 'utf8');
const liveStatus = readFileSync(new URL('../lib/live-service-status.ts', import.meta.url), 'utf8');

test('desktop and mobile live surfaces share one maintenance status owner', () => {
  assert.equal(liveStatus.includes("export const LIVE_ROUTE = '/live'"), true);
  assert.equal(liveStatus.includes("mode: 'maintenance'"), true);
  assert.equal(liveStatus.includes("tableStatus: 'ปิดปรับปรุง'"), true);
  assert.equal(livePage.includes('LIVE_SERVICE_COPY'), true);
  assert.equal(mobileLive.includes('LIVE_SERVICE_COPY'), true);
  assert.equal(controller.includes('LIVE_SERVICE_COPY'), true);
});

test('all desktop and mobile live actions converge on the live page', () => {
  assert.equal(controller.includes('.source-live-card__watch'), true);
  assert.equal(controller.includes('.source-live-card__bet'), true);
  assert.equal(controller.includes('.member-desktop-nav a[href="/#live"]'), true);
  assert.equal(controller.includes('a[href="/mobile/member/live"]'), true);
  assert.equal(controller.includes('a[href="/mobile-menu/live"]'), true);
  assert.match(controller, /router\.push\(LIVE_ROUTE\)/);
  assert.match(controller, /normalizeLiveLinks\(\)/);
  assert.doesNotMatch(controller, /category=sport/);
  assert.doesNotMatch(controller, /SPORT_ROUTE/);
});

test('home football cards visibly expose the maintenance state', () => {
  assert.equal(controller.includes('.source-feed-host--live'), true);
  assert.equal(controller.includes('.source-live-card__status b'), true);
  assert.equal(controller.includes('.source-live-card__status time'), true);
  assert.equal(controller.includes('.source-live-card__watch span'), true);
  assert.equal(controller.includes("data-live-service-status"), true);
  assert.equal(controller.includes('copy.tableStatus'), true);
  assert.equal(controller.includes('copy.tableDescription'), true);
  assert.match(desktopHome, /<SourceLiveSection onAction=\{openLiveAction\} \/>/);
});

test('mobile schedule does not request provider data during maintenance', () => {
  assert.equal(mobileLive.includes("maintenance = LIVE_SERVICE_STATUS.mode === 'maintenance'"), true);
  assert.match(mobileLive, /if \(maintenance\) \{/);
  assert.equal(mobileLive.includes('setLoading(false)'), true);
  assert.equal(mobileLive.includes('data-live-service-status={LIVE_SERVICE_STATUS.mode}'), true);
  assert.equal(mobileLive.includes('window.location.assign(LIVE_ROUTE)'), true);
});
