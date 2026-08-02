import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const resolver = readFileSync(new URL('./local-asset-by-basename.ts', import.meta.url), 'utf8');
const generator = readFileSync(
  new URL('../../tools/generate-local-asset-basename-map.mjs', import.meta.url),
  'utf8',
);
const slot = readFileSync(
  new URL('../components/mobile-home/mobile-slot-provider-page.tsx', import.meta.url),
  'utf8',
);
const fishing = readFileSync(
  new URL('../components/mobile-home/mobile-fishing-provider-page.tsx', import.meta.url),
  'utf8',
);
const card = readFileSync(
  new URL('../components/mobile-home/mobile-card-provider-page.tsx', import.meta.url),
  'utf8',
);

test('asset generator publishes separate provider and game identity maps', () => {
  assert.match(generator, /LOCAL_PROVIDER_ASSET_PATHS_BY_IDENTITY/);
  assert.match(generator, /LOCAL_GAME_ASSET_PATHS_BY_IDENTITY/);
  assert.match(generator, /indexProviderAsset\(providersByIdentity/);
  assert.match(generator, /else if \(indexGameAsset\(gamesByIdentity/);
  assert.match(generator, /`\$\{platform\}\|\$\{providerIdentity\}\|\$\{kind\}`/);
  assert.match(generator, /`\$\{platform\}\|\$\{providerIdentity\}\|\$\{gameIdentity\}`/);
});

test('runtime resolves provider and game artwork by platform identity before basename', () => {
  assert.match(resolver, /LOCAL_PROVIDER_ASSET_PATHS_BY_IDENTITY/);
  assert.match(resolver, /LOCAL_GAME_ASSET_PATHS_BY_IDENTITY/);
  assert.match(resolver, /export function resolveProviderAssetOrSource/);
  assert.match(resolver, /export function resolveGameAssetOrSource/);
  assert.match(resolver, /classifyStructuredAsset\(sourcePath\)/);
  assert.match(resolver, /return resolveStrictPlatformBasename\(source, preference\) \|\| source/);
  assert.doesNotMatch(
    resolver,
    /resolveProviderAssetOrSource[\s\S]*resolveLocalAssetByBasename\(source, preference\)/,
  );
});

test('provider and game identity mapping stays scoped away from generic CMS artwork', () => {
  assert.match(generator, /segment\.identity === 'providers'/);
  assert.match(generator, /segments\[index\]\.identity === 'games'/);
  assert.doesNotMatch(generator, /promotionByIdentity|bannerByIdentity|highlightByIdentity/);
});

test('Mobile slot fishing and card no longer borrow PC game artwork', () => {
  for (const source of [slot, fishing, card]) {
    assert.match(source, /catalogPlatform="mobile"/);
    assert.match(source, /providerAssetPlatform="mobile"/);
    assert.match(source, /gameAssetPlatform="mobile"/);
    assert.doesNotMatch(source, /gameAssetPlatform="pc"/);
  }
});
