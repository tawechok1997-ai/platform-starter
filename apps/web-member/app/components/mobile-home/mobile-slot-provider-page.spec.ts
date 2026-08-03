import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const slot = readFileSync(new URL('./mobile-slot-provider-page.tsx', import.meta.url), 'utf8');
const fishing = readFileSync(new URL('./mobile-fishing-provider-page.tsx', import.meta.url), 'utf8');
const card = readFileSync(new URL('./mobile-card-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

const SLOT_PROVIDER_ORDER = [
  'ygr', 'hotdog', 'misolt', 'jl', 'pp', 'kingm', 'spg', 'jkgx2', 'fachai', 'rsg',
  'pgsoft', 'kaga', 'hacksaw', 'cq', 'redtiger', 'hbn', 'wmslot', 'evp', 'netent', 'ps',
  'pokslot', 'edp', 'spp', 'ame', 'bng', 'r88', 'cala', 'glx', 'l22', 'reg', 'ygg', 'fs',
  'pgsus', 'n2', 'ap', 'amb', 'ask', 'nlc', 'vp', 'drag', 'acewin', 'rb7slot',
] as const;

const FISHING_PROVIDER_ORDER = [
  'ygrfish', 'misoltfish', 'cqfish', 'fachaifish', 'jlfish', 'jkgx2fish', 'rsgfish',
  'sppfish', 'spgfish', 'wmfish', 'kagafish', 'r88fish', 'fsfish', 'askfish', 'acewinfish',
] as const;

test('slot keeps the supplied provider order and merges providers returned by the catalog API', () => {
  let previous = -1;
  for (const provider of SLOT_PROVIDER_ORDER) {
    const current = slot.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }

  assert.equal(SLOT_PROVIDER_ORDER.length, 42);
  assert.match(slot, /code: 'ygr'[\s\S]*layout: 'wide-hero'[\s\S]*badge: 'hot'/);
  assert.match(slot, /code: 'hotdog'[\s\S]*layout: 'wide-banner'[\s\S]*badge: 'new'/);
  assert.match(slot, /catalogPlatform="mobile"/);
  assert.match(slot, /providerAssetPlatform="mobile"/);
  assert.match(slot, /gameAssetPlatform="mobile"/);
  assert.doesNotMatch(slot, /gameAssetPlatform="pc"/);
  assert.match(slot, /includeCatalogProviders/);
});

test('fishing keeps source providers and uses the Mobile game-art library', () => {
  let previous = -1;
  for (const provider of FISHING_PROVIDER_ORDER) {
    const current = fishing.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }

  assert.equal(FISHING_PROVIDER_ORDER.length, 15);
  assert.match(fishing, /code: 'ygrfish'[\s\S]*layout: 'wide-hero'[\s\S]*badge: 'hot'/);
  assert.match(fishing, /code: 'misoltfish'[\s\S]*layout: 'wide-banner'/);
  assert.match(fishing, /catalogPlatform="mobile"/);
  assert.match(fishing, /providerAssetPlatform="mobile"/);
  assert.match(fishing, /gameAssetPlatform="mobile"/);
  assert.doesNotMatch(fishing, /gameAssetPlatform="pc"/);
  assert.match(fishing, /includeCatalogProviders/);
});

test('card resolves both provider and game artwork from the Mobile identity map', () => {
  assert.match(card, /code: 'kingm'[\s\S]*layout: 'wide-hero'/);
  assert.match(card, /code: 'amb'[\s\S]*layout: 'wide-banner'/);
  assert.match(card, /includeCatalogProviders/);
  assert.match(card, /catalogPlatform="mobile"/);
  assert.match(card, /providerAssetPlatform="mobile"/);
  assert.match(card, /gameAssetPlatform="mobile"/);
  assert.doesNotMatch(card, /gameAssetPlatform="pc"/);
});

test('shared provider flow selects a provider before exposing its games', () => {
  assert.match(shared, /data-category-flow="provider-games"/);
  assert.match(shared, /data-provider-games-stage="providers"/);
  assert.match(shared, /data-provider-select="true"/);
  assert.match(shared, /data-next-step="games"/);
  assert.match(shared, /setSelectedCode\(normalizeProviderCode\(provider\.code\)\)/);
  assert.match(shared, /data-provider-games-stage="games"/);
  assert.match(shared, /backToProviders/);
});

test('shared game page loads the selected Mobile catalog and filters by provider', () => {
  assert.match(shared, /loadSourceCategoryCatalog\(catalogSlug, sourceProviders, catalogPlatform/);
  assert.match(shared, /normalizeProviderCode\(game\.provider \?\? ''\) === selectedCode/);
  assert.match(shared, /INITIAL_GAME_COUNT = 60/);
  assert.match(shared, /GAME_PAGE_STEP = 60/);
  assert.match(shared, /visibleCount < filteredGames\.length/);
});

test('game cards preserve the chosen game through login and real launch', () => {
  assert.match(shared, /href=\{`\/games\?\$\{destination\.toString\(\)\}`\}/);
  assert.match(shared, /data-game-id=\{game\.id\}/);
  assert.match(shared, /data-game-code=\{game\.id\}/);
  assert.match(shared, /data-game-name=\{game\.name\}/);
  assert.match(shared, /data-provider-code=\{providerCode\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /data-game-icon-platform=\{gameAssetPlatform\}/);
});

test('Mobile provider games keep a horizontally scrollable provider rail and a three-column grid', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /\.providerRail\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.providerRail\s*\{[\s\S]*-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /\.slotGameGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /:has\(\.providerSelectionRoot\)/);
  assert.doesNotMatch(css, /:has\(\.root\)/);
});

test('mobile category owner routes slot fishing and card to the shared flow', () => {
  assert.match(owner, /import MobileSlotProviderPage/);
  assert.match(owner, /import MobileFishingProviderPage/);
  assert.match(owner, /import MobileCardProviderPage/);
  assert.match(owner, /activeCategory === 'slot'[\s\S]*<MobileSlotProviderPage \/>/);
  assert.match(owner, /activeCategory === 'fishing'[\s\S]*<MobileFishingProviderPage \/>/);
  assert.match(owner, /activeCategory === 'card'[\s\S]*<MobileCardProviderPage \/>/);
});
