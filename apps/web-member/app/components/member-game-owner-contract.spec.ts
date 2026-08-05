import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../member-home.tsx', import.meta.url), 'utf8');
const feeds = readFileSync(new URL('./member-home/member-source-feed-sections.tsx', import.meta.url), 'utf8');
const globalFallback = readFileSync(new URL('./member-image-fallback-controller.tsx', import.meta.url), 'utf8');
const mobileAssetRuntime = readFileSync(new URL('./mobile-local-asset-runtime.tsx', import.meta.url), 'utf8');

const gameCardSelectors = [
  '[data-game-card]',
  '.source-highlight-game',
  '.source-popular-card',
  '.source-online-card',
  '.reference-game-tile',
  '.v47-mobile-game-grid > a',
  '.member-game-card',
];

test('global and Mobile generic image runtimes leave game cards to their React owner', () => {
  for (const selector of gameCardSelectors) {
    assert.ok(globalFallback.includes(selector), `global fallback must exclude ${selector}`);
    assert.ok(mobileAssetRuntime.includes(selector), `Mobile asset runtime must exclude ${selector}`);
  }

  assert.match(
    globalFallback,
    /if \(image\.closest\(GAME_ART_OWNER_SELECTOR\)\) \{[\s\S]*window\.setTimeout\([\s\S]*applyFallbackToImage\(image\)/,
  );
  assert.match(mobileAssetRuntime, /if \(image\.closest\(CARD_OWNED_MEDIA_SELECTOR\)\) return/);
});

test('Desktop Popular and Online consume the Home catalog result instead of fetching again', () => {
  assert.match(home, /DesktopGameFeedProvider/);
  assert.match(home, /popular=\{data\.popular\}/);
  assert.match(home, /online=\{data\.onlineGames\}/);
  assert.match(feeds, /createContext<DesktopGameFeedValue>/);
  assert.match(feeds, /useContext\(DesktopGameFeedContext\)/);
  assert.doesNotMatch(feeds, /getMemberGameCatalog/);
});

test('Home does not mount DOM game mutation runtimes', () => {
  assert.doesNotMatch(home, /DesktopHomeGameSectionRuntime/);
  assert.doesNotMatch(home, /MemberGameSectionRuntimeController/);
});
