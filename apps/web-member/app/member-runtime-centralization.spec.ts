import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildMemberHomeDataRuntime } from './member-home-data-runtime';
import { buildConfiguredMemberNavigation } from './member-navigation-runtime';
import type {
  MemberFeatureVisibilityRuntime,
  MemberHomeContentRuntime,
  MemberIconRuntime,
} from './member-runtime-contract';
import type { TypedPublicSiteSettings } from './site-settings-types';

const providerSource = readFileSync(new URL('./member-runtime-provider.tsx', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('./components/member-modal-system.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');

test('provider exposes one runtime for settings, session, navigation and home data', () => {
  assert.match(providerSource, /useSiteSettings\(\)/);
  assert.match(providerSource, /useMemberSession\(\)/);
  assert.match(providerSource, /buildConfiguredMemberNavigation/);
  assert.match(providerSource, /buildMemberHomeDataRuntime/);
  assert.match(providerSource, /memberThemeCssVariables/);
  assert.match(providerSource, /homeData/);
});

test('desktop and mobile home consume one structured runtime controller', () => {
  assert.match(controllerSource, /runtime\.homeData\.tournaments/);
  assert.match(controllerSource, /runtime\.homeData\.leaderboard/);
  assert.match(controllerSource, /runtime\.homeData\.miniGames/);
  assert.match(controllerSource, /\.source-tournament__slide/);
  assert.match(controllerSource, /\.v47-mobile-rank-panel/);
  assert.match(controllerSource, /\.reference-leaderboard/);
  assert.match(controllerSource, /\.v47-mobile-board-row/);
});

test('shell navigation and member summary are runtime owned', () => {
  assert.match(shellSource, /useMemberRuntime\(\)/);
  assert.match(shellSource, /runtime\.navigation/);
  assert.match(shellSource, /runtime\.summary\.pendingCount/);
  assert.match(shellSource, /runtime\.summary\.walletAvailable/);
});

test('shared overlay system covers modal sheet and drawer accessibility', () => {
  assert.match(modalSource, /MemberBottomSheet/);
  assert.match(modalSource, /MemberDrawer/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /focusable/);
  assert.match(modalSource, /event\.key === 'Escape'/);
  assert.match(modalSource, /restoreFocus/);
});

test('configured navigation respects locale, visibility, order and feature gates', () => {
  const settings = settingsWith({
    navigation_items_json: JSON.stringify([
      { id: 'hidden', labelTh: 'ซ่อน', labelEn: 'Hidden', href: '/hidden', enabled: false, order: 0 },
      { id: 'sports', labelTh: 'กีฬากลาง', labelEn: 'Shared sports', href: '/browse/games?category=sport', iconKey: 'sport', feature: 'games', desktop: true, mobile: true, order: 2 },
      { id: 'home', labelTh: 'หน้าแรกกลาง', labelEn: 'Shared home', href: '/', iconKey: 'home', order: 1 },
    ]),
  });
  const navigation = buildConfiguredMemberNavigation(settings, 'th', FEATURES, ICONS);
  assert.deepEqual(navigation.map((item) => item.id), ['home', 'sports']);
  assert.equal(navigation[0]?.label, 'หน้าแรกกลาง');
  assert.equal(navigation[1]?.icon, '/sport.png');
});

test('home data parses one tournament leaderboard and mini game source', () => {
  const settings = settingsWith({
    tournament_items_json: JSON.stringify([{ id: 'cup', title: 'ถ้วยกลาง', players: [{ rank: 1, name: 'A', score: 9, stats: [1, 2, 3, 4, 5, 6] }] }]),
    leaderboard_items_json: JSON.stringify([{ rank: 1, name: 'Game A', user: '09X', amount: '999' }]),
    mini_games_json: JSON.stringify([{ id: 'wheel', title: 'วงล้อกลาง', subtitle: 'ทุกหน้าจอ', href: '/wheel', image: '/wheel.png', enabled: true }]),
  });
  const data = buildMemberHomeDataRuntime(settings, HOME);
  assert.equal(data.tournaments[0]?.title, 'ถ้วยกลาง');
  assert.equal(data.tournaments[0]?.players[0]?.stats[5], 6);
  assert.equal(data.leaderboard[0]?.amount, '999');
  assert.equal(data.miniGames[0]?.title, 'วงล้อกลาง');
});

function settingsWith(features: Record<string, unknown>) {
  return {
    website: {}, branding: {}, theme: {}, icons: {}, seo: {}, contact: {}, maintenance: {}, legal: {},
    features,
  } as unknown as TypedPublicSiteSettings;
}

const FEATURES = {
  registration: true, login: true, deposit: true, withdraw: true, promotion: true, bonus: true,
  affiliate: true, support: true, kyc: true, games: true, profile: true, notifications: true,
  hero: true, announcement: true, activity: true, news: true, tournament: true, jackpot: true,
  leaderboard: true, miniGames: true, popularGames: true, onlineGames: true, liveGames: true,
  classicGames: true, usageGuide: true,
} satisfies MemberFeatureVisibilityRuntime;

const ICONS = {
  home: '/home.png', casino: '/casino.png', slot: '/slot.png', fishing: '/fishing.png', sport: '/sport.png',
  card: '/card.png', lottery: '/lottery.png', live: '/live.png', search: '/search.png', mission: '/mission.png',
  announcement: '/announcement.png', promotion: '/promotion.png', activity: '/activity.png', news: '/news.png',
  tournament: '/tournament.png', jackpot: '/jackpot.png', leaderboard: '/leaderboard.png', miniGame: '/mini.png',
  popular: '/popular.png', online: '/online.png', classic: '/classic.png', contact: '/contact.png', close: '/close.svg',
} satisfies MemberIconRuntime;

const HOME = {
  announcement: { id: 'a', title: 'a', summary: 'a', href: '', image: '', icon: '', kind: 'system', priority: 0 },
  quickActions: [], activities: [], news: [],
  tournament: { id: 't', title: 't', summary: 't', href: '', image: '', icon: '', kind: 'activity', priority: 0 },
  jackpot: { title: 'J', amount: '1', subtitle: '', image: '', icon: '', enabled: true },
  leaderboard: { title: 'L', entries: [{ rank: 1, name: 'Fallback', user: '-', amount: '0', image: '' }], enabled: true },
  miniGames: [{ id: 'fallback', title: 'Fallback', subtitle: '', href: '/', image: '', enabled: true }],
  sectionTitles: { popular: 'P', online: 'O', live: 'L', classic: 'C', featured: 'F', guide: 'G' },
} satisfies MemberHomeContentRuntime;
