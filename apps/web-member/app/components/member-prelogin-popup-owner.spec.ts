import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberChrome = readFileSync(new URL('../member-chrome.tsx', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const mobileHomeRoot = readFileSync(new URL('./mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');

test('MemberChrome is the sole pre-login auth overlay owner', () => {
  assert.equal((memberChrome.match(/<MemberAuthOverlay\b/g) ?? []).length, 1);
  assert.match(memberChrome, /const authMode = authModeOverride \?\? queryAuthMode/);
  assert.doesNotMatch(navigationController, /<MemberAuthOverlay\b/);
  assert.doesNotMatch(navigationController, /useState<AuthRequest|authRequest|useMemberSession/);
  assert.match(navigationController, /router\.replace\(`\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`, \{ scroll: false \}\)/);
  assert.match(navigationController, /return null;/);
});

test('guest mobile login and register actions use the canonical auth request', () => {
  assert.match(mobileHomeRoot, /href="\/\?auth=register"/);
  assert.match(mobileHomeRoot, /href="\/\?auth=login"/);
  assert.doesNotMatch(mobileHomeRoot, /MemberAuthOverlay|createPortal\([^)]*auth/i);
});

test('public guest drawer pages bypass login and keep their existing mobile routes', () => {
  const publicRows = [
    ['ระดับสมาชิก VIP', '/mobile/member/vip'],
    ['ถ่ายทอดสด', '/mobile/member/live'],
    ['โปรโมชั่น', '/mobile/member/promotions'],
    ['ข่าวสาร', '/mobile/member/news'],
    ['กิจกรรม', '/mobile/member/activity'],
    ['แนะนำการใช้งาน', '/mobile/member/guide'],
  ] as const;

  for (const [label, href] of publicRows) {
    assert.match(mobileHomeRoot, new RegExp(`\\['${label}', '${href}'`));
    assert.match(navigationController, new RegExp(`'${href}': '${href}'`));
  }

  assert.match(navigationController, /authAction\.closest\('#mobile-home-drawer'\)/);
  assert.match(navigationController, /guestPublicMobileTargetFor\(authAction\)/);
  assert.match(navigationController, /router\.replace\(guestPublicTarget, \{ scroll: false \}\)/);

  const publicGuardIndex = navigationController.indexOf('if (guestPublicTarget)');
  const memberOnlyGuardIndex = navigationController.indexOf('requiresGuestLogin(authAction)');
  const runtimeProtectedIndex = navigationController.indexOf('protectedTargets.get(href)');
  assert.ok(publicGuardIndex >= 0);
  assert.ok(publicGuardIndex < memberOnlyGuardIndex);
  assert.ok(publicGuardIndex < runtimeProtectedIndex);
});

test('guest member-only drawer actions open the one login overlay before popup and navigation owners', () => {
  for (const label of [
    'รายได้คอมมิชชั่น',
    'แนะนำเพื่อน',
    'คูปอง',
    'โบนัสพิเศษ',
    'ประวัติ',
    'ประวัติรายการ',
    'แจ้งเตือน',
  ]) {
    assert.match(navigationController, new RegExp(`GUEST_LOGIN_REQUIRED_LABELS[\\s\\S]*${label}`));
  }

  assert.match(navigationController, /authAction && !summary\.isLoggedIn && requiresGuestLogin\(authAction\)/);
  assert.match(navigationController, /const intended = canonicalTargetFor\(authAction\) \|\| rawHref/);
  assert.match(navigationController, /event\.stopImmediatePropagation\(\);[\s\S]*openAuth\('login', intended\)/);
  assert.match(navigationController, /requiresGuestLogin[\s\S]*GUEST_LOGIN_REQUIRED_LABELS\.has\(actionLabel\(action\)\)/);
});
