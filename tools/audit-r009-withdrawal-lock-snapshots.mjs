import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const helperPath = path.join(ROOT, 'apps', 'api', 'src', 'common', 'infrastructure', 'prisma-row-locks.ts');

if (!fs.existsSync(helperPath)) {
  console.error('R-009 withdrawal lock snapshot audit failed: prisma-row-locks.ts is missing.');
  process.exit(1);
}

const source = fs.readFileSync(helperPath, 'utf8');
const checks = [
  ['withdrawal snapshot type', /export type LockedWithdrawalSnapshot/],
  ['wallet snapshot type', /export type LockedWalletSnapshot/],
  ['withdrawal snapshot helper', /export async function lockWithdrawalSnapshotForUpdate/],
  ['wallet snapshot helper', /export async function lockWalletSnapshotForUpdateByUserId/],
  ['withdrawal row lock', /FROM "withdrawal_requests"[\s\S]*FOR UPDATE/],
  ['wallet row lock', /FROM "wallets"[\s\S]*FOR UPDATE/],
  ['withdrawal amount mapping', /amount:\s*row\.amount/],
  ['wallet locked balance mapping', /lockedBalance:\s*row\.locked_balance/],
];

const failures = checks.filter(([, pattern]) => !pattern.test(source)).map(([name]) => name);
if (failures.length) {
  console.error(`R-009 withdrawal lock snapshot audit failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`R-009 withdrawal lock snapshot audit passed: ${checks.length} contract(s).`);
