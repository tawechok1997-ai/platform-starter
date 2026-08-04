import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const generatorSource = readFileSync(
  new URL('../../tools/generate-local-asset-basename-map.mjs', import.meta.url),
  'utf8',
);
const nextConfigSource = readFileSync(new URL('../../next.config.js', import.meta.url), 'utf8');
const resolverSource = readFileSync(new URL('./local-asset-by-basename.ts', import.meta.url), 'utf8');
const catalogModelSource = readFileSync(new URL('./member-game-catalog-model.ts', import.meta.url), 'utf8');

test('indexes PC and Mobile inventories instead of dropping Mobile provider logos', () => {
  assert.match(generatorSource, /const platform = assetPlatform\(relative\)/);
  assert.match(generatorSource, /platformCounts\[platform\] \+= 1/);
  assert.match(generatorSource, /asset-mobile\//);
  assert.doesNotMatch(generatorSource, /isLegacyMobileAssetPath/);
  assert.doesNotMatch(generatorSource, /if \(isLegacyMobileAssetPath\(relative\)\) continue/);
});

test('serves canonical Mobile assets directly and only repairs the historical typo root', () => {
  assert.match(nextConfigSource, /canonicalMobileAssetRoot = '\/assets\/asset-mobile'/);
  assert.match(nextConfigSource, /source: '\/assets\/asset-moblie\/:path\*'/);
  assert.match(nextConfigSource, /destination: `\$\{canonicalMobileAssetRoot\}\/:path\*`/);
  assert.doesNotMatch(
    nextConfigSource,
    /source: '\/assets\/asset-mobile\/:path\*'[\s\S]{0,160}destination: `\$\{canonicalPcAssetRoot\}/,
  );
});

test('provider icons keep the requested platform through catalog mapping and basename resolution', () => {
  assert.match(catalogModelSource, /providerIcon:\s*resolveProviderAssetOrSource\([\s\S]*providerIconSource,[\s\S]*requestedPlatform/);
  assert.match(resolverSource, /preference === 'mobile'/);
  assert.match(resolverSource, /if \(platform === 'mobile'\) score -= 70/);
  assert.match(resolverSource, /if \(platform === 'pc'\) score \+= 90/);
});
