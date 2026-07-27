import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');

test('login heading, tabs, recovery and support copy use the active locale', () => {
  assert.match(loginSource, /title:\s*'เข้าสู่ระบบ'/);
  assert.match(loginSource, /title:\s*'Sign in'/);
  assert.match(loginSource, /<Link href=\{registerHref\}>\{t\.register\}<\/Link>/);
  assert.match(loginSource, /<Link href=\{loginHref\} aria-current="page">\{t\.title\}<\/Link>/);
  assert.match(loginSource, /<h1 id="member-login-title">\{t\.title\}<\/h1>/);
  assert.match(loginSource, /<Link href="\/forgot-password" className="public-auth-forgot">\{t\.forgot\}<\/Link>/);
  assert.match(loginSource, /<div className="source-login-support"><span>\{t\.supportPrompt\}<\/span><Link href="\/support">\{t\.support\}<\/Link><\/div>/);
  assert.doesNotMatch(loginSource, /<span>Secure connection<\/span>/);
});

test('register heading and legal copy switch Thai and English together', () => {
  assert.match(registerSource, /สร้างบัญชีสมาชิก/);
  assert.match(registerSource, /CREATE MEMBER ACCOUNT/);
  assert.match(registerSource, /การสมัครที่ปลอดภัย/);
  assert.match(registerSource, /Secure registration/);
  assert.doesNotMatch(registerSource, /<span>Secure registration<\/span>/);
});
