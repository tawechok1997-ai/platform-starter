import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vipPage = readFileSync(new URL('./mobile-member-vip-page.tsx', import.meta.url), 'utf8');
const vipStyles = readFileSync(new URL('./mobile-member-vip-page.module.css', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');

test('authenticated VIP page reuses the existing route and member profile owner', () => {
  assert.match(sectionPage, /vip:\s*\{\s*title:\s*'ระดับสมาชิก VIP',\s*endpoint:\s*'\/member\/auth\/profile'/);
  assert.match(sectionPage, /<MobileMemberVipPage/);
  assert.match(vipPage, /useMemberRuntime\(\)/);
  assert.match(vipPage, /summary\.vipLevel/);
  assert.match(vipPage, /data-mobile-member-page="vip"/);
});

test('Bronze is the current base tier and progresses toward Silver at 50,000 credits', () => {
  assert.match(vipPage, /key:\s*'bronze'[\s\S]*?threshold:\s*0/);
  assert.match(vipPage, /key:\s*'silver'[\s\S]*?threshold:\s*50_000/);
  assert.match(vipPage, /ยอดแทงสะสม/);
  assert.match(vipPage, /ทำยอดแทงเพิ่มอีก/);
  assert.match(vipPage, /เพื่อเป็นระดับ/);
  assert.match(vipPage, /vipPeriodEndsAt/);
});

test('authenticated VIP source sections and birthday action remain present', () => {
  for (const label of [
    'โบนัสพิเศษวันเกิด',
    'กรอกวันเกิด',
    'สิทธิประโยชน์ VIP',
    'โบนัสพิเศษต่างๆ',
    'คืนเงินพิเศษ',
    'ฝ่ายบริการลูกค้าพิเศษ รายบุคคล',
    'ยอดถอนสูงสุดต่อวัน',
    'สิทธิ์เข้าร่วมกิจกรรมต่างๆ',
    'กีฬา',
    'คาสิโน',
    'ยิงปลา',
    'สล็อต',
    'หวย',
  ]) {
    assert.ok(vipPage.includes(label), `missing ${label}`);
  }

  assert.match(vipPage, /summary\.isLoggedIn \? <BirthdayPrompt/);
  assert.match(vipPage, /window\.location\.assign\('\/profile'\)/);
});

test('VIP geometry follows the supplied 428px mobile source', () => {
  assert.match(vipStyles, /width:\s*min\(100%,\s*428px\)/);
  assert.match(vipStyles, /\.header\s*\{[\s\S]*?height:\s*50px/);
  assert.match(vipStyles, /\.tierTimeline\s*\{[\s\S]*?height:\s*100px/);
  assert.match(vipStyles, /\.birthdayPrompt\s*\{[\s\S]*?height:\s*72px/);
  assert.match(vipStyles, /\.benefitGrid\s*\{[\s\S]*?repeat\(3/);
  assert.match(vipStyles, /\.cashbackGrid\s*\{[\s\S]*?repeat\(2/);
});
