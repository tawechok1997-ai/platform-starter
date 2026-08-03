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

test('catalog keeps provider artwork from the API instead of remapping it through local assets', () => {
  assert.match(catalog, /card:\s*firstText\([\s\S]*item\.provider\?\.cardUrl/);
  assert.match(catalog, /badge:\s*firstText\([\s\S]*item\.provider\?\.badgeUrl/);
  assert.doesNotMatch(catalog, /function localizeProvider/);
  assert.doesNotMatch(catalog, /card:\s*resolveAssetForPlatform/);
});

test('slot fishing and card replace configured provider art with API cardUrl', () => {
  assert.match(providerGames, /source:\s*provider\.card \|\| existing\.source/);
  assert.match(providerGames, /iconSource:\s*provider\.badge \|\| existing\.iconSource/);
  assert.match(providerGames, /src=\{provider\.source\}/);
  assert.match(providerGames, /data-provider-image-owner="api"/);
  assert.doesNotMatch(
    providerGames,
    /const resolvedSource = resolveLocalAssetOrSource\(provider\.source, providerAssetPlatform\)/,
  );
});

test('casino sport and lottery replace source cards with API cardUrl', () => {
  assert.match(launcher, /source:\s*apiProvider\?\.card \|\| provider\.source/);
  assert.match(launcher, /src=\{provider\.source\}/);
  assert.match(launcher, /data-provider-image-owner="api"/);
  assert.doesNotMatch(launcher, /resolveLocalAssetOrSource/);
});
