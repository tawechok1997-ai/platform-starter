import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const providerSource = readFileSync(new URL('./member-runtime-provider.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const gameSectionSource = readFileSync(new URL('./components/member-game-section-runtime-controller.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('./components/member-modal-system.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');
const navigationSource = readFileSync(new URL('./member-navigation-runtime.ts', import.meta.url), 'utf8');
const navigationStateSource = readFileSync(new URL('./components/member-navigation-state-controller.tsx', import.meta.url), 'utf8');
const navigationAuthSource = readFileSync(new URL('./components/member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const homeDataSource = readFileSync(new URL('./member-home-data-runtime.ts', import.meta.url), 'utf8');
const mobileHomeSource = readFileSync(new URL('./components/mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const mobileAuthenticatedSource = readFileSync(new URL('./components/mobile-home/mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');

test('provider exposes one runtime for settings, session, navigation and home data', () => {
  assert.match(providerSource, /useSiteSettings\(\)/);
  assert.match(providerSource, /useMemberSession\(\)/);
  assert.match(providerSource, /buildConfiguredMemberNavigation/);
  assert.match(providerSource, /buildMemberHomeDataRuntime/);
  assert.match(providerSource, /memberThemeCssVariables/);
  assert.match(providerSource, /homeData/);
  assert.match(providerSource, /MemberNavigationStateController/);
  assert.match(layoutSource, /<MemberRuntimeProvider>\s*<MemberNavigationAuthController \/>/);
});

test('desktop and mobile home consume one structured runtime controller', () => {
  assert.match(controllerSource, /runtime\.homeData\.tournaments/);
  assert.match(controllerSource, /runtime\.homeData\.leaderboard/);
  assert.match(controllerSource, /runtime\.homeData\.miniGames/);
  assert.match(controllerSource, /runtimeSource = 'desktop-primary'/);
  assert.doesNotMatch(controllerSource, /features\.tournament && runtime\.features\.activity/);
  assert.match(mobileHomeSource, /useMemberRuntime\(\)/);
  assert.match(mobileHomeSource, /const \{ navigation \} = useMemberRuntime\(\)/);
  assert.match(mobileHomeSource, /navigation\.find\(\(candidate\) => candidate\.id === id && candidate\.mobile\)/);
  assert.equal((mobileHomeSource.match(/function MobileAuthActions\(/g) ?? []).length, 1);
});

test('game sections enforce shared desktop and mobile limits', () => {
  assert.match(gameSectionSource, /section\.mobileLimit/);
  assert.match(gameSectionSource, /section\.desktopLimit/);
  assert.match(gameSectionSource, /data-section-kind/);
  assert.match(gameSectionSource, /runtimeLimitHidden/);
});

test('shell and authenticated mobile surfaces consume runtime-owned summary data', () => {
  assert.match(shellSource, /useMemberRuntime\(\)/);
  assert.match(shellSource, /runtime\.navigation/);
  assert.match(shellSource, /runtime\.summary\.pendingCount/);
  assert.match(shellSource, /runtime\.summary\.walletAvailable/);
  assert.match(mobileAuthenticatedSource, /useMemberRuntime\(\)/);
  assert.match(mobileAuthenticatedSource, /summary\.displayName \|\| summary\.username/);
  assert.match(mobileAuthenticatedSource, /summary\.walletAvailable/);
  assert.match(mobileAuthenticatedSource, /summary\.vipLevel/);
});

test('shared overlay system covers modal sheet and drawer accessibility', () => {
  assert.match(modalSource, /MemberBottomSheet/);
  assert.match(modalSource, /MemberDrawer/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /focusable/);
  assert.match(modalSource, /event\.key === 'Escape'/);
  assert.match(modalSource, /restoreFocus/);
});

test('configured navigation handles locale visibility order feature and auth contracts', () => {
  assert.match(navigationSource, /navigation_items_json/);
  assert.match(navigationSource, /labelTh/);
  assert.match(navigationSource, /labelEn/);
  assert.match(navigationSource, /requiresAuth/);
  assert.match(navigationSource, /\.sort\(\(left, right\) => left\.order - right\.order\)/);
  assert.match(navigationStateSource, /isMemberNavigationActive/);
  assert.match(navigationStateSource, /aria-current/);
  assert.match(navigationAuthSource, /requiresAuth/);
  assert.match(navigationAuthSource, /url\.searchParams\.set\('auth', mode\)/);
  assert.match(navigationAuthSource, /safeNextTarget\(next\)/);
  assert.match(navigationAuthSource, /url\.searchParams\.set\('next', safeNext\)/);
  assert.match(navigationAuthSource, /router\.replace\(`\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`/);
});

test('home data has one parser and fails empty instead of inventing production records', () => {
  assert.match(homeDataSource, /tournament_items_json/);
  assert.match(homeDataSource, /leaderboard_items_json/);
  assert.match(homeDataSource, /mini_games_json/);
  assert.match(homeDataSource, /normalizeTournaments/);
  assert.match(homeDataSource, /normalizeLeaderboard/);
  assert.match(homeDataSource, /normalizeMiniGames/);
  assert.match(homeDataSource, /function firstStructured/);
  assert.match(homeDataSource, /Invalid CMS JSON is ignored/);
  assert.equal((homeDataSource.match(/if \(!Array\.isArray\(value\)\) return \[\];/g) ?? []).length, 2);
  assert.match(homeDataSource, /return fallback/);
  assert.doesNotMatch(homeDataSource, /DESKTOP_TOURNAMENT_MOCKS|DEMO_TOURNAMENT_DATA_ENABLED|NEXT_PUBLIC_ENABLE_DEMO_TOURNAMENT_DATA/);
});
