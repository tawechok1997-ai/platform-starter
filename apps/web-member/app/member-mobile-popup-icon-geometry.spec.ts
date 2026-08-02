import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const authority = readFileSync(new URL('./member-mobile-popup-icon-geometry.css', import.meta.url), 'utf8');
const sourceFonts = readFileSync(new URL('./member-source-fonts.css', import.meta.url), 'utf8');
const menuBridge = readFileSync(new URL('./components/mobile-home/mobile-member-menu-source-bridge.tsx', import.meta.url), 'utf8');

test('member menu popup keeps source 70px icons at every mobile width', () => {
  assert.match(authority, /--member-popup-menu-icon-size:\s*70px/);
  assert.match(authority, /--member-popup-menu-icon-padding:\s*12px/);
  assert.match(authority, /data-source-member-menu-item/);
  assert.match(authority, /flex:\s*0 0 var\(--member-popup-menu-icon-size\)\s*!important/);
  assert.match(authority, /@media \(max-width: 359px\)[\s\S]*column-gap:\s*4px\s*!important/);

  // The legacy bridge contains a 50px narrow fallback. The late authority is
  // intentionally required so that fallback can no longer shrink the source.
  assert.match(menuBridge, /width:\s*50px\s*!important/);
});

test('other popup icon families retain their source dimensions', () => {
  assert.match(authority, /--member-popup-language-icon-size:\s*71px/);
  assert.match(authority, /--member-popup-card-icon-size:\s*50px/);
  assert.match(authority, /--member-popup-method-icon-size:\s*32px/);
  assert.match(authority, /--member-popup-close-icon-size:\s*12px/);
  assert.match(authority, /data-mobile-popup-owner='language'/);
  assert.match(authority, /data-mobile-popup-owner='contact'/);
  assert.match(authority, /data-mobile-popup-owner='deposit'/);
  assert.match(authority, /data-mobile-popup-owner='withdraw'/);
});

test('popup icon authority loads after cap and popup bridge styles', () => {
  const capIndex = sourceFonts.indexOf("@import './member-mobile-popup-cap-clearance.css';");
  const iconIndex = sourceFonts.indexOf("@import './member-mobile-popup-icon-geometry.css';");
  assert.ok(capIndex >= 0);
  assert.ok(iconIndex > capIndex);
});
