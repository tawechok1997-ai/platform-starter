import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const sourceOverrides = readFileSync(new URL('../member-authenticated-source-overrides.css', import.meta.url), 'utf8');

test('mobile member drawer follows the 340px source geometry', () => {
  assert.match(sourceOverrides, /#mobile-home-drawer[\s\S]*width:\s*min\(340px, calc\(100vw - 20px\)\)/);
  assert.match(sourceOverrides, /max\(20px, env\(safe-area-inset-top\)\)[\s\S]*23px[\s\S]*max\(28px, env\(safe-area-inset-bottom\)\)/);
});

test('legacy floating contact UI stays removed while mobile back routing remains centralized', () => {
  assert.equal((floatingContact.match(/export default function MemberFloatingContact\(/g) ?? []).length, 1);
  assert.match(floatingContact, /MOBILE_MENU_PAGE_ROUTES/);
  assert.match(floatingContact, /MOBILE_MENU_BACK_SELECTOR/);
  assert.match(floatingContact, /router\.replace\('\/'\)/);
  assert.match(floatingContact, /return null/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__contact-stage|member-floating-contact__ring--|MINI_TOOLS|createPortal/);
  assert.doesNotMatch(floatingContact, /member-floating-contact\.css/);
});
