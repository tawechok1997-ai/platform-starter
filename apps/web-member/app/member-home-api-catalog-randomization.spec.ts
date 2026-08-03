import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const desktopHomeData = readFileSync(new URL('./hooks/use-member-home-data.ts', import.meta.url), 'utf8');
const mobileSourceRuntime = readFileSync(new URL('./components/mobile-home/mobile-source-runtime.ts', import.meta.url), 'utf8');
const catalogModel = readFileSync(new URL('./lib/member-game-catalog-model.ts', import.meta.url), 'utf8');
const memberHome = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');

test('desktop and mobile home games are loaded from their platform API catalogs and randomized', () => {
  assert.match(desktopHomeData, /getMemberGameCatalog\('pc'\)/);
  assert.match(desktopHomeData, /randomizeGameCatalog\(catalog\)/);
  assert.match(mobileSourceRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(mobileSourceRuntime, /randomizeGameCatalog\(items\.map\(mapCatalogGame\)\)/);
});

test('game artwork prefers local files across platforms before leaving an empty card', () => {
  assert.match(catalogModel, /const alternatePlatform: MemberGamePlatform = platform === 'pc' \? 'mobile' : 'pc'/);
  assert.match(catalogModel, /if \(isLocalAsset\(alternate\)\) return alternate/);
  assert.match(memberHome, /<DesktopHomeGameImageRecoveryRuntime \/>/);
});
