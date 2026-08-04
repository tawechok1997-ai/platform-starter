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

test('desktop jackpot sidebar stays in its original grid rail and sticks below the header', () => {
  assert.match(desktop, /setProperty\('position', 'sticky'/);
  assert.match(desktop, /DEFAULT_STICKY_TOP = 124/);
  assert.match(desktop, /setProperty\('left', 'auto'/);
  assert.match(desktop, /setProperty\('z-index', '20'/);
  assert.match(desktop, /scrollState = 'pinned'/);
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
