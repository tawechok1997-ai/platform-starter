import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { DepositWorkflowService } from '../topups/deposit-workflow.service';
import { TopUpsService } from '../topups/topups.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { WithdrawalWorkflowService } from '../withdrawals/withdrawal-workflow.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) {
    throw new Error('FINANCE_TEST_DATABASE_URL must point to an isolated test database');
  }
}

describeWithDatabase('finance concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  const userId = randomUUID();
  const adminId = randomUUID();
  const secondAdminId = randomUUID();
  const requestId = randomUUID();
  const depositClaimRequestId = randomUUID();
  const withdrawalUserId = randomUUID();
  const withdrawalBankId = randomUUID();
  const claimRequestId = randomUUID();
  const payoutRequestId = randomUUID();

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();

    const suffix = randomUUID().slice(0, 12);
    await prisma.user.create({
      data: {
        id: userId,
        username: `finance-ci-${suffix}`,
        email: `finance-ci-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.adminUser.create({
      data: {
        id: adminId,
        username: `finance-admin-${suffix}`,
        email: `finance-admin-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.adminUser.create({
      data: {
        id: secondAdminId,
        username: `finance-admin-two-${suffix}`,
        email: `finance-admin-two-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.wallet.create({
      data: { userId, currency: 'THB', balance: 0, lockedBalance: 0 },
    });
    await prisma.topUpRequest.create({
      data: {
        id: requestId,
        userId,
        amount: 100,
        currency: 'THB',
        status: 'PENDING_CREDIT',
        claimedBy: adminId,
        claimedAt: new Date(),
      },
    });
    await prisma.topUpRequest.create({
      data: {
        id: depositClaimRequestId,
        userId,
        amount: 25,
        currency: 'THB',
        status: 'PENDING_CREDIT',
      },
    });
    await prisma.user.create({
      data: {
        id: withdrawalUserId,
        username: `finance-withdrawal-${suffix}`,
        email: `finance-withdrawal-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.wallet.create({
      data: { userId: withdrawalUserId, currency: 'THB', balance: 500, lockedBalance: 100 },
    });
    await prisma.memberBankAccount.create({
      data: {
        id: withdrawalBankId,
        userId: withdrawalUserId,
        bankName: 'Test Bank',
        accountName: 'Finance CI User',
        accountNumber: `CI-${suffix}`,
        status: 'ACTIVE',
      },
    });
    await prisma.withdrawalRequest.create({
      data: {
        id: claimRequestId,
        userId: withdrawalUserId,
        amount: 50,
        currency: 'THB',
        status: 'PENDING_REVIEW',
      },
    });
    await prisma.withdrawalRequest.create({
      data: {
        id: payoutRequestId,
        userId: withdrawalUserId,
        amount: 100,
        currency: 'THB',
        status: 'PAYMENT_PROOF_UPLOADED',
        claimedBy: adminId,
        claimedAt: new Date(),
        paymentSlipUrl: 'withdrawal-proofs/test/payout-proof.jpg',
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: [adminId, secondAdminId] } } });
    await prisma.topUpRequest.deleteMany({ where: { id: { in: [requestId, depositClaimRequestId] } } });
    await prisma.withdrawalRequest.deleteMany({ where: { id: { in: [claimRequestId, payoutRequestId] } } });
    await prisma.withdrawalRequest.deleteMany({ where: { userId: withdrawalUserId } });
    await prisma.memberBankAccount.deleteMany({ where: { id: withdrawalBankId } });
    await prisma.walletLedger.deleteMany({ where: { userId } });
    await prisma.walletLedger.deleteMany({ where: { userId: withdrawalUserId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId: withdrawalUserId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.user.deleteMany({ where: { id: withdrawalUserId } });
    await prisma.adminUser.deleteMany({ where: { id: { in: [adminId, secondAdminId] } } });
    await prisma.$disconnect();
  }, 30_000);

  it('credits one ledger and one balance change when confirmation runs twice in parallel', async () => {
    const storage = { put: jest.fn(), get: jest.fn(), delete: jest.fn() };
    const service = new DepositWorkflowService(prisma as any, storage as any);

    const results = await Promise.all([
      service.confirmCredit(requestId, adminId, 'parallel confirmation A'),
      service.confirmCredit(requestId, adminId, 'parallel confirmation B'),
    ]);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const ledgers = await prisma.walletLedger.findMany({
      where: { idempotencyKey: `topup:${requestId}:credit-confirmed` },
    });
    const request = await prisma.topUpRequest.findUniqueOrThrow({ where: { id: requestId } });

    expect(results).toHaveLength(2);
    expect(wallet.balance.toString()).toBe('100');
    expect(ledgers).toHaveLength(1);
    expect(request.status).toBe('COMPLETED');
    expect(request.creditedLedgerId).toBe(ledgers[0].id);
  }, 30_000);

  it('allows only one admin to claim the same deposit request', async () => {
    const service = new TopUpsService(prisma as any);
    const results = await Promise.allSettled([
      service.claimRequest(depositClaimRequestId, { id: adminId }),
      service.claimRequest(depositClaimRequestId, { id: secondAdminId }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const request = await prisma.topUpRequest.findUniqueOrThrow({ where: { id: depositClaimRequestId } });
    expect([adminId, secondAdminId]).toContain(request.claimedBy);
  }, 30_000);

  it('allows only one admin to claim the same withdrawal request', async () => {
    const service = new WithdrawalsService(prisma as any);
    const results = await Promise.allSettled([
      service.claimRequest(claimRequestId, { id: adminId }),
      service.claimRequest(claimRequestId, { id: secondAdminId }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: claimRequestId } });
    expect([adminId, secondAdminId]).toContain(request.claimedBy);
  }, 30_000);

  it('does not over-lock a wallet when two withdrawal reservations race', async () => {
    const service = new WithdrawalsService(prisma as any);
    const results = await Promise.allSettled([
      service.createMemberRequest(withdrawalUserId, { amount: 350, method: 'bank_transfer', accountName: 'Finance CI User', accountNumber: await getAccountNumber(), bankName: 'Test Bank' } as any),
      service.createMemberRequest(withdrawalUserId, { amount: 350, method: 'bank_transfer', accountName: 'Finance CI User', accountNumber: await getAccountNumber(), bankName: 'Test Bank' } as any),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    expect(wallet.lockedBalance.toString()).toBe('450');
    await prisma.withdrawalRequest.deleteMany({ where: { userId: withdrawalUserId, id: { notIn: [claimRequestId, payoutRequestId] } } });
    await prisma.wallet.update({ where: { userId: withdrawalUserId }, data: { lockedBalance: 100 } });
  }, 30_000);

  it('creates one payout ledger and preserves wallet invariants when verification runs twice', async () => {
    const service = new WithdrawalWorkflowService(prisma as any, {} as any);
    const results = await Promise.all([
      service.verifyAndComplete(payoutRequestId, adminId, 'parallel payout A'),
      service.verifyAndComplete(payoutRequestId, adminId, 'parallel payout B'),
    ]);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const ledgers = await prisma.walletLedger.findMany({ where: { idempotencyKey: `withdrawal:${payoutRequestId}:payment-verified` } });
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: payoutRequestId } });

    expect(results).toHaveLength(2);
    expect(ledgers).toHaveLength(1);
    expect(wallet.balance.toString()).toBe('400');
    expect(wallet.lockedBalance.toString()).toBe('0');
    expect(request.status).toBe('COMPLETED');
    expect(request.completedLedgerId).toBe(ledgers[0].id);
  }, 30_000);

  it('returns the existing payout result on a retry after the first attempt completed', async () => {
    const service = new WithdrawalWorkflowService(prisma as any, {} as any);
    const result = await service.verifyAndComplete(payoutRequestId, adminId, 'retry after timeout');
    expect(result).toEqual(expect.objectContaining({ ok: true, status: 'COMPLETED', idempotent: true }));
  }, 30_000);

  async function getAccountNumber() {
    const account = await prisma.memberBankAccount.findUniqueOrThrow({ where: { id: withdrawalBankId }, select: { accountNumber: true } });
    return account.accountNumber;
  }
});
