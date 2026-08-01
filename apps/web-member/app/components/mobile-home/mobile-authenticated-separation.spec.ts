import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const authenticatedRuntime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const memberChrome = readFileSync(new URL('../../member-chrome.tsx', import.meta.url), 'utf8');

test('authenticated mobile home owns its popup UI without desktop popup imports', () => {
  assert.match(authenticatedRuntime, /MobileMemberPopupRuntime/);
  assert.doesNotMatch(authenticatedRuntime, /MemberHeaderFinanceRuntime/);
  assert.doesNotMatch(authenticatedRuntime, /MemberMenuIncomeSafeRuntime/);
  assert.doesNotMatch(authenticatedRuntime, /MemberMenuSecondaryRuntime/);
  assert.doesNotMatch(authenticatedRuntime, /MemberMenuSpecialBonusRuntime/);
  assert.doesNotMatch(authenticatedRuntime, /MemberMenuVipRuntime/);
});

test('mobile popup owner talks to shared APIs but renders its own source shell', () => {
  assert.match(popupRuntime, /data-mobile-popup-owner/);
  assert.match(popupRuntime, /memberApiFetch\('\/member\/wallet'\)/);
  assert.match(popupRuntime, /memberApiFetch\('\/member\/bank-accounts'\)/);
  assert.match(popupRuntime, /memberApiFetch\('\/member\/bonus-ledgers'\)/);
  assert.match(popupRuntime, /memberApiFetch\('\/member\/withdrawals'/);
  assert.match(popupRuntime, /memberApiFetch\('\/member\/topups'/);
  assert.doesNotMatch(popupRuntime, /MemberHeaderFinanceRuntime/);
  assert.doesNotMatch(popupRuntime, /DepositClient/);
});

test('mobile member pages prefer API images and local basename assets before remote fallback', () => {
  assert.match(sectionPage, /firstString\(item\.mobileImageUrl, item\.imageUrl/);
  assert.match(sectionPage, /resolveLocalAssetByBasename\(value, 'mobile'\)/);
  assert.match(sectionPage, /resolveLocalAssetByBasename\(value, 'pc'\)/);
});

test('mobile member routes bypass desktop chrome and footer ownership', () => {
  assert.match(memberChrome, /'\/mobile\/member'/);
  assert.match(memberChrome, /if \(standaloneRoute\) return <>\{children\}<\/>/);
});
