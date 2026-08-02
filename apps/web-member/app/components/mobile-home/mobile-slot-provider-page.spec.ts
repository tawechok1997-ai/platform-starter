import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const slot = readFileSync(new URL('./mobile-slot-provider-page.tsx', import.meta.url), 'utf8');
const fishing = readFileSync(new URL('./mobile-fishing-provider-page.tsx', import.meta.url), 'utf8');
const card = readFileSync(new URL('./mobile-card-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

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

test('slot keeps the supplied provider order and Mobile artwork contract', () => {
  let previous = -1;
  for (const provider of SLOT_PROVIDER_ORDER) {
    const current = slot.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }
  assert.equal(SLOT_PROVIDER_ORDER.length, 42);
  assert.match(slot, /catalogPlatform="mobile"/);
  assert.match(slot, /providerAssetPlatform="mobile"/);
  assert.match(slot, /gameAssetPlatform="mobile"/);
});

test('fishing keeps Mobile provider artwork and PC game artwork', () => {
  let previous = -1;
  for (const provider of FISHING_PROVIDER_ORDER) {
    const current = fishing.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }
  assert.equal(FISHING_PROVIDER_ORDER.length, 15);
  assert.match(fishing, /catalogPlatform="mobile"/);
  assert.match(fishing, /providerAssetPlatform="mobile"/);
  assert.match(fishing, /gameAssetPlatform="pc"/);
});

test('card keeps Mobile provider artwork while game icons resolve from PC', () => {
  assert.match(card, /includeCatalogProviders/);
  assert.match(card, /catalogPlatform="mobile"/);
  assert.match(card, /providerAssetPlatform="mobile"/);
  assert.match(card, /gameAssetPlatform="pc"/);
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
  assert.match(shared, /normalizeProviderCode\(game\.provider \?\? ''\) !== selectedCode/);
  assert.match(shared, /INITIAL_GAME_COUNT = 60/);
  assert.match(shared, /GAME_PAGE_STEP = 60/);
  assert.match(shared, /visibleCount < filteredGames\.length/);
});

test('game cards preserve the chosen game through login and real launch', () => {
  assert.match(shared, /href=\{`\/games\?\$\{destination\.toString\(\)\}`\}/);
  assert.match(shared, /data-game-id=\{game\.id\}/);
  assert.match(shared, /data-game-code=\{game\.id\}/);
  assert.match(shared, /data-game-name=\{game\.name\}/);
  assert.match(shared, /data-provider-code=\{normalizedProvider\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /data-game-icon-platform=\{gameAssetPlatform\}/);
});

test('Mobile provider games keep the three-column game layout', () => {
  assert.match(css, /\.providerRail\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.slotGameGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /:has\(\.providerSelectionRoot\)/);
  assert.doesNotMatch(css, /:has\(\.root\)/);
});

test('central category runtime routes slot fishing and card providers to the shared browse flow', () => {
  assert.match(categoryRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(categoryRuntime, /\/browse\/games\?category=\$\{encodeURIComponent\(category\)\}/);
  assert.match(categoryRuntime, /provider=\$\{encodeURIComponent\(provider\.code\)\}/);
  assert.match(categoryRuntime, /platform=mobile/);
  assert.match(categoryRuntime, /data-provider-code=\{provider\.code\}/);
});
