import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlights = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');

test('non-home categories still replace the shared home feed', () => {
  assert.match(runtime, /data-mobile-provider-artwork-only="true"/);
  assert.match(runtime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(runtime, /setProperty\('display', 'none', 'important'\)/);
  assert.match(runtime, /mobile-category-tab-runtime\.module\.css/);
  assert.doesNotMatch(runtime, /mobile-category-provider-icons\.module\.css/);
});

test('all six game categories keep their source provider owners', () => {
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

test('slot fishing and card select a provider before a game', () => {
  assert.match(providerGames, /data-provider-games-stage="providers"/);
  assert.match(providerGames, /data-provider-select="true"/);
  assert.match(providerGames, /onClick=\{\(\) => setSelectedCode\(normalizeProviderCode\(provider\.code\)\)\}/);
  assert.match(providerGames, /data-provider-games-stage="games"/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);
  assert.match(providerGames, /href=\{`\/games\?\$\{destination\.toString\(\)\}`\}/);
  assert.match(providerGames, /provider: normalizedProvider/);
  assert.match(providerGames, /platform: 'mobile'/);
});
