import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const allowedRegisterCopy = new Set([
  'สร้างรหัสผ่าน',
  'Create password',
]);

const committedSecretCandidates = Array.from(
  source.matchAll(/\b(?:password|passwd)\s*[=:]\s*(["'`])([^"'`\r\n]{12,})\1/gi),
  (match) => match[2],
).filter((value): value is string => Boolean(value) && !allowedRegisterCopy.has(value));

test('register copy does not resemble a committed production password', () => {
  assert.deepEqual(committedSecretCandidates, []);
  assert.match(source, /password:\s*["'`]สร้างรหัสผ่าน["'`]/);
  assert.match(source, /confirmPassword:\s*["'`]ยืนยันรหัสผ่านอีกครั้ง["'`]/);
  assert.match(source, /password:\s*["'`]Create password["'`]/);
  assert.match(source, /confirmPassword:\s*["'`]Confirm password["'`]/);
});
