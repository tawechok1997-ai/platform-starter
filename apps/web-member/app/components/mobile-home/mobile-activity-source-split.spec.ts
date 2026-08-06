import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/activity/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-member-standalone-navigation.tsx', import.meta.url), 'utf8');
const activityPage = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const activityCss = readFileSync(new URL('./mobile-member-activity-page.module.css', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');

test('Home Activity summary and the full Activity route stay separate', () => {
  assert.match(highlight, /activeTab === 'activities'/);
  assert.match(route, /MobileMemberActivityPage/);
  assert.match(activityPage, /data-activity-owner="standalone"/);
});

test('Home and standalone Activity consume one cached source owner', () => {
  assert.match(highlight, /useMobileActivitiesSource\(\)/);
  assert.match(route, /useMobileActivitiesSource\(\)/);
  assert.equal((source.match(/export function useMobileActivitiesSource/g) ?? []).length, 1);
  assert.match(source, /let activityRequest:/);
  assert.match(source, /resolveActivitySnapshot/);
});

test('one member navigation owner opens the dedicated Activity route', () => {
  assert.match(home, /import MobileMemberStandaloneNavigation/);
  assert.match(home, /<MobileMemberStandaloneNavigation \/>/);
  assert.doesNotMatch(home, /MobileActivityStandaloneNavigation/);
  assert.match(navigation, /activity: '\/mobile\/member\/activity'/);
  assert.match(navigation, /router\.push\(route\)/);
});

test('the shared Activity source keeps live API data and unavailable states', () => {
  assert.match(source, /loadJson\('\/public\/activities'/);
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /cache: 'no-store'/);
  assert.match(source, /const disabled = item\.disabled === true/);
  assert.match(source, /formatActivityDate/);
  assert.match(activityPage, /unavailableOverlay/);
  assert.match(activityPage, /activity\.disabled === true \|\| !activity\.href/);
  assert.match(activityCss, /filter:\s*grayscale\(1\)/);
  assert.match(activityCss, /background:\s*rgb\(219 1 1 \/ 71%\)/);
  assert.match(activityCss, /border-radius:\s*16px/);
});

test('disabled activity cards avoid unsupported ARIA on the article role', () => {
  assert.match(activityPage, /data-activity-disabled=\{activity\.disabled \? 'true' : undefined\}/);
  assert.doesNotMatch(activityPage, /<article[\s\S]{0,220}aria-disabled=/);
  assert.match(activityPage, /<button[\s\S]{0,220}disabled=\{activity\.disabled === true \|\| !activity\.href\}/);
});

test('legacy activity items without disabled remain enabled by default', () => {
  assert.match(activityPage, /disabled\?: boolean/);
  assert.match(activityPage, /disabled: item\.disabled === true/);
  assert.match(activityPage, /activity\.disabled === true \|\| !activity\.href/);
});
