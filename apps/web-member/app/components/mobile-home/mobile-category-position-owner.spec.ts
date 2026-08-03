import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const followCss = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');

test('Mobile category positioning stays sticky and preserves both grid columns', () => {
  assert.doesNotMatch(home, /MobileCategoryRailPinRuntime/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(60px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*grid-column:\s*1\s*!important/);
  assert.match(followCss, /data-mobile-content-slot='after-highlight'[\s\S]*grid-column:\s*2 \/ -1\s*!important/);
  assert.doesNotMatch(followCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
});
