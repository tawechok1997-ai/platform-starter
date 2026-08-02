import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlightOwner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('mobile category controller switches active state in place', () => {
  assert.equal((memberHome.match(/<MobileCategoryTabRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(categoryRuntime, /event\.preventDefault\(\)/);
  assert.match(categoryRuntime, /event\.stopPropagation\(\)/);
  assert.match(categoryRuntime, /setActiveCategory\(category\)/);
  assert.match(categoryRuntime, /MOBILE_CATEGORY_SELECT_EVENT/);
  assert.doesNotMatch(categoryRuntime, /window\.location|router\.push|router\.replace/);
});

test('mobile highlight owner renders category content inside the existing content slot', () => {
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
  assert.match(mobileRoot, /<MobileHighlightTabContent activeTab=\{activeTab\} \/>/);
  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(highlightOwner, new RegExp(`activeCategory === '${category}'`));
  }
  assert.doesNotMatch(categoryRuntime, /createPortal|data-mobile-section-owner="category-content"/);
  assert.match(categoryRuntime, /return null/);
});

test('non-home categories hide the home bottom structure and restore it on cleanup', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = false/);
  assert.match(categoryRuntime, /bottomStructure\.removeAttribute\('aria-hidden'\)/);
});

test('category controller owns state and accessibility but not catalog transport or category UI', () => {
  assert.match(categoryRuntime, /root\.dataset\.mobileActiveCategory = activeCategory/);
  assert.match(categoryRuntime, /item\.setAttribute\('aria-selected', active \? 'true' : 'false'\)/);
  assert.match(categoryRuntime, /item\.setAttribute\('aria-current', 'page'\)/);
  assert.doesNotMatch(categoryRuntime, /memberApiFetch|getMemberGameCatalog|loadSourceCategoryCatalog/);
  assert.doesNotMatch(categoryRuntime, /MobileCasinoProviderPage|MobileSlotProviderPage|data-provider-launch/);
  assert.match(highlightOwner, /import MobileCasinoProviderPage/);
  assert.match(highlightOwner, /import MobileSlotProviderPage/);
});
