import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const files = {
  interceptor: join(root, 'apps/api/src/common/interceptors/sensitive-response.interceptor.ts'),
  test: join(root, 'apps/api/src/common/interceptors/sensitive-response.interceptor.spec.ts'),
  main: join(root, 'apps/api/src/main.ts'),
};

const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => [name, await readFile(path, 'utf8')]));
const source = Object.fromEntries(entries);
const requiredFields = [
  'passwordHash',
  'accessToken',
  'refreshToken',
  'twoFactorSecret',
  'otpCode',
  'recoveryCodes',
  'storageKey',
  'privateUrl',
];
const violations = [];

for (const field of requiredFields) {
  if (!source.interceptor.includes(`'${field}'`)) violations.push(`sensitive response denylist missing ${field}`);
  if (!source.test.includes(field)) violations.push(`response sanitizer test missing ${field}`);
}
if (!source.main.includes('app.useGlobalInterceptors(new SensitiveResponseInterceptor())')) {
  violations.push('SensitiveResponseInterceptor is not registered globally');
}
if (!source.interceptor.includes('sanitizeApiResponse')) violations.push('response sanitizer implementation missing');
if (!source.test.includes('removes sensitive fields recursively')) violations.push('recursive response sanitizer regression missing');

console.log(`API response safety audit: ${requiredFields.length} sensitive fields`);
console.log(`  violations: ${violations.length}`);
if (violations.length) {
  console.error('\nAPI response safety violations:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
}
