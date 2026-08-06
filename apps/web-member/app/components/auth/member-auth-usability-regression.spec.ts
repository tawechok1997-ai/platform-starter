import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const login = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const register = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');
const registerView = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');
const antiBot = readFileSync(new URL('../../(auth)/anti-bot-widget.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./auth-field-ux-final.css', import.meta.url), 'utf8');
const desktopCss = readFileSync(new URL('./auth-popup-reference-desktop-final.css', import.meta.url), 'utf8');
const lock = readFileSync(new URL('../../lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('auth layout loads usability and final desktop source owners in order', () => {
  const sourceParityIndex = layout.indexOf('auth-popup-original-mobile-final.css');
  const usabilityIndex = layout.indexOf('auth-field-ux-final.css');
  const desktopSourceIndex = layout.indexOf('auth-popup-reference-desktop-final.css');
  assert.ok(sourceParityIndex >= 0);
  assert.ok(usabilityIndex > sourceParityIndex);
  assert.ok(desktopSourceIndex > usabilityIndex);
  assert.match(layout, /<AuthFieldRuntime \/>/);
});

test('login and registration fields keep visible labels and usable password controls', () => {
  assert.match(css, /public-auth-field-label/);
  assert.match(css, /position:\s*static\s*!important/);
  assert.match(css, /opacity:\s*1\s*!important/);
  assert.match(css, /auth-runtime-password-eye/);
  assert.match(runtime, /control\.placeholder = label/);
  assert.match(runtime, /control\.type = reveal \? 'text' : 'password'/);
  assert.match(runtime, /MutationObserver/);
});

test('desktop embedded Auth matches the source geometry and remains usable on short screens', () => {
  assert.match(desktopCss, /width:\s*min\(1060px,\s*calc\(100vw - 40px\)\)/);
  assert.match(desktopCss, /grid-template-columns:\s*minmax\(0,\s*588px\)\s+minmax\(360px,\s*1fr\)/);
  assert.match(desktopCss, /min-height:\s*min\(560px,\s*calc\(100dvh - 32px\)\)/);
  assert.match(desktopCss, /overflow-y:\s*auto\s*!important/);
  assert.match(desktopCss, /position:\s*absolute\s*!important/);
  assert.match(desktopCss, /@media \(min-width: 901px\) and \(max-height: 620px\)/);
  assert.match(desktopCss, /source-login-tabs a\[aria-current='page'\]/);
  assert.match(desktopCss, /clip-path:\s*polygon/);
  assert.doesNotMatch(desktopCss, /public-auth-close[\s\S]{0,220}position:\s*fixed/);
});

test('member login sends the API contract and verifies persisted session tokens', () => {
  assert.match(login, /memberApiFetch\('\/member\/auth\/login'/);
  assert.match(login, /skipAuth:\s*true/);
  assert.match(login, /identifier:\s*identifier\.trim\(\)/);
  assert.match(login, /\bsecret\b/);
  assert.match(login, /hasMemberSessionTokens\(\)/);
});

test('registration phone step does not mount CAPTCHA or block the next button', () => {
  const phoneStep = registerView.match(/\{step === 1[\s\S]*?\{step === 2/)?.[0] ?? '';
  const reviewStep = registerView.match(/\{step === 3[\s\S]*?<\/div>\}/)?.[0] ?? '';
  assert.doesNotMatch(phoneStep, /AntiBotWidget/);
  assert.match(reviewStep, /AntiBotWidget endpoint="member-register"/);
  assert.match(register, /const disabled = !flags\.registration \|\| maintenanceEnabled \|\| loading/);
  assert.doesNotMatch(register, /disabled = [^\n]*captchaRequired[^\n]*captchaReady/);
});

test('CAPTCHA provider failures warn without freezing Login or Register', () => {
  assert.match(antiBot, /warnWithoutFreezing/);
  assert.match(antiBot, /onRequiredChange\(false, true\)/);
  assert.match(antiBot, /The API remains authoritative/);
  assert.doesNotMatch(antiBot, /const block =/);
});

test('registration transitions and request completion release local blockers', () => {
  assert.match(register, /function goNext\(\)/);
  assert.match(register, /setStep\(nextStep\)/);
  assert.match(register, /releaseLocalInteractionLock\(\)/);
  assert.match(register, /finally \{[\s\S]*setLoading\(false\);[\s\S]*releaseLocalInteractionLock\(\)/);
  assert.match(register, /memberApiFetch\('\/member\/auth\/register'/);
  assert.match(register, /skipAuth:\s*true/);
});

test('closing the final overlay repairs an abandoned document scroll lock', () => {
  assert.match(lock, /repairAbandonedLockBeforeAcquire/);
  assert.match(lock, /schedulePostCloseRepair/);
  assert.match(lock, /clearOwnedDocumentStyles/);
  assert.match(lock, /body\.style\.removeProperty\('overflow'\)/);
  assert.match(lock, /html\.style\.removeProperty\('overflow'\)/);
});

test('Mobile Home no longer mounts the stray guest bottom navigation', () => {
  assert.doesNotMatch(home, /MobileP6GuestBottomNavigation/);
});
