import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const floatingContact = readFileSync(new URL('./member-floating-contact.tsx', import.meta.url), 'utf8');
const floatingContactCss = readFileSync(new URL('../member-floating-contact.css', import.meta.url), 'utf8');
const sourceOverrides = readFileSync(new URL('../member-authenticated-source-overrides.css', import.meta.url), 'utf8');

test('mobile member drawer follows the 340px source geometry', () => {
  assert.match(sourceOverrides, /#mobile-home-drawer[\s\S]*width:\s*min\(340px, calc\(100vw - 20px\)\)/);
  assert.match(sourceOverrides, /max\(20px, env\(safe-area-inset-top\)\)[\s\S]*23px[\s\S]*max\(28px, env\(safe-area-inset-bottom\)\)/);
});

test('authenticated mobile contact reuses the one existing contact owner', () => {
  assert.match(floatingContact, /const showFloatingContact = sessionReady/);
  assert.match(floatingContact, /data-authenticated=\{isLoggedIn \? 'true' : 'false'\}/);
  assert.equal((floatingContact.match(/member-floating-contact__contact-stage/g) ?? []).length, 1);
  assert.doesNotMatch(floatingContact, /createPortal|MemberFloatingContact\s*\(/g);
});

test('contact button keeps the source 120px shell, 80px face and three staggered rings', () => {
  assert.match(floatingContactCss, /member-floating-contact__toggle[\s\S]*width:\s*120px[\s\S]*height:\s*120px/);
  assert.match(floatingContactCss, /member-floating-contact__button-face[\s\S]*width:\s*80px[\s\S]*height:\s*80px/);
  assert.equal((floatingContact.match(/member-floating-contact__ring--[123]/g) ?? []).length, 3);
  assert.match(floatingContactCss, /member-contact-ring 2\.7s ease-out infinite/);
  assert.match(floatingContactCss, /member-floating-contact__ring--2[\s\S]*animation-delay:\s*0\.9s/);
  assert.match(floatingContactCss, /member-floating-contact__ring--3[\s\S]*animation-delay:\s*1\.8s/);
});

test('authenticated contact stays mobile-only and does not return on desktop', () => {
  assert.match(sourceOverrides, /@media \(min-width: 901px\)[\s\S]*data-authenticated='true'[\s\S]*display:\s*none/);
  assert.match(sourceOverrides, /@media \(max-width: 900px\)[\s\S]*data-authenticated='true'[\s\S]*display:\s*flex/);
});
