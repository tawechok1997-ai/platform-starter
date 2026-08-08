import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const menu = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const sharedSource = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');
const tournamentEntry = readFileSync(new URL('./mobile-tournament-entry-bridge.tsx', import.meta.url), 'utf8');
const promotions = readFileSync(new URL('./mobile-member-promotions-live-page.tsx', import.meta.url), 'utf8');
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
  assert.match(highlight, /useMobilePromotionsSource\(\)/);
  assert.match(highlight, /useMobileActivitiesSource\(\)/);
  assert.match(highlight, /useMobileNewsSource\(\)/);
  assert.match(promotionRoute, /MobileMemberPromotionsLivePage/);
  assert.match(newsRoute, /MobileMemberNewsLivePage/);
  assert.match(activityRoute, /MobileMemberActivityPage/);
});

test('mobile tournament artwork preserves login continuation', () => {
  assert.match(homeRoute, /MobileTournamentEntryBridge/);
  assert.match(tournamentEntry, /MOBILE_TOURNAMENT_ROUTE = '\/mobile\/member\/tournament'/);
  assert.match(tournamentEntry, /detail: \{ mode: 'login', next: MOBILE_TOURNAMENT_ROUTE \}/);
  assert.match(tournamentRoute, /memberApiFetch\('\/games\/tournaments'/);
});

test('promotion page keeps source categories with shared API-owned content states', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) {
    assert.match(promotions, new RegExp(label));
  }
  assert.match(promotionRoute, /useMobilePromotionsSource\(\)/);
  assert.match(sharedSource, /loadJson\('\/public\/site-settings'\)/);
  assert.match(sharedSource, /loadJson\('\/public\/promotions'\)/);
  assert.match(sharedSource, /skipAuth:\s*true/);
  assert.doesNotMatch(promotionRoute, /SOURCE_PROMOTION_PAYLOAD/);
  assert.match(promotions, /data-content-source="api"/);
  assert.match(promotions, /aria-busy=\{loading\}/);
  assert.match(promotions, /ยังไม่มีโปรโมชั่นที่เผยแพร่/);
});

test('news page keeps the CMS-owned empty state', () => {
  assert.match(news, /<h1>ข่าวสาร<\/h1>/);
  assert.match(news, /cmsContentSetting\(settings\)/);
  assert.match(news, /item\.kind === 'news'/);
  assert.match(news, /data-content-source="cms"/);
  assert.match(news, /ไม่มีข้อความใหม่/);
});

test('activity page keeps API-owned cards and the canonical shared public activity API', () => {
  assert.match(activity, /data-content-source="api"/);
  assert.match(activity, /resolveLocalAssetOrSource\(item\.image, 'mobile'\)/);
  assert.match(activity, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.match(activity, /image\.dataset\.activityImageFallback = 'generic'/);
  assert.doesNotMatch(activity, /SOURCE_ACTIVITIES/);
  assert.match(activityRoute, /useMobileActivitiesSource\(\)/);
  assert.match(sharedSource, /loadJson\('\/public\/activities'\)/);
  assert.match(sharedSource, /skipAuth:\s*true/);
});
