import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-sport-provider-page.tsx', import.meta.url), 'utf8');
const shared = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('sport source page keeps the supplied five-provider order', () => {
  const providers = ['sbo', 'lali', 'bcs', 'muay', 'saba'];

  let previous = -1;
  for (const provider of providers) {
    const current = page.indexOf(`code: '${provider}'`);
    assert.ok(current > previous, `${provider} must keep the source order`);
    previous = current;
  }

  assert.match(page, /1_1_h\/sbo\.png/);
  assert.match(page, /1_1_l\/lali\.png/);
  assert.match(page, /code: 'bcs'[\s\S]*isNew: true/);
  assert.match(page, /code: 'muay'[\s\S]*isNew: true/);
  assert.match(page, /code: 'saba'[\s\S]*layout: 'half'/);
});

test('sport uses provider launch mode without game-level identifiers', () => {
  assert.match(page, /category="sport"/);
  assert.match(page, /title=\{\{ th: 'กีฬา', en: 'Sports' \}\}/);
  assert.match(shared, /data-category-launch-mode="provider"/);
  assert.match(shared, /data-provider-launch="true"/);
  assert.doesNotMatch(shared, /data-game-id=/);
});

test('mobile category owner switches sport in place', () => {
  assert.match(owner, /import MobileSportProviderPage/);
  assert.match(owner, /activeCategory === 'sport'/);
  assert.match(owner, /<MobileSportProviderPage \/>/);
});
