import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');

test('login heading and legal copy use the active locale', () => {
  assert.match(loginSource, /เข้าสู่ระบบสมาชิก/);
  assert.match(loginSource, /MEMBER ACCESS/);
  assert.match(loginSource, /\{t\.eyebrow\}/);
  assert.match(loginSource, /\{t\.secureConnection\}/);
  assert.doesNotMatch(loginSource, /<span>Secure connection<\/span>/);
});

test('register heading and legal copy switch Thai and English together', () => {
  assert.match(registerSource, /สร้างบัญชีสมาชิก/);
  assert.match(registerSource, /CREATE MEMBER ACCOUNT/);
  assert.match(registerSource, /การสมัครที่ปลอดภัย/);
  assert.match(registerSource, /Secure registration/);
  assert.doesNotMatch(registerSource, /<span>Secure registration<\/span>/);
});
