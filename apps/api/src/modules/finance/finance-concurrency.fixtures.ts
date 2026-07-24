import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

export type FinanceConcurrencyFixture = {
  seed: string;
  suffix: string;
  userId: string;
  adminId: string;
  secondAdminId: string;
  depositRequestId: string;
  depositClaimRequestId: string;
  withdrawalUserId: string;
  withdrawalBankId: string;
  withdrawalClaimRequestId: string;
  payoutRequestId: string;
};

export function buildFinanceConcurrencyFixture(seed = randomUUID()): FinanceConcurrencyFixture {
  const suffix = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return {
    seed,
    suffix,
    userId: fixtureUuid(seed, 'deposit-user'),
    adminId: fixtureUuid(seed, 'admin-one'),
    secondAdminId: fixtureUuid(seed, 'admin-two'),
    depositRequestId: fixtureUuid(seed, 'deposit-request'),
    depositClaimRequestId: fixtureUuid(seed, 'deposit-claim-request'),
    withdrawalUserId: fixtureUuid(seed, 'withdrawal-user'),
    withdrawalBankId: fixtureUuid(seed, 'withdrawal-bank'),
    withdrawalClaimRequestId: fixtureUuid(seed, 'withdrawal-claim-request'),
    payoutRequestId: fixtureUuid(seed, 'payout-request'),
  };
}

export async function seedFinanceConcurrencyFixture(
  prisma: PrismaClient,
  fixture: FinanceConcurrencyFixture,
) {
  await prisma.user.create({
    data: {
      id: fixture.userId,
      username: `finance-ci-${fixture.suffix}`,
      email: `finance-ci-${fixture.suffix}@example.test`,
      passwordHash: 'not-used-in-concurrency-test',
    },
  });
  await prisma.adminUser.create({
    data: {
      id: fixture.adminId,
      username: `finance-admin-${fixture.suffix}`,
      email: `finance-admin-${fixture.suffix}@example.test`,
      passwordHash: 'not-used-in-concurrency-test',
    },
  });
  await prisma.adminUser.create({
    data: {
      id: fixture.secondAdminId,
      username: `finance-admin-two-${fixture.suffix}`,
      email: `finance-admin-two-${fixture.suffix}@example.test`,
      passwordHash: 'not-used-in-concurrency-test',
    },
  });
  await prisma.wallet.create({
    data: { userId: fixture.userId, currency: 'THB', balance: 0, lockedBalance: 0 },
  });
  await prisma.topUpRequest.create({
    data: {
      id: fixture.depositRequestId,
      userId: fixture.userId,
      amount: 100,
      currency: 'THB',
      status: 'PENDING_CREDIT',
      claimedBy: fixture.adminId,
      claimedAt: new Date(),
    },
  });
  await prisma.topUpRequest.create({
    data: {
      id: fixture.depositClaimRequestId,
      userId: fixture.userId,
      amount: 25,
      currency: 'THB',
      status: 'PENDING_CREDIT',
    },
  });
  await prisma.user.create({
    data: {
      id: fixture.withdrawalUserId,
      username: `finance-withdrawal-${fixture.suffix}`,
      email: `finance-withdrawal-${fixture.suffix}@example.test`,
      passwordHash: 'not-used-in-concurrency-test',
    },
  });
  await prisma.wallet.create({
    data: { userId: fixture.withdrawalUserId, currency: 'THB', balance: 500, lockedBalance: 100 },
  });
  await prisma.memberBankAccount.create({
    data: {
      id: fixture.withdrawalBankId,
      userId: fixture.withdrawalUserId,
      bankName: 'Test Bank',
      accountName: 'Finance CI User',
      accountNumber: `CI-${fixture.suffix}`,
      status: 'ACTIVE',
    },
  });
  await prisma.withdrawalRequest.create({
    data: {
      id: fixture.withdrawalClaimRequestId,
      userId: fixture.withdrawalUserId,
      amount: 50,
      currency: 'THB',
      status: 'PENDING_REVIEW',
    },
  });
  await prisma.withdrawalRequest.create({
    data: {
      id: fixture.payoutRequestId,
      userId: fixture.withdrawalUserId,
      amount: 100,
      currency: 'THB',
      status: 'PAYMENT_PROOF_UPLOADED',
      claimedBy: fixture.adminId,
      claimedAt: new Date(),
      paymentSlipUrl: `withdrawal-proofs/test/${fixture.suffix}/payout-proof.jpg`,
    },
  });
}

export async function cleanupFinanceConcurrencyFixture(
  prisma: PrismaClient,
  fixture: FinanceConcurrencyFixture,
) {
  const adminIds = [fixture.adminId, fixture.secondAdminId];
  const userIds = [fixture.userId, fixture.withdrawalUserId];

  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: adminIds } } });
  await prisma.topUpRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.withdrawalRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.walletLedger.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.memberBankAccount.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
}

function fixtureUuid(seed: string, label: string) {
  const hex = createHash('sha256').update(`${seed}:${label}`).digest('hex').slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = '8';
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
