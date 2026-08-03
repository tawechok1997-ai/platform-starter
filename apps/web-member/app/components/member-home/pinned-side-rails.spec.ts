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

test('desktop jackpot sidebar stays fixed and visible for the full page scroll', () => {
  assert.match(desktop, /setProperty\('position', 'fixed'/);
  assert.match(desktop, /DEFAULT_FIXED_TOP = 124/);
  assert.match(desktop, /desktopSidebarPlaceholder/);
  assert.match(desktop, /setProperty\('overflow-y', 'auto'/);
  assert.doesNotMatch(desktop, /addEventListener\('scroll'/);
});

test('mobile category rail stays fixed while only the content column scrolls', () => {
  assert.match(mobile, /RAIL_SELECTOR = '\[data-mobile-section-owner="category-menu"\]'/);
  assert.match(mobile, /setProperty\('position', 'fixed'/);
  assert.match(mobile, /setProperty\('top', `\$\{HEADER_HEIGHT\}px`/);
  assert.match(mobile, /setProperty\('overflow-y', 'auto'/);
  assert.match(mobile, /mobileCategoryFollow = 'fixed'/);
  assert.doesNotMatch(mobile, /addEventListener\('scroll'/);
  assert.match(home, /<MobileCategoryRailPinRuntime \/>/);
});
