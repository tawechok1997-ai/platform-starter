import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sourceRuntime = readFileSync(new URL('./mobile-source-runtime.ts', import.meta.url), 'utf8');
const sourceContent = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');
const highlightContent = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const memberContentSources = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');
const providerLauncher = readFileSync(new URL('./mobile-provider-launcher-page.tsx', import.meta.url), 'utf8');
const providerGames = readFileSync(new URL('./mobile-provider-games-category-page.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../../lib/member-game-catalog.ts', import.meta.url), 'utf8');
const homeDataRuntime = readFileSync(new URL('../../member-home-data-runtime.ts', import.meta.url), 'utf8');
const gameController = readFileSync(new URL('../member-home/public-home-game-navigation-controller.tsx', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../../manifest.ts', import.meta.url), 'utf8');
const jackpotRuntime = readFileSync(new URL('../member-home/member-jackpot-runtime.ts', import.meta.url), 'utf8');
const desktopJackpot = readFileSync(new URL('../member-home/desktop-jackpot-card.tsx', import.meta.url), 'utf8');

test('mobile home and category catalogs request mobile records only', () => {
  assert.match(sourceRuntime, /getMemberGameCatalog\('mobile'\)/);
  assert.match(providerLauncher, /loadSourceCategoryCatalog\(category, sourceProviders, 'mobile', controller\.signal\)/);
  assert.match(providerLauncher, /platform: 'mobile'/);
  assert.match(providerGames, /loadSourceCategoryCatalog\(catalogSlug, sourceProviders, catalogPlatform, controller\.signal\)/);
  assert.doesNotMatch(sourceRuntime, /getMemberGameCatalog\('pc'\)/);
  assert.match(catalog, /Promise\.allSettled/);
  assert.match(catalog, /DEFAULT_CATEGORIES/);
});

test('mobile game cards and provider cards delegate to the canonical controller contracts', () => {
  for (const attribute of ['data-game-id', 'data-game-code', 'data-provider-code', 'data-game-category']) assert.match(sourceContent, new RegExp(attribute));
  assert.match(providerLauncher, /data-provider-launch="true"/);
  assert.match(providerLauncher, /data-provider-code=\{provider\.code\}/);
  assert.match(providerLauncher, /data-game-category=\{category\}/);
  assert.match(providerGames, /data-game-id=\{game\.id\}/);
  assert.match(gameController, /openMemberProviderGame/);
  assert.match(gameController, /currentUrl\.searchParams\.set\('auth', 'login'\)/);
});

test('mobile content uses public APIs or CMS and keeps presentation records outside operational APIs', () => {
  assert.match(sourceRuntime, /memberApiFetch\('\/games\/tournaments'/);
  assert.match(memberContentSources, /loadJson\('\/public\/promotions'\)/);
  assert.match(memberContentSources, /loadJson\('\/public\/site-settings'\)/);
  assert.match(memberContentSources, /loadJson\('\/public\/activities'\)/);
  assert.match(memberContentSources, /skipAuth:\s*true/);
  assert.match(sourceRuntime, /cms_content\.faqs/);
  assert.match(sourceRuntime, /live_match_items/);
  assert.doesNotMatch(sourceRuntime, /const LIVE_MATCHES/);
  assert.doesNotMatch(highlightContent, /const PROMOTIONS|const ACTIVITIES|memberApiFetch/);
  assert.doesNotMatch(homeDataRuntime, /const TOURNAMENTS|const LEADERBOARD/);
});

test('highlight tabs preserve separate real promotion, activity, and news destinations', () => {
  assert.match(highlightContent, /useMobilePromotionsSource\(\)/);
  assert.match(highlightContent, /useMobileActivitiesSource\(\)/);
  assert.match(highlightContent, /useMobileNewsSource\(\)/);
  assert.match(highlightContent, /activeTab === 'promotions'/);
  assert.match(highlightContent, /activeTab === 'activities'/);
  assert.match(highlightContent, /activeTab === 'news'/);
  assert.match(highlightContent, /href=\{item\.href\}/);
  assert.match(memberContentSources, /href:\s*'\/mobile\/member\/promotions'/);
  assert.match(memberContentSources, /'\/mobile\/member\/activity'/);
  assert.match(memberContentSources, /'\/mobile\/member\/news'/);
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
  for (const phrase of ['Open member menu', 'Register', 'Sign in', 'Payment methods', 'Add on Android']) assert.match(mobileRoot, new RegExp(phrase));
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
