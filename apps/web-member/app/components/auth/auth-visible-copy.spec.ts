import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerPageSource = readFileSync(new URL('../../(auth)/register/page.tsx', import.meta.url), 'utf8');
const registerViewSource = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');

test('login heading, tabs, inline recovery and support copy use the active locale', () => {
  assert.match(loginSource, /title:\s*'เข้าสู่ระบบ'/);
  assert.match(loginSource, /title:\s*'Sign in'/);
  assert.match(loginSource, /forgotTitle:\s*'ลืมรหัสผ่าน'/);
  assert.match(loginSource, /forgotTitle:\s*'Forgot password'/);
  assert.match(loginSource, /<Link href=\{registerHref\}>\{t\.register\}<\/Link>/);
  assert.match(loginSource, /<Link href=\{loginHref\} aria-current="page">\{t\.title\}<\/Link>/);
  assert.match(loginSource, /const heading = mode === 'login' \? t\.title : t\.forgotTitle/);
  assert.match(loginSource, /<h1 id="member-login-title">\{heading\}<\/h1>/);
  assert.match(loginSource, /className="public-auth-forgot"/);
  assert.match(loginSource, /switchMode\('forgot'\)/);
  assert.match(loginSource, /<div className="source-login-support"><span>\{t\.supportPrompt\}<\/span><Link href="\/support">\{t\.support\}<\/Link><\/div>/);
  assert.doesNotMatch(loginSource, /<span>Secure connection<\/span>/);
});

test('register heading and legal copy switch Thai and English together', () => {
  assert.match(registerPageSource, /title:\s*'สมัครสมาชิก'/);
  assert.match(registerPageSource, /title:\s*'Create account'/);
  assert.match(registerPageSource, /terms:\s*'ข้าพเจ้ามีอายุครบ 20 ปีบริบูรณ์/);
  assert.match(registerPageSource, /terms:\s*'I confirm that I am at least 20 years old/);
  assert.match(registerViewSource, /const registerLabel = locale === 'th' \? 'สมัครสมาชิก' : 'Register'/);
  assert.match(registerViewSource, /<h1 id="member-register-title">\{t\.title\}<\/h1>/);
  assert.match(registerViewSource, /<span>\{t\.terms\}<\/span>/);
  assert.match(registerViewSource, /const supportPrompt = locale === 'th' \? 'พบปัญหาการใช้งาน' : 'Having trouble\?'/);
  assert.match(registerViewSource, /const supportLabel = locale === 'th' \? 'ติดต่อเจ้าหน้าที่' : 'Contact support'/);
  assert.doesNotMatch(registerViewSource, /<span>Secure registration<\/span>/);
});
