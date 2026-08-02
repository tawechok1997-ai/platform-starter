import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const categoryStyles = readFileSync(new URL('./mobile-category-provider-icons.module.css', import.meta.url), 'utf8');

test('mobile category menu switches content in place', () => {
  assert.equal((memberHome.match(/<MobileCategoryTabRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(categoryRuntime, /event\.preventDefault\(\)/);
  assert.match(categoryRuntime, /event\.stopPropagation\(\)/);
  assert.match(categoryRuntime, /setActiveCategory\(category\)/);
  assert.doesNotMatch(categoryRuntime, /window\.location|router\.push|router\.replace/);
});

test('category content mounts into the existing after-highlight slot', () => {
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /querySelector<HTMLElement>\('\[data-mobile-content-slot="after-highlight"\]'\)/);
  assert.match(categoryRuntime, /createPortal\(/);
  assert.equal((categoryRuntime.match(/data-mobile-section-owner="category-content"/g) ?? []).length, 1);
});

test('category switching preserves shared source content, shortcuts and footer', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="shortcut"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-section-owner="footer"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /bottomStructure/);
  assert.match(categoryRuntime, /sourceContent/);
  assert.match(categoryRuntime, /element\.hidden = false/);
  assert.match(categoryRuntime, /element\.removeAttribute\('aria-hidden'\)/);
});

test('every non-home category reads the central mobile catalog and resolves provider icons locally first', () => {
  assert.match(categoryRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(categoryRuntime, /collectCategoryProviders\(catalog, category\)/);
  assert.match(categoryRuntime, /game\.category !== category/);
  assert.match(categoryRuntime, /resolveLocalAssetOrSource\(iconSource, 'pc'\)/);
  assert.match(categoryRuntime, /data-provider-icon-source=\{provider\.iconSource\}/);
  assert.match(categoryRuntime, /data-category-flow="provider-icons"/);
  assert.doesNotMatch(categoryRuntime, /FALLBACK_|LIVE_MATCHES|GUIDES/);
  assert.match(categoryStyles, /\.grid/);
  assert.match(categoryStyles, /\.iconFrame/);
});
