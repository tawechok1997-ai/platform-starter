import { PrismaClient } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import { GamePlatformMoneyService } from './game-platform-money.service';
import { GenericTransferProviderAdapter } from './adapters/generic-transfer-provider.adapter';

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

describeWithDatabase('provider webhook concurrency', () => {
  let prisma: PrismaClient;
  const providerId = randomUUID();
  const providerCode = `webhook-ci-${randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    await prisma.gameProvider.create({
      data: {
        id: providerId,
        name: 'Webhook Concurrency CI',
        code: providerCode,
        status: 'ACTIVE',
        walletMode: 'TRANSFER',
        currency: 'THB',
        credentials: {
          create: {
            type: 'WEBHOOK_SECRET',
            encryptedValue: 'webhook-ci-secret',
            maskedValue: 'webhook-ci-secret',
          },
        },
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.webhookLog.deleteMany({ where: { providerId } });
    await prisma.gameProvider.delete({ where: { id: providerId } });
    await prisma.$disconnect();
  }, 30_000);

  it('processes one copy and marks the concurrent copy as duplicate', async () => {
    const adapter = new GenericTransferProviderAdapter();
    const service = new GamePlatformMoneyService(
      prisma as any,
      { getAdapter: () => adapter, hasAdapter: () => true } as any,
      { get: (key: string) => key === 'GAME_CREDENTIAL_SECRET' ? 'test-key' : undefined } as any,
    );
    const body = { eventType: 'transfer.completed', idempotencyKey: `webhook-${randomUUID()}` };
    const rawBody = Buffer.from(JSON.stringify(body));
    const timestamp = new Date().toISOString();
    const signature = createHmac('sha256', 'webhook-ci-secret')
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex');
    const headers = {
      'x-provider-signature': signature,
      'x-provider-timestamp': timestamp,
    };

    const results = await Promise.all([
      service.receiveWebhook(providerCode, headers, body, rawBody),
      service.receiveWebhook(providerCode, headers, body, rawBody),
    ]);

    expect(results.filter((result: any) => result.duplicate).length).toBe(1);
    expect(results.filter((result: any) => result.ok && !result.duplicate).length).toBe(1);

    const logs = await prisma.webhookLog.findMany({
      where: { providerId, idempotencyKey: body.idempotencyKey },
    });
    expect(logs.filter((log) => log.status === 'PROCESSED')).toHaveLength(1);
    expect(logs.filter((log) => log.status === 'DUPLICATE')).toHaveLength(1);
  }, 30_000);
});
