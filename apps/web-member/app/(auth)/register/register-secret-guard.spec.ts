import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const productionSecretPattern = /(?:password|passwd)\s*[=:]\s*["'][^"']{12,}["']/i;

test('register copy does not resemble a committed production password', () => {
  assert.doesNotMatch(source, productionSecretPattern);
  assert.match(source, /password:\s*`สร้างรหัสผ่าน`/);
  assert.match(source, /password:\s*`Create password`/);
});
