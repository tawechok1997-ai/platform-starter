import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./public-mobile-source-header.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../member-mobile-source-header.css', import.meta.url), 'utf8');

test('mobile drawer preserves the Desktop member service order required by shared popup runtimes', () => {
  const orderedIds = ['vip', 'commission', 'referral', 'coupon', 'bonus', 'live'];
  let cursor = -1;

  for (const id of orderedIds) {
    const next = source.indexOf(`id: '${id}'`, cursor + 1);
    assert.ok(next > cursor, `${id} must remain in the Desktop-compatible menu order`);
    cursor = next;
  }

  assert.match(source, /public-member-menu-grid member-mobile-source-menu__primary/);
  assert.match(source, /\/ระดับสมาชิก\.png/);
  assert.match(source, /\/รายได่คอมมิชชั่น\.png/);
  assert.match(source, /\/โบนัสพิเศษ\.png/);
});

test('mobile drawer reuses central popups and protected Member routes instead of duplicating data', () => {
  assert.match(source, /openMemberSharedPopup/);
  assert.match(source, /sharedPopup: 'promotion'/);
  assert.match(source, /sharedPopup: 'news'/);
  assert.match(source, /sharedPopup: 'activity'/);
  assert.match(source, /href: '\/transactions'.*protected: true/);
  assert.match(source, /href: '\/notifications'.*protected: true/);
  assert.match(source, /href: '\/guide'/);
  assert.doesNotMatch(source, /memberApiFetch/);
  assert.doesNotMatch(source, /loadPublicSiteSettings/);
});

test('guest-only actions and protected entries use the existing auth popup contract', () => {
  assert.match(source, /memberLoginHref/);
  assert.match(source, /runtime\.features\.registration/);
  assert.match(source, /runtime\.features\.login/);
  assert.match(source, /\/\?auth=register/);
  assert.match(source, /\/\?auth=login/);
  assert.match(source, /ready && isLoggedIn/);
});

test('source drawer is isolated to Mobile and opens from the left at the supplied width', () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.member-modal-system__panel\.member-mobile-runtime-drawer/);
  assert.match(css, /left: 0 !important/);
  assert.match(css, /right: auto !important/);
  assert.match(css, /width: min\(340px, 92vw\) !important/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /prefers-reduced-motion/);
});
