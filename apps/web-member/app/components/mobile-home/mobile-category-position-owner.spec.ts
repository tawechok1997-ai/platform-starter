import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const followCss = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');

test('Mobile category positioning is owned by the final viewport-fixed CSS contract only', () => {
  assert.doesNotMatch(home, /MobileCategoryRailPinRuntime/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
  assert.match(followCss, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(60px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(followCss, /left:\s*max\(env\(safe-area-inset-left, 0px\), calc\(\(100vw - 640px\) \/ 2\)\)\s*!important/);
  assert.match(followCss, /max-height:\s*calc\(100dvh - 68px - env\(safe-area-inset-top, 0px\)\)\s*!important/);
});
