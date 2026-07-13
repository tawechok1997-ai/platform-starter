import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PromotionDomainRepository } from './promotion-domain.repository';

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

describeWithDatabase('promotion settlement concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  let repository: PromotionDomainRepository;

  const userId = randomUUID();
  const adminId = randomUUID();
  const riskAlertId = randomUUID();
  const claimId = randomUUID();
  const bonusId = randomUUID();
  const idempotencyKey = `bonus:${bonusId}:settlement`;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    repository = new PromotionDomainRepository(prisma as any);
    await prisma.$connect();

    const suffix = randomUUID().slice(0, 12);
    await prisma.user.create({
      data: {
        id: userId,
        username: `bonus-ci-${suffix}`,
        email: `bonus-ci-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.adminUser.create({
      data: {
        id: adminId,
        username: `bonus-admin-${suffix}`,
        email: `bonus-admin-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.wallet.create({
      data: { userId, currency: 'THB', balance: 100, lockedBalance: 0 },
    });
    await prisma.riskAlert.create({
      data: {
        id: riskAlertId,
        type: 'WALLET_LEDGER_MISMATCH',
        severity: 'LOW',
        status: 'RESOLVED',
        memberId: userId,
        refType: 'BONUS_LEDGER',
        refId: claimId,
        title: 'Bonus settlement concurrency test',
      },
    });

    await prisma.$executeRawUnsafe(
      `INSERT INTO promotion_claims
        (id, member_id, campaign_id, source_risk_alert_id, deposit_amount, bonus_amount, status, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, NULL, 100, 25, 'APPROVED', CURRENT_TIMESTAMP)`,
      claimId,
      userId,
      `campaign-${suffix}`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO bonus_ledgers
        (id, promotion_claim_id, member_id, source_risk_alert_id, amount, currency,
         turnover_required, turnover_progress, status, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 25, 'THB', 50, 50,
         'TURNOVER_COMPLETED', CURRENT_TIMESTAMP)`,
      bonusId,
      claimId,
      userId,
      riskAlertId,
    );
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.walletLedger.deleteMany({ where: { idempotencyKey } });
    await prisma.$executeRawUnsafe('DELETE FROM bonus_ledgers WHERE id = $1::uuid', bonusId);
    await prisma.$executeRawUnsafe('DELETE FROM promotion_claims WHERE id = $1::uuid', claimId);
    await prisma.riskAlert.deleteMany({ where: { id: riskAlertId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  }, 30_000);

  it('credits exactly once when two settlements race and remains idempotent on retry', async () => {
    const results = await Promise.allSettled([
      repository.settleBonus({ sourceRiskAlertId: riskAlertId, adminUserId: adminId, idempotencyKey }),
      repository.settleBonus({ sourceRiskAlertId: riskAlertId, adminUserId: adminId, idempotencyKey }),
    ]);

    // Serializable PostgreSQL may abort one contender. A normal retry must return the
    // already-settled result instead of crediting the wallet a second time.
    for (const result of results) {
      if (result.status === 'rejected') {
        await repository.settleBonus({ sourceRiskAlertId: riskAlertId, adminUserId: adminId, idempotencyKey });
      }
    }

    const retry = await repository.settleBonus({
      sourceRiskAlertId: riskAlertId,
      adminUserId: adminId,
      idempotencyKey,
    });
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const ledgers = await prisma.walletLedger.findMany({ where: { idempotencyKey } });
    const bonusRows = await prisma.$queryRawUnsafe<Array<{ status: string; wallet_ledger_id: string | null }>>(
      'SELECT status, wallet_ledger_id FROM bonus_ledgers WHERE id = $1::uuid',
      bonusId,
    );

    expect(results.filter((result) => result.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    expect(wallet.balance.toString()).toBe('125');
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].amount.toString()).toBe('25');
    expect(bonusRows[0]).toEqual({ status: 'SETTLED', wallet_ledger_id: ledgers[0].id });
    expect(retry).toEqual(expect.objectContaining({ status: 'SETTLED', wallet_ledger_id: ledgers[0].id }));
  }, 30_000);
});
