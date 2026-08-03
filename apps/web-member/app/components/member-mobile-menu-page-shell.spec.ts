import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const livePage = readFileSync(new URL('./mobile-home/mobile-live-schedule-page.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('./mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const mobilePopup = readFileSync(new URL('./mobile-home/mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

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

test('every visible referral action delegates to the authenticated copy owner', () => {
  assert.match(mobileHome, /\['แนะนำเพื่อน', '\/mobile\/member\/affiliate', 'referral'\]/);
  assert.match(mobilePopup, /label:\s*'แนะนำเพื่อน'[\s\S]*page:\s*'affiliate'/);

  assert.match(floatingContact, /MOBILE_REFERRAL_LABELS = new Set\(\['แนะนำเพื่อน', 'Refer a friend'\]\)/);
  assert.match(floatingContact, /MOBILE_REFERRAL_ROUTES = new Set\(\['\/affiliate', '\/mobile\/member\/affiliate'\]\)/);
  assert.match(floatingContact, /data-mobile-member-drawer-copy="referral"/);
  assert.match(floatingContact, /window\.addEventListener\('click', routeReferralActionsToCopyOwner, true\)/);
  assert.match(floatingContact, /event\.preventDefault\(\)/);
  assert.match(floatingContact, /event\.stopImmediatePropagation\(\)/);
  assert.match(floatingContact, /copyAction\.click\(\)/);
  assert.match(floatingContact, /if \(action\.dataset\.mobileMemberPopup\) return/);
  assert.match(floatingContact, /button\[aria-label="ปิดเมนู"\]/);
  assert.match(floatingContact, /data-mobile-popup-owner="menu"/);
});

test('canonical referral row keeps the real copy handler and source success toast', () => {
  assert.match(floatingContact, /preserveCanonicalReferralCopyLabel/);
  assert.match(floatingContact, /label\.textContent = 'คัดลอกลิงก์'/);
  assert.match(floatingContact, /window\.queueMicrotask/);
  assert.doesNotMatch(
    floatingContact.slice(
      floatingContact.indexOf('function preserveCanonicalReferralCopyLabel'),
      floatingContact.indexOf('function normalizeActionLabel'),
    ),
    /router\.|location\.|copyAction\.click/,
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
