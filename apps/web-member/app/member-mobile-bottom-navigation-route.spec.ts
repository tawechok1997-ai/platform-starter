import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chrome = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');
const navigationCss = readFileSync(
  new URL('./member-mobile-bottom-navigation-source-size.css', import.meta.url),
  'utf8',
);

test('member chrome exposes the current pathname for route-owned mobile UI', () => {
  assert.match(chrome, /data-route=\{pathname\}/);
});

test('authenticated mobile bottom navigation is visible on home only', () => {
  assert.match(
    navigationCss,
    /body:not\(:has\(\.public-game-shell\[data-route='\/'\]\)\)/,
  );
  assert.match(
    navigationCss,
    /nav\[data-ui-owner='mobile-navigation'\]\[data-mobile-member-bottom-navigation='true'\]/,
  );
  assert.match(navigationCss, /display: none !important/);
  assert.match(navigationCss, /visibility: hidden !important/);
  assert.match(navigationCss, /pointer-events: none !important/);
  assert.doesNotMatch(navigationCss, /data-route\^=/);
  assert.doesNotMatch(navigationCss, /data-route\*=/);
});
