import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const contentOwner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('mobile category runtime switches selection without route navigation', () => {
  assert.equal((memberHome.match(/<MobileCategoryTabRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(categoryRuntime, /root\.addEventListener\('click', switchCategory, true\)/);
  assert.match(categoryRuntime, /setActiveCategory\(category\)/);
  assert.match(categoryRuntime, /member:mobile-category-select/);
  assert.doesNotMatch(categoryRuntime, /event\.preventDefault\(\)|event\.stopPropagation\(\)/);
  assert.doesNotMatch(categoryRuntime, /window\.location|router\.push|router\.replace/);
});

test('category runtime owns selection only and renders no duplicate content', () => {
  assert.match(categoryRuntime, /return null;/);
  assert.doesNotMatch(categoryRuntime, /createPortal|memberApiFetch|data-mobile-category-content/);
  assert.doesNotMatch(categoryRuntime, /MobileCasinoProviderPage|MobileSlotProviderPage|MobileFishingProviderPage/);
});

test('highlight content is the single category page owner', () => {
  for (const component of [
    'MobileCasinoProviderPage',
    'MobileSlotProviderPage',
    'MobileFishingProviderPage',
    'MobileSportProviderPage',
    'MobileCardProviderPage',
    'MobileLotteryProviderPage',
  ]) {
    assert.match(contentOwner, new RegExp(`import ${component}`));
  }
  assert.match(contentOwner, /window\.addEventListener\('member:mobile-category-select', selectFromEvent\)/);
  assert.match(contentOwner, /if \(activeCategory === 'casino'\)[\s\S]*return <MobileCasinoProviderPage \/>/);
  assert.match(contentOwner, /if \(activeCategory === 'lottery'\)[\s\S]*return <MobileLotteryProviderPage \/>/);
});

test('category switching hides and restores only the shared lower home owner', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="shortcut"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="footer"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = false/);
  assert.match(categoryRuntime, /bottomStructure\.style\.removeProperty\('display'\)/);
});

test('all category identifiers remain accepted by the selection runtime', () => {
  for (const category of ['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(categoryRuntime, new RegExp(`value === '${category}'`));
  }
});
