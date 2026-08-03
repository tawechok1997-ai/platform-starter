import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const followCss = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');

test('Mobile category positioning is owned by the final CSS contract only', () => {
  assert.doesNotMatch(home, /MobileCategoryRailPinRuntime/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(64px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
});
