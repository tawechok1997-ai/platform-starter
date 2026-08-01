import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const homeEffect = readFileSync(new URL('../member-floating-contact-home-effect.css', import.meta.url), 'utf8');

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
  assert.match(floatingContact, /event\.stopImmediatePropagation\(\)/);
  assert.match(floatingContact, /router\.replace\('\/'\)/);
  assert.doesNotMatch(floatingContact, /router\.back\(\)/);
});

test('contact and purple mini tools are removed only while a menu page is open', () => {
  assert.match(floatingContact, /const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES\.has\(normalizedPath\)/);
  assert.match(floatingContact, /const showFloatingContact = sessionReady && !isMobileMenuPage/);
  assert.match(floatingContact, /if \(isMobileMenuPage\) return null/);
  assert.match(floatingContact, /data-home=\{isHomePage \? 'true' : 'false'\}/);
});

test('mobile home contact has an obvious source-style float, glow and staggered ring effect', () => {
  assert.match(homeEffect, /data-home='true'/);
  assert.match(homeEffect, /member-contact-source-float 2\.1s ease-in-out infinite/);
  assert.match(homeEffect, /member-contact-source-glow 2\.1s ease-in-out infinite/);
  assert.match(homeEffect, /animation-name:\s*member-contact-source-ring/);
  assert.match(homeEffect, /ring--2[\s\S]*animation-delay:\s*\.8s/);
  assert.match(homeEffect, /ring--3[\s\S]*animation-delay:\s*1\.6s/);
});
