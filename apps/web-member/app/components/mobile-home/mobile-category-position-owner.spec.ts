import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const followCss = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');
const foundationCss = readFileSync(new URL('../../member-mobile-p1-p3-foundation.css', import.meta.url), 'utf8');

test('Mobile category rail begins below top content and sticks within its own section', () => {
  assert.doesNotMatch(home, /MobileCategoryRailPinRuntime/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(followCss, /@import '\.\/member-mobile-p1-p3-foundation\.css';/);
  assert.match(foundationCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(foundationCss, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(64px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(foundationCss, /data-mobile-section-owner='category-menu'[\s\S]*grid-column:\s*1\s*!important/);
  assert.match(followCss, /data-mobile-content-slot='after-highlight'[\s\S]*grid-column:\s*2 \/ -1\s*!important/);
  assert.match(followCss, /data-mobile-content-slot='after-highlight'[\s\S]*grid-row:\s*1\s*!important/);
  assert.doesNotMatch(foundationCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
});

test('narrow viewports keep the Mobile owner so category routes preserve top chrome', () => {
  assert.match(home, /const NARROW_HOME_QUERY = '\(max-width: 900px\)'/);
  assert.match(home, /setViewportMode\(narrow\.matches \? 'mobile' : 'desktop'\)/);
  assert.doesNotMatch(home, /MOBILE_INPUT_QUERY/);
  assert.doesNotMatch(home, /window\.screen\.width/);
});

test('Authenticated Mobile Home cannot show guest login and register actions', () => {
  assert.match(
    followCss,
    /data-mobile-home-root='true'\]\[data-mobile-authenticated='true'\][\s\S]*data-mobile-section-owner='auth-actions'/,
  );
  assert.match(
    followCss,
    /data-mobile-home-root='true'\]\[data-mobile-authenticated='true'\][\s\S]*data-mobile-auth-layout='drawer'/,
  );
  assert.match(followCss, /data-mobile-auth-layout='drawer'[\s\S]*display:\s*none\s*!important/);
});
