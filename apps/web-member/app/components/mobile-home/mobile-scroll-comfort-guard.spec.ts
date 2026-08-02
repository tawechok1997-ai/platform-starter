import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guard = readFileSync(new URL('./mobile-scroll-comfort-guard.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('mobile home mounts the vertical scroll comfort guard', () => {
  assert.match(home, /MobileScrollComfortGuard/);
  assert.match(home, /<MobileScrollComfortGuard \/>/);
});

test('hero gestures lock direction before horizontal swipe can consume movement', () => {
  assert.match(guard, /AXIS_LOCK_DISTANCE = 8/);
  assert.match(guard, /HORIZONTAL_INTENT_RATIO = 1\.15/);
  assert.match(guard, /absX > absY \* HORIZONTAL_INTENT_RATIO/);
  assert.match(guard, /axis !== 'vertical'/);
  assert.match(guard, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(guard, /event\.preventDefault\(\)/);
});

test('scroll comfort listener runs in capture phase before the hero swipe runtime', () => {
  assert.match(guard, /addEventListener\('pointerdown', onPointerDown, true\)/);
  assert.match(guard, /addEventListener\('pointermove', onPointerMove, true\)/);
  assert.match(guard, /removeEventListener\('pointermove', onPointerMove, true\)/);
});
