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
  assert.match(page, /category="casino"/);
});

test('casino providers launch the first catalog game with a mobile browse fallback', () => {
  assert.match(shared, /loadSourceCategoryCatalog\(category, sourceProviders, 'mobile', controller\.signal\)/);
  assert.match(shared, /const firstGameByProvider/);
  assert.match(shared, /data-category-launch-mode="provider-launch"/);
  assert.match(shared, /data-provider-launch="true"/);
  assert.match(shared, /data-provider-code=\{provider\.code\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /data-game-id=\{firstGame\?\.id\}/);
  assert.match(shared, /data-game-platform="mobile"/);
  assert.match(shared, /gameDestination\(category, provider\.code, firstGame\.id\)/);
  assert.match(shared, /\/browse\/games\?category=/);
  assert.match(shared, /platform=mobile/);
});

test('legacy casino source grid retains its supplied geometry', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
});

test('mobile highlight owner switches casino in place', () => {
  assert.match(owner, /import MobileCasinoProviderPage/);
  assert.match(owner, /activeCategory === 'casino'/);
  assert.match(owner, /<MobileCasinoProviderPage \/>/);
});
