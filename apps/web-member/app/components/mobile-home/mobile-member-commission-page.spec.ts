import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./mobile-member-commission-page.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./mobile-member-commission-page.module.css', import.meta.url), 'utf8');
const sectionOwner = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const authenticatedHome = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');

test('commission drawer opens the commission page', () => {
  assert.ok(authenticatedHome.includes('href="/mobile/member/commission"'));
  assert.ok(!authenticatedHome.includes('MobileCommissionPopupBridge'));
});

test('commission page uses the affiliate commission ledger', () => {
  assert.ok(sectionOwner.includes("commission: { title: 'รายได้คอมมิชชั่น', endpoint: '/member/affiliate/profile'"));
  assert.ok(sectionOwner.includes('<MobileMemberCommissionPage'));
  assert.ok(page.includes('normalizeCommissions(payload)'));
  assert.ok(page.includes('data-mobile-commission-income-page="true"'));
});

test('commission source controls remain present', () => {
  for (const copy of [
    'รายได้ที่ถอนได้', 'ถอนรายได้', 'ทั้งหมด', 'วันนี้', 'สัปดาห์ที่แล้ว',
    'เดือนที่แล้ว', 'รายได้คอมมิชชั่นทั้งหมด', 'จากเดือนที่แล้ว',
    'รายละเอียดรายได้คอมมิชชั่น', 'ค้นหา', 'ประเภท', 'รายได้', 'ไม่พบข้อมูล',
  ]) assert.ok(page.includes(copy), `missing ${copy}`);
  assert.ok(page.includes("openMobileMemberPopup('commission-income')"));
});

test('commission source geometry remains present', () => {
  for (const geometry of [
    'width: min(100%, 428px)', 'height: 50px', 'height: 138px',
    'height: 75px', 'height: 24px', 'min-height: 77px', 'max-height: 475px',
  ]) assert.ok(styles.includes(geometry), `missing ${geometry}`);
});
