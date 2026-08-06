import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-hero-carousel.css', import.meta.url), 'utf8');
const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');

test('Mobile Home loads the focused Hero carousel stylesheet', () => {
  assert.match(home, /import '\.\/components\/mobile-home\/mobile-hero-carousel\.css';/);
});

test('every rendered Hero slide receives one indicator button', () => {
  assert.match(root, /heroSlides\.map\(\(slide, index\) => \(/);
  assert.match(root, /aria-current=\{index === activeSlide \? 'true' : undefined\}/);
});

test('Hero indicators stay visible and the active indicator is not a pill', () => {
  assert.match(css, /visibility:\s*visible\s*!important/);
  assert.match(css, /button::before/);
  assert.match(css, /button\[aria-current='true'\]::before/);
  assert.match(css, /width:\s*6px\s*!important/);
  assert.match(css, /height:\s*6px\s*!important/);
  assert.doesNotMatch(css, /aria-current='true'[\s\S]{0,220}width:\s*16px/);
});
