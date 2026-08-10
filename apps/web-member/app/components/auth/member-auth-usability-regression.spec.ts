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
const mobileFinalCss = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const desktopCss = readFileSync(new URL('./auth-popup-reference-desktop-final.css', import.meta.url), 'utf8');
const sharedShellCss = readFileSync(new URL('./auth-popup-shared-shell-final.css', import.meta.url), 'utf8');
const lock = readFileSync(new URL('../../lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('auth layout loads the shared Login/Register shell owner last', () => {
  const sourceParityIndex = layout.indexOf('auth-popup-original-mobile-final.css');
  const usabilityIndex = layout.indexOf('auth-field-ux-final.css');
  const desktopSourceIndex = layout.indexOf('auth-popup-reference-desktop-final.css');
  const sharedShellIndex = layout.indexOf('auth-popup-shared-shell-final.css');
  assert.ok(sourceParityIndex >= 0);
  assert.ok(usabilityIndex > sourceParityIndex);
  assert.ok(desktopSourceIndex > usabilityIndex);
  assert.ok(sharedShellIndex > desktopSourceIndex);
  assert.match(layout, /<AuthFieldRuntime \/>/);
});

test('legacy Mobile Auth keeps the supplied compact angled-tab styling', () => {
  assert.match(mobileFinalCss, /width:\s*55%\s*!important/);
  assert.match(mobileFinalCss, /clip-path:\s*polygon\(0 0,\s*88% 0,\s*100% 100%,\s*0 100%\)/);
  assert.match(mobileFinalCss, /clip-path:\s*polygon\(12% 0,\s*100% 0,\s*100% 100%,\s*0 100%\)/);
  assert.match(mobileFinalCss, /background:\s*linear-gradient\(180deg,\s*#e81bd8 0%,\s*#9200df 100%\)/);
  assert.match(mobileFinalCss, /background:\s*#fff\s*!important/);
  assert.doesNotMatch(mobileFinalCss, /clip-path:\s*none\s*!important/);
});

test('final Mobile Auth uses the source-width shared shell for both modes', () => {
  assert.match(sharedShellCss, /@media \(max-width:\s*900px\)/);
  assert.match(sharedShellCss, /width:\s*min\(360px,\s*calc\(100vw - 24px\)\)\s*!important/);
  assert.match(sharedShellCss, /source-login-tabs,[\s\S]*source-register-tabs/);
  assert.match(sharedShellCss, /height:\s*46px\s*!important/);
  assert.match(sharedShellCss, /padding:\s*16px 18px 14px\s*!important/);
  assert.match(sharedShellCss, /source-register-progress[\s\S]*display:\s*none\s*!important/);
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

test('final Desktop Auth keeps Login and Register on the same source geometry', () => {
  assert.match(sharedShellCss, /@media \(min-width:\s*901px\)/);
  assert.match(sharedShellCss, /width:\s*min\(980px,\s*calc\(100vw - 40px\)\)\s*!important/);
  assert.match(sharedShellCss, /grid-template-columns:\s*minmax\(0,\s*543px\)\s+minmax\(0,\s*380px\)\s*!important/);
  assert.match(sharedShellCss, /source-login-form-shell[\s\S]*width:\s*380px\s*!important/);
  assert.match(sharedShellCss, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important/);
  assert.match(sharedShellCss, /source-register-progress[\s\S]*display:\s*none\s*!important/);
  assert.match(sharedShellCss, /@media \(min-width:\s*901px\) and \(max-height:\s*620px\)/);
  assert.match(desktopCss, /position:\s*absolute\s*!important/);
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
  const phoneStepIndex = registerView.indexOf('{step === 1');
  const detailsStepIndex = registerView.indexOf('{step === 2');
  const reviewStepIndex = registerView.indexOf('{step === 3');
  const captchaIndex = registerView.indexOf('<AntiBotWidget endpoint="member-register"');
  assert.ok(phoneStepIndex >= 0);
  assert.ok(detailsStepIndex > phoneStepIndex);
  assert.ok(reviewStepIndex > detailsStepIndex);
  assert.ok(captchaIndex > reviewStepIndex);
  assert.equal(registerView.slice(phoneStepIndex, detailsStepIndex).includes('AntiBotWidget'), false);
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
