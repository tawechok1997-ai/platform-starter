import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const carousel = readFileSync(
  new URL('./desktop-hero-carousel-media.tsx', import.meta.url),
  'utf8',
);

test('desktop promotion carousel continues autoplay while hovered', () => {
  assert.match(carousel, /const autoplayPaused = hasFocus \|\| isDragging \|\| reducedMotion;/);
  assert.doesNotMatch(carousel, /isHovering/);
  assert.doesNotMatch(carousel, /onPointerEnter/);
  assert.doesNotMatch(carousel, /onPointerLeave/);
});

test('desktop promotion carousel still pauses for deliberate interaction', () => {
  assert.match(carousel, /if \(realCount < 2 \|\| autoplayPaused\) return;/);
  assert.match(carousel, /onFocusCapture=\{\(\) => setHasFocus\(true\)\}/);
  assert.match(carousel, /setIsDragging\(true\)/);
  assert.match(carousel, /window\.setInterval\(\(\) => \{/);
  assert.match(carousel, /moveBy\(1\)/);
});
