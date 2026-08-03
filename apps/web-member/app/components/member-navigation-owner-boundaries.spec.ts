import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const clientNavigation = readFileSync(new URL('./member-client-navigation-controller.tsx', import.meta.url), 'utf8');
const authNavigation = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const liveNavigation = readFileSync(new URL('./public-live-navigation-controller.tsx', import.meta.url), 'utf8');
const guideNavigation = readFileSync(new URL('./member-home/usage-guide-controller.tsx', import.meta.url), 'utf8');

test('/guide remains an in-place modal action', () => {
  assert.match(clientNavigation, /pathname\.replace\(\/\\\/\+\$\/, ''\) === '\/guide'/);
  assert.match(clientNavigation, /if \(url\.pathname\.replace[\s\S]*=== '\/guide'\) return null/);
  assert.match(authNavigation, /if \(authAction && isUsageGuidePopupTarget\(authAction\)\) return/);
  assert.match(guideNavigation, /pathname\.replace\(\/\\\/\+\$\/, ''\) === '\/guide'/);
  assert.match(guideNavigation, /setOpen\(true\)/);
});

test('all legacy Live entries remain owned by the central live controller', () => {
  assert.match(authNavigation, /if \(authAction && isLiveNavigationTarget\(authAction\)\) return/);
  for (const target of ['/live', '/mobile/member/live', '/mobile-menu/live']) {
    assert.ok(authNavigation.includes(`path === '${target}'`));
  }
  assert.match(liveNavigation, /router\.push\(LIVE_ROUTE\)/);
  assert.match(liveNavigation, /event\.stopImmediatePropagation\(\)/);
});
