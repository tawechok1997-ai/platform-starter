import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const rootCss = readFileSync(new URL('./mobile-home/mobile-home-root.module.css', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-home/mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');

test('mobile drawer preserves the member service order required by popup and route owners', () => {
  const orderedIcons = ['vip', 'commission', 'referral', 'coupon', 'bonus', 'live'];
  let cursor = -1;
  for (const icon of orderedIcons) {
    const next = root.indexOf(`'${icon}'`, cursor + 1);
    assert.ok(next > cursor, `${icon} must remain in the source menu order`);
    cursor = next;
  }
  assert.match(root, /const PRIMARY_MENU = \[/);
  assert.match(root, /ระดับสมาชิก VIP/);
  assert.match(root, /รายได้คอมมิชชั่น/);
  assert.match(root, /โบนัสพิเศษ/);
});

test('mobile drawer delegates popup actions and keeps protected routes centralized', () => {
  assert.match(popupRuntime, /label: 'เมนู', kind: 'menu'/);
  assert.match(popupRuntime, /label: 'ฝาก', kind: 'deposit'/);
  assert.match(popupRuntime, /label: 'ถอน', kind: 'withdraw'/);
  assert.match(popupRuntime, /label: 'ติดต่อ', kind: 'contact'/);
  assert.match(navigationController, /GUEST_LOGIN_REQUIRED/);
  assert.match(root, /'\/mobile\/member\/history'/);
  assert.match(root, /'\/mobile\/member\/notifications'/);
  assert.match(root, /'\/mobile\/member\/guide'/);
});

test('guest actions use the query-driven shared auth popup contract', () => {
  assert.equal((root.match(/function MobileAuthActions\(/g) ?? []).length, 1);
  assert.match(root, /href="\/\?auth=register"/);
  assert.match(root, /href="\/\?auth=login"/);
  assert.match(navigationController, /url\.searchParams\.set\('auth', mode\)/);
  assert.match(navigationController, /router\.replace\(`\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`/);
});

test('current mobile header and drawer remain isolated to the mobile owner', () => {
  assert.match(root, /data-mobile-section-owner="header"/);
  assert.match(root, /id="mobile-home-drawer"/);
  assert.match(root, /aria-controls="mobile-home-drawer"/);
  assert.match(rootCss, /@media/);
  assert.match(rootCss, /\.header/);
  assert.match(rootCss, /\.drawer/);
});
