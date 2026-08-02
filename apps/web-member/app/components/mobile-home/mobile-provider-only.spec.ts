import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const lottery = readFileSync(new URL('./mobile-lottery-provider-page.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('all mobile category pages render provider artwork only', () => {
  assert.match(launcher, /data-category-launch-mode="provider-only"/);
  assert.match(providerGames, /data-category-flow="provider-only"/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(providerGames, /data-provider-launch="true"/);

  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(highlight, new RegExp(`activeCategory === '${category}'`));
  }
});

test('mobile provider pages do not restore lower filters or inline game stages', () => {
  for (const source of [launcher, providerGames]) {
    assert.doesNotMatch(source, /FilterIcon/);
    assert.doesNotMatch(source, /filterOpen/);
    assert.doesNotMatch(source, /filterButton/);
    assert.doesNotMatch(source, /filterMenu/);
  }

  assert.doesNotMatch(providerGames, /slotGamesToolbar/);
  assert.doesNotMatch(providerGames, /slotGameGrid/);
  assert.doesNotMatch(providerGames, /data-provider-games-stage="games"/);
  assert.doesNotMatch(lottery, /filterable/);
});
