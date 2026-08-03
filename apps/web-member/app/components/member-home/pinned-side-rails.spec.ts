import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const desktop = readFileSync(
  new URL('./home-sidebar-scroll-controller.tsx', import.meta.url),
  'utf8',
);
const mobile = readFileSync(
  new URL('../mobile-home/mobile-category-rail-pin-runtime.tsx', import.meta.url),
  'utf8',
);
const home = readFileSync(
  new URL('../../member-home.tsx', import.meta.url),
  'utf8',
);

test('desktop jackpot sidebar stays natively sticky beneath the header', () => {
  assert.match(desktop, /setProperty\('position', 'sticky'/);
  assert.match(desktop, /DEFAULT_STICKY_TOP = 124/);
  assert.match(desktop, /100dvh/);
  assert.match(desktop, /setProperty\('overflow-y', 'auto'/);
  assert.doesNotMatch(desktop, /requestAnimationFrame|addEventListener\('scroll'/);
});

test('mobile category rail stays pinned while the content column scrolls', () => {
  assert.match(mobile, /RAIL_SELECTOR = '\[data-mobile-section-owner="category-menu"\]'/);
  assert.match(mobile, /setProperty\('position', 'sticky'/);
  assert.match(mobile, /setProperty\('top', `\$\{HEADER_HEIGHT\}px`/);
  assert.match(mobile, /setProperty\('overflow-y', 'auto'/);
  assert.match(mobile, /mobileCategoryFollow = 'pinned'/);
  assert.match(home, /<MobileCategoryRailPinRuntime \/>/);
});
