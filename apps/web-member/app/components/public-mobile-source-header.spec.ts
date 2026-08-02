import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mobileRoot = readFileSync(new URL('./mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const authenticatedRuntime = readFileSync(new URL('./mobile-home/mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const sourceCss = readFileSync(new URL('../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');

test('mobile drawer preserves the Desktop-compatible member service order', () => {
  const labels = ['ระดับสมาชิก VIP', 'รายได้คอมมิชชั่น', 'แนะนำเพื่อน', 'คูปอง', 'โบนัสพิเศษ', 'ถ่ายทอดสด'];
  let cursor = -1;
  for (const label of labels) {
    const next = mobileRoot.indexOf(`'${label}'`, cursor + 1);
    assert.ok(next > cursor, `${label} must remain in the shared service order`);
    cursor = next;
  }
  assert.match(mobileRoot, /\/assets\/asset-pc\/images/);
  assert.match(mobileRoot, /id="mobile-home-drawer"/);
  assert.match(mobileRoot, /PRIMARY_MENU\.map/);
});

test('mobile drawer uses central popup and canonical route owners', () => {
  assert.match(mobileRoot, /data-mobile-member-popup/);
  for (const route of ['promotions', 'news', 'activity', 'history', 'notifications']) {
    assert.match(mobileRoot, new RegExp(`'/mobile/member/${route}'`));
  }
  assert.doesNotMatch(mobileRoot, /memberApiFetch|loadPublicSiteSettings/);
});

test('guest auth and member summary keep one runtime contract', () => {
  assert.match(mobileRoot, /href="\/\?auth=register"/);
  assert.match(mobileRoot, /href="\/\?auth=login"/);
  assert.match(navigationController, /GUEST_LOGIN_REQUIRED_LABELS/);
  assert.match(navigationController, /GUEST_PUBLIC_MOBILE_TARGETS/);
  assert.match(authenticatedRuntime, /summary\.displayName \|\| summary\.username/);
  assert.match(authenticatedRuntime, /summary\.walletAvailable/);
});

test('source drawer is isolated to Mobile and opens from the left', () => {
  assert.match(sourceCss, /@media \(max-width: 900px\)/);
  assert.match(sourceCss, /#mobile-home-drawer/);
  assert.match(sourceCss, /width:\s*min\(340px/);
  assert.match(sourceCss, /translate3d\(-105%,\s*0,\s*0\)/);
});
