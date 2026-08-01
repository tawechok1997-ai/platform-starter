import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const sourceOverrides = readFileSync(new URL('../../member-authenticated-source-overrides.css', import.meta.url), 'utf8');

test('referral row copies the resolved invite link without navigating away', () => {
  assert.match(runtime, /data-mobile-member-drawer-copy="referral"/);
  assert.match(runtime, /referralLink\.startsWith\('http'\)/);
  assert.match(runtime, /window\.location\.origin/);
  assert.match(runtime, /copyReferralLink\(absoluteLink\)/);
  assert.match(runtime, /navigator\.clipboard\?\.writeText/);
  assert.match(runtime, /document\.execCommand\('copy'\)/);
  assert.match(runtime, /if \(copied\) setReferralToast\(true\)/);
});

test('successful copy shows the supplied success message and dismiss action', () => {
  assert.match(runtime, /สำเร็จ/);
  assert.match(runtime, /คัดลอกลิงก์ชวนเพื่อนเรียบร้อยแล้ว/);
  assert.match(runtime, /aria-label="ปิดข้อความแจ้งเตือน"/);
  assert.match(runtime, /setTimeout\(\(\) => setReferralToast\(false\), 3000\)/);
  assert.match(runtime, /#48ca93/i);
  assert.match(runtime, /#48baca/i);
});

test('toast geometry matches the authenticated mobile source card', () => {
  assert.match(sourceOverrides, /width:\s*min\(365px, calc\(100vw - 24px\)\)/);
  assert.match(sourceOverrides, /height:\s*60px/);
  assert.match(sourceOverrides, /padding:\s*20px/);
  assert.match(sourceOverrides, /gap:\s*16px/);
  assert.match(sourceOverrides, /border:\s*1px solid #48c1b5/i);
  assert.match(sourceOverrides, /background:\s*#f8fafc/i);
  assert.match(sourceOverrides, /margin-right:\s*24px/);
  assert.match(sourceOverrides, /top:\s*-10px/);
  assert.match(sourceOverrides, /-webkit-line-clamp:\s*2/);
  assert.match(sourceOverrides, /margin-left:\s*auto/);
});
