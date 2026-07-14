import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const servicePath = path.join(ROOT, 'apps', 'api', 'src', 'modules', 'withdrawals', 'withdrawals.service.ts');

if (!fs.existsSync(servicePath)) {
  console.error('R-009 withdrawal completion audit failed: withdrawals.service.ts not found.');
  process.exit(1);
}

const source = fs.readFileSync(servicePath, 'utf8');
const start = source.indexOf('async completeRequest(');
const end = source.indexOf('\n  async rejectRequest(', start);

if (start < 0 || end < 0) {
  console.error('R-009 withdrawal completion audit failed: completeRequest boundary not found.');
  process.exit(1);
}

const method = source.slice(start, end);
const checks = [
  ['single caller-owned Prisma transaction', /return\s+this\.prisma\.\$transaction\s*\(\s*async\s*\(tx\)/.test(method)],
  ['withdrawal aggregate is locked before mutation', /withdrawal_requests[\s\S]*FOR\s+UPDATE/.test(method)],
  ['wallet is locked after withdrawal aggregate', method.indexOf('FROM "withdrawal_requests"') < method.indexOf('FROM "wallets"')],
  ['ledger write uses transaction client', /await\s+tx\.walletLedger\.create\s*\(/.test(method)],
  ['wallet mutation uses transaction client', /await\s+tx\.wallet\.update\s*\(/.test(method)],
  ['withdrawal mutation uses transaction client', /UPDATE\s+"withdrawal_requests"/.test(method)],
  ['audit write uses transaction client', /await\s+tx\.adminAuditLog\.create\s*\(/.test(method)],
  ['completion idempotency key is stable', /idempotencyKey:\s*`withdrawal:\$\{id\}:complete`/.test(method)],
  ['no unscoped Prisma write inside completion', !/this\.prisma\.[A-Za-z0-9_]+\.(?:create|update|upsert|delete)/.test(method)],
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
console.log(`R-009 withdrawal completion transaction audit: ${checks.length - failures.length}/${checks.length} checks passed.`);
for (const failure of failures) console.error(`- FAIL ${failure}`);

if (failures.length > 0) process.exitCode = 1;
