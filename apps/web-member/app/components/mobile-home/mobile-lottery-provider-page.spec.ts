import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-lottery-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-casino-provider-page.module.css', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('lottery source page keeps the supplied two-card order', () => {
  const lotmw = page.indexOf("code: 'lotmw'");
  const dac = page.indexOf("code: 'dac'");
  assert.ok(lotmw >= 0);
  assert.ok(dac > lotmw);
  assert.match(page, /1_1_h\/lotmw\.png/);
  assert.match(page, /1_1_h\/dac\.png/);
  assert.match(page, /code: 'lotmw'[\s\S]*isNew: true/);
  assert.doesNotMatch(page, /code: 'dac'[\s\S]*isNew: true/);
  assert.match(shared, /<NewBadge label="NEW" \/>/);
});

test('lottery heading and filter match the supplied mobile source', () => {
  assert.match(page, /title=\{\{ th: 'หวย', en: 'Lottery' \}\}/);
  assert.match(page, /countLabel=\{\{ th: 'เกม', en: 'games' \}\}/);
  assert.match(page, /filterable/);
  assert.match(page, /stacked/);
  assert.match(shared, /data-mobile-provider-filter-button="true"/);
  assert.match(shared, /ProviderFilter = 'all' \| 'new'/);
  assert.match(shared, /providers\.filter\(\(provider\) => provider\.isNew\)/);
  assert.match(css, /\.filterButton\s*\{[\s\S]*height:\s*20px/);
});

test('lottery cards launch at category provider level', () => {
  assert.match(page, /category="lottery"/);
  assert.match(shared, /data-category-launch-mode="provider"/);
  assert.match(shared, /data-provider-code=\{provider\.code\}/);
  assert.match(shared, /data-game-category=\{category\}/);
  assert.doesNotMatch(shared, /data-game-id=/);
});

test('central category runtime exposes lottery providers in place', () => {
  assert.match(categoryRuntime, /type MobileCategoryId = [^;]*'lottery'/);
  assert.match(categoryRuntime, /data-mobile-category-content=\{category\}/);
  assert.match(categoryRuntime, /data-provider-category=\{category\}/);
  assert.match(categoryRuntime, /platform: 'mobile'/);
  assert.match(categoryRuntime, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
});
