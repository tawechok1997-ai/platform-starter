import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryCss = readFileSync(new URL('./mobile-category-tab-runtime.module.css', import.meta.url), 'utf8');

test('promotion banner announcement and topic tabs stay outside the replaceable category slot', () => {
  const hero = root.indexOf('data-mobile-section-owner="hero"');
  const announcement = root.indexOf('data-mobile-section-owner="announcement"');
  const topics = root.indexOf('data-mobile-section-owner="highlight-tabs"');
  const categorySlot = root.indexOf('className={styles.categoryContent}');

  assert.ok(hero >= 0);
  assert.ok(announcement >= 0);
  assert.ok(topics >= 0);
  assert.ok(categorySlot >= 0);
  assert.ok(hero < categorySlot);
  assert.ok(announcement < categorySlot);
  assert.ok(topics < categorySlot);
});

test('non-home game categories preserve the shared top content', () => {
  for (const owner of ['hero', 'announcement', 'highlight-tabs']) {
    assert.ok(categoryCss.includes(`[data-mobile-section-owner='${owner}']`));
  }

  assert.ok(categoryCss.includes("[data-mobile-active-category]:not([data-mobile-active-category='home'])"));
  assert.ok(categoryCss.includes('visibility: visible !important'));
  assert.ok(categoryCss.includes('opacity: 1 !important'));
  assert.ok(categoryCss.includes('content-visibility: visible !important'));
});

test('category content still replaces only the home feed, not the shared chrome', () => {
  assert.ok(categoryCss.includes("[data-mobile-section-owner='source-content']"));
  assert.ok(categoryCss.includes('display: none !important'));
});
