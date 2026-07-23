import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./auth.css', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('./auth-brand-runtime.ts', import.meta.url), 'utf8');
const adapterSource = readFileSync(new URL('./register-brand-adapter.ts', import.meta.url), 'utf8');

test('auth route loads one scoped visual contract', () => {
  assert.match(layoutSource, /auth\.css/);
  assert.match(layoutSource, /className=["']auth-reference-scope["']/);
  assert.doesNotMatch(layoutSource, /auth-reference-contract|auth-visual-polish|auth-reference-fidelity|auth-final-polish/);
  assert.match(cssSource, /\.auth-reference-scope \.public-auth-page/);
  assert.match(cssSource, /\.auth-reference-scope \.public-auth-shell/);
});

test('auth visual contract covers responsive accessibility and reduced motion behavior', () => {
  assert.match(cssSource, /@media \(max-width: 980px\)/);
  assert.match(cssSource, /@media \(max-width: 860px\)/);
  assert.match(cssSource, /@media \(max-width: 560px\)/);
  assert.match(cssSource, /@media \(max-width: 360px\)/);
  assert.match(cssSource, /safe-area-inset-top/);
  assert.match(cssSource, /safe-area-inset-bottom/);
  assert.match(cssSource, /:focus-visible/);
  assert.match(cssSource, /min-height: 50px/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
});

test('login and register preserve authentication behavior contracts', () => {
  assert.match(loginSource, /memberApiFetch\('\/member\/auth\/login'/);
  assert.match(loginSource, /AntiBotWidget/);
  assert.match(loginSource, /resolveMemberLoginDestination/);
  assert.match(registerSource, /AntiBotWidget endpoint=["']member-register["']/);
  assert.match(registerSource, /public-auth-shell--register/);
  assert.match(registerSource, /public-auth-progress/);
  assert.match(registerSource, /public-auth-review/);
  assert.match(registerSource, /public-auth-terms/);
});

test('register branding delegates to the shared auth runtime', () => {
  assert.match(runtimeSource, /createAuthBrandRuntimeFromBrand/);
  assert.match(adapterSource, /createAuthBrandRuntimeFromBrand\(brand, 'register'\)/);
  assert.match(adapterSource, /createAuthBrandRuntime\(settings, 'register'\)/);
  assert.doesNotMatch(adapterSource, /normalizeTypedSiteSettings|createBrandRuntimeConfig|createAuthBrandViewModel/);
});
