import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-casino-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('casino source page keeps the supplied ten-provider order', () => {
  const providers = ['dg', 'sexyd', 'yeebet', 'sag', 'ppcasino', 'evt', 'ab', 'wmc', 'biggamecasino', 'astar'];
  let previous = -1;
  for (const provider of providers) {
    const current = page.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the source order`);
    previous = current;
  }
  assert.match(page, /1_1_h\/dg\.png/);
  assert.match(page, /1_1_l\/sexyd\.png/);
  assert.match(page, /code: 'yeebet'[\s\S]*isNew: true/);
  assert.match(page, /code: 'astar'[\s\S]*isNew: true/);
  assert.match(page, /category="casino"/);
});

test('shared cards launch at provider level without a game selection page', () => {
  assert.match(shared, /data-category-launch-mode="provider"/);
  assert.match(shared, /data-provider-launch="true"/);
  assert.match(shared, /data-provider-code=\{provider\.code\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /data-game-name=\{provider\.name\}/);
  assert.doesNotMatch(shared, /data-game-id=/);
});

test('provider grid matches the source full-row and two-column geometry', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /\.hero\s*\{[\s\S]*aspect-ratio:\s*100 \/ 56/);
  assert.match(css, /\.banner\s*\{[\s\S]*aspect-ratio:\s*100 \/ 31/);
  assert.match(css, /\.newBadge\s*\{[\s\S]*height:\s*17px[\s\S]*background:\s*#00d719/);
});

test('provider categories hide home-only sections through explicit stage owners', () => {
  for (const ownerName of ['hero', 'auth-actions', 'announcement', 'highlight-tabs']) {
    assert.match(css, new RegExp(`data-mobile-section-owner='${ownerName}'`));
  }
  assert.match(css, /:has\(\.providerLauncherRoot\)/);
  assert.match(css, /:has\(\.providerSelectionRoot\)/);
  assert.doesNotMatch(css, /:has\(\.root\)/);
  assert.match(css, /display:\s*none !important/);
});

test('mobile category owner switches casino in place', () => {
  assert.match(owner, /activeCategory === 'casino'/);
  assert.match(owner, /<MobileCasinoProviderPage \/>/);
});
