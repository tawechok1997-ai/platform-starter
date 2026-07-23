import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./auth-reference-fidelity.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const login = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerView = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');

test('auth fidelity layer is scoped and loaded after the base auth styles', () => {
  const contractIndex = layout.indexOf('auth-reference-contract.css');
  const polishIndex = layout.indexOf('auth-visual-polish.css');
  const fidelityIndex = layout.indexOf('auth-reference-fidelity.css');

  assert.ok(contractIndex >= 0);
  assert.ok(polishIndex > contractIndex);
  assert.ok(fidelityIndex > polishIndex);
  assert.match(css, /\.auth-reference-scope \.public-auth-shell/);
  assert.doesNotMatch(css, /(^|\n)\s*(body|html|:root)\s*\{/);
});

test('login and register retain their existing authentication contracts', () => {
  assert.match(login, /memberApiFetch\(['"]\/member\/auth\/login['"]/);
  assert.match(login, /AntiBotWidget/);
  assert.match(login, /resolveMemberLoginDestination/);
  assert.match(registerView, /AntiBotWidget endpoint=["']member-register["']/);
  assert.match(registerView, /public-auth-shell--register/);
});

test('auth fidelity distinguishes login and register density', () => {
  assert.match(css, /public-auth-shell:not\(\.public-auth-shell--register\) \.public-auth-card/);
  assert.match(css, /public-auth-shell--register \.public-auth-card/);
  assert.match(css, /public-auth-progress/);
  assert.match(css, /public-auth-review/);
  assert.match(css, /public-auth-terms/);
  assert.match(css, /public-auth-form-actions\.has-back/);
});

test('mobile auth layout keeps captcha and messages visible above the action buttons', () => {
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /\.public-auth-submit \{\s*position: static;/s);
  assert.match(css, /\.public-auth-card-topbar \{\s*position: static;/s);
  assert.match(css, /@media \(max-width: 360px\)/);
});

test('auth fidelity respects reduced-motion preferences', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition: none/);
});
