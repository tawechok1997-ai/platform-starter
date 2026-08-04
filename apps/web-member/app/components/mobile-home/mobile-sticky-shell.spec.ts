import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stickyCss = readFileSync(new URL('../../member-mobile-sticky-shell.css', import.meta.url), 'utf8');
const sourceFonts = readFileSync(new URL('../../member-source-fonts.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../layout.tsx', import.meta.url), 'utf8');

test('Mobile Home header remains visible with bounded sticky positioning', () => {
  assert.match(stickyCss, /data-mobile-section-owner='header'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'[\s\S]*top:\s*0\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'[\s\S]*z-index:\s*120\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'\] > :first-child[\s\S]*position:\s*relative\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'\] > :first-child[\s\S]*transform:\s*none\s*!important/);
  assert.doesNotMatch(stickyCss, /data-mobile-section-owner='header'[\s\S]*position:\s*fixed\s*!important/);
});

test('outer branded main cannot trap the sticky header in a non-scrolling overflow owner', () => {
  assert.match(stickyCss, /main\[data-animation-level\]:has\(\[data-mobile-home-root='true'\]\)/);
  assert.match(stickyCss, /main\[data-animation-level\]:has\([\s\S]*overflow-x:\s*clip\s*!important/);
  assert.match(stickyCss, /main\[data-animation-level\]:has\([\s\S]*overflow-y:\s*visible\s*!important/);
  assert.match(stickyCss, /main\[data-animation-level\]:has\([\s\S]*contain:\s*none\s*!important/);
  assert.doesNotMatch(stickyCss, /body:has\(\[data-mobile-home-root='true'\]\)\s*>\s*main\[data-animation-level\]/);
});

test('Mobile Home shell and padded full-width sections stay inside the viewport', () => {
  assert.match(stickyCss, /data-mobile-home-root='true'[\s\S]*box-sizing:\s*border-box\s*!important/);
  assert.match(stickyCss, /data-mobile-home-root='true'[\s\S]*width:\s*min\(100%, 640px\)\s*!important/);
  assert.match(stickyCss, /data-mobile-home-root='true'[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'\] > :first-child[\s\S]*box-sizing:\s*border-box\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='header'\] > :first-child[\s\S]*max-width:\s*100%\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='auth-actions'[\s\S]*box-sizing:\s*border-box\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='auth-actions'[\s\S]*max-width:\s*100%\s*!important/);
});

test('Mobile category rail follows below the header and stops at its grid owner', () => {
  assert.match(stickyCss, /\*:has\(> \[data-mobile-section-owner='category-menu'\]\)[\s\S]*position:\s*relative\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(64px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='category-menu'[\s\S]*height:\s*fit-content\s*!important/);
  assert.match(stickyCss, /data-mobile-section-owner='category-menu'[\s\S]*max-height:\s*calc\(100dvh - 72px - env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.doesNotMatch(stickyCss, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
});

test('sticky shell owner loads after the legacy category owner', () => {
  assert.match(sourceFonts, /@import '\.\/member-mobile-sticky-shell\.css';/);
  const legacyOwner = layout.indexOf("import './member-mobile-category-follow.css'");
  const finalOwner = layout.indexOf("import './member-source-fonts.css'");
  assert.ok(legacyOwner >= 0);
  assert.ok(finalOwner > legacyOwner);
});
