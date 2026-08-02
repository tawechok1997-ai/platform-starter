import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('mobile category surface renders provider artwork before any game selection', () => {
  assert.match(categoryRuntime, /data-category-flow="provider-only"/);
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /resolveMobileProviderCover\(category, provider\.code\)/);
  assert.match(categoryRuntime, /platform: 'mobile'/);
  assert.match(categoryRuntime, /platform=mobile/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(providerGames, /data-provider-games-stage="providers"/);
});

test('slot fishing and card retain their provider-to-game stage outside the category grid', () => {
  assert.match(providerGames, /data-category-flow="provider-games"/);
  assert.match(providerGames, /data-provider-games-stage="providers"/);
  assert.match(providerGames, /data-provider-games-stage="games"/);
  assert.match(providerGames, /slotGamesToolbar/);
  assert.match(providerGames, /slotGameGrid/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);
});

test('non-home category provider grid hides the shared lower home owner', () => {
  assert.match(categoryRuntime, /\[data-mobile-bottom-owner="true"\]/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(categoryRuntime, /bottomStructure\.style\.removeProperty\('display'\)/);
});
