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

function assertProviderOrder(source: string, providers: readonly string[]) {
  let previous = -1;
  for (const provider of providers) {
    const current = source.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }
}

test('slot keeps the supplied 42-provider order and Mobile artwork contract', () => {
  assertProviderOrder(slot, SLOT_PROVIDER_ORDER);
  assert.equal(SLOT_PROVIDER_ORDER.length, 42);
  assert.match(slot, /code: 'ygr'[\s\S]*layout: 'wide-hero'[\s\S]*badge: 'hot'/);
  assert.match(slot, /code: 'hotdog'[\s\S]*layout: 'wide-banner'[\s\S]*badge: 'new'/);
  assert.match(slot, /category="slot"/);
  assert.match(slot, /catalogPlatform="mobile"/);
  assert.match(slot, /providerAssetPlatform="mobile"/);
});

test('fishing keeps the supplied 15-provider order and category identity', () => {
  assertProviderOrder(fishing, FISHING_PROVIDER_ORDER);
  assert.equal(FISHING_PROVIDER_ORDER.length, 15);
  assert.match(fishing, /code: 'ygrfish'[\s\S]*layout: 'wide-hero'[\s\S]*badge: 'hot'/);
  assert.match(fishing, /code: 'misoltfish'[\s\S]*layout: 'wide-banner'/);
  assert.match(fishing, /category="fishing"/);
  assert.match(fishing, /providerAssetPlatform="mobile"/);
});

test('card keeps its configured source providers and canonical category route', () => {
  assert.match(card, /code: 'kingm'[\s\S]*layout: 'wide-hero'/);
  assert.match(card, /code: 'amb'[\s\S]*layout: 'wide-banner'/);
  assert.match(card, /providers=\{CARD_PROVIDER_SEEDS\}/);
  assert.match(card, /category="card"/);
  assert.match(card, /catalogPlatform="mobile"/);
  assert.match(card, /providerAssetPlatform="mobile"/);
  assert.doesNotMatch(card, /includeCatalogProviders/);
});

test('shared provider flow launches the selected provider into the canonical mobile browse route', () => {
  assert.match(shared, /data-category-flow="provider-only"/);
  assert.match(shared, /data-provider-games-stage="providers"/);
  assert.match(shared, /data-provider-launch="true"/);
  assert.match(shared, /data-provider-code=\{provider\.code\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /\/browse\/games\?category=/);
  assert.match(shared, /platform=mobile/);
  assert.doesNotMatch(shared, /data-provider-games-stage="games"|setSelectedCode|backToProviders|data-game-id=/);
});

test('shared provider cards resolve local artwork before remote fallback', () => {
  assert.match(shared, /resolveLocalAssetOrSource\(provider\.source, providerAssetPlatform\)/);
  assert.match(shared, /data-provider-image-source=\{provider\.source\}/);
  assert.match(shared, /fallbackImage\(event\.currentTarget, resolvedSource, provider\.source\)/);
  assert.match(shared, /loadSourceCategoryCatalog\(catalogSlug, sourceProviders, catalogPlatform, controller\.signal\)/);
});

test('provider grid preserves source full-row and two-column geometry', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
});

test('mobile category owner routes slot fishing and card to their source components', () => {
  assert.match(owner, /import MobileSlotProviderPage/);
  assert.match(owner, /import MobileFishingProviderPage/);
  assert.match(owner, /import MobileCardProviderPage/);
  assert.match(owner, /activeCategory === 'slot'[\s\S]*<MobileSlotProviderPage \/>/);
  assert.match(owner, /activeCategory === 'fishing'[\s\S]*<MobileFishingProviderPage \/>/);
  assert.match(owner, /activeCategory === 'card'[\s\S]*<MobileCardProviderPage \/>/);
});
