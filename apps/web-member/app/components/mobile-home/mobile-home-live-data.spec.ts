import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sourceRuntime = readFileSync(new URL('./mobile-source-runtime.ts', import.meta.url), 'utf8');
const sourceContent = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');
const categoryRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');
const highlightContent = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../../lib/member-game-catalog.ts', import.meta.url), 'utf8');
const homeDataRuntime = readFileSync(new URL('../../member-home-data-runtime.ts', import.meta.url), 'utf8');
const gameController = readFileSync(new URL('../member-home/public-home-game-navigation-controller.tsx', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../../manifest.ts', import.meta.url), 'utf8');
const jackpotRuntime = readFileSync(new URL('../member-home/member-jackpot-runtime.ts', import.meta.url), 'utf8');
const desktopJackpot = readFileSync(new URL('../member-home/desktop-jackpot-card.tsx', import.meta.url), 'utf8');

test('mobile home and category catalogs request mobile records only', () => {
  assert.match(sourceRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.doesNotMatch(sourceRuntime, /getMemberGameCatalog\('pc'\)/);
  assert.match(categoryRuntime, /platform:\s*'mobile'/);
  assert.match(categoryRuntime, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
  assert.doesNotMatch(categoryRuntime, /platform:\s*'pc'/);
  assert.match(catalog, /Promise\.allSettled/);
  assert.match(catalog, /DEFAULT_CATEGORIES/);
});

test('mobile game and provider cards expose the identifiers required by their launch level', () => {
  for (const token of ['data-game-id', 'data-game-code', 'data-provider-code', 'data-game-category']) {
    assert.match(sourceContent, new RegExp(token));
  }
  assert.match(categoryRuntime, /data-provider-launch="true"/);
  assert.match(categoryRuntime, /data-provider-code=\{provider\.code\}/);
  assert.match(categoryRuntime, /data-provider-category=\{category\}/);
  assert.doesNotMatch(categoryRuntime, /data-game-id=/);
  assert.match(gameController, /openMemberProviderGame/);
  assert.match(gameController, /currentUrl\.searchParams\.set\('auth', 'login'\)/);
});

test('mobile content uses public APIs or CMS and never substitutes demo records', () => {
  assert.match(sourceRuntime, /memberApiFetch\('\/games\/tournaments'/);
  assert.match(highlightContent, /memberApiFetch\('\/public\/promotions'/);
  assert.match(sourceRuntime, /cms_content\.faqs/);
  assert.match(sourceRuntime, /live_match_items/);
  assert.doesNotMatch(sourceRuntime, /FALLBACK_|DEMO_|const LIVE_MATCHES/);
  assert.doesNotMatch(highlightContent, /FALLBACK_|DEMO_|const PROMOTIONS|const ACTIVITIES/);
  assert.doesNotMatch(homeDataRuntime, /DEMO_|const TOURNAMENTS|const LEADERBOARD/);
});

test('highlight tabs preserve separate real promotion, activity, and news destinations', () => {
  assert.match(highlightContent, /home\.promotions/);
  assert.match(highlightContent, /home\.activities/);
  assert.match(highlightContent, /home\.news/);
  assert.match(highlightContent, /href=\{item\.href\}/);
  assert.match(highlightContent, /`\/browse\/promotions\/\$\{encodeURIComponent\(item\.id\)\}`/);
});

test('Android and iOS shortcut controls have install and manual Home Screen paths', () => {
  assert.match(mobileRoot, /beforeinstallprompt/);
  assert.match(mobileRoot, /installPrompt\.prompt\(\)/);
  assert.match(mobileRoot, /installShortcut\('android'\)/);
  assert.match(mobileRoot, /installShortcut\('ios'\)/);
  assert.match(mobileRoot, /Add to Home screen/);
  assert.match(manifest, /display:\s*'standalone'/);
  assert.doesNotMatch(mobileRoot, /href="\/download"/);
});

test('mobile home, drawer, data states, and game launch overlay include English copy', () => {
  for (const phrase of ['Open member menu', 'Register', 'Sign in', 'Payment methods', 'Add on Android']) {
    assert.match(mobileRoot, new RegExp(phrase));
  }
  assert.match(sourceContent, /Unable to load games/);
  assert.match(highlightContent, /No published activities yet/);
  assert.match(gameController, /Connecting to the game provider/);
});

test('desktop and mobile jackpots share one continuous simulator when no real amount exists', () => {
  assert.match(desktopJackpot, /useMemberJackpotLabel\(home\.jackpot\.amount\)/);
  assert.match(sourceContent, /useMemberJackpotLabel\(runtime\.jackpot\.amount\)/);
  assert.match(sourceContent, /runtime\.jackpot\.enabled\s*\?/);
  assert.doesNotMatch(sourceContent, /runtime\.jackpot\.enabled\s*&&\s*runtime\.jackpot\.amount/);
  assert.match(jackpotRuntime, /useSyncExternalStore/);
  assert.match(jackpotRuntime, /MEMBER_JACKPOT_EPOCH_MS/);
});
