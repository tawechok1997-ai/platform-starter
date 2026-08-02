import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guard = readFileSync(new URL('./mobile-category-footer-guard.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('mobile home mounts the persistent bottom-content guard', () => {
  assert.match(home, /MobileCategoryFooterGuard/);
  assert.match(home, /<MobileCategoryFooterGuard \/>/);
});

test('game categories keep both shortcut download card and footer visible', () => {
  assert.match(guard, /data-mobile-bottom-owner="true"/);
  assert.match(guard, /data-mobile-section-owner="shortcut"/);
  assert.match(guard, /data-mobile-section-owner="footer"/);
  assert.match(guard, /mobilePersistentBottom/);
  assert.match(guard, /forceVisible\(bottomStructure\)/);
  assert.match(guard, /forceVisible\(section\)/);
  assert.doesNotMatch(guard, /activeCategory !== 'home'/);
  assert.doesNotMatch(guard, /setElementHidden/);
});

test('persistent bottom content is restored after category runtime updates the DOM', () => {
  assert.match(guard, /MutationObserver/);
  assert.match(guard, /data-mobile-active-category/);
  assert.match(guard, /requestAnimationFrame/);
  assert.match(guard, /member:mobile-category-select/);
});
