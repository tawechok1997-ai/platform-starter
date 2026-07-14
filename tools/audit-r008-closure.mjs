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

const integrations = [
  ['apps/api/src/modules/topups/topups.service.ts', [
    'DepositPolicy.assertAmount',
    'DepositPolicy.canBeClaimed',
  ]],
  ['apps/api/src/modules/withdrawals/withdrawals.service.ts', [
    'WithdrawalPolicy.assertAmount',
    'WithdrawalPolicy.canBeClaimed',
    'WithdrawalPolicy.assertTransition',
    'WalletSettlementPolicy.assertActive',
    'WalletSettlementPolicy.reserve',
    'WalletSettlementPolicy.completeDebit',
    'WalletSettlementPolicy.releaseReservation',
  ]],
  ['apps/api/src/modules/admin-access/admin-access.service.ts', [
    'AdminOwnershipPolicy.assertCanTransfer',
  ]],
  ['apps/api/src/modules/risk-alerts/kyc-review-command.service.ts', [
    'KycReviewPolicy.assertReviewable',
    'KycReviewPolicy.assertTransition',
  ]],
  ['apps/api/src/modules/risk-alerts/risk-watchlist-command.service.ts', [
    'WatchlistPolicy.assertRelease',
  ]],
  ['apps/api/src/modules/support/support-command.service.ts', [
    'SupportTicketPolicy.nextStatusForReply',
    'SupportTicketPolicy.assertTransition',
  ]],
  ['apps/api/src/modules/notifications/notifications-command.service.ts', [
    'NotificationPreferencePolicy.normalize',
    'NotificationPreferencePolicy.assertMutable',
  ]],
];
for (const [path, markers] of integrations) {
  let source = '';
  try {
    source = await readFile(join(root, path), 'utf8');
  } catch {
    failures.push(`${path}: missing integration target`);
    continue;
  }
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${path}: missing integration marker ${marker}`);
  }
}

console.log(`R-008 domain policy audit: ${requiredFiles.length} required files`);
console.log(`  integrations: ${integrations.length}`);
console.log(`  failures: ${failures.length}`);
if (failures.length) {
  console.error('\nR-008 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
