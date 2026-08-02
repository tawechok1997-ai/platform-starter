import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cardPage = readFileSync(new URL('./mobile-card-provider-page.tsx', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');

test('card category only renders providers with verified configured artwork', () => {
  assert.doesNotMatch(cardPage, /includeCatalogProviders/);
  assert.match(cardPage, /providers=\{CARD_PROVIDER_SEEDS\}/);
});

test('broken artwork collapses the complete provider or game card', () => {
  assert.match(launcher, /function hideProviderCard/);
  assert.match(launcher, /card\.hidden = true/);
  assert.match(launcher, /card\.setAttribute\('aria-hidden', 'true'\)/);

  assert.match(providerGames, /\[data-provider-select="true"\], \[data-game-id\]/);
  assert.match(providerGames, /card\.hidden = true/);
  assert.match(providerGames, /card\.setAttribute\('aria-hidden', 'true'\)/);
});
