import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launcher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const lottery = readFileSync(new URL('./mobile-lottery-provider-page.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('all mobile category pages render provider artwork only', () => {
  assert.match(launcher, /data-category-launch-mode="provider-only"/);
  assert.match(providerGames, /data-category-flow="provider-only"/);
  assert.match(categoryRuntime, /data-mobile-provider-artwork-only="true"/);
  assert.match(categoryRuntime, /data-category-flow="provider-only"/);
  assert.match(launcher, /data-provider-launch="true"/);
  assert.match(providerGames, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /platform=mobile/);

  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']) {
    assert.match(highlight, new RegExp(`activeCategory === '${category}'`));
  }
});

test('mobile provider pages do not restore lower filters or inline game stages', () => {
  for (const source of [launcher, providerGames, categoryRuntime]) {
    assert.doesNotMatch(source, /FilterIcon/);
    assert.doesNotMatch(source, /filterOpen/);
    assert.doesNotMatch(source, /filterButton/);
    assert.doesNotMatch(source, /filterMenu/);
    assert.doesNotMatch(source, /activeProvider/);
    assert.doesNotMatch(source, /visibleGameCount/);
    assert.doesNotMatch(source, /providerPickerHeading/);
    assert.doesNotMatch(source, /providerGameGroups/);
    assert.doesNotMatch(source, /data-game-id/);
  }

  assert.doesNotMatch(providerGames, /slotGamesToolbar/);
  assert.doesNotMatch(providerGames, /slotGameGrid/);
  assert.doesNotMatch(providerGames, /data-provider-games-stage="games"/);
  assert.doesNotMatch(lottery, /filterable/);
});

test('non-home mobile categories end after the provider grid', () => {
  assert.match(categoryRuntime, /\[data-mobile-bottom-owner="true"\]/);
  assert.match(categoryRuntime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(categoryRuntime, /bottomStructure\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.doesNotMatch(categoryRuntime, /ค่ายเกม' : 'Providers'/);
  assert.doesNotMatch(categoryRuntime, />ทั้งหมด</);
  assert.doesNotMatch(categoryRuntime, /providerCoverName/);
  assert.doesNotMatch(categoryRuntime, /provider\.games\.map/);
});
