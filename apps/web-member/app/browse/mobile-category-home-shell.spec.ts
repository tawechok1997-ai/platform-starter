import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const owner = readFileSync(new URL('./mobile-api-category-owner.tsx', import.meta.url), 'utf8');
const redirect = readFileSync(new URL('./mobile-home-category-redirect.tsx', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('../components/mobile-home/mobile-category-query-bridge.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../member-home.tsx', import.meta.url), 'utf8');

test('mobile browse categories redirect into the Mobile Home owner while Desktop keeps its route page', () => {
  assert.match(owner, /if \(!mobile\) return <>\{desktop\}<\/>;/);
  assert.match(owner, /<MobileHomeCategoryRedirect slug=\{slug\} \/>/);
  assert.match(redirect, /window\.location\.replace\(destination\.toString\(\)\)/);
});

test('every category maps to the inline Home category contract', () => {
  for (const category of ['casino', 'slot', 'fishing', 'sport', 'card']) {
    assert.match(redirect, new RegExp(`${category}: '${category}'`));
  }
  assert.match(redirect, /lotto: 'lottery'/);
});

test('Mobile Home activates category queries without removing the top chrome', () => {
  assert.match(home, /import MobileCategoryQueryBridge/);
  assert.match(home, /<MobileHomeRoot[\s\S]*<MobileCategoryQueryBridge \/>/);
  assert.match(bridge, /data-mobile-category-id/);
  assert.match(bridge, /button\.click\(\)/);
  assert.match(bridge, /window\.history\.pushState/);
  assert.match(bridge, /window\.addEventListener\('popstate'/);
});
