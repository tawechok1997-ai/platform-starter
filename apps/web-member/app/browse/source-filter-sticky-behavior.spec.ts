import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const behavior = readFileSync(new URL('./source-filter-sticky-behavior.tsx', import.meta.url), 'utf8');

test('all desktop game categories share one viewport-bounded sticky filter owner', () => {
  assert.equal(behavior.includes("const DESKTOP_QUERY = '(min-width: 901px)'"), true);
  assert.equal(behavior.includes("const FILTER_SELECTOR = 'main[data-source-game-category] [data-source-filter-panel]'"), true);
  assert.equal(behavior.includes('max-height: calc(100dvh - 144px) !important'), true);
  assert.equal(behavior.includes('overflow-y: auto !important'), true);
  assert.equal(behavior.includes('overscroll-behavior: contain !important'), true);
  assert.equal(behavior.includes("main[data-source-game-category='fishing'] [data-source-filter-panel]"), false);
});

test('outer page scrolling reveals long filters in both directions', () => {
  assert.equal(behavior.includes("document.addEventListener('scroll', handleScroll, true)"), true);
  assert.equal(behavior.includes('panel.scrollTop + delta'), true);
  assert.equal(behavior.includes('panel.scrollHeight - panel.clientHeight'), true);
  assert.equal(behavior.includes('bounds.top > STICKY_TOP_PX + 2'), true);
});

test('filter title and actions remain visible while the filter body scrolls', () => {
  assert.equal(behavior.includes('[data-source-filter-title] {'), true);
  assert.equal(behavior.includes('[data-source-filter-panel] > div:last-child'), true);
  assert.equal(behavior.includes('position: sticky !important'), true);
  assert.equal(behavior.includes('bottom: 0 !important'), true);
});
