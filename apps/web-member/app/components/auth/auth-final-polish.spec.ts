import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const polishSource = readFileSync(new URL('./auth-final-polish-v2.css', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');

const authOnlyImports = [
  'auth-reference-contract.css',
  'auth-visual-polish.css',
  'auth-reference-fidelity.css',
  'auth-final-polish-v2.css',
] as const;

test('auth route loads the scoped visual layers in deterministic order', () => {
  let previousIndex = -1;
  for (const file of authOnlyImports) {
    const index = layoutSource.indexOf(file);
    assert.ok(index > previousIndex, `${file} must remain loaded after the previous Auth layer`);
    previousIndex = index;
  }
  assert.match(layoutSource, /className=["']auth-reference-scope["']/);
  assert.doesNotMatch(layoutSource, /auth-final-polish\.css/);
});

test('final Auth polish stays scoped and responsive without touching auth logic', () => {
  assert.match(polishSource, /\.auth-reference-scope \.public-auth-page/);
  assert.match(polishSource, /width:\s*min\(1180px,\s*100%\)/);
  assert.match(polishSource, /grid-template-columns:\s*minmax\(0,\s*1\.08fr\)/);
  assert.match(polishSource, /min-height:\s*100svh/);
  assert.match(polishSource, /max-height:\s*760px/);
  assert.match(polishSource, /max-width:\s*980px/);
  assert.match(polishSource, /max-width:\s*560px/);
  assert.match(polishSource, /max-width:\s*390px/);
  assert.match(polishSource, /max-width:\s*340px/);
  assert.match(polishSource, /safe-area-inset-top/);
  assert.match(polishSource, /safe-area-inset-bottom/);
  assert.match(polishSource, /prefers-reduced-motion/);
  assert.doesNotMatch(polishSource, /adminApiFetch|fetch\(|captcha|session|redirect|localStorage/);
});

test('final Auth polish preserves keyboard focus touch targets and disabled states', () => {
  assert.match(polishSource, /:focus-visible/);
  assert.match(polishSource, /outline:\s*3px solid var\(--auth-focus\)/);
  assert.match(polishSource, /min-height:\s*48px/);
  assert.match(polishSource, /public-auth-submit[\s\S]*min-height:\s*52px/);
  assert.match(polishSource, /:disabled/);
  assert.match(polishSource, /cursor:\s*not-allowed/);
});

test('mobile Auth layout removes decorative panel but preserves the form surface', () => {
  assert.match(polishSource, /@media \(max-width:\s*860px\)[\s\S]*public-auth-brand-panel[\s\S]*display:\s*none/);
  assert.match(polishSource, /@media \(max-width:\s*560px\)[\s\S]*public-auth-card/);
  assert.match(polishSource, /public-auth-input-wrap[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/);
});

test('visual polish preserves login and registration behavior contracts', () => {
  assert.match(loginSource, /memberApiFetch\('\/member\/auth\/login'/);
  assert.match(loginSource, /AntiBotWidget/);
  assert.match(loginSource, /resolveMemberLoginDestination/);
  assert.match(registerSource, /memberApiFetch\('\/member\/auth\/register'/);
  assert.match(registerSource, /AntiBotWidget/);
  assert.match(registerSource, /createRegisterBrandAdapterFromSettings/);
});
