import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const original = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const sharedShell = readFileSync(new URL('./auth-popup-shared-shell-final.css', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const overlayCss = readFileSync(new URL('../../member-auth-overlay.css', import.meta.url), 'utf8');

test('Desktop shared shell stays below the supplied compact Mobile final owner', () => {
  const imports = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]);
  const originalIndex = imports.indexOf('../components/auth/auth-popup-original-mobile-final.css');
  const sharedShellIndex = imports.indexOf('../components/auth/auth-popup-shared-shell-final.css');
  assert.ok(sharedShellIndex >= 0);
  assert.ok(originalIndex > sharedShellIndex);
  assert.equal(imports.at(-1), '../components/auth/auth-popup-original-mobile-final.css');
  assert.doesNotMatch(layout, /auth-popup-source-set1-final\.css/);
  assert.match(original, /@media \(max-width:\s*900px\)/);
  assert.match(sharedShell, /@media \(min-width:\s*901px\)/);
});

test('Mobile auth controls keep direct touch ownership from the supplied compact source', () => {
  assert.match(original, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*min-height:\s*42px\s*!important/);
  assert.match(original, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(original, /source-login-tabs > a,[\s\S]*source-register-tabs > a[\s\S]*touch-action:\s*manipulation\s*!important/);
  assert.match(original, /source-login-close[\s\S]*background:\s*#fff\s*!important/);
});

test('Login and Register switch inside the mounted overlay instead of reopening it', () => {
  assert.match(overlay, /const AUTH_MODES: readonly MemberAuthMode\[\] = \['register', 'login'\]/);
  assert.match(overlay, /data-auth-frame-active=/);
  assert.doesNotMatch(overlay, /location\.replace\(nextPath\)/);
  assert.doesNotMatch(overlay, /frame\.src\s*=\s*nextPath/);
});

test('closing auth cannot leave an invisible full-screen click blocker', () => {
  assert.match(overlayCss, /member-auth-overlay\[data-state='closing'\][\s\S]*pointer-events:\s*none\s*!important/);
  assert.match(overlay, /setDismissed\(true\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
});
