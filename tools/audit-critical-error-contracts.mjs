import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const files = {
  catalog: join(root, 'apps/api/src/common/errors/error-codes.ts'),
  resolver: join(root, 'apps/api/src/common/errors/error-code-resolver.ts'),
  filter: join(root, 'apps/api/src/common/filters/http-exception.filter.ts'),
  test: join(root, 'apps/api/src/common/errors/error-code-resolver.spec.ts'),
};

const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => [name, await readFile(path, 'utf8')]));
const source = Object.fromEntries(entries);
const requiredCodes = [
  'WITHDRAWAL_CLAIM_REQUIRED',
  'WITHDRAWAL_CLAIM_CONFLICT',
  'WITHDRAWAL_PROOF_INVALID',
  'FINANCE_INSUFFICIENT_BALANCE',
  'FINANCE_INVALID_STATE',
  'RISK_ALERT_NOT_FOUND',
  'RISK_ALERT_INVALID_TRANSITION',
  'RISK_ALERT_SCAN_COOLDOWN',
  'PROMOTION_CAMPAIGN_NOT_FOUND',
  'PROMOTION_DUPLICATE_CLAIM',
  'PROMOTION_INVALID_LIFECYCLE',
];

const violations = [];
for (const code of requiredCodes) {
  if (!source.catalog.includes(code)) violations.push(`catalog missing ${code}`);
  if (!source.resolver.includes(`API_ERROR_CODES.${code}`)) violations.push(`resolver missing ${code}`);
  if (!source.test.includes(`API_ERROR_CODES.${code}`)) violations.push(`contract test missing ${code}`);
}
if (!source.filter.includes("resolveApiErrorCode(message)")) violations.push('HTTP filter does not resolve stable error codes');
if (!source.filter.includes("...(code ? { code } : {})")) violations.push('HTTP filter does not expose resolved code');

console.log(`Critical error contract audit: ${requiredCodes.length} codes checked`);
console.log(`  violations: ${violations.length}`);
if (violations.length) {
  console.error('\nCritical error contract violations:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
}
