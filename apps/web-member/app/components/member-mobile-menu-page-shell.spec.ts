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

test('mobile contact follows the supplied source DOM structure', () => {
  assert.match(floatingContact, /member-floating-contact__contact-host/);
  assert.match(floatingContact, /member-floating-contact__contact-stage/);
  assert.match(floatingContact, /member-floating-contact__contact-spacer/);
  assert.match(floatingContact, /member-floating-contact__contact-motion/);
  assert.match(floatingContact, /className="member-floating-contact__line contact"/);
  assert.match(floatingContact, /contact-ring contact-ring-1/);
  assert.match(floatingContact, /contact-ring contact-ring-2/);
  assert.match(floatingContact, /contact-ring contact-ring-3/);
  assert.match(floatingContact, /contact-btn/);
  assert.match(floatingContact, /contact-icon-btn/);
  assert.match(floatingContact, /member-floating-contact__close-canvas/);
  assert.match(floatingContact, /width=\{80\}/);
  assert.match(floatingContact, /height=\{80\}/);
  assert.match(floatingContact, /member-floating-contact__scroll-top/);
  assert.match(floatingContact, /drawContactCloseCanvas/);
});

test('mobile contact uses the supplied closed and open transitions', () => {
  assert.match(floatingContactCss, /contact-host[\s\S]*bottom:\s*calc\(64px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(floatingContactCss, /contact-stage[\s\S]*right:\s*0[\s\S]*bottom:\s*0/);
  assert.match(floatingContactCss, /contact-spacer[\s\S]*translateY\(56px\)/);
  assert.match(floatingContactCss, /contact-motion[\s\S]*translateY\(64px\)/);

  assert.match(floatingContactCss, /member-floating-contact__line[\s\S]*height:\s*0[\s\S]*opacity:\s*0/);
  assert.match(floatingContactCss, /member-floating-contact__line img[\s\S]*translateY\(50%\) scale\(0\)/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*member-floating-contact__line[\s\S]*height:\s*60px[\s\S]*opacity:\s*1/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*member-floating-contact__line img[\s\S]*translateY\(0\) scale\(1\)/);

  assert.match(floatingContactCss, /contact-icon-btn[\s\S]*opacity:\s*1/);
  assert.match(floatingContactCss, /close-canvas[\s\S]*opacity:\s*0/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*contact-icon-btn[\s\S]*opacity:\s*0[\s\S]*rotate\(90deg\)/);
  assert.match(floatingContactCss, /data-open='true'[\s\S]*close-canvas[\s\S]*opacity:\s*1[\s\S]*rotate\(90deg\)/);

  assert.match(floatingContactCss, /member-contact-ring 2\.7s ease-out infinite/);
  assert.match(floatingContactCss, /ring--2[\s\S]*animation-delay:\s*0\.9s/);
  assert.match(floatingContactCss, /ring--3[\s\S]*animation-delay:\s*1\.8s/);
});
