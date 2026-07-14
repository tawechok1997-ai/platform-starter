import fs from 'node:fs';

const servicePath = 'apps/api/src/modules/withdrawals/withdrawals.service.ts';
const source = fs.readFileSync(servicePath, 'utf8');

const checks = [
  ['imports withdrawal snapshot helper', source.includes('lockWithdrawalSnapshotForUpdate')],
  ['imports wallet snapshot helper', source.includes('lockWalletSnapshotForUpdateByUserId')],
  ['claim uses withdrawal snapshot', /async claimRequest[\s\S]*lockWithdrawalSnapshotForUpdate\(tx, id\)/.test(source)],
  ['release owns a transaction', /async releaseRequest[\s\S]*this\.prisma\.\$transaction\(async \(tx\)/.test(source)],
  ['release uses withdrawal snapshot', /async releaseRequest[\s\S]*lockWithdrawalSnapshotForUpdate\(tx, id\)/.test(source)],
  ['approve uses withdrawal snapshot', /async approveRequest[\s\S]*lockWithdrawalSnapshotForUpdate\(tx, id\)/.test(source)],
  ['complete uses request then wallet snapshots', /async completeRequest[\s\S]*lockWithdrawalSnapshotForUpdate\(tx, id\)[\s\S]*lockWalletSnapshotForUpdateByUserId\(tx, request\.userId\)/.test(source)],
  ['reject uses request then wallet snapshots', /async rejectRequest[\s\S]*lockWithdrawalSnapshotForUpdate\(tx, id\)[\s\S]*lockWalletSnapshotForUpdateByUserId\(tx, request\.userId\)/.test(source)],
  ['create uses wallet snapshot', /async createMemberRequest[\s\S]*lockWalletSnapshotForUpdateByUserId\(tx, userId\)/.test(source)],
  ['no inline FOR UPDATE remains', !source.includes('FOR UPDATE')],
  ['no legacy locked wallet type remains', !source.includes('type LockedWalletRow')],
  ['no unscoped release audit remains', !/releaseRequest[\s\S]*this\.audit\(/.test(source)],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failures.length > 0) {
  console.error(`R-009 withdrawal row-lock migration failed: ${failures.length} contract(s) broken.`);
  process.exitCode = 1;
}
