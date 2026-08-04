import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = readFileSync(
  new URL('../../browse/source-game-catalog.ts', import.meta.url),
  'utf8',
);
const providerGames = readFileSync(
  new URL('./mobile-provider-games-category-page.tsx', import.meta.url),
  'utf8',
);
const launcher = readFileSync(
  new URL('./mobile-provider-launcher-page.tsx', import.meta.url),
  'utf8',
);

test('catalog preserves API provider identity and badge artwork before configured fallbacks', () => {
  assert.match(catalog, /const providerObject = item\.provider && typeof item\.provider === 'object'/);
  assert.match(catalog, /providerObject\?\.badgeUrl/);
  assert.match(catalog, /providerObject\?\.logoUrl/);
  assert.match(catalog, /resolveProviderArtwork\(/);
  assert.doesNotMatch(catalog, /function localizeProvider/);
});

test('slot fishing and card replace configured provider art with catalog card artwork', () => {
  assert.match(providerGames, /source:\s*provider\.card \|\| existing\.source/);
  assert.match(providerGames, /iconSource:\s*provider\.badge \|\| existing\.iconSource/);
  assert.match(providerGames, /src=\{provider\.source\}/);
  assert.match(providerGames, /data-provider-image-owner="api"/);
  assert.doesNotMatch(
    providerGames,
    /const resolvedSource = resolveLocalAssetOrSource\(provider\.source, providerAssetPlatform\)/,
  );
});

test('casino sport and lottery replace source cards with catalog card artwork', () => {
  assert.match(launcher, /source:\s*apiProvider\?\.card \|\| provider\.source/);
  assert.match(launcher, /src=\{provider\.source\}/);
  assert.match(launcher, /data-provider-image-owner="api"/);
  assert.doesNotMatch(launcher, /resolveLocalAssetOrSource/);
});
