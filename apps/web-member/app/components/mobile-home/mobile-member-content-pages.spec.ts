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
const tournamentStyles = readFileSync(new URL('../../mobile/member/tournament/mobile-tournament-page.module.css', import.meta.url), 'utf8');

test('mobile drawer keeps promotion news and activity inside the current home content', () => {
  assert.match(menu, /\['โปรโมชั่น', '\/mobile\/member\/promotions', 'promotion'\]/);
  assert.match(menu, /\['ข่าวสาร', '\/mobile\/member\/news', 'news'\]/);
  assert.match(menu, /\['กิจกรรม', '\/mobile\/member\/activity', 'activity'\]/);
  assert.match(highlight, /MOBILE_INLINE_MEMBER_TABS/);
  assert.match(highlight, /'\/mobile\/member\/promotions': 'promotions'/);
  assert.match(highlight, /'\/mobile\/member\/news': 'news'/);
  assert.match(highlight, /'\/mobile\/member\/activity': 'activities'/);
  assert.match(highlight, /event\.preventDefault\(\)/);
  assert.match(highlight, /mobile-highlight-tab-/);
  assert.match(highlight, /scrollIntoView/);
  assert.match(promotionRoute, /MobileMemberPromotionsPage/);
  assert.match(newsRoute, /MobileMemberNewsPage/);
  assert.match(activityRoute, /MobileMemberActivityPage/);
});

test('mobile tournament artwork requires login and continues to the source page', () => {
  assert.match(homeRoute, /MobileTournamentEntryBridge/);
  assert.match(tournamentEntry, /tournament-mobile-source\.svg/);
  assert.match(tournamentEntry, /MOBILE_TOURNAMENT_ROUTE = '\/mobile\/member\/tournament'/);
  assert.match(tournamentEntry, /MEMBER_AUTH_OPEN_EVENT = 'member:auth-open'/);
  assert.match(tournamentEntry, /detail: \{ mode: 'login', next: MOBILE_TOURNAMENT_ROUTE \}/);
  assert.match(tournamentEntry, /router\.push\(MOBILE_TOURNAMENT_ROUTE\)/);
  assert.match(tournamentEntry, /event\.key !== 'Enter' && event\.key !== ' '/);
});

test('mobile tournament page matches the source shell and empty states', () => {
  assert.match(tournamentRoute, /data-mobile-member-page="tournament"/);
  assert.match(tournamentRoute, /<h1>ทัวร์นาเมนต์<\/h1>/);
  assert.match(tournamentRoute, /ทัวร์นาเมนต์ขณะนี้/);
  assert.match(tournamentRoute, /ทัวร์นาเมนต์ที่จบลงแล้ว/);
  assert.match(tournamentRoute, /ยังไม่มีรายการทัวร์นาเมนต์ในขณะนี้/);
  assert.match(tournamentRoute, /memberApiFetch\('\/games\/tournaments'/);
  assert.match(tournamentRoute, /detail: \{ mode: 'login', next: MOBILE_TOURNAMENT_ROUTE \}/);
  assert.match(tournamentStyles, /max-width: 428px/);
  assert.match(tournamentStyles, /height: 50px/);
  assert.match(tournamentStyles, /#944fe8/);
  assert.match(tournamentStyles, /#7600a8/);
});

test('promotion page keeps the source category and card contract', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) assert.match(promotions, new RegExp(label));
  assert.match(promotions, /อ่านเงื่อนไข/);
  assert.match(promotions, /หมดเขต/);
  assert.match(promotions, /data-mobile-member-page="promotions"/);
  assert.match(promotionRoute, /\/public\/site-settings/);
  assert.match(promotionRoute, /SOURCE_PROMOTION_PAYLOAD/);
});

test('promotion fallback preserves all source cards and order', () => {
  assert.equal((promotionSource.match(/\n {2}campaign\(/g) ?? []).length, 18);
  assert.match(promotionSource, /โปรโมชั่นฝากครั้งแรกของวันรับโบนัส 10%/);
  assert.match(promotionSource, /Happy Sunday❤️/);
  assert.match(promotionSource, /Happy Monday💛/);
  assert.match(promotionSource, /คืนยอดเสีย ทุกสัปดาห์ 💜/);
  assert.match(promotionSource, /ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨/);
});

test('news page matches the source empty state', () => {
  assert.match(news, /<h1>ข่าวสาร<\/h1>/);
  assert.match(news, /MobileMemberEmptyState/);
  assert.match(news, /label="ไม่มีข้อความใหม่"/);
  assert.match(news, /data-mobile-member-page="news"/);
});

test('activity page keeps the three source cards and canonical auth join bridge', () => {
  assert.match(activity, /1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d\.jpeg/);
  assert.match(activity, /1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d\.jpeg/);
  assert.match(activity, /1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b\.png/);
  assert.match(activity, /title: 'ภารกิจ'/);
  assert.match(activity, /title: 'ทายผลหวย'/);
  assert.match(activity, /title: 'ทำยอด Turn รับรางวัลจุใจ'/);
  assert.match(activity, /MEMBER_AUTH_OPEN_EVENT/);
  assert.match(activity, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.match(activity, /เข้าร่วม/);
  assert.match(activityRoute, /\/public\/site-settings/);
});
