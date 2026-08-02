import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-lottery-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('lottery source page keeps the supplied two-card order', () => {
  const lotmw = page.indexOf("code: 'lotmw'");
  const dac = page.indexOf("code: 'dac'");
  assert.ok(lotmw >= 0);
  assert.ok(dac > lotmw);
  assert.match(page, /1_1_h\/lotmw\.png/);
  assert.match(page, /1_1_h\/dac\.png/);
  assert.match(page, /code: 'lotmw'[\s\S]*isNew: true/);
  assert.match(shared, /<NewBadge label="NEW" \/>/);
});

test('lottery source page keeps its localized heading and category identity', () => {
  assert.match(page, /title=\{\{ th: 'หวย', en: 'Lottery' \}\}/);
  assert.match(page, /countLabel=\{\{ th: 'เกม', en: 'games' \}\}/);
  assert.match(page, /category="lottery"/);
});

test('current category runtime launches lottery at provider level', () => {
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /data-provider-code=\{provider\.code\}/);
  assert.match(categoryRuntime, /data-provider-category=\{category\}/);
  assert.doesNotMatch(categoryRuntime, /data-game-id=/);
});

test('mobile category owner switches lottery in place', () => {
  assert.match(owner, /import MobileLotteryProviderPage/);
  assert.match(owner, /activeCategory === 'lottery'/);
  assert.match(owner, /<MobileLotteryProviderPage \/>/);
});
