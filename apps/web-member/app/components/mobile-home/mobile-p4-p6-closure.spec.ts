import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(
  new URL('./mobile-p4-p6-closure-runtime.tsx', import.meta.url),
  'utf8',
);
const guestNavigation = readFileSync(
  new URL('./mobile-p6-guest-bottom-navigation.tsx', import.meta.url),
  'utf8',
);
const home = readFileSync(
  new URL('../../member-home.tsx', import.meta.url),
  'utf8',
);
const root = readFileSync(
  new URL('./mobile-home-root.tsx', import.meta.url),
  'utf8',
);
const sourceContent = readFileSync(
  new URL('./mobile-source-content.tsx', import.meta.url),
  'utf8',
);
const popupRuntime = readFileSync(
  new URL('./mobile-member-popup-runtime.tsx', import.meta.url),
  'utf8',
);

test('P4 mounts one final Mobile Home completion owner', () => {
  assert.match(home, /import MobileP4P6ClosureRuntime from '.\/components\/mobile-home\/mobile-p4-p6-closure-runtime'/);
  assert.equal((home.match(/<MobileP4P6ClosureRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /owner\.dataset\.mobileP4P6Ready = 'true'/);
  assert.match(runtime, /width:\s*min\(100%, 640px\)\s*!important/);
  assert.match(runtime, /data-mobile-content-slot='after-highlight'/);
  assert.match(runtime, /data-provider-games-stage/);
});

test('P4 category rail drives the rendered category owner through one event', () => {
  assert.match(runtime, /const CATEGORY_EVENT = 'member:mobile-category-select'/);
  assert.match(runtime, /new CustomEvent\(CATEGORY_EVENT/);
  assert.match(runtime, /detail:\s*\{ category \}/);
  assert.match(runtime, /const categoryButton = event\.target\.closest/);
  assert.match(runtime, /closest<HTMLElement>\(CATEGORY_SELECTOR\)/);
  assert.match(root, /data-mobile-category-id=\{item\.id\}/);
});

test('P5 resolves Home game launches from the central Mobile catalog', () => {
  assert.match(runtime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(runtime, /indexCatalog\(items, catalogIndex\)/);
  assert.match(runtime, /findCatalogGame\(catalogIndex, gameId, gameCode\)/);
  assert.match(
    runtime,
    /const query = new URLSearchParams\(\{[\s\S]*category,[\s\S]*provider,[\s\S]*game,[\s\S]*platform:\s*'mobile'[\s\S]*\}\)/,
  );
  assert.match(runtime, /window\.location\.assign\(`\/games\?\$\{query\.toString\(\)\}`\)/);
  assert.match(sourceContent, /data-game-id/);
  assert.match(sourceContent, /data-game-code/);
  assert.match(sourceContent, /data-provider-code/);
});

test('P5 does not intercept provider pages that already own canonical anchors', () => {
  assert.match(runtime, /if \(action\.closest\('a\[href\]'\)\) return/);
  assert.match(runtime, /dataset\.mobileGameLaunch = 'canonical'/);
  assert.match(runtime, /dataset\.gamePlatform = 'mobile'/);
});

test('P6 drawer owns dialog semantics, keyboard trap and focus restoration', () => {
  assert.match(runtime, /panel\.setAttribute\('role', 'dialog'\)/);
  assert.match(runtime, /panel\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(runtime, /event\.key === 'Escape'/);
  assert.match(runtime, /event\.key !== 'Tab'/);
  assert.match(runtime, /last\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /first\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /returnTarget\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runtime, /data-mobile-drawer-owner='p6'/);
});

test('P6 bottom navigation is Home-only for both guest and authenticated owners', () => {
  assert.match(home, /import MobileP6GuestBottomNavigation from '.\/components\/mobile-home\/mobile-p6-guest-bottom-navigation'/);
  assert.equal((home.match(/<MobileP6GuestBottomNavigation\s*\/>/g) ?? []).length, 1);
  assert.match(guestNavigation, /if \(summary\.isLoggedIn\) return null/);
  assert.match(guestNavigation, /data-mobile-bottom-navigation-mode="guest"/);
  assert.match(guestNavigation, /data-mobile-member-bottom-navigation="true"/);
  assert.match(guestNavigation, /window\.location\.assign\('\/\?auth=login'\)/);
  assert.match(popupRuntime, /data-mobile-member-bottom-navigation="true"/);
  assert.match(runtime, /mobileMemberHomeSurface/);
  assert.match(runtime, /mobileDrawerOpen/);
  assert.match(runtime, /data-mobile-member-bottom-navigation='true'/);
  assert.match(runtime, /data-mobile-member-home-surface='true'\]\[data-mobile-drawer-open='false'/);
  assert.match(runtime, /min-height:\s*60px\s*!important/);
  assert.match(runtime, /min-height:\s*44px/);
  assert.match(runtime, /env\(safe-area-inset-bottom, 0px\)/);
});
