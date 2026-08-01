import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-slot-provider-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

const SLOT_PROVIDER_ORDER = [
  'ygr', 'hotdog', 'misolt', 'jl', 'pp', 'kingm', 'spg', 'jkgx2', 'fachai', 'rsg',
  'pgsoft', 'kaga', 'hacksaw', 'cq', 'redtiger', 'hbn', 'wmslot', 'evp', 'netent', 'ps',
  'pokslot', 'edp', 'spp', 'ame', 'bng', 'r88', 'cala', 'glx', 'l22', 'reg', 'ygg', 'fs',
  'pgsus', 'n2', 'ap', 'amb', 'ask', 'nlc', 'vp', 'drag', 'acewin', 'rb7slot',
] as const;

test('slot provider page keeps the supplied 42-provider order and geometry', () => {
  let previous = -1;
  for (const provider of SLOT_PROVIDER_ORDER) {
    const current = page.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the supplied source order`);
    previous = current;
  }

  assert.equal(SLOT_PROVIDER_ORDER.length, 42);
  assert.match(page, /code: 'ygr'[\s\S]*layout: 'wide-hero'[\s\S]*badge: 'hot'/);
  assert.match(page, /code: 'hotdog'[\s\S]*layout: 'wide-banner'[\s\S]*badge: 'new'/);
  assert.match(page, /code: 'jl'[\s\S]*badge: 'hot'/);
  for (const provider of ['hacksaw', 'vp', 'drag', 'acewin', 'rb7slot']) {
    assert.match(page, new RegExp(`code: '${provider}'[\\s\\S]*badge: 'new'`));
  }
});

test('slot uses provider selection before game launch', () => {
  assert.match(page, /data-category-flow="provider-games"/);
  assert.match(page, /data-slot-step="providers"/);
  assert.match(page, /data-provider-select="true"/);
  assert.match(page, /data-next-step="games"/);
  assert.doesNotMatch(page, /data-provider-launch="true"/);
  assert.match(page, /setSelectedProvider\(provider\)/);
  assert.match(page, /data-slot-step="games"/);
  assert.match(page, /onBack=\{\(\) => setSelectedProvider\(null\)\}/);
});

test('selected provider loads and filters the mobile slot catalog', () => {
  assert.match(page, /loadSourceCategoryCatalog\('slot', SLOT_SOURCE_PROVIDERS, 'mobile'/);
  assert.match(page, /catalog\.games\.filter\(\(game\) => game\.provider === selectedCode\)/);
  assert.match(page, /INITIAL_GAME_COUNT = 60/);
  assert.match(page, /GAME_PAGE_STEP = 60/);
  assert.match(page, /visibleCount < games\.length/);
});

test('slot game cards hand real game identifiers to the shared launcher', () => {
  assert.match(page, /data-game-id=\{game\.id\}/);
  assert.match(page, /data-game-code=\{game\.id\}/);
  assert.match(page, /data-game-name=\{game\.name\}/);
  assert.match(page, /data-provider-code=\{game\.provider \?\? provider\.code\}/);
  assert.match(page, /data-game-category="slot"/);
});

test('slot mobile geometry contains provider and game grids', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /\.hotProviderBadge\s*\{[\s\S]*height:\s*19px[\s\S]*linear-gradient/);
  assert.match(css, /\.slotGameGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.backButton\s*\{/);
  assert.match(css, /\.loadMoreButton\s*\{/);
});

test('mobile category owner switches slot to the two-step component', () => {
  assert.match(owner, /import MobileSlotProviderPage/);
  assert.match(owner, /activeCategory === 'slot'/);
  assert.match(owner, /<MobileSlotProviderPage \/>/);
});
