import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADAPTER = path.join(ROOT, 'apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts');

const failures = [];
if (!fs.existsSync(ADAPTER)) {
  failures.push('Missing finance Prisma adapter file.');
} else {
  const source = fs.readFileSync(ADAPTER, 'utf8');
  const required = [
    'class PrismaDepositRepositoryAdapter implements DepositRepositoryPort',
    'class PrismaWithdrawalRepositoryAdapter implements WithdrawalRepositoryPort',
    'Prisma.TransactionClient',
    'FROM "top_up_requests"',
    'FROM "withdrawal_requests"',
    'FOR UPDATE',
  ];
  for (const token of required) {
    if (!source.includes(token)) failures.push(`Missing required adapter token: ${token}`);
  }
  if (/new\s+PrismaClient\s*\(/.test(source)) {
    failures.push('Adapters must not instantiate PrismaClient; the transaction owner must inject TransactionClient.');
  }
  if (/\$transaction\s*\(/.test(source)) {
    failures.push('Adapters must not own transactions or open nested transactions.');
  }
}

if (failures.length > 0) {
  console.error('R-009 finance Prisma adapter audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-009 finance Prisma adapter audit passed.');
console.log('- Deposit and withdrawal adapters implement persistence-agnostic ports.');
console.log('- TransactionClient is injected by the caller.');
console.log('- Row locks are explicit and adapters do not open transactions.');
