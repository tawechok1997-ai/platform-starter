import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const login = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const register = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');
const registerView = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');
const antiBot = readFileSync(new URL('../../(auth)/anti-bot-widget.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');
const originalMobile = readFileSync(new URL('./auth-popup-original-mobile-final.css', import.meta.url), 'utf8');
const desktopCss = readFileSync(new URL('./auth-popup-reference-desktop-final.css', import.meta.url), 'utf8');
const sharedShellCss = readFileSync(new URL('./auth-popup-shared-shell-final.css', import.meta.url), 'utf8');
const lock = readFileSync(new URL('../../lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('auth layout restores the supplied compact Mobile stylesheet as the final owner', () => {
  const imports = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]);
  const sharedShellIndex = imports.indexOf('../components/auth/auth-popup-shared-shell-final.css');
  const originalMobileIndex = imports.indexOf('../components/auth/auth-popup-original-mobile-final.css');
  assert.ok(sharedShellIndex >= 0);
  assert.ok(originalMobileIndex > sharedShellIndex);
  assert.equal(imports.at(-1), '../components/auth/auth-popup-original-mobile-final.css');
  assert.doesNotMatch(layout, /auth-popup-source-set1-final\.css/);
  assert.match(layout, /<AuthFieldRuntime \/>/);
});

test('final Mobile Auth uses the supplied compact angled tabs', () => {
  assert.match(originalMobile, /height:\s*42px\s*!important/);
  assert.match(originalMobile, /width:\s*55%\s*!important/);
  assert.match(originalMobile, /clip-path:\s*polygon\(0 0, 88% 0, 100% 100%, 0 100%\)\s*!important/);
  assert.match(originalMobile, /a\[aria-current='page'\][\s\S]*linear-gradient\(180deg, #e81bd8 0%, #9200df 100%\)/);
});

test('final Mobile Auth uses the supplied compact shell and field geometry', () => {
  assert.match(originalMobile, /@media \(max-width:\s*900px\)/);
  assert.match(originalMobile, /width:\s*min\(360px,\s*calc\(100vw - 48px\)\)\s*!important/);
  assert.match(originalMobile, /source-login-card,[\s\S]*source-register-card[\s\S]*padding:\s*14px 14px 12px\s*!important/);
  assert.match(originalMobile, /source-login-field \.public-auth-input,[\s\S]*height:\s*42px\s*!important/);
  assert.match(originalMobile, /source-login-submit,[\s\S]*height:\s*38px\s*!important/);
  assert.match(originalMobile, /source-register-progress[\s\S]*display:\s*none\s*!important/);
});

test('login and registration fields keep runtime placeholders and password controls', () => {
  assert.match(originalMobile, /public-auth-field-label[\s\S]*opacity:\s*0\s*!important/);
  assert.match(runtime, /control\.placeholder = label/);
  assert.match(runtime, /control\.type = reveal \? 'text' : 'password'/);
  assert.match(runtime, /\.auth-runtime-password-eye/);
  assert.match(runtime, /MutationObserver/);
});

test('embedded auth forwards Escape to the owning popup instead of trapping focus in the iframe', () => {
  assert.match(runtime, /const forwardEmbeddedEscape = \(event: KeyboardEvent\)/);
  assert.match(runtime, /event\.key !== 'Escape' \|\| window\.parent === window/);
  assert.match(runtime, /window\.parent\.postMessage\(\{ type: 'member-auth-close' \}, window\.location\.origin\)/);
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

test('CAPTCHA provider failures warn without freezing Login or Register and config refresh follows submit failures', () => {
  assert.match(antiBot, /import \{ memberApiFetch \} from '\.\.\/member-api'/);
  assert.match(antiBot, /memberApiFetch\(`\/public\/anti-bot\/\$\{endpoint\}`/);
  assert.match(antiBot, /skipAuth:\s*true/);
  assert.match(antiBot, /warnWithoutFreezing/);
  assert.match(antiBot, /onRequiredChange\(false, true\)/);
  assert.match(antiBot, /API remains authoritative/);
  assert.match(antiBot, /\[endpoint, locale, onRequiredChange, resetKey\]/);
  assert.doesNotMatch(antiBot, /const block =/);
  assert.doesNotMatch(antiBot, /\bfetch\s*\(/);
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
