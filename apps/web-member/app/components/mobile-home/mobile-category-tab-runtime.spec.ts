import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const contentOwner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const duplicateRuntime = new URL('./mobile-category-tab-runtime.tsx', import.meta.url);

test('duplicate mobile category state runtime is removed', () => {
  assert.doesNotMatch(memberHome, /MobileCategoryTabRuntime/);
  assert.equal(existsSync(duplicateRuntime), false);
});

test('highlight content owns category rendering and shared side effects', () => {
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
  assert.match(contentOwner, /window\.addEventListener\('click', selectFromClick, true\)/);
  assert.match(contentOwner, /window\.addEventListener\('member:mobile-category-select', selectFromEvent\)/);
  assert.match(contentOwner, /root\.dataset\.mobileActiveCategory = category/);
  assert.match(contentOwner, /restoreTopChrome\(root\)/);
  assert.match(contentOwner, /document\.scrollingElement/);
  assert.match(contentOwner, /if \(activeCategory === 'casino'\)[\s\S]*return <MobileCasinoProviderPage \/>/);
  assert.match(contentOwner, /if \(activeCategory === 'lottery'\)[\s\S]*return <MobileLotteryProviderPage \/>/);
});

test('category switching preserves the single lower Home owner', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="shortcut"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="footer"/g) ?? []).length, 1);
  assert.doesNotMatch(contentOwner, /bottomStructure\.hidden|style\.setProperty\('display', 'none'/);
});

test('all category identifiers remain accepted by the content owner', () => {
  for (const category of ['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(contentOwner, new RegExp(`'${category}'`));
  }
});
