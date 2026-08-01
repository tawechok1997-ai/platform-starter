import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const runtimeCss = readFileSync(new URL('./mobile-authenticated-home-runtime.module.css', import.meta.url), 'utf8');

test('authenticated mobile shell reuses the guest header and drawer owners', () => {
  assert.equal((memberHome.match(/<MobileAuthenticatedHomeRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /querySelector<HTMLElement>\('\[data-mobile-section-owner="header"\] > div'\)/);
  assert.match(runtime, /querySelector<HTMLElement>\('#mobile-home-drawer'\)/);
  assert.match(runtime, /createPortal\(/);
  assert.doesNotMatch(runtime, /<aside|drawerBackdrop|data-mobile-drawer-dismiss/);
  assert.doesNotMatch(runtimeCss, /transform\s*:/);
});

test('logged-in header replaces only guest language and auth controls', () => {
  assert.match(runtime, /summary\.isLoggedIn/);
  assert.match(runtime, /\[data-mobile-section-owner="auth-actions"\]/);
  assert.match(runtime, /\[data-mobile-auth-layout="drawer"\]/);
  assert.match(runtime, /button\[aria-label="เปลี่ยนภาษา"\]/);
  assert.match(runtime, /className=\{styles\.headerSearch\}/);
  assert.match(runtime, /public-member-wallet-action/);
  assert.match(runtime, /summary\.walletAvailable/);
  assert.doesNotMatch(runtime, /hero|announcement|highlight-tabs|category-menu|shortcut|footer/);
});

test('mobile member menu reuses the existing desktop popup runtimes', () => {
  assert.equal((runtime.match(/<MemberHeaderFinanceRuntime\s+locale=\{locale\}\s*\/>/g) ?? []).length, 1);
  assert.equal((runtime.match(/<MemberMenuIncomeSafeRuntime\s+locale=\{locale\}\s*\/>/g) ?? []).length, 1);
  assert.equal((runtime.match(/<MemberMenuSpecialBonusRuntime\s+locale=\{locale\}\s*\/>/g) ?? []).length, 1);
  assert.equal((runtime.match(/<MemberMenuSecondaryRuntime\s+locale=\{locale\}\s*\/>/g) ?? []).length, 1);
  assert.equal((runtime.match(/<MemberMenuVipRuntime\s+locale=\{locale\}\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /primaryMenu\.classList\.add\('public-member-menu-grid'\)/);
  assert.match(runtime, /secondaryMenu\.classList\.add\('public-member-menu-grid', 'public-member-menu-grid--secondary'\)/);
  assert.match(runtime, /data-member-language-trigger/);
  assert.match(runtime, /\/browse\/promotions\?view=activity/);
  assert.doesNotMatch(runtime, /function\s+(DepositPopup|WithdrawPopup|CouponPopup|IncomeTransferPopup|MemberVipModal)/);
});

test('authenticated drawer matches the supplied member structure and central session', () => {
  assert.match(runtime, /data-mobile-authenticated-drawer-content="true"/);
  assert.match(runtime, /summary\.displayName \|\| summary\.username/);
  assert.match(runtime, /summary\.vipLevel/);
  assert.equal((runtime.match(/href="\/deposit"/g) ?? []).length >= 2, true);
  assert.match(runtime, /href="\/withdraw"/);
  assert.match(runtime, /public-member-income-row/);
  assert.match(runtime, /public-member-referral-row/);
  assert.match(runtime, /onClick=\{logout\}/);
  assert.match(runtime, /resolveLocalAssetByBasename\(VIP_BADGE_SOURCE/);
  assert.match(runtimeCss, /width:\s*min\(340px,\s*calc\(100vw - 20px\)\)/);
  assert.match(runtimeCss, /padding:\s*20px 23px 28px/);
});

test('guest drawer slide behavior remains the only motion owner', () => {
  assert.match(runtime, /drawer\.insertBefore\(drawerProfile, primaryMenu\)/);
  assert.match(runtime, /drawer\.append\(drawerLogout\)/);
  assert.match(runtime, /drawer\.addEventListener\('pointerdown', closeBeforeAction, true\)/);
  assert.match(runtime, /closeButton\?\.click\(\)/);
  assert.match(runtime, /drawerProfile\.remove\(\)/);
  assert.match(runtime, /drawerLogout\.remove\(\)/);
  assert.doesNotMatch(runtime, /translateX|translate3d|setMenuOpen/);
});
