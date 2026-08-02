import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlights = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const providerStyles = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');

test('category runtime only owns category selection and never renders duplicate content', () => {
  assert.match(runtime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(runtime, /return null/);
  assert.doesNotMatch(runtime, /createPortal/);
  assert.doesNotMatch(runtime, /CategoryProviderPanel/);
  assert.doesNotMatch(runtime, /data-mobile-provider-artwork-only/);
});

test('all six categories use the single highlight content owners', () => {
  for (const owner of [
    'MobileCasinoProviderPage',
    'MobileSlotProviderPage',
    'MobileFishingProviderPage',
    'MobileSportProviderPage',
    'MobileCardProviderPage',
    'MobileLotteryProviderPage',
  ]) assert.match(highlights, new RegExp(owner));
});

test('casino sport and lottery continue directly to authenticated launch', () => {
  assert.match(launcher, /data-category-launch-mode="provider-launch"/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(launcher, /data-game-id=\{firstGame\?\.id\}/);
  assert.match(launcher, /gameDestination\(category, provider\.code, firstGame\.id\)/);
  assert.match(launcher, /platform: 'mobile'/);
});

test('slot fishing and card replace provider cards with the inline game grid', () => {
  assert.match(providerGames, /data-provider-games-stage="providers"/);
  assert.match(providerGames, /data-provider-select="true"/);
  assert.match(providerGames, /onClick=\{\(\) => onSelect\(provider\)\}/);
  assert.match(providerGames, /data-provider-games-stage="games"/);
  assert.match(providerGames, /className=\{styles\.providerRail\}/);
  assert.match(providerGames, /className=\{styles\.filterButton\}/);
  assert.match(providerGames, /className=\{styles\.slotGameGrid\}/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);
  assert.match(providerGames, /href=\{`\/games\?\$\{destination\.toString\(\)\}`\}/);
  assert.match(providerGames, /data-game-platform="mobile"/);
  assert.match(providerStyles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
});
