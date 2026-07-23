import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const polishSource = readFileSync(new URL('./auth-final-polish.css', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');

const authOnlyImports = [
  'auth-reference-contract.css',
  'auth-visual-polish.css',
  'auth-reference-fidelity.css',
  'auth-final-polish.css',
] as const;

test('auth route loads the scoped visual layers in deterministic order', () => {
  let previousIndex = -1;
  for (const file of authOnlyImports) {
    const index = layoutSource.indexOf(file);
    assert.ok(index > previousIndex, `${file} must remain loaded after the previous Auth layer`);
    previousIndex = index;
  }
  assert.match(layoutSource, /className=["']auth-reference-scope["']/);
});

test('final Auth polish stays scoped and responsive without touching auth logic', () => {
  assert.match(polishSource, /\.auth-reference-scope \.public-auth-page/);
  assert.match(polishSource, /width:\s*min\(1180px,\s*100%\)/);
  assert.match(polishSource, /min-height:\s*100svh/);
  assert.match(polishSource, /max-height:\s*760px/);
  assert.match(polishSource, /max-width:\s*560px/);
  assert.match(polishSource, /max-width:\s*390px/);
  assert.match(polishSource, /max-width:\s*340px/);
  assert.match(polishSource, /safe-area-inset-top/);
  assert.match(polishSource, /safe-area-inset-bottom/);
  assert.match(polishSource, /prefers-reduced-motion/);
  assert.doesNotMatch(polishSource, /adminApiFetch|fetch\(|captcha|session|redirect|localStorage/);
});

test('final Auth polish preserves keyboard focus and touch targets', () => {
  assert.match(polishSource, /:focus-visible/);
  assert.match(polishSource, /outline:\s*3px solid var\(--auth-focus\)/);
  assert.match(polishSource, /min-height:\s*48px/);
  assert.match(polishSource, /public-auth-submit[\s\S]*min-height:\s*52px/);
});

test('visual polish preserves login and registration behavior contracts', () => {
  assert.match(loginSource, /memberApiFetch\('\/member\/auth\/login'/);
  assert.match(loginSource, /AntiBotWidget/);
  assert.match(loginSource, /resolveMemberLoginDestination/);
  assert.match(registerSource, /memberApiFetch\('\/member\/auth\/register'/);
  assert.match(registerSource, /AntiBotWidget/);
  assert.match(registerSource, /createRegisterBrandAdapterFromSettings/);
});
