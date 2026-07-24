import { PrismaClient } from '@prisma/client';
import {
  buildFinanceConcurrencyFixture,
  cleanupFinanceConcurrencyFixture,
  seedFinanceConcurrencyFixture,
} from './finance-concurrency.fixtures';
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
  const fixture = buildFinanceConcurrencyFixture();
  const {
    userId,
    adminId,
    secondAdminId,
    depositRequestId,
    depositClaimRequestId,
    withdrawalUserId,
    withdrawalBankId,
    withdrawalClaimRequestId,
    payoutRequestId,
  } = fixture;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    await seedFinanceConcurrencyFixture(prisma, fixture);
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await cleanupFinanceConcurrencyFixture(prisma, fixture);
    await prisma.$disconnect();
  }, 30_000);

  it('credits one ledger and one balance change when confirmation runs twice in parallel', async () => {
    const storage = { put: jest.fn(), get: jest.fn(), delete: jest.fn() };
    const service = new DepositWorkflowService(prisma as any, storage as any);

    const results = await Promise.all([
      service.confirmCredit(depositRequestId, adminId, 'parallel confirmation A'),
      service.confirmCredit(depositRequestId, adminId, 'parallel confirmation B'),
    ]);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const ledgers = await prisma.walletLedger.findMany({
      where: { idempotencyKey: `topup:${depositRequestId}:credit-confirmed` },
    });
    const allUserLedgers = await prisma.walletLedger.count({ where: { userId } });
    const request = await prisma.topUpRequest.findUniqueOrThrow({ where: { id: depositRequestId } });

    expect(results).toHaveLength(2);
    expect(wallet.balance.toString()).toBe('100');
    expect(wallet.lockedBalance.toString()).toBe('0');
    expect(ledgers).toHaveLength(1);
    expect(allUserLedgers).toBe(1);
    expect(request.status).toBe('COMPLETED');
    expect(request.creditedLedgerId).toBe(ledgers[0].id);
  }, 30_000);

  it('allows only one admin to claim the same deposit request without creating money rows', async () => {
    const service = new TopUpsService(prisma as any);
    const ledgerCountBefore = await prisma.walletLedger.count({ where: { userId } });
    const results = await Promise.allSettled([
      service.claimRequest(depositClaimRequestId, { id: adminId }),
      service.claimRequest(depositClaimRequestId, { id: secondAdminId }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const request = await prisma.topUpRequest.findUniqueOrThrow({ where: { id: depositClaimRequestId } });
    const ledgerCountAfter = await prisma.walletLedger.count({ where: { userId } });
    expect([adminId, secondAdminId]).toContain(request.claimedBy);
    expect(request.status).toBe('PENDING_CREDIT');
    expect(ledgerCountAfter).toBe(ledgerCountBefore);
  }, 30_000);

  it('allows only one admin to claim the same withdrawal request without changing wallet locks', async () => {
    const service = new WithdrawalsService(prisma as any);
    const walletBefore = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const ledgerCountBefore = await prisma.walletLedger.count({ where: { userId: withdrawalUserId } });
    const results = await Promise.allSettled([
      service.claimRequest(withdrawalClaimRequestId, { id: adminId }),
      service.claimRequest(withdrawalClaimRequestId, { id: secondAdminId }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: withdrawalClaimRequestId } });
    const walletAfter = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const ledgerCountAfter = await prisma.walletLedger.count({ where: { userId: withdrawalUserId } });
    expect([adminId, secondAdminId]).toContain(request.claimedBy);
    expect(request.status).toBe('PENDING_REVIEW');
    expect(walletAfter.balance.toString()).toBe(walletBefore.balance.toString());
    expect(walletAfter.lockedBalance.toString()).toBe(walletBefore.lockedBalance.toString());
    expect(ledgerCountAfter).toBe(ledgerCountBefore);
  }, 30_000);

  it('does not over-lock or leave orphan rows when two withdrawal reservations race', async () => {
    const service = new WithdrawalsService(prisma as any);
    const accountNumber = await getAccountNumber();
    const ledgerCountBefore = await prisma.walletLedger.count({ where: { userId: withdrawalUserId } });
    const existingRequestIds = [withdrawalClaimRequestId, payoutRequestId];

    const results = await Promise.allSettled([
      service.createMemberRequest(withdrawalUserId, {
        amount: 350,
        method: 'bank_transfer',
        accountName: 'Finance CI User',
        accountNumber,
        bankName: 'Test Bank',
      } as any),
      service.createMemberRequest(withdrawalUserId, {
        amount: 350,
        method: 'bank_transfer',
        accountName: 'Finance CI User',
        accountNumber,
        bankName: 'Test Bank',
      } as any),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const createdRequests = await prisma.withdrawalRequest.findMany({
      where: { userId: withdrawalUserId, id: { notIn: existingRequestIds } },
      select: { id: true, amount: true, status: true },
    });
    const ledgerCountAfter = await prisma.walletLedger.count({ where: { userId: withdrawalUserId } });

    expect(wallet.balance.toString()).toBe('500');
    expect(wallet.lockedBalance.toString()).toBe('450');
    expect(Number(wallet.lockedBalance)).toBeLessThanOrEqual(Number(wallet.balance));
    expect(createdRequests).toHaveLength(1);
    expect(createdRequests[0].amount.toString()).toBe('350');
    expect(createdRequests[0].status).toBe('PENDING_REVIEW');
    expect(ledgerCountAfter).toBe(ledgerCountBefore);

    await prisma.withdrawalRequest.deleteMany({ where: { id: { in: createdRequests.map((item) => item.id) } } });
    await prisma.wallet.update({ where: { userId: withdrawalUserId }, data: { lockedBalance: 100 } });
  }, 30_000);

  it('creates one payout ledger and preserves wallet invariants when verification runs twice', async () => {
    const service = new WithdrawalWorkflowService(prisma as any, {} as any);
    const results = await Promise.all([
      service.verifyAndComplete(payoutRequestId, adminId, 'parallel payout A'),
      service.verifyAndComplete(payoutRequestId, adminId, 'parallel payout B'),
    ]);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const ledgers = await prisma.walletLedger.findMany({
      where: { idempotencyKey: `withdrawal:${payoutRequestId}:payment-verified` },
    });
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: payoutRequestId } });

    expect(results).toHaveLength(2);
    expect(ledgers).toHaveLength(1);
    expect(wallet.balance.toString()).toBe('400');
    expect(wallet.lockedBalance.toString()).toBe('0');
    expect(Number(wallet.balance)).toBeGreaterThanOrEqual(0);
    expect(Number(wallet.lockedBalance)).toBeGreaterThanOrEqual(0);
    expect(Number(wallet.lockedBalance)).toBeLessThanOrEqual(Number(wallet.balance));
    expect(request.status).toBe('COMPLETED');
    expect(request.completedLedgerId).toBe(ledgers[0].id);
  }, 30_000);

  it('returns the existing payout result on a retry without duplicate ledger or stale lock state', async () => {
    const service = new WithdrawalWorkflowService(prisma as any, {} as any);
    const result = await service.verifyAndComplete(payoutRequestId, adminId, 'retry after timeout');
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: withdrawalUserId } });
    const ledgers = await prisma.walletLedger.findMany({
      where: { idempotencyKey: `withdrawal:${payoutRequestId}:payment-verified` },
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, status: 'COMPLETED', idempotent: true }));
    expect(ledgers).toHaveLength(1);
    expect(wallet.balance.toString()).toBe('400');
    expect(wallet.lockedBalance.toString()).toBe('0');
  }, 30_000);

  async function getAccountNumber() {
    const account = await prisma.memberBankAccount.findUniqueOrThrow({
      where: { id: withdrawalBankId },
      select: { accountNumber: true },
    });
    return account.accountNumber;
  }
});
