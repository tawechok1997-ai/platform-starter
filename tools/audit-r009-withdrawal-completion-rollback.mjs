import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const servicePath = path.join(ROOT, 'apps', 'api', 'src', 'modules', 'withdrawals', 'withdrawals.service.ts');
const source = fs.readFileSync(servicePath, 'utf8');
const start = source.indexOf('async completeRequest(');
const end = source.indexOf('\n  async rejectRequest(', start);

if (start < 0 || end < 0) {
  console.error('R-009 withdrawal rollback audit failed: completeRequest boundary not found.');
  process.exit(1);
}

const method = source.slice(start, end);
const checks = [
  ['all writes use tx client', !/this\.prisma\.(?:wallet|walletLedger|withdrawalRequest|adminAuditLog)\.(?:create|update|upsert|delete)/.test(method)],
  ['transaction callback errors are not swallowed', !/\.catch\s*\(\s*\(?.*=>\s*(?:null|undefined|\{\})/.test(method)],
  ['ledger is created before wallet mutation', method.indexOf('tx.walletLedger.create') < method.indexOf('tx.wallet.update')],
  ['wallet is mutated before request completion update', method.indexOf('tx.wallet.update') < method.indexOf('UPDATE "withdrawal_requests"')],
  ['audit occurs after successful state update', method.indexOf('UPDATE "withdrawal_requests"') < method.indexOf('tx.adminAuditLog.create')],
  ['state-change conflict throws and therefore rolls back', /if\s*\(changed\s*!==\s*1\)\s*throw\s+new\s+ConflictException/.test(method)],
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
console.log(`R-009 withdrawal completion rollback audit: ${checks.length - failures.length}/${checks.length} checks passed.`);
for (const failure of failures) console.error(`- FAIL ${failure}`);
if (failures.length > 0) process.exitCode = 1;
