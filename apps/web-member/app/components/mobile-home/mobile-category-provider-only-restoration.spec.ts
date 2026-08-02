import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlights = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('every non-home category replaces the home feed with provider artwork only', () => {
  assert.match(runtime, /data-mobile-provider-artwork-only="true"/);
  assert.match(runtime, /data-category-flow="provider-only"/);
  assert.match(runtime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.match(runtime, /setProperty\('display', 'none', 'important'\)/);
  assert.match(runtime, /mobile-category-tab-runtime\.module\.css/);

  assert.doesNotMatch(runtime, /mobile-category-provider-icons\.module\.css/);
  assert.doesNotMatch(runtime, /data-category-flow="provider-icons"/);
  assert.doesNotMatch(runtime, /panel\.parentElement\.prepend\(panel\)/);
});

test('all six game categories use their original provider page owners', () => {
  const owners = [
    'MobileCasinoProviderPage',
    'MobileSlotProviderPage',
    'MobileFishingProviderPage',
    'MobileSportProviderPage',
    'MobileCardProviderPage',
    'MobileLotteryProviderPage',
  ];

  for (const owner of owners) assert.match(highlights, new RegExp(owner));

  assert.doesNotMatch(
    highlights,
    /game category adds its provider icon grid above this shared content/,
  );
  assert.doesNotMatch(
    highlights,
    /if \(activeCategory !== 'home'\) return <MobileSourceContent \/>/,
  );
});
