import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const menu = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const promotions = readFileSync(new URL('./mobile-member-promotions-page.tsx', import.meta.url), 'utf8');
const news = readFileSync(new URL('./mobile-member-news-page.tsx', import.meta.url), 'utf8');
const activity = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const promotionRoute = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');
const newsRoute = readFileSync(new URL('../../mobile/member/news/page.tsx', import.meta.url), 'utf8');
const activityRoute = readFileSync(new URL('../../mobile/member/activity/page.tsx', import.meta.url), 'utf8');

test('authenticated drawer routes all three source pages', () => {
  assert.match(menu, /\['โปรโมชั่น', '\/mobile\/member\/promotions', 'promotion'\]/);
  assert.match(menu, /\['ข่าวสาร', '\/mobile\/member\/news', 'news'\]/);
  assert.match(menu, /\['กิจกรรม', '\/mobile\/member\/activity', 'activity'\]/);
  assert.match(promotionRoute, /MobileMemberPromotionsPage/);
  assert.match(newsRoute, /MobileMemberNewsPage/);
  assert.match(activityRoute, /MobileMemberActivityPage/);
});

test('promotion page keeps the source category and card contract', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) {
    assert.match(promotions, new RegExp(label));
  }
  assert.match(promotions, /อ่านเงื่อนไข/);
  assert.match(promotions, /หมดเขต/);
  assert.match(promotions, /data-mobile-member-page="promotions"/);
  assert.match(promotionRoute, /\/public\/site-settings/);
});

test('news page matches the source empty state', () => {
  assert.match(news, /<h1>ข่าวสาร<\/h1>/);
  assert.match(news, /MobileMemberEmptyState/);
  assert.match(news, /label="ไม่มีข้อความใหม่"/);
  assert.match(news, /data-mobile-member-page="news"/);
});

test('activity page keeps the three source cards and real join bridge', () => {
  assert.match(activity, /1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d\.jpeg/);
  assert.match(activity, /1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d\.jpeg/);
  assert.match(activity, /1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b\.png/);
  assert.match(activity, />ภารกิจ</);
  assert.match(activity, />ทายผลหวย</);
  assert.match(activity, /ทำยอด Turn รับรางวัลจุใจ/);
  assert.match(activity, /MEMBER_ACTIVITY_JOIN_EVENT/);
  assert.match(activity, /เข้าร่วม/);
  assert.match(activityRoute, /\/public\/site-settings/);
});
