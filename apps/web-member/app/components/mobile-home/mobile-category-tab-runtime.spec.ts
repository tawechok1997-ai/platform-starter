import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const categoryStyles = readFileSync(new URL('./mobile-category-provider-icons.module.css', import.meta.url), 'utf8');

test('mobile category menu switches content without route navigation', () => {
  assert.equal((memberHome.match(/<MobileCategoryTabRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(categoryRuntime, /event\.preventDefault\(\)/);
  assert.match(categoryRuntime, /event\.stopPropagation\(\)/);
  assert.match(categoryRuntime, /setActiveCategory\(category\)/);
  assert.doesNotMatch(categoryRuntime, /window\.location|router\.push|router\.replace/);
});

test('category content is mounted into the existing after-highlight slot', () => {
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /querySelector<HTMLElement>\('\[data-mobile-content-slot="after-highlight"\]'\)/);
  assert.match(categoryRuntime, /createPortal\(/);
  assert.equal((categoryRuntime.match(/data-mobile-section-owner="category-content"/g) ?? []).length, 1);
});

test('category switching preserves the shared source feed shortcut and footer', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="shortcut"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="footer"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /querySelector<HTMLElement>\('\[data-mobile-bottom-owner="true"\]'\)/);
  assert.match(categoryRuntime, /querySelector<HTMLElement>\('\[data-mobile-section-owner="source-content"\]'\)/);
  assert.match(categoryRuntime, /element\.hidden = false/);
  assert.match(categoryRuntime, /element\.style\.removeProperty\('display'\)/);
  assert.doesNotMatch(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
});

test('every non-home category reads the central Mobile catalog and has no static game records', () => {
  assert.match(categoryRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(categoryRuntime, /type GameCategoryId = Exclude<MobileCategoryId, 'home'>/);
  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(categoryRuntime, new RegExp(`'${category}'`));
  }
  assert.doesNotMatch(categoryRuntime, /FALLBACK_|LIVE_MATCHES|GUIDES/);
});

test('provider cards use real catalog artwork and preserve category provider deep links', () => {
  assert.match(categoryRuntime, /data-category-flow="provider-icons"/);
  assert.match(categoryRuntime, /game\.providerIconSource/);
  assert.match(categoryRuntime, /game\.providerIcon/);
  assert.match(categoryRuntime, /resolveLocalAssetOrSource\(iconSource, 'pc'\)/);
  assert.match(categoryRuntime, /\/browse\/games\?category=\$\{encodeURIComponent\(category\)\}&provider=/);
  assert.match(categoryRuntime, /platform=mobile/);
  assert.match(categoryRuntime, /data-provider-code=\{provider\.code\}/);
  assert.match(categoryStyles, /grid-template-columns:\s*repeat\(2/);
});
