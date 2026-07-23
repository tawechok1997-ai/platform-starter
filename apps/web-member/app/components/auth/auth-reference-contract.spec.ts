import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./auth-reference-contract.css', import.meta.url), 'utf8');

test('auth route group activates the shared visual scope for login and register', () => {
  assert.match(layoutSource, /className=["']auth-reference-scope["']/);
  assert.match(layoutSource, /auth-reference-contract\.css/);
  assert.match(cssSource, /\.auth-reference-scope \.public-auth-page/);
  assert.match(cssSource, /\.auth-reference-scope \.public-auth-shell/);
});

test('auth visual contract covers desktop tablet mobile and narrow screens', () => {
  assert.match(cssSource, /grid-template-columns:\s*minmax\(0,\s*1\.05fr\)\s+minmax\(380px,\s*0\.95fr\)/);
  assert.match(cssSource, /@media \(max-width:\s*1040px\)/);
  assert.match(cssSource, /@media \(max-width:\s*860px\)/);
  assert.match(cssSource, /@media \(max-width:\s*560px\)/);
  assert.match(cssSource, /@media \(max-width:\s*360px\)/);
  assert.match(cssSource, /overflow-x:\s*clip/);
  assert.match(cssSource, /min-height:\s*100dvh/);
});

test('login polish preserves captcha API session and redirect contracts', () => {
  assert.match(loginSource, /AntiBotWidget endpoint=["']member-login["']/);
  assert.match(loginSource, /memberApiFetch\(['"]\/member\/auth\/login['"]/);
  assert.match(loginSource, /member_access_token/);
  assert.match(loginSource, /member_refresh_token/);
  assert.match(loginSource, /resolveMemberLoginDestination/);
});

test('register polish preserves validation captcha API tokens referral and redirect contracts', () => {
  assert.match(registerSource, /validateStep\(3\)/);
  assert.match(registerSource, /captchaRequired/);
  assert.match(registerSource, /onCaptchaToken={handleCaptchaToken}/);
  assert.match(registerSource, /memberApiFetch\(['"]\/member\/auth\/register['"]/);
  assert.match(registerSource, /member_access_token/);
  assert.match(registerSource, /member_refresh_token/);
  assert.match(registerSource, /linkReferralAfterRegister/);
  assert.match(registerSource, /window\.location\.replace\(['"]\/['"]\)/);
});
