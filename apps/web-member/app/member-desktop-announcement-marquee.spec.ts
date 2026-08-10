import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./member-desktop-announcement-marquee.css', import.meta.url), 'utf8');

test('Desktop announcement marquee owner loads after the other motion layers', () => {
  assert.match(
    layout,
    /import '\.\/member-desktop-motion-final\.css';\s*import '\.\/member-desktop-announcement-marquee\.css';/,
  );
});

test('Desktop announcement continuously scrolls inside its clipped viewport', () => {
  assert.match(css, /@media \(min-width:\s*901px\)/);
  assert.match(css, /\.reference-announcement-viewport[\s\S]*overflow:\s*hidden\s*!important/);
  assert.match(css, /\.reference-announcement-track\s*>\s*span[\s\S]*padding-left:\s*100%\s*!important/);
  assert.match(css, /animation:\s*desktop-reference-announcement-marquee\s+18s\s+linear\s+infinite\s*!important/);
  assert.match(css, /@keyframes desktop-reference-announcement-marquee/);
  assert.match(css, /translate3d\(-100%,\s*0,\s*0\)/);
});
