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

test('contact and purple mini tools are removed only while a menu page is open', () => {
  assert.match(floatingContact, /const isMobileMenuPage = MOBILE_MENU_PAGE_ROUTES\.has\(normalizedPath\)/);
  assert.match(floatingContact, /const showFloatingContact = sessionReady && !isMobileMenuPage/);
  assert.match(floatingContact, /if \(isMobileMenuPage\) return null/);
});

test('mobile contact reuses the proven single animation owner', () => {
  assert.match(floatingContact, /import '\.\.\/member-floating-contact\.css'/);
  assert.doesNotMatch(floatingContact, /member-floating-contact-home-effect\.css/);
  assert.doesNotMatch(floatingContact, /data-source-contact-motion|contact-source-stage/);

  assert.match(floatingContactCss, /member-floating-contact__contact-stage[\s\S]*right:\s*-4px[\s\S]*bottom:\s*0/);
  assert.match(floatingContactCss, /member-floating-contact__line[\s\S]*translateY\(50%\) scale\(0\)/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*member-floating-contact__line[\s\S]*translateY\(0\) scale\(1\)/);
  assert.match(floatingContactCss, /member-contact-ring 2\.7s ease-out infinite/);
  assert.match(floatingContactCss, /ring--2[\s\S]*animation-delay:\s*0\.9s/);
  assert.match(floatingContactCss, /ring--3[\s\S]*animation-delay:\s*1\.8s/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*button-face > img[\s\S]*rotate\(90deg\) scale\(0\.78\)/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*close-icon[\s\S]*rotate\(90deg\) scale\(1\)/);
});
