import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const activityPage = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const activityCss = readFileSync(new URL('./mobile-member-activity-page.module.css', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const mobileHomeRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('../member-navigation-auth-controller.tsx', import.meta.url), 'utf8');

test('mobile drawer and navigation keep the dedicated activity route', () => {
  assert.match(mobileHomeRoot, /\['กิจกรรม', '\/mobile\/member\/activity', 'activity'\]/);
  assert.match(navigationController, /'\/mobile\/member\/activity': '\/mobile\/member\/activity'/);
});

test('existing mobile member route reuses the dedicated activity source layout', () => {
  assert.match(sectionPage, /section === 'activity'/);
  assert.match(sectionPage, /<MobileMemberActivityPage/);
  assert.match(sectionPage, /endpoint: '\/public\/site-settings', publicEndpoint: true/);
});

test('activity cards resolve source basenames against mobile then PC local assets', () => {
  for (const basename of [
    '1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d.jpeg',
    '1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
    '1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  ]) {
    assert.match(activityPage, new RegExp(basename.replaceAll('.', '\\.')));
  }

  assert.match(activityPage, /extractAssetBasename\(source\.sourceImageUrl\)/);
  assert.match(activityPage, /resolveLocalAssetByBasename\(sourceUrl, 'mobile'\)/);
  assert.match(activityPage, /resolveLocalAssetByBasename\(sourceUrl, 'pc'\)/);
  assert.match(activityPage, /imageUrl: localImage \|\| sourceUrl/);
  assert.match(activityPage, /title: 'ภารกิจ'/);
  assert.match(activityPage, /title: 'ทายผลหวย'/);
  assert.match(activityPage, /title: 'ทำยอด Turn รับรางวัลจุใจ'/);
});

test('activity page geometry follows the 428px source screen', () => {
  assert.match(activityCss, /max-width:\s*428px/);
  assert.match(activityCss, /height:\s*50px/);
  assert.match(activityCss, /border-radius:\s*16px/);
  assert.match(activityCss, /linear-gradient\(0deg, #1b1824 -5\.86%, #3f3b4b 104\.05%\)/);
  assert.match(activityCss, /grid-template-columns:\s*140px minmax\(0, 1fr\)/);
  assert.match(activityCss, /linear-gradient\(165deg, #944fe8 -17\.16%, #7600a8 91\.36%\)/);
});

test('joining before login opens the shared auth owner and preserves the selected activity destination', () => {
  assert.match(activityPage, /MEMBER_AUTH_OPEN_EVENT = 'member:auth-open'/);
  assert.match(activityPage, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.match(activityPage, /if \(!ready \|\| !isLoggedIn\)/);
  assert.match(activityPage, /router\.push\(activity\.href\)/);
});
