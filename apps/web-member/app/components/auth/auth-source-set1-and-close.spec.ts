import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const desktopRegisterFix = readFileSync(new URL('./auth-register-desktop-field-fix.css', import.meta.url), 'utf8');
const originalMobile = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');

test('supplied compact Mobile auth stylesheet is the final visual owner', () => {
  const polishIndex = layout.indexOf('auth-popup-polish.css');
  const desktopRegisterFixIndex = layout.indexOf('auth-register-desktop-field-fix.css');
  const originalMobileIndex = layout.indexOf('auth-popup-original-mobile-final.css');
  assert.ok(polishIndex >= 0);
  assert.ok(desktopRegisterFixIndex > polishIndex);
  assert.ok(originalMobileIndex > desktopRegisterFixIndex);
  assert.equal(
    [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]).at(-1),
    '../components/auth/auth-popup-original-mobile-final.css',
  );
  assert.doesNotMatch(layout, /auth-popup-source-set1-final\.css/);
  assert.match(originalMobile, /height:\s*42px\s*!important/);
  assert.match(originalMobile, /width:\s*55%\s*!important/);
  assert.match(originalMobile, /clip-path:\s*polygon\(0 0, 88% 0, 100% 100%, 0 100%\)\s*!important/);
  assert.match(originalMobile, /a\[aria-current='page'\][\s\S]*background:\s*linear-gradient\(180deg, #e81bd8 0%, #9200df 100%\)\s*!important/);
  assert.match(originalMobile, /source-login-close[\s\S]*background:\s*#fff\s*!important/);
});

test('desktop register progress and step wrappers cannot collapse to min-content width', () => {
  assert.match(desktopRegisterFix, /@media\s*\(min-width:\s*901px\)/);
  assert.match(desktopRegisterFix, /source-register-card\s*>\s*\.source-register-progress,[\s\S]*source-register-card\s*>\s*\.source-register-step[\s\S]*width:\s*100%\s*!important/);
  assert.match(desktopRegisterFix, /source-register-card\s*>\s*\.source-register-step[\s\S]*min-width:\s*0\s*!important/);
  assert.match(desktopRegisterFix, /source-register-card\s*>\s*\.source-register-step[\s\S]*align-self:\s*stretch\s*!important/);
  assert.match(desktopRegisterFix, /source-register-step\s*>\s*\.source-login-field[\s\S]*width:\s*100%\s*!important/);
});

test('closing auth removes the portal hit layer and releases the document lock before routing', () => {
  assert.match(overlay, /setDismissed\(true\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /removeAttribute\('data-member-overlay-open'\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
  assert.ok(overlay.indexOf('setDismissed(true)') < overlay.indexOf('void afterClose()'));
});
