import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-chrome-guard.tsx', import.meta.url), 'utf8');
const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('game categories keep the shared Home chrome visible even after later runtime mutations', () => {
  assert.match(runtime, /data-mobile-section-owner="header"/);
  assert.match(runtime, /data-mobile-section-owner="hero"/);
  assert.match(runtime, /data-mobile-section-owner="auth-actions"/);
  assert.match(runtime, /data-mobile-section-owner="announcement"/);
  assert.match(runtime, /data-mobile-section-owner="highlight-tabs"/);
  assert.match(runtime, /new MutationObserver/);
  assert.match(runtime, /attributeFilter:\s*\['hidden', 'aria-hidden', 'style', 'class'\]/);
  assert.match(runtime, /member:mobile-category-select/);
  assert.match(memberHome, /<MobileAuthenticatedHomeRuntime \/>\s*<MobileCategoryChromeGuard \/>/);
});

test('the final Mobile Home chrome owner caps the source viewport at 428px', () => {
  assert.match(runtime, /max-width:\s*428px\s*!important/);
  assert.match(runtime, /width:\s*min\(100%, 428px\)\s*!important/);
  assert.match(runtime, /grid-template-columns:\s*40px minmax\(0, 1fr\) 20px\s*!important/);
});

test('the source header language control stays at 20px', () => {
  assert.match(runtime, /> div > button:last-child[\s\S]*width:\s*20px\s*!important/);
  assert.match(runtime, /> button:last-child > img[\s\S]*width:\s*20px\s*!important/);
  assert.match(runtime, /height:\s*20px\s*!important/);
});

test('the source Hero keeps 428-slide geometry with px-3 and 41.6 percent media ratio', () => {
  assert.match(runtime, /data-mobile-section-owner='hero'[\s\S]*padding:\s*0 12px\s*!important/);
  assert.match(runtime, /padding-bottom:\s*41\.6%\s*!important/);
  assert.match(runtime, /border-radius:\s*10px\s*!important/);
});

test('page auth actions match the compact source row', () => {
  assert.match(runtime, /data-mobile-section-owner='auth-actions'[\s\S]*padding:\s*8px 16px 0\s*!important/);
  assert.match(runtime, /data-mobile-auth-layout='page'[\s\S]*gap:\s*12px\s*!important/);
  assert.match(runtime, /height:\s*38px\s*!important/);
});

test('narrow viewports always render the Mobile owner so direct category redirects keep top chrome', () => {
  assert.match(memberHome, /const NARROW_HOME_QUERY = '\(max-width: 900px\)'/);
  assert.match(memberHome, /setViewportMode\(narrow\.matches \? 'mobile' : 'desktop'\)/);
  assert.doesNotMatch(memberHome, /MOBILE_INPUT_QUERY/);
  assert.doesNotMatch(memberHome, /window\.screen\.width/);
});

test('the final runtime overrides the old 640px and 428px drawer owners', () => {
  assert.match(runtime, /#mobile-home-drawer\[data-mobile-drawer-owner='p6'\][\s\S]*width:\s*min\(340px, 100vw\)\s*!important/);
  assert.match(runtime, /max-width:\s*340px\s*!important/);
  assert.match(runtime, /padding:\s*20px 23px\s*!important/);
});
