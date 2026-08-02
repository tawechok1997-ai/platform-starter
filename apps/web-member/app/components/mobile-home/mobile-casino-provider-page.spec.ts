import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-casino-provider-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

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

test('category runtime exposes provider-level mobile destinations without game identifiers', () => {
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /data-provider-code=\{provider\.code\}/);
  assert.match(categoryRuntime, /data-provider-category=\{category\}/);
  assert.match(categoryRuntime, /\/browse\/games\?category=/);
  assert.match(categoryRuntime, /platform=mobile/);
  assert.doesNotMatch(categoryRuntime, /data-game-id=/);
});

test('legacy casino source grid retains its supplied geometry', () => {
  assert.match(css, /\.grid\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*gap:\s*10px/);
  assert.match(css, /\.card\s*\{[\s\S]*width:\s*calc\(50% - 5px\)/);
  assert.match(css, /\.wide\s*\{[\s\S]*width:\s*100%/);
});

test('mobile category owner switches casino in place', () => {
  assert.match(owner, /activeCategory === 'casino'/);
  assert.match(owner, /<MobileCasinoProviderPage \/>/);
});
