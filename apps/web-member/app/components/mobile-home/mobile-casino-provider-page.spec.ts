import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-casino-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

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

test('shared cards resolve a Mobile catalog game before authenticated launch', () => {
  assert.match(shared, /data-category-launch-mode="provider-launch"/);
  assert.match(shared, /data-provider-launch="true"/);
  assert.match(shared, /data-provider-code=\{provider\.code\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.match(shared, /data-game-id=\{firstGame\?\.id\}/);
  assert.match(shared, /data-game-name=\{firstGame\?\.name \?\? provider\.name\}/);
  assert.match(shared, /gameDestination\(category, provider\.code, firstGame\.id\)/);
  assert.match(shared, /platform: 'mobile'/);
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
});

test('central category runtime exposes casino providers in place', () => {
  assert.match(categoryRuntime, /type MobileCategoryId = [^;]*'casino'/);
  assert.match(categoryRuntime, /data-mobile-category-content=\{category\}/);
  assert.match(categoryRuntime, /data-provider-category=\{category\}/);
  assert.match(categoryRuntime, /platform: 'mobile'/);
  assert.match(categoryRuntime, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
});
