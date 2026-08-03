import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./desktop-home-game-section-runtime.tsx', import.meta.url), 'utf8');
const catalogModel = readFileSync(new URL('../../lib/member-game-catalog-model.ts', import.meta.url), 'utf8');

test('desktop home no longer mounts the unrelated random reference image recovery owner', () => {
  assert.doesNotMatch(home, /DesktopHomeGameImageRecoveryRuntime/);
  assert.match(home, /<DesktopHomeGameSectionRuntime\s*\/>/);
});

test('catalog artwork resolves by provider and game identity', () => {
  assert.match(catalogModel, /resolveGameAssetOrSource/);
  assert.match(catalogModel, /requestedPlatform,\s*provider,\s*id/);
  assert.match(catalogModel, /resolveProviderAssetOrSource/);
  assert.match(catalogModel, /requestedPlatform,\s*provider,\s*'badge'/);
});

test('desktop strips preload artwork and skip broken games before syncing cards', () => {
  assert.match(runtime, /keepLoadableArtwork/);
  assert.match(runtime, /firstLoadableImage/);
  assert.match(runtime, /game\.imageSource/);
  assert.match(runtime, /image\.naturalWidth > 1/);
  assert.match(runtime, /slice\(0, limit\)/);
  assert.match(runtime, /selectHomeGameSection\(catalog, section, 'pc', featureSettings, 30\)/);
  assert.doesNotMatch(runtime, /Object\.fromEntries/);
});
