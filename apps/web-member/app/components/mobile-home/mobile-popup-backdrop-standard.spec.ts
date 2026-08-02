import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const backdropCss = readFileSync(
  new URL('../../member-mobile-popup-backdrop-standard.css', import.meta.url),
  'utf8',
);
const fontAuthority = readFileSync(
  new URL('../../member-source-fonts.css', import.meta.url),
  'utf8',
);

test('all Mobile Member popup owners share the source black backdrop', () => {
  for (const owner of [
    "[data-ui-owner='mobile-popup']",
    "[data-ui-owner='mobile-video-popup']",
    "[data-ui-owner='mobile-video-guide-popup']",
    '[data-mobile-global-overlay]',
    '.member-modal-system__backdrop',
  ]) {
    assert.match(backdropCss, new RegExp(owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(backdropCss, /--member-mobile-popup-backdrop: rgb\(0 0 0 \/ 80%\)/);
  assert.match(backdropCss, /background-image: none !important/);
  assert.match(backdropCss, /backdrop-filter: none !important/);
});

test('auth open state uses the same backdrop without breaking its closing transition', () => {
  assert.match(backdropCss, /\.member-auth-overlay\[data-state='open'\]/);
  assert.doesNotMatch(backdropCss, /\.member-auth-overlay\[data-state='closing'\][^{]*\{[^}]*background-color: var\(--member-mobile-popup-backdrop\)/);
});

test('backdrop authority loads from the final Member CSS owner', () => {
  assert.match(fontAuthority, /^@import '\.\/member-mobile-popup-backdrop-standard\.css';/);
  assert.match(backdropCss, /position: fixed !important/);
  assert.match(backdropCss, /height: 100dvh !important/);
  assert.match(backdropCss, /overscroll-behavior: contain !important/);
});
