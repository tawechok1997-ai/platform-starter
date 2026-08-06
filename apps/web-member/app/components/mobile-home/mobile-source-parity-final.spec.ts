import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-source-parity-final.css', import.meta.url), 'utf8');

test('Mobile Home loads the final source-parity stylesheet', () => {
  assert.match(home, /import '\.\/components\/mobile-home\/mobile-source-parity-final\.css';/);
});

test('bottom navigation removes Contact for guest and authenticated members', () => {
  assert.match(css, /data-bottom-navigation-canvas='contact'/);
  assert.match(css, /button\[aria-label='ติดต่อ'\]/);
  assert.match(css, /button\[aria-label='Contact'\]/);
  assert.match(css, /display:\s*none\s*!important/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)\s*!important/);
});

test('hero pagination uses equal circular source indicators instead of an active pill', () => {
  assert.match(css, /data-mobile-section-owner='hero'/);
  assert.match(css, /width:\s*9px\s*!important/);
  assert.match(css, /height:\s*9px\s*!important/);
  assert.match(css, /border-radius:\s*999px\s*!important/);
  assert.match(css, /button\[aria-current='true'\]/);
  assert.doesNotMatch(css, /width:\s*16px/);
});
