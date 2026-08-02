import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const sourceOverrides = readFileSync(new URL('../member-authenticated-source-overrides.css', import.meta.url), 'utf8');

test('mobile member drawer follows the 340px source geometry', () => {
  assert.match(sourceOverrides, /#mobile-home-drawer[\s\S]*width:\s*min\(340px, calc\(100vw - 20px\)\)/);
  assert.match(sourceOverrides, /max\(20px, env\(safe-area-inset-top\)\)[\s\S]*23px[\s\S]*max\(28px, env\(safe-area-inset-bottom\)\)/);
});

test('authenticated mobile contact bridge owns only menu-page back navigation', () => {
  assert.match(floatingContact, /MOBILE_MENU_PAGE_ROUTES/);
  assert.match(floatingContact, /MOBILE_MENU_BACK_SELECTOR/);
  assert.match(floatingContact, /router\.replace\('\/'\)/);
  assert.equal((floatingContact.match(/export default function MemberFloatingContact\(/g) ?? []).length, 1);
  assert.match(floatingContact, /return null/);
  assert.doesNotMatch(floatingContact, /createPortal|member-floating-contact__contact-stage|member-floating-contact__ring/);
});

test('legacy floating contact visuals are not duplicated by the route bridge', () => {
  assert.doesNotMatch(floatingContact, /member-floating-contact__toggle/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__button-face/);
  assert.doesNotMatch(floatingContact, /member-contact-ring/);
});

test('authenticated contact stays mobile-only and does not return on desktop', () => {
  assert.match(sourceOverrides, /@media \(min-width: 901px\)[\s\S]*data-authenticated='true'[\s\S]*display:\s*none/);
  assert.match(sourceOverrides, /@media \(max-width: 900px\)[\s\S]*data-authenticated='true'[\s\S]*display:\s*flex/);
});
