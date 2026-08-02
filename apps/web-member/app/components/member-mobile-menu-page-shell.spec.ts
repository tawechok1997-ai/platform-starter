import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
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

test('drawer referral link keeps the original source copy handler instead of inferred navigation', () => {
  assert.match(floatingContact, /data-mobile-member-drawer-copy="referral"/);
  assert.match(floatingContact, /window\.addEventListener\('click', preserveReferralCopy, true\)/);
  assert.match(floatingContact, /label\.textContent = 'คัดลอกลิงก์'/);
  assert.match(floatingContact, /window\.queueMicrotask/);
  assert.doesNotMatch(
    floatingContact.slice(
      floatingContact.indexOf('const preserveReferralCopy'),
      floatingContact.indexOf('window.addEventListener', floatingContact.indexOf('const preserveReferralCopy')),
    ),
    /preventDefault|stopPropagation|router\.|location\./,
  );
});

test('purple mini tools are removed globally while the back-route controller remains mounted', () => {
  assert.doesNotMatch(floatingContact, /MINI_TOOLS/);
  assert.doesNotMatch(floatingContact, /member:mini-tool/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__mini-shell/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__mini-panel/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__mini-card/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__mini-toggle/);
  assert.doesNotMatch(floatingContact, /member-floating-contact\.css/);
  assert.doesNotMatch(floatingContact, /useState/);
  assert.match(floatingContact, /return null;/);
  assert.match(floatingContact, /member-authenticated-source-overrides\.css/);
});

test('gold floating contact remains removed globally', () => {
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
});
