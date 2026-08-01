import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-casino-provider-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('casino source page keeps the supplied ten-provider order', () => {
  const providers = [
    'dg',
    'sexyd',
    'yeebet',
    'sag',
    'ppcasino',
    'evt',
    'ab',
    'wmc',
    'biggamecasino',
    'astar',
  ];

  let previous = -1;
  for (const provider of providers) {
    const current = page.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the source order`);
    previous = current;
  }

  assert.match(page, /CASINO_PROVIDERS\.length/);
  assert.match(page, /1_1_h\/dg\.png/);
  assert.match(page, /1_1_l\/sexyd\.png/);
  assert.match(page, /code: 'yeebet'[\s\S]*isNew: true/);
  assert.match(page, /code: 'astar'[\s\S]*isNew: true/);
});

test('casino cards launch at provider level without a game selection page', () => {
  assert.match(page, /data-category-launch-mode="provider"/);
  assert.match(page, /data-provider-launch="true"/);
  assert.match(page, /data-provider-code=\{provider\.code\}/);
  assert.match(page, /data-game-category="casino"/);
  assert.match(page, /data-game-name=\{provider\.name\}/);
  assert.doesNotMatch(page, /data-game-id=/);
});

test('casino grid matches the source full-row and two-column geometry', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /\.hero\s*\{[\s\S]*aspect-ratio:\s*100 \/ 56/);
  assert.match(css, /\.banner\s*\{[\s\S]*aspect-ratio:\s*100 \/ 31/);
  assert.match(css, /\.newBadge\s*\{[\s\S]*height:\s*17px[\s\S]*background:\s*#00d719/);
});

test('mobile category owner switches casino in place and returns home from highlight tabs', () => {
  assert.match(owner, /target\.closest<HTMLElement>\('\[data-mobile-category-id\]'\)/);
  assert.match(owner, /member:mobile-category-select/);
  assert.match(owner, /activeCategory === 'casino'/);
  assert.match(owner, /<MobileCasinoProviderPage \/>/);
});
