import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const categoryStyles = readFileSync(new URL('./mobile-category-tab-runtime.module.css', import.meta.url), 'utf8');

test('mobile category menu switches content without navigating to another page', () => {
  assert.equal((memberHome.match(/<MobileCategoryTabRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(categoryRuntime, /event\.preventDefault\(\)/);
  assert.match(categoryRuntime, /event\.stopPropagation\(\)/);
  assert.match(categoryRuntime, /setActiveCategory\(category\)/);
  assert.doesNotMatch(categoryRuntime, /window\.location|router\.push|router\.replace/);
});

test('category content is mounted only into the existing after-highlight slot', () => {
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /querySelector<HTMLElement>\('\[data-mobile-content-slot="after-highlight"\]'\)/);
  assert.match(categoryRuntime, /createPortal\(/);
  assert.equal((categoryRuntime.match(/data-mobile-section-owner="category-content"/g) ?? []).length, 1);
});

test('category switching never owns or replaces shortcut and footer structures', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="shortcut"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="footer"/g) ?? []).length, 1);
  assert.doesNotMatch(categoryRuntime, /bottomStructure|data-mobile-bottom-owner|mobileFooter|<footer/);
  assert.doesNotMatch(categoryStyles, /bottomStructure|data-mobile-bottom-owner|mobileFooter|footer/);
});

test('every non-home category reads central catalog data and has no static game records', () => {
  assert.match(categoryRuntime, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
  assert.match(categoryRuntime, /platform:\s*'mobile'/);
  assert.match(categoryRuntime, /casino:\s*\['casino'\]/);
  assert.match(categoryRuntime, /slot:\s*\['slot'\]/);
  assert.match(categoryRuntime, /fishing:\s*\['fishing'\]/);
  assert.match(categoryRuntime, /sport:\s*\['sport',\s*'sports'\]/);
  assert.match(categoryRuntime, /card:\s*\['card'\]/);
  assert.match(categoryRuntime, /lottery:\s*\['lottery'\]/);
  assert.doesNotMatch(categoryRuntime, /FALLBACK_|LIVE_MATCHES|GUIDES/);
});

test('home content is hidden only while a non-home category is active', () => {
  assert.match(categoryStyles, /data-mobile-active-category/);
  assert.match(categoryStyles, /:not\(\[data-mobile-active-category='home'\]\)/);
  assert.match(categoryStyles, /data-mobile-section-owner='source-content'/);
});
