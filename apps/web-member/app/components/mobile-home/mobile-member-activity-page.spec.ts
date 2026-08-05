import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const activityPage = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const activityCss = readFileSync(new URL('./mobile-member-activity-page.module.css', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const mobileHomeRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('../member-navigation-auth-controller.tsx', import.meta.url), 'utf8');

test('guest drawer activity button keeps the public mobile activity route', () => {
  assert.match(mobileHomeRoot, /\['กิจกรรม', '\/mobile\/member\/activity', 'activity'\]/);
  assert.match(navigationController, /'\/mobile\/member\/activity': '\/mobile\/member\/activity'/);
  assert.match(navigationController, /'กิจกรรม': '\/mobile\/member\/activity'/);
  assert.match(navigationController, /guestPublicMobileTargetFor/);
});

test('existing mobile member route reuses the dedicated activity source layout', () => {
  assert.match(sectionPage, /section === 'activity'/);
  assert.match(sectionPage, /<MobileMemberActivityPage/);
  assert.match(sectionPage, /endpoint: '\/public\/site-settings', publicEndpoint: true/);
});

test('activity cards consume API items and keep a bounded image recovery chain', () => {
  assert.match(activityPage, /items\.map\(\(item\) => \(\{/);
  assert.match(activityPage, /resolveLocalAssetOrSource\(item\.image, 'mobile'\)/);
  assert.match(activityPage, /src=\{activity\.imageUrl \|\| FALLBACK_ACTIVITY_IMAGE\}/);
  assert.match(activityPage, /recoverActivityImage\(event\.currentTarget, activity\.image\)/);
  assert.match(activityPage, /image\.dataset\.activityImageFallback = 'source'/);
  assert.match(activityPage, /image\.dataset\.activityImageFallback = 'generic'/);
  assert.doesNotMatch(activityPage, /SOURCE_ACTIVITIES/);
});

test('activity page geometry follows the source screen', () => {
  assert.match(activityCss, /max-width:\s*428px/);
  assert.match(activityCss, /height:\s*50px/);
  assert.match(activityCss, /border-radius:\s*16px/);
  assert.match(activityCss, /grid-template-columns:\s*140px minmax\(0, 1fr\)/);
});

test('joining before login preserves the selected activity', () => {
  assert.match(activityPage, /MEMBER_AUTH_OPEN_EVENT = 'member:auth-open'/);
  assert.match(activityPage, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.match(activityPage, /router\.push\(activity\.href\)/);
});
