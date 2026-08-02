import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlights = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const iconCss = readFileSync(new URL('./mobile-category-provider-icons.module.css', import.meta.url), 'utf8');

test('game categories never hide the shared lower feed, shortcut or footer', () => {
  assert.match(runtime, /data-mobile-bottom-owner/);
  assert.match(runtime, /data-mobile-section-owner=\"source-content\"/);
  assert.match(runtime, /element\.hidden = false/);
  assert.match(runtime, /element\.style\.removeProperty\('display'\)/);
  assert.doesNotMatch(runtime, /bottomStructure\.hidden = activeCategory !== 'home'/);
  assert.doesNotMatch(runtime, /setProperty\('display', 'none', 'important'\)/);
  assert.match(highlights, /if \(activeCategory !== 'home'\) return <MobileSourceContent \/>/);
});

test('one API catalog owner renders every category with real provider icons', () => {
  assert.match(runtime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(runtime, /game\.providerIconSource/);
  assert.match(runtime, /game\.providerIcon/);
  assert.match(runtime, /providers\/set\/1_1_badge/);
  assert.match(runtime, /data-category-flow=\"provider-icons\"/);
  assert.match(runtime, /data-provider-icon-source/);

  for (const obsoleteOwner of [
    'MobileCasinoProviderPage',
    'MobileSlotProviderPage',
    'MobileFishingProviderPage',
    'MobileSportProviderPage',
    'MobileCardProviderPage',
    'MobileLotteryProviderPage',
  ]) {
    assert.doesNotMatch(highlights, new RegExp(obsoleteOwner));
  }
});

test('provider icon panel is placed above the shared lower feed', () => {
  assert.match(runtime, /panel\.parentElement\.prepend\(panel\)/);
  assert.match(iconCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(iconCss, /object-fit: contain/);
});
