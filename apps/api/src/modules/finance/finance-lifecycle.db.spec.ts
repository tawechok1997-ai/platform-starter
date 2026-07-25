import { PrismaClient } from '@prisma/client';
import { buildFinanceConcurrencyFixture } from './finance-concurrency.fixtures';
import { DepositWorkflowService } from '../topups/deposit-workflow.service';
import { TopUpsService } from '../topups/topups.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { WithdrawalWorkflowService } from '../withdrawals/withdrawal-workflow.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

type StoredObject = { data: Buffer; contentType: string };

class MemoryStorage {
  readonly objects = new Map<string, StoredObject>();

  async put(key: string, data: Buffer, contentType: string) {
    this.objects.set(key, { data: Buffer.from(data), contentType });
  }

  async get(key: string, contentType: string) {
    const stored = this.objects.get(key);
    if (!stored) throw new Error(`Missing test object: ${key}`);
    return { data: Buffer.from(stored.data), contentType: stored.contentType || contentType };
  }

  async remove(key: string) {
    this.objects.delete(key);
  }
}

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('FINANCE_TEST_DATABASE_URL must point to an isolated test database');
}

describeWithDatabase('full finance lifecycle with PostgreSQL', () => {
  let prisma: PrismaClient;
  const fixture = buildFinanceConcurrencyFixture();
  const storage = new MemoryStorage();
  const userId = fixture.userId;
  const adminId = fixture.adminId;
  const bankId = fixture.withdrawalBankId;
  const accountNumber = `E2E-${fixture.suffix}`;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    await prisma.user.create({
      data: {
        id: userId,
        username: `finance-e2e-${fixture.suffix}`,
        email: `finance-e2e-${fixture.suffix}@example.test`,
        passwordHash: 'not-used-in-finance-lifecycle-test',
      },
    });
    await prisma.adminUser.create({
      data: {
        id: adminId,
        username: `finance-e2e-admin-${fixture.suffix}`,
        email: `finance-e2e-admin-${fixture.suffix}@example.test`,
        passwordHash: 'not-used-in-finance-lifecycle-test',
      },
    });
    await prisma.wallet.create({
      data: { userId, currency: 'THB', balance: 0, lockedBalance: 0 },
    });
    await prisma.memberBankAccount.create({
      data: {
        id: bankId,
        userId,
        bankName: 'Lifecycle Bank',
        accountName: 'Finance Lifecycle User',
        accountNumber,
        status: 'ACTIVE',
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: adminId } });
    await prisma.topUpRequest.deleteMany({ where: { userId } });
    await prisma.withdrawalRequest.deleteMany({ where: { userId } });
    await prisma.walletLedger.deleteMany({ where: { userId } });
    await prisma.memberBankAccount.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
    storage.objects.clear();
  }, 30_000);

  it('completes deposit and withdrawal with consistent wallet, ledger, evidence and audit state', async () => {
    const topUps = new TopUpsService(prisma as any);
    const depositWorkflow = new DepositWorkflowService(prisma as any, storage as any);
    const withdrawals = new WithdrawalsService(prisma as any);
    const withdrawalWorkflow = new WithdrawalWorkflowService(prisma as any, storage as any);

    const deposit = await topUps.createMemberRequest(
      userId,
      { amount: 250, method: 'bank_transfer', referenceCode: `DEP-${fixture.suffix}` } as any,
      `deposit-${fixture.suffix}`,
    );
    expect(deposit.status).toBe('PENDING');

    const depositEvidence = await depositWorkflow.submitEvidence(deposit.id, userId, {
      slipImageData: imageDataUrl(`deposit-${fixture.suffix}`),
      slipImageName: 'deposit.png',
      transactionRef: `DEP-TXN-${fixture.suffix}`,
      detectedAmount: '250',
      transferredAt: new Date().toISOString(),
    });
    expect(depositEvidence).toEqual(expect.objectContaining({ ok: true, status: 'PENDING_SLIP_REVIEW' }));

    await topUps.claimRequest(deposit.id, { id: adminId });
    await depositWorkflow.approveSlip(deposit.id, adminId, 'slip verified');
    const credit = await depositWorkflow.confirmCredit(deposit.id, adminId, 'credit verified');
    expect(credit).toEqual(expect.objectContaining({ ok: true, status: 'COMPLETED' }));

    const walletAfterDeposit = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const completedDeposit = await prisma.topUpRequest.findUniqueOrThrow({ where: { id: deposit.id } });
    const depositLedgers = await prisma.walletLedger.findMany({
      where: { userId, referenceType: 'top_up_request', referenceId: deposit.id },
    });
    expect(walletAfterDeposit.balance.toString()).toBe('250');
    expect(walletAfterDeposit.lockedBalance.toString()).toBe('0');
    expect(completedDeposit.status).toBe('COMPLETED');
    expect(completedDeposit.claimedBy).toBeNull();
    expect(depositLedgers).toHaveLength(1);
    expect(depositLedgers[0].direction).toBe('CREDIT');
    expect(depositLedgers[0].balanceBefore.toString()).toBe('0');
    expect(depositLedgers[0].balanceAfter.toString()).toBe('250');
    expect(completedDeposit.slipUrl && storage.objects.has(completedDeposit.slipUrl)).toBe(true);

    const withdrawal = await withdrawals.createMemberRequest(
      userId,
      {
        amount: 100,
        method: 'bank_transfer',
        accountName: 'Finance Lifecycle User',
        accountNumber,
        bankName: 'Lifecycle Bank',
      } as any,
      `withdrawal-${fixture.suffix}`,
    );
    expect(withdrawal.status).toBe('PENDING_REVIEW');

    const walletAfterReservation = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(walletAfterReservation.balance.toString()).toBe('250');
    expect(walletAfterReservation.lockedBalance.toString()).toBe('100');

    await withdrawals.claimRequest(withdrawal.id, { id: adminId });
    await withdrawalWorkflow.approveForPayment(withdrawal.id, adminId, 'approved for bank payment');
    const proof = await withdrawalWorkflow.uploadPaymentProof(withdrawal.id, adminId, {
      slipImageData: imageDataUrl(`withdrawal-${fixture.suffix}`),
      slipImageName: 'withdrawal.png',
      transactionRef: `WD-TXN-${fixture.suffix}`,
      note: 'bank transfer completed',
    });
    expect(proof).toEqual(expect.objectContaining({ ok: true, status: 'PAYMENT_PROOF_UPLOADED' }));

    const completion = await withdrawalWorkflow.verifyAndComplete(withdrawal.id, adminId, 'payment verified');
    expect(completion).toEqual(expect.objectContaining({ ok: true, status: 'COMPLETED', balanceAfter: '150', lockedAfter: '0' }));

    const finalWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const completedWithdrawal = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: withdrawal.id } });
    const ledgers = await prisma.walletLedger.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const audits = await prisma.adminAuditLog.findMany({ where: { adminUserId: adminId }, select: { action: true } });

    expect(finalWallet.balance.toString()).toBe('150');
    expect(finalWallet.lockedBalance.toString()).toBe('0');
    expect(completedWithdrawal.status).toBe('COMPLETED');
    expect(completedWithdrawal.claimedBy).toBeNull();
    expect(completedWithdrawal.paymentSlipUrl && storage.objects.has(completedWithdrawal.paymentSlipUrl)).toBe(true);
    expect(ledgers).toHaveLength(2);
    expect(ledgers.map((item) => item.direction)).toEqual(['CREDIT', 'DEBIT']);
    expect(ledgers[1].balanceBefore.toString()).toBe('250');
    expect(ledgers[1].balanceAfter.toString()).toBe('150');
    expect(audits.map((item) => item.action)).toEqual(expect.arrayContaining([
      'CLAIM_TOP_UP',
      'APPROVE_DEPOSIT_SLIP',
      'CONFIRM_DEPOSIT_CREDIT',
      'CLAIM_WITHDRAWAL',
      'APPROVE_WITHDRAWAL_FOR_PAYMENT',
      'UPLOAD_WITHDRAWAL_PAYMENT_PROOF',
      'VERIFY_AND_COMPLETE_WITHDRAWAL',
    ]));
  }, 45_000);
});

function imageDataUrl(seed: string) {
  return `data:image/png;base64,${Buffer.from(`finance-lifecycle:${seed}`, 'utf8').toString('base64')}`;
}
