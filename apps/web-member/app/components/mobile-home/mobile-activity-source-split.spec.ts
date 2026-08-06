import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/activity/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-activity-standalone-navigation.tsx', import.meta.url), 'utf8');
const activityPage = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const activityCss = readFileSync(new URL('./mobile-member-activity-page.module.css', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('Home Activity summary and the full Activity route stay separate', () => {
  assert.match(highlight, /activeTab === 'activities'/);
  assert.match(route, /MobileMemberActivityPage/);
  assert.match(activityPage, /data-activity-owner="standalone"/);
});

test('the member Activity button opens the dedicated route', () => {
  assert.match(home, /import MobileActivityStandaloneNavigation/);
  assert.match(home, /<MobileActivityStandaloneNavigation \/>/);
  assert.match(navigation, /data-source-member-menu-item=\\"activity\\"/);
  assert.match(navigation, /window\.location\.assign\(ACTIVITY_ROUTE\)/);
  assert.match(navigation, /useLayoutEffect/);
});

test('the standalone Activity page keeps live API data and source unavailable states', () => {
  assert.match(route, /memberApiFetch\('\/public\/activities'/);
  assert.match(route, /credentials: 'omit'/);
  assert.match(route, /cache: 'no-store'/);
  assert.match(route, /isActivityDisabled/);
  assert.match(route, /formatActivityDate/);
  assert.match(activityPage, /unavailableOverlay/);
  assert.match(activityPage, /disabled=\{activity\.disabled \|\| !activity\.href\}/);
  assert.match(activityCss, /filter:\s*grayscale\(1\)/);
  assert.match(activityCss, /background:\s*rgb\(219 1 1 \/ 71%\)/);
  assert.match(activityCss, /border-radius:\s*16px/);
});
