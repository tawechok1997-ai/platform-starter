import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const floatingContactCss = readFileSync(new URL('../member-floating-contact.css', import.meta.url), 'utf8');
const livePage = readFileSync(new URL('./mobile-home/mobile-live-schedule-page.tsx', import.meta.url), 'utf8');

const menuPages = [
  '/mobile/member/vip',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
] as const;

test('all public mobile menu pages return to the mobile home instead of browser history', () => {
  for (const route of menuPages) {
    assert.match(floatingContact, new RegExp(`'${route.replaceAll('/', '\\/')}'`));
  }

  assert.match(floatingContact, /\[data-mobile-member-page\] button\[aria-label="ย้อนกลับ"\]/);
  assert.match(floatingContact, /\[data-mobile-live-page="true"\] button\[aria-label="ย้อนกลับ"\]/);
  assert.match(livePage, /data-mobile-live-page="true"/);
  assert.match(floatingContact, /event\.stopImmediatePropagation\(\)/);
  assert.match(floatingContact, /router\.replace\('\/'\)/);
  assert.doesNotMatch(floatingContact, /router\.back\(\)/);
});

test('purple mini tools are removed only while a menu page is open', () => {
  assert.match(floatingContact, /const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES\.has\(normalizedPath\)/);
  assert.match(floatingContact, /if \(isMobileMenuPage\) return null/);
  assert.match(floatingContact, /member-floating-contact__mini-shell/);
  assert.match(floatingContact, /member-floating-contact__mini-card/);
  assert.match(floatingContact, /member-floating-contact__mini-toggle/);
});

test('gold floating contact is removed globally', () => {
  assert.doesNotMatch(floatingContact, /CONTACT_ICON_URL/);
  assert.doesNotMatch(floatingContact, /LINE_ICON_URL/);
  assert.doesNotMatch(floatingContact, /useMemberContactRuntime/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__contact-host/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__contact-stage/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__line/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__toggle/);
  assert.doesNotMatch(floatingContact, /contact-ring/);
  assert.doesNotMatch(floatingContact, /contact-icon-btn/);
  assert.doesNotMatch(floatingContact, /drawContactCloseCanvas/);

  assert.doesNotMatch(floatingContactCss, /member-floating-contact__contact-host/);
  assert.doesNotMatch(floatingContactCss, /member-floating-contact__contact-stage/);
  assert.doesNotMatch(floatingContactCss, /member-floating-contact__line/);
  assert.doesNotMatch(floatingContactCss, /member-floating-contact__ring/);
  assert.doesNotMatch(floatingContactCss, /member-contact-ring/);
  assert.match(floatingContactCss, /member-floating-contact__mini-shell/);
});
