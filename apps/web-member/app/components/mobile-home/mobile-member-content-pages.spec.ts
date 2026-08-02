import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const menu = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const tournamentEntry = readFileSync(new URL('./mobile-tournament-entry-bridge.tsx', import.meta.url), 'utf8');
const promotions = readFileSync(new URL('./mobile-member-promotions-page.tsx', import.meta.url), 'utf8');
const promotionSource = readFileSync(new URL('./mobile-member-promotion-source.ts', import.meta.url), 'utf8');
const news = readFileSync(new URL('./mobile-member-news-page.tsx', import.meta.url), 'utf8');
const activity = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const homeRoute = readFileSync(new URL('../../page.tsx', import.meta.url), 'utf8');
const promotionRoute = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');
const newsRoute = readFileSync(new URL('../../mobile/member/news/page.tsx', import.meta.url), 'utf8');
const activityRoute = readFileSync(new URL('../../mobile/member/activity/page.tsx', import.meta.url), 'utf8');
const tournamentRoute = readFileSync(new URL('../../mobile/member/tournament/page.tsx', import.meta.url), 'utf8');

test('mobile drawer keeps promotion news and activity routes', () => {
  assert.match(menu, /\['โปรโมชั่น', '\/mobile\/member\/promotions', 'promotion'\]/);
  assert.match(menu, /\['ข่าวสาร', '\/mobile\/member\/news', 'news'\]/);
  assert.match(menu, /\['กิจกรรม', '\/mobile\/member\/activity', 'activity'\]/);
  assert.match(highlight, /MOBILE_INLINE_MEMBER_TABS/);
  assert.match(promotionRoute, /MobileMemberPromotionsPage/);
  assert.match(newsRoute, /MobileMemberNewsPage/);
  assert.match(activityRoute, /MobileMemberActivityPage/);
});

test('mobile tournament artwork preserves login continuation', () => {
  assert.match(homeRoute, /MobileTournamentEntryBridge/);
  assert.match(tournamentEntry, /MOBILE_TOURNAMENT_ROUTE = '\/mobile\/member\/tournament'/);
  assert.match(tournamentEntry, /detail: \{ mode: 'login', next: MOBILE_TOURNAMENT_ROUTE \}/);
  assert.match(tournamentRoute, /memberApiFetch\('\/games\/tournaments'/);
});

test('promotion page keeps source categories and fallback cards', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) assert.match(promotions, new RegExp(label));
  assert.match(promotionRoute, /\/public\/site-settings/);
  assert.match(promotionRoute, /SOURCE_PROMOTION_PAYLOAD/);
  assert.equal((promotionSource.match(/\n {2}campaign\(/g) ?? []).length, 18);
});

test('news page matches the source empty state', () => {
  assert.match(news, /<h1>ข่าวสาร<\/h1>/);
  assert.match(news, /MobileMemberEmptyState/);
  assert.match(news, /label="ไม่มีข้อความใหม่"/);
});

test('activity page keeps source cards and the canonical public activity API', () => {
  for (const basename of [
    '1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d.jpeg',
    '1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
    '1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  ]) assert.match(activity, new RegExp(basename.replaceAll('.', '\\.')));
  assert.match(activity, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.match(activityRoute, /memberApiFetch\('\/public\/activities'/);
  assert.match(activityRoute, /skipAuth: true/);
});
