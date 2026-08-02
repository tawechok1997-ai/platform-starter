import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('mobile category pages use the two explicit provider launch models', () => {
  assert.match(launcher, /data-category-launch-mode="provider-launch"/);
  assert.match(launcher, /loadSourceCategoryCatalog\(category, sourceProviders, 'mobile', controller\.signal\)/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(launcher, /data-game-id=\{firstGame\?\.id\}/);
  assert.match(launcher, /gameDestination\(category, provider\.code, firstGame\.id\)/);
  assert.match(launcher, /\/browse\/games\?category=/);

  assert.match(providerGames, /data-category-flow="provider-games"/);
  assert.match(providerGames, /data-provider-games-stage="providers"/);
  assert.match(providerGames, /data-provider-games-stage="games"/);
  assert.match(providerGames, /data-provider-select="true"/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);

  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(highlight, new RegExp(`activeCategory === '${category}'`));
  }
});

test('inline game controls belong only to slot fishing and card provider-game pages', () => {
  assert.match(providerGames, /FilterIcon/);
  assert.match(providerGames, /filterOpen/);
  assert.match(providerGames, /filterButton/);
  assert.match(providerGames, /filterMenu/);
  assert.match(providerGames, /INITIAL_GAME_COUNT = 60/);
  assert.match(providerGames, /GAME_PAGE_STEP = 60/);
  assert.match(providerGames, /slotGamesToolbar/);
  assert.match(providerGames, /slotGameGrid/);
  assert.match(providerGames, /backToProviders/);

  assert.doesNotMatch(launcher, /filterOpen|filterMenu|slotGamesToolbar|slotGameGrid|backToProviders/);
});

test('category controller ends after state accessibility and home-bottom ownership', () => {
  assert.match(categoryRuntime, /\[data-mobile-bottom-owner="true"\]/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(categoryRuntime, /root\.dataset\.mobileActiveCategory = activeCategory/);
  assert.match(categoryRuntime, /return null/);
  assert.doesNotMatch(categoryRuntime, /loadSourceCategoryCatalog|data-provider-launch|data-game-id|FilterIcon/);
});
