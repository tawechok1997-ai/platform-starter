import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'apps/api/src/common/domain/domain-error.ts',
  'apps/api/src/common/domain/value-objects.ts',
  'apps/api/src/modules/topups/domain/deposit.policy.ts',
  'apps/api/src/modules/withdrawals/domain/withdrawal.policy.ts',
  'apps/api/src/modules/wallet/domain/wallet-settlement.policy.ts',
  'apps/api/src/modules/admin-access/domain/admin-ownership.policy.ts',
  'apps/api/src/modules/risk-alerts/domain/kyc-review.policy.ts',
  'apps/api/src/modules/risk-alerts/domain/watchlist.policy.ts',
  'apps/api/src/modules/support/domain/support-ticket.policy.ts',
  'apps/api/src/modules/notifications/domain/notification-preference.policy.ts',
  'apps/api/src/common/domain/r008-domain-policies.spec.ts',
];

const failures = [];
for (const path of requiredFiles) {
  try {
    await access(join(root, path));
  } catch {
    failures.push(`${path}: missing`);
    continue;
  }
  const source = await readFile(join(root, path), 'utf8');
  if (path.includes('/domain/') && !path.endsWith('.spec.ts')) {
    for (const forbidden of ['@nestjs/', '@prisma/client', 'HttpException', 'BadRequestException', 'ConflictException']) {
      if (source.includes(forbidden)) failures.push(`${path}: domain policy imports framework concern ${forbidden}`);
    }
  }
}

const spec = await readFile(join(root, 'apps/api/src/common/domain/r008-domain-policies.spec.ts'), 'utf8');
for (const marker of [
  'DepositPolicy',
  'WithdrawalPolicy',
  'WalletSettlementPolicy',
  'AdminOwnershipPolicy',
  'KycReviewPolicy',
  'WatchlistPolicy',
  'SupportTicketPolicy',
  'NotificationPreferencePolicy',
]) {
  if (!spec.includes(marker)) failures.push(`r008-domain-policies.spec.ts: missing ${marker} coverage`);
}

console.log(`R-008 domain policy audit: ${requiredFiles.length} required files`);
console.log(`  failures: ${failures.length}`);
if (failures.length) {
  console.error('\nR-008 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
