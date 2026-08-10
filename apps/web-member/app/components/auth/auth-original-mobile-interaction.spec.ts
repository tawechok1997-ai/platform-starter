import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const original = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const sharedShell = readFileSync(new URL('./auth-popup-shared-shell-final.css', import.meta.url), 'utf8');
const sourceSetOne = readFileSync(new URL('./auth-popup-source-set1-final.css', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const overlayCss = readFileSync(new URL('../../member-auth-overlay.css', import.meta.url), 'utf8');

test('legacy Mobile auth layers remain below the accepted Source Set 1 final owner', () => {
  const imports = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]);
  const originalIndex = imports.indexOf('../components/auth/auth-popup-original-mobile-final.css');
  const sharedShellIndex = imports.indexOf('../components/auth/auth-popup-shared-shell-final.css');
  const sourceSetOneIndex = imports.indexOf('../components/auth/auth-popup-source-set1-final.css');
  assert.ok(originalIndex >= 0);
  assert.ok(sharedShellIndex > originalIndex);
  assert.ok(sourceSetOneIndex > sharedShellIndex);
  assert.equal(imports.at(-1), '../components/auth/auth-popup-source-set1-final.css');
  assert.match(sourceSetOne, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)\s*!important/);
  assert.match(sourceSetOne, /clip-path:\s*none\s*!important/);
  assert.match(sourceSetOne, /a\[aria-current='page'\][\s\S]*background:\s*#3e3a49\s*!important/);
  assert.match(original, /@media \(max-width:\s*900px\)/);
  assert.match(sharedShell, /@media \(min-width:\s*901px\)/);
});

test('Mobile auth controls keep direct and comfortable touch ownership from Source Set 1', () => {
  assert.match(sourceSetOne, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*min-height:\s*48px\s*!important/);
  assert.match(sourceSetOne, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(sourceSetOne, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*touch-action:\s*manipulation\s*!important/);
  assert.match(sourceSetOne, /source-login-close[\s\S]*background:\s*#fff\s*!important/);
});

test('closing auth cannot leave an invisible full-screen click blocker', () => {
  assert.match(overlayCss, /member-auth-overlay\[data-state='closing'\][\s\S]*pointer-events:\s*none\s*!important/);
  assert.match(overlay, /setDismissed\(true\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
});
