import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const exactCss = readFileSync(new URL('./auth-source-popup-exact.css', import.meta.url), 'utf8');
const overlayCss = readFileSync(new URL('../../member-auth-overlay.css', import.meta.url), 'utf8');
const authLayout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');

test('auth layout keeps one final mobile popup geometry owner', () => {
  const singleOwnerImport = authLayout.indexOf('auth-popup-single-owner.css');
  const mobileFinalImport = authLayout.indexOf('auth-popup-mobile-source-final.css');
  const polishImport = authLayout.indexOf('auth-popup-polish.css');
  assert.ok(singleOwnerImport >= 0);
  assert.ok(mobileFinalImport > singleOwnerImport);
  assert.ok(polishImport > mobileFinalImport);
  assert.match(exactCss, /Final Login\/Register geometry owner/);
});

test('desktop login and register keep the supplied source dimensions', () => {
  assert.match(exactCss, /width:\s*min\(1080px,\s*calc\(100vw - 32px\)\)/);
  assert.match(exactCss, /height:\s*min\(669px,\s*calc\(100dvh - 32px\)\)/);
  assert.match(exactCss, /width:\s*470px\s*!important[\s\S]*padding:\s*0 0 0 20px/);
  assert.match(exactCss, /width:\s*450px\s*!important[\s\S]*height:\s*48px/);
  assert.match(exactCss, /width:\s*225px\s*!important[\s\S]*height:\s*48px/);
  assert.match(exactCss, /min-height:\s*56px\s*!important/);
  assert.match(exactCss, /height:\s*44px\s*!important/);
});

test('mobile login and register use the supplied 430px bottom sheet', () => {
  assert.match(exactCss, /width:\s*min\(430px,\s*100vw\)/);
  assert.match(exactCss, /border-radius:\s*22px 22px 0 0/);
  assert.match(exactCss, /padding:\s*10px 12px max\(16px,\s*env\(safe-area-inset-bottom\)\)/);
  assert.match(exactCss, /width:\s*42px\s*!important[\s\S]*height:\s*4px/);
  assert.match(exactCss, /height:\s*44px\s*!important[\s\S]*border-radius:\s*13px/);
  assert.match(exactCss, /height:\s*46px\s*!important[\s\S]*border-radius:\s*12px/);
  assert.match(exactCss, /height:\s*46px\s*!important[\s\S]*border-radius:\s*13px/);
  assert.match(exactCss, /font-size:\s*21px\s*!important/);
});

test('mobile auth backdrop matches the supplied source and does not blur', () => {
  assert.match(overlayCss, /background-color:\s*rgb\(0 0 0 \/ 72%\)\s*!important/);
  assert.match(overlayCss, /backdrop-filter:\s*none\s*!important/);
});

test('login and register share one overlay owner and no popup scaling contract', () => {
  assert.match(exactCss, /source-login-modal\[data-auth-mode='login'\]/);
  assert.match(exactCss, /source-register-modal\[data-auth-mode='register'\]/);
  assert.doesNotMatch(exactCss, /transform:\s*scale\(\.(?:76|88)\)/);
});
