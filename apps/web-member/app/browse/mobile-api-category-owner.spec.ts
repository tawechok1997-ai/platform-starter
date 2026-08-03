import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const owner = readFileSync(
  new URL('./mobile-api-category-owner.tsx', import.meta.url),
  'utf8',
);
const router = readFileSync(
  new URL('./browse-games-router.tsx', import.meta.url),
  'utf8',
);
const catalog = readFileSync(
  new URL('./source-game-catalog.ts', import.meta.url),
  'utf8',
);

test('every supported mobile game category is routed through the API-only owner', () => {
  for (const slug of ['casino', 'slot', 'fishing', 'sport', 'card', 'lotto']) {
    assert.match(router, new RegExp(`MobileApiCategoryOwner slug="${slug}"`));
  }
  assert.match(owner, /loadSourceCategoryCatalog\(slug, \[\], 'mobile'/);
  assert.match(owner, /ระบบจะไม่แสดงรายการเกมจำลองแทนข้อมูลจริง/);
});

test('mobile inventory falls back to the real PC API instead of hard-coded rows', () => {
  assert.match(catalog, /platform === 'mobile' && catalogGames\.length === 0/);
  assert.match(catalog, /loadMemberGameCatalog\('pc', signal, categories\)/);
  assert.doesNotMatch(owner, /FISHING_SOURCE_ROWS|const rows =|config\.games/);
});

test('game and provider artwork can recover from the alternate local platform bundle', () => {
  assert.match(catalog, /platform === 'mobile' \? 'pc' : 'mobile'/);
  assert.match(catalog, /resolveGameAssetOrSource\(value, alternate/);
  assert.match(catalog, /resolveProviderAssetOrSource\(value, alternate/);
});
