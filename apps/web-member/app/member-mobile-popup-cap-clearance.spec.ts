import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const authority = readFileSync(new URL('./member-mobile-popup-cap-clearance.css', import.meta.url), 'utf8');
const sourceFonts = readFileSync(new URL('./member-source-fonts.css', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./components/mobile-home/mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const globalActions = readFileSync(new URL('./components/mobile-home/mobile-global-member-actions-runtime.tsx', import.meta.url), 'utf8');

test('every SourcePopupShell owner reserves one canonical title-cap lane', () => {
  assert.match(authority, /--member-mobile-popup-cap-height:\s*38px/);
  assert.match(authority, /--member-mobile-popup-cap-gap:\s*34px/);
  assert.match(authority, /section\[data-mobile-popup-owner\]/);
  assert.match(authority, /padding-block-start:\s*var\(--member-mobile-popup-cap-clearance\)\s*!important/);
  assert.match(authority, /max-height:\s*calc\(100dvh - 136px\)\s*!important/);

  for (const kind of [
    'menu',
    'contact',
    'password',
    'deposit',
    'withdraw',
    'network-income',
    'commission-income',
    'coupon',
    'language',
  ]) {
    assert.match(popupRuntime, new RegExp(`\\| '${kind}'|popup === '${kind}'|kind=\\"${kind}\\"`));
  }
});

test('late menu and coupon bridges cannot collapse the cap clearance', () => {
  assert.match(authority, /data-mobile-popup-owner='menu'\]\[data-mobile-menu-source='true'/);
  assert.match(authority, /data-mobile-popup-owner='coupon'\]\[data-mobile-coupon-source='true'/);
});

test('the shared guest and member language popup keeps its grid below the cap', () => {
  assert.match(globalActions, /data-mobile-global-overlay=\{overlay\}/);
  assert.match(authority, /data-mobile-global-overlay='language'/);
  assert.match(authority, /\[class\*='languageGrid'\]/);
  assert.match(authority, /overflow-y:\s*auto/);
});

test('cap geometry authority is loaded after the backdrop standard', () => {
  const backdropIndex = sourceFonts.indexOf("@import './member-mobile-popup-backdrop-standard.css';");
  const capIndex = sourceFonts.indexOf("@import './member-mobile-popup-cap-clearance.css';");
  assert.ok(backdropIndex >= 0);
  assert.ok(capIndex > backdropIndex);
});
