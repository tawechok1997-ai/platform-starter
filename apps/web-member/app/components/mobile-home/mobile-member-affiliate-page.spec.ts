import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('../../mobile/member/affiliate/page.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./mobile-member-affiliate-page.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('authenticated referral action routes to the dedicated mobile affiliate page', () => {
  assert.match(popupRuntime, /label: 'แนะนำเพื่อน'[\s\S]*page: 'affiliate'/);
  assert.match(route, /MobileMemberAffiliatePage/);
  assert.match(route, /memberApiFetch\('\/member\/affiliate\/profile'/);
  assert.match(route, /next=\/mobile\/member\/affiliate/);
});

test('affiliate page keeps the source sections and working referral actions', () => {
  for (const label of [
    'รายได้จากเครือข่าย',
    'รายได้ที่ถอนได้',
    'ถอนรายได้',
    'ลิงก์แนะนำเพื่อน',
    'วิธีการสร้างเครือข่าย',
    'รายได้จากเครือข่ายทั้งหมด',
    'รายละเอียดการทำรายได้',
    'ยอดแทง',
    'รายได้',
    'ไม่พบข้อมูล',
  ]) {
    assert.match(page, new RegExp(label));
  }

  assert.match(page, /navigator\.clipboard\.writeText\(referralUrl\)/);
  assert.match(page, /resolveLocalAssetByBasename\('\/images\/income_bg\.webp', 'pc'\)/);
  assert.match(page, /commissions\.reduce<number>/);
});
