import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const polishSource = readFileSync(new URL('./auth-final-polish.css', import.meta.url), 'utf8');

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
  assert.match(polishSource, /max-height:\s*760px/);
  assert.match(polishSource, /max-width:\s*560px/);
  assert.match(polishSource, /max-width:\s*390px/);
  assert.match(polishSource, /max-width:\s*340px/);
  assert.match(polishSource, /safe-area-inset/);
  assert.match(polishSource, /prefers-reduced-motion/);
  assert.doesNotMatch(polishSource, /adminApiFetch|fetch\(|captcha|session|redirect|localStorage/);
});

test('final Auth polish preserves keyboard focus visibility', () => {
  assert.match(polishSource, /:focus-visible/);
  assert.match(polishSource, /outline:\s*3px solid var\(--auth-focus\)/);
});
