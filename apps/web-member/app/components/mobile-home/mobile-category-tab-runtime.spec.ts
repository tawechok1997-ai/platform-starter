import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const categoryStyles = readFileSync(new URL('./mobile-category-tab-runtime.module.css', import.meta.url), 'utf8');

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

test('non-home categories replace the home bottom structure and restore it on cleanup', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = false/);
  assert.match(categoryRuntime, /bottomStructure\.removeAttribute\('aria-hidden'\)/);
});

test('every non-home category reads the central mobile catalog and resolves provider covers locally first', () => {
  assert.match(categoryRuntime, /const API_CATEGORIES/);
  assert.match(categoryRuntime, /platform:\s*'mobile'/);
  assert.match(categoryRuntime, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
  assert.match(categoryRuntime, /skipAuth:\s*true/);
  assert.match(categoryRuntime, /resolveMobileProviderCover\(category, provider\.code\)/);
  assert.match(categoryRuntime, /resolveLocalAssetByBasename\(cover\.sourceUrl, 'pc'\)/);
  assert.match(categoryRuntime, /data-category-flow="provider-only"/);
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /platform=mobile/);
  assert.doesNotMatch(categoryRuntime, /FALLBACK_|LIVE_MATCHES|GUIDES/);
  assert.match(categoryStyles, /\.providerCoverGrid/);
  assert.match(categoryStyles, /\.providerCoverMedia/);
});
