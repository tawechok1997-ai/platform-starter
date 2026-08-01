import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routePolicy = readFileSync(new URL('./member-routes.ts', import.meta.url), 'utf8');
const memberChrome = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('./components/mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');

const publicGuestRoutes = [
  '/mobile/member/vip',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
] as const;

const protectedGuestRoutes = [
  '/mobile/member/commission',
  '/mobile/member/affiliate',
  '/mobile/member/bonus',
  '/mobile/member/history',
  '/mobile/member/notifications',
] as const;

test('mobile guest pages that already exist are public at the route policy owner', () => {
  for (const route of publicGuestRoutes) {
    assert.match(routePolicy, new RegExp(`'${route.replaceAll('/', '\\/')}'`));
    assert.match(mobileHome, new RegExp(`'${route.replaceAll('/', '\\/')}'`));
  }

  assert.match(routePolicy, /PUBLIC_MOBILE_MEMBER_ROUTES\.has\(safePathname\)/);
  assert.match(memberChrome, /if \(!isPublicRoute && !isLoggedIn\)/);
});

test('member-only mobile pages are not accidentally made public', () => {
  const publicSetMatch = routePolicy.match(/const PUBLIC_MOBILE_MEMBER_ROUTES = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(publicSetMatch, 'public mobile route set must exist');
  const publicSetSource = publicSetMatch[1] ?? '';

  for (const route of protectedGuestRoutes) {
    assert.doesNotMatch(publicSetSource, new RegExp(route.replaceAll('/', '\\/')));
  }
});

test('mobile public route matching is exact instead of exposing every member child route', () => {
  assert.match(routePolicy, /PUBLIC_MOBILE_MEMBER_ROUTES\.has\(safePathname\)/);
  assert.doesNotMatch(routePolicy, /prefix:\s*'\/mobile\/member'[^\n]*public:\s*true/);
  assert.match(routePolicy, /value\.replace\(\/\\\/+\$\/, ''\)/);
});
