import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');

test('login legal and password-toggle copy comes from the active locale', () => {
  assert.match(loginSource, /secureConnection:\s*'การเชื่อมต่อปลอดภัย'/);
  assert.match(loginSource, /secureConnection:\s*'Secure connection'/);
  assert.match(loginSource, /<span>{t\.secureConnection}<\/span>/);
  assert.match(loginSource, /<Link href="\/legal\/privacy">{t\.privacy}<\/Link>/);
  assert.match(loginSource, /<Link href="\/legal\/terms">{t\.terms}<\/Link>/);
  assert.match(loginSource, /{showSecret \? t\.hidePassword : t\.showPassword}/);
  assert.doesNotMatch(loginSource, /<span>Secure connection<\/span>/);
});
