import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const desktop = readFileSync(
  new URL('./home-sidebar-scroll-controller.tsx', import.meta.url),
  'utf8',
);
const mobileCss = readFileSync(
  new URL('../../member-mobile-category-follow.css', import.meta.url),
  'utf8',
);
const home = readFileSync(
  new URL('../../member-home.tsx', import.meta.url),
  'utf8',
);

test('desktop jackpot remains in the reserved left rail and follows page scroll', () => {
  assert.match(desktop, /setProperty\('position', 'absolute'/);
  assert.match(desktop, /DEFAULT_PIN_TOP = 124/);
  assert.match(desktop, /setProperty\('right', 'auto'/);
  assert.match(desktop, /setProperty\('left', '0px'/);
  assert.match(desktop, /setProperty\('z-index', '20'/);
  assert.match(desktop, /addEventListener\('scroll', scheduleGeometry/);
  assert.match(desktop, /const followTop = Math\.max\(0, \(pinTop - bodyRect\.top\) \/ scale\)/);
  assert.match(desktop, /scrollState = 'following'/);
  assert.doesNotMatch(desktop, /desktopSidebarPlaceholder/);
  assert.doesNotMatch(desktop, /setProperty\('position', 'fixed'/);
});

test('mobile category rail starts below top content and sticks when its grid reaches the header', () => {
  assert.doesNotMatch(home, /MobileCategoryRailPinRuntime/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(mobileCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(mobileCss, /top:\s*calc\(64px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(mobileCss, /overflow-y:\s*auto\s*!important/);
  assert.doesNotMatch(mobileCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
});
