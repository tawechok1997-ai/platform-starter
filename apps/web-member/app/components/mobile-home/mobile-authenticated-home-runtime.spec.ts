import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const runtimeCss = readFileSync(new URL('./mobile-authenticated-home-runtime.module.css', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const mobileHomeRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');

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
  assert.match(runtime, /className=\{styles\.headerWallet\}/);
  assert.match(runtime, /summary\.walletAvailable/);
  assert.doesNotMatch(runtime, /hero|announcement|highlight-tabs|category-menu|shortcut|footer/);
});

test('mobile authenticated shell owns one mobile popup runtime and no desktop popup runtime', () => {
  assert.equal((runtime.match(/<MobileMemberPopupRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /import MobileMemberPopupRuntime from '\.\/mobile-member-popup-runtime'/);
  assert.doesNotMatch(runtime, /MemberHeaderFinanceRuntime|MemberMenuIncomeSafeRuntime|MemberMenuSpecialBonusRuntime|MemberMenuSecondaryRuntime|MemberMenuVipRuntime/);
  assert.doesNotMatch(popupRuntime, /MemberHeaderFinanceRuntime|MemberMenuIncomeSafeRuntime|MemberSharedPopupRuntime/);
  assert.match(popupRuntime, /function SourcePopupShell/);
});

test('authenticated drawer routes popup actions through the one mobile owner', () => {
  assert.match(runtime, /data-mobile-authenticated-drawer-content="true"/);
  assert.match(runtime, /summary\.displayName \|\| summary\.username/);
  assert.match(runtime, /summary\.vipLevel/);
  assert.equal((runtime.match(/data-mobile-member-popup="deposit"/g) ?? []).length >= 2, true);
  assert.match(runtime, /data-mobile-member-popup="withdraw"/);
  assert.match(runtime, /data-mobile-member-popup="network-income"/);
  assert.match(runtime, /data-mobile-member-popup="commission-income"/);
  assert.match(runtime, /data-mobile-member-popup', 'language'/);
  assert.match(runtime, /onClick=\{logout\}/);
  assert.match(runtime, /resolveLocalAssetByBasename\(VIP_BADGE_SOURCE/);
  assert.match(runtimeCss, /width:\s*min\(340px,\s*calc\(100vw - 20px\)\)/);
  assert.match(runtimeCss, /padding:[\s\S]*max\(20px, env\(safe-area-inset-top\)\)[\s\S]*23px[\s\S]*max\(28px, env\(safe-area-inset-bottom\)\)/);
});

test('guest drawer slide behavior remains the only drawer motion owner', () => {
  assert.match(runtime, /drawer\.insertBefore\(drawerProfile, primaryMenu\)/);
  assert.match(runtime, /drawer\.append\(drawerLogout\)/);
  assert.doesNotMatch(runtime, /pointerdown|closeBeforePlainNavigation/);
  assert.match(runtime, /drawerProfile\.remove\(\)/);
  assert.match(runtime, /drawerLogout\.remove\(\)/);
  assert.doesNotMatch(runtime, /translateX|translate3d|setMenuOpen/);
});

test('authenticated drawer matches source density and never renders guest actions', () => {
  assert.match(runtimeCss, /data-mobile-auth-layout='drawer'[\s\S]*display:\s*none\s*!important/);
  assert.match(runtimeCss, /\.referralRow\s*>\s*img\s*\{[\s\S]*width:\s*17px[\s\S]*height:\s*15px/);
  assert.match(runtimeCss, /\.drawerAccount\s*\{[\s\S]*gap:\s*8px/);
  assert.match(runtimeCss, /\.profileRow\s*\{[\s\S]*margin-bottom:\s*8px/);
  assert.match(runtimeCss, /nav\[aria-label='บริการสมาชิก'\][\s\S]*margin-top:\s*16px[\s\S]*gap:\s*8px/);
  assert.match(runtimeCss, /nav\[aria-label='เมนูเพิ่มเติม'\][\s\S]*gap:\s*14px 10px/);
  assert.match(runtimeCss, /data-mobile-authenticated-drawer-top='true'[\s\S]*position:\s*absolute/);
  assert.match(runtime, /data-mobile-member-drawer-copy="referral"/);
  assert.match(runtime, /copyReferralLink\(absoluteLink\)/);
  assert.match(runtime, /ReferralCopiedToast/);
  assert.match(runtimeCss, /\.referralToast\s*\{[\s\S]*width:\s*min\(365px,[\s\S]*height:\s*60px[\s\S]*border:\s*1px solid #48c1b5/);
  assert.match(runtime, /action\.dataset\.mobileMemberDrawerCopy/);
});


test('all source drawer page and popup actions have explicit mobile destinations', () => {
  for (const section of [
    'vip',
    'commission',
    'affiliate',
    'bonus',
    'live',
    'promotions',
    'news',
    'activity',
    'history',
    'notifications',
    'guide',
  ]) {
    assert.match(mobileHomeRoot, new RegExp(`/mobile/member/${section}`));
  }
  assert.match(mobileHomeRoot, /data-mobile-member-popup=\{icon === 'coupon' \? 'coupon'/);
  assert.match(mobileHomeRoot, /data-mobile-member-popup=\{icon === 'video' \? 'video'/);
});
