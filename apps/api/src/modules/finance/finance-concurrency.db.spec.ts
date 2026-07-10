import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { DepositWorkflowService } from '../topups/deposit-workflow.service';

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
  const requestId = randomUUID();

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
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: adminId } });
    await prisma.topUpRequest.deleteMany({ where: { id: requestId } });
    await prisma.walletLedger.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
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
});
