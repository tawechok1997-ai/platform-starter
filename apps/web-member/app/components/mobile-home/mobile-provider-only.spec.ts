import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const highlightContent = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('mobile category surface renders provider artwork before any game selection', () => {
  for (const owner of [
    'MobileCasinoProviderPage',
    'MobileSportProviderPage',
    'MobileLotteryProviderPage',
    'MobileSlotProviderPage',
    'MobileFishingProviderPage',
    'MobileCardProviderPage',
  ]) assert.match(highlightContent, new RegExp(owner));

  assert.match(launcher, /data-category-launch-mode="provider-launch"/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(launcher, /loadSourceCategoryCatalog\(category, sourceProviders, 'mobile', controller\.signal\)/);
  assert.match(launcher, /platform: 'mobile'/);
  assert.match(providerGames, /data-provider-games-stage="providers"/);
});

test('slot fishing and card retain their provider-to-game stage outside the category grid', () => {
  assert.match(providerGames, /data-category-flow="provider-games"/);
  assert.match(providerGames, /data-provider-games-stage="providers"/);
  assert.match(providerGames, /data-provider-games-stage="games"/);
  assert.match(providerGames, /slotGamesToolbar/);
  assert.match(providerGames, /slotGameGrid/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);
});
