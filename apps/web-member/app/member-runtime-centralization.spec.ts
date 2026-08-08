import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const providerSource = readFileSync(new URL('./member-runtime-provider.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('./components/member-modal-system.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');
const navigationSource = readFileSync(new URL('./member-navigation-runtime.ts', import.meta.url), 'utf8');
const navigationStateSource = readFileSync(new URL('./components/member-navigation-state-controller.tsx', import.meta.url), 'utf8');
const navigationAuthSource = readFileSync(new URL('./components/member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const homeDataSource = readFileSync(new URL('./member-home-data-runtime.ts', import.meta.url), 'utf8');
const mobileRootSource = readFileSync(new URL('./components/mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const authenticatedMobileSource = readFileSync(new URL('./components/mobile-home/mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');

test('provider exposes one runtime for settings session navigation and home data', () => {
  assert.match(providerSource, /useSiteSettings\(\)/);
  assert.match(providerSource, /useMemberSession\(\)/);
  assert.match(providerSource, /buildConfiguredMemberNavigation/);
  assert.match(providerSource, /buildMemberHomeDataRuntime/);
  assert.match(providerSource, /MemberNavigationStateController/);
  assert.match(layoutSource, /<MemberRuntimeProvider>\s*<MemberNavigationAuthController \/>/);
});

test('desktop and mobile home consume one structured runtime', () => {
  assert.match(controllerSource, /runtime\.homeData\.tournaments/);
  assert.match(controllerSource, /runtime\.homeData\.leaderboard/);
  assert.match(controllerSource, /runtime\.homeData\.miniGames/);
  assert.match(mobileRootSource, /data-mobile-home-root="true"/);
  assert.match(authenticatedMobileSource, /useMemberRuntime\(\)/);
  assert.match(authenticatedMobileSource, /summary\.walletAvailable/);
});

test('shell navigation and member summary are runtime owned', () => {
  assert.match(shellSource, /useMemberRuntime\(\)/);
  assert.match(shellSource, /runtime\.navigation/);
  assert.match(shellSource, /runtime\.summary\.pendingCount/);
  assert.match(shellSource, /runtime\.summary\.walletAvailable/);
  assert.match(mobileRootSource, /id="mobile-home-drawer"/);
  assert.match(mobileRootSource, /PRIMARY_MENU\.map/);
  assert.match(authenticatedMobileSource, /summary\.displayName \|\| summary\.username/);
  assert.match(authenticatedMobileSource, /summary\.vipLevel/);
});

test('shared overlay system covers modal sheet and drawer accessibility', () => {
  assert.match(modalSource, /MemberBottomSheet/);
  assert.match(modalSource, /MemberDrawer/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /event\.key === 'Escape'/);
  assert.match(modalSource, /restoreFocus/);
});

test('configured navigation handles locale visibility order feature and canonical auth contracts', () => {
  assert.match(navigationSource, /navigation_items_json/);
  assert.match(navigationSource, /labelTh/);
  assert.match(navigationSource, /labelEn/);
  assert.match(navigationSource, /requiresAuth/);
  assert.match(navigationStateSource, /isMemberNavigationActive/);
  assert.match(navigationStateSource, /aria-current/);
  assert.match(navigationAuthSource, /openMemberAuth\(authMode, nextTargetFor\(rawHref\)\)/);
  assert.match(navigationAuthSource, /openMemberAuth\('login', intended\)/);
  assert.match(shellSource, /url\.searchParams\.set\('auth', request\.mode\)/);
  assert.match(shellSource, /url\.searchParams\.set\('authRequest', request\.requestId\)/);
  assert.match(shellSource, /url\.searchParams\.set\('next', request\.next\)/);
});

test('home data has one parser and Admin-controlled presentation fallback', () => {
  assert.match(homeDataSource, /tournament_items_json/);
  assert.match(homeDataSource, /leaderboard_items_json/);
  assert.match(homeDataSource, /mini_games_json/);
  assert.match(homeDataSource, /presentationDemoEnabled\(features\)/);
  assert.match(homeDataSource, /PRESENTATION_TOURNAMENTS/);
  assert.match(homeDataSource, /PRESENTATION_LEADERBOARD/);
  assert.match(homeDataSource, /PRESENTATION_MINI_GAMES/);
});
