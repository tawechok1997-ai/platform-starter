import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guard = readFileSync(new URL('./mobile-category-footer-guard.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('mobile home mounts the persistent category footer guard', () => {
  assert.match(home, /MobileCategoryFooterGuard/);
  assert.match(home, /<MobileCategoryFooterGuard \/>/);
});

test('game categories hide home-only bottom content but never the footer', () => {
  assert.match(guard, /data-mobile-bottom-owner=\"true\"/);
  assert.match(guard, /data-mobile-section-owner=\"footer\"/);
  assert.match(guard, /:not\(\[data-mobile-section-owner=\"footer\"\]\)/);
  assert.match(guard, /forceVisible\(bottomStructure\)/);
  assert.match(guard, /forceVisible\(footer\)/);
  assert.match(guard, /activeCategory !== 'home'/);
  assert.match(guard, /mobilePersistentFooter/);
  assert.doesNotMatch(guard, /bottomStructure\.hidden = activeCategory !== 'home'/);
});

test('footer visibility is re-applied after the category runtime updates the DOM', () => {
  assert.match(guard, /MutationObserver/);
  assert.match(guard, /data-mobile-active-category/);
  assert.match(guard, /requestAnimationFrame/);
  assert.match(guard, /member:mobile-category-select/);
});
