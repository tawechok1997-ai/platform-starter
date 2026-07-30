import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');

test('login controls and support copy come from the active locale', () => {
  assert.match(loginSource, /showPassword:\s*'แสดงรหัสผ่าน'/);
  assert.match(loginSource, /showPassword:\s*'Show password'/);
  assert.match(loginSource, /hidePassword:\s*'ซ่อนรหัสผ่าน'/);
  assert.match(loginSource, /hidePassword:\s*'Hide password'/);
  assert.match(loginSource, /supportPrompt:\s*'พบปัญหาการใช้งาน'/);
  assert.match(loginSource, /supportPrompt:\s*'Having trouble\?'/);
  assert.match(loginSource, /forgot:\s*'ลืมรหัสผ่าน\?'/);
  assert.match(loginSource, /forgot:\s*'Forgot password\?'/);
  assert.match(loginSource, /\{showSecret \? t\.hidePassword : t\.showPassword\}/);
  assert.match(
    loginSource,
    /<button type="button" className="public-auth-forgot" onClick=\{\(\) => switchMode\('forgot'\)\}>\s*\{t\.forgot\}\s*<\/button>/,
  );
  assert.match(loginSource, /if \(params\.get\('mode'\) === 'forgot'\) setMode\('forgot'\)/);
  assert.match(loginSource, /<div className="source-login-support"><span>\{t\.supportPrompt\}<\/span><Link href="\/support">\{t\.support\}<\/Link><\/div>/);
  assert.doesNotMatch(loginSource, /<span>Secure connection<\/span>/);
});
