import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const homeEffect = readFileSync(new URL('../member-floating-contact-home-effect.css', import.meta.url), 'utf8');
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

test('contact and purple mini tools are removed only while a menu page is open', () => {
  assert.match(floatingContact, /const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES\.has\(normalizedPath\)/);
  assert.match(floatingContact, /const showFloatingContact = sessionReady && !isMobileMenuPage/);
  assert.match(floatingContact, /if \(isMobileMenuPage\) return null/);
  assert.match(floatingContact, /data-home=\{isHomePage \? 'true' : 'false'\}/);
});

test('mobile home contact follows the source idle ring timing and open transition', () => {
  assert.match(floatingContact, /data-source-contact-motion="true"/);
  assert.match(floatingContact, /contact-source-stage/);
  assert.match(floatingContact, /contact-source-line-icon/);
  assert.match(floatingContact, /contact-icon-btn/);
  assert.match(floatingContact, /contact-ring-1/);
  assert.match(floatingContact, /contact-ring-2/);
  assert.match(floatingContact, /contact-ring-3/);

  assert.match(homeEffect, /contact-source-stage[\s\S]*translateY\(64px\)/);
  assert.match(homeEffect, /data-open='true'[\s\S]*contact-source-stage[\s\S]*translateY\(0\)/);
  assert.match(homeEffect, /contact-source-line-icon[\s\S]*translateY\(50%\) scale\(0\)/);
  assert.match(homeEffect, /data-open='true'[\s\S]*contact-source-line-icon[\s\S]*translateY\(0\) scale\(1\)/);
  assert.match(homeEffect, /contact-icon-btn[\s\S]*opacity:\s*1/);
  assert.match(homeEffect, /data-open='true'[\s\S]*contact-icon-btn[\s\S]*opacity:\s*0/);
  assert.match(homeEffect, /contact-ring-2[\s\S]*animation-delay:\s*800ms/);
  assert.match(homeEffect, /contact-ring-3[\s\S]*animation-delay:\s*1600ms/);
  assert.match(homeEffect, /contact-source-toggle:active[\s\S]*scale\(\.92\)/);
});
