import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const runtimeCss = readFileSync(new URL('./mobile-authenticated-home-runtime.module.css', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const mobileHomeRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const avatarPage = readFileSync(new URL('../../profile/avatar/page.tsx', import.meta.url), 'utf8');
const avatarCss = readFileSync(new URL('../../profile/avatar/avatar-page.module.css', import.meta.url), 'utf8');

test('authenticated mobile shell augments the shared header and drawer owners', () => {
  assert.equal((memberHome.match(/<MobileAuthenticatedHomeRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /querySelector<HTMLElement>\('\[data-mobile-section-owner="header"\] > div'\)/);
  assert.match(runtime, /querySelector<HTMLElement>\('#mobile-home-drawer'\)/);
  assert.match(runtime, /createPortal\(/);
  assert.doesNotMatch(runtime, /<aside|drawerBackdrop|translateX|translate3d|setMenuOpen/);
  assert.match(runtimeCss, /data-mobile-authenticated='true'[\s\S]*#mobile-home-drawer[\s\S]*width:\s*min\(340px, calc\(100vw - 20px\)\)/);
});

test('authenticated runtime owns one mobile popup bridge and real member destinations', () => {
  assert.equal((runtime.match(/<MobileMemberPopupRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /import MobileMemberPopupRuntime from '\.\/mobile-member-popup-runtime'/);
  assert.match(popupRuntime, /function SourcePopupShell/);
  for (const destination of ['commission', 'affiliate', 'live', 'promotions', 'news', 'activity', 'history', 'notifications', 'guide']) {
    assert.match(mobileHomeRoot, new RegExp(`/mobile/member/${destination}`));
  }
  assert.match(runtime, /data-mobile-member-popup="deposit"/);
  assert.match(runtime, /data-mobile-member-popup="withdraw"/);
  assert.match(runtime, /data-mobile-member-popup="network-income"/);
  assert.match(runtime, /data-mobile-member-popup', 'language'/);
});

test('avatar page keeps local preference, real account data and popup-based account actions', () => {
  assert.match(runtime, /href="\/profile\/avatar"/);
  assert.match(runtime, /MOBILE_AVATAR_EVENT/);
  assert.match(runtime, /MOBILE_AVATAR_STORAGE_KEY/);
  assert.match(avatarPage, /data-mobile-avatar-owner="true"/);
  assert.match(avatarPage, /memberApiFetch\('\/member\/bank-accounts'\)/);
  assert.match(avatarPage, /MOBILE_AVATAR_OPTIONS\.map/);
  assert.match(avatarPage, /writeMobileAvatarPreference\(avatar\)/);
  assert.match(avatarPage, /setPopup\('contact'\)/);
  assert.match(avatarPage, /setPopup\('password'\)/);
  assert.match(avatarPage, /<ProfileActionPopupLayer kind=\{popup\}/);
  assert.match(avatarCss, /max-width:\s*428px/);
  assert.match(avatarCss, /\.avatarGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});

test('authenticated drawer retains source account, referral and logout behavior', () => {
  assert.match(runtime, /data-mobile-authenticated-drawer-content="true"/);
  assert.match(runtime, /summary\.displayName \|\| summary\.username/);
  assert.match(runtime, /summary\.vipLevel/);
  assert.match(runtime, /copyReferralLink\(absoluteLink\)/);
  assert.match(runtime, /ReferralCopiedToast/);
  assert.match(runtime, /onClick=\{logout\}/);
  assert.match(runtimeCss, /data-mobile-auth-layout='drawer'[\s\S]*display:\s*none\s*!important/);
});
