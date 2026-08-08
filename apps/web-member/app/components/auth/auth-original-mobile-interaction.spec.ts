import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const original = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const overlayCss = readFileSync(new URL('../../member-auth-overlay.css', import.meta.url), 'utf8');

test('the supplied original Mobile auth style remains before the final desktop owner', () => {
  const imports = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]);
  const mobileIndex = imports.indexOf('../components/auth/auth-popup-original-mobile-final.css');
  const desktopIndex = imports.indexOf('../components/auth/auth-popup-reference-desktop-final.css');
  assert.ok(mobileIndex >= 0);
  assert.ok(desktopIndex > mobileIndex);
  assert.equal(imports.at(-1), '../components/auth/auth-popup-reference-desktop-final.css');
  assert.match(original, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(original, /clip-path:\s*none\s*!important/);
  assert.match(original, /a\[aria-current='page'\][\s\S]*background:\s*#3e3a49\s*!important/);
});

test('Mobile auth controls keep direct and comfortable touch ownership', () => {
  assert.match(original, /public-auth-tabs > a[\s\S]*min-height:\s*48px\s*!important/);
  assert.match(original, /public-auth-tabs > a[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(original, /public-auth-tabs > a[\s\S]*touch-action:\s*manipulation\s*!important/);
  assert.match(original, /source-login-card :is\(a, button, input, select, textarea\)[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(original, /source-login-close[\s\S]*z-index:\s*60\s*!important/);
});

test('closing auth cannot leave an invisible full-screen click blocker', () => {
  assert.match(overlayCss, /member-auth-overlay\[data-state='closing'\][\s\S]*pointer-events:\s*none\s*!important/);
  assert.match(overlay, /setDismissed\(true\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
});
