import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const desktopHomeData = readFileSync(new URL('./hooks/use-member-home-data.ts', import.meta.url), 'utf8');
const desktopFeedSections = readFileSync(new URL('./components/member-home/member-source-feed-sections.tsx', import.meta.url), 'utf8');
const mobileSourceRuntime = readFileSync(new URL('./components/mobile-home/mobile-source-runtime.ts', import.meta.url), 'utf8');
const catalogModel = readFileSync(new URL('./lib/member-game-catalog-model.ts', import.meta.url), 'utf8');
const memberHome = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');

test('desktop and mobile home games are loaded from their platform API catalogs and randomized', () => {
  assert.match(desktopHomeData, /getMemberGameCatalog\('pc'\)/);
  assert.match(desktopHomeData, /randomizeGameCatalog\(catalog\)/);
  assert.match(desktopFeedSections, /DesktopGameFeedProvider/);
  assert.match(desktopFeedSections, /sourceGames\.length > 0 \? sourceGames\.map\(toLobbyGame\) : FALLBACK_GAMES/);
  assert.match(mobileSourceRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(mobileSourceRuntime, /randomizeGameCatalog\(items\.map\(mapCatalogGame\)\)/);
});

test('game artwork uses the platform-aware local resolver before leaving an empty card', () => {
  assert.match(catalogModel, /image:\s*resolveGameAssetOrSource\([\s\S]*imageSource,[\s\S]*requestedPlatform/);
  assert.match(catalogModel, /providerIcon:\s*resolveProviderAssetOrSource\(/);
  assert.match(memberHome, /<DesktopHomeGameImageRecoveryRuntime \/>/);
});
