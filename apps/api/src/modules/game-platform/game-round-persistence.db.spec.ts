import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { GameRoundPersistenceService } from './game-round-persistence.service';

const databaseUrl = process.env.GAME_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('GAME_TEST_DATABASE_URL must point to an isolated test database');
}

type RoundRow = {
  providerRoundId: string;
  state: string;
  betTransactionId: string | null;
};

describeWithDatabase('game round persistence concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  const service = new GameRoundPersistenceService();
  const providerId = randomUUID();

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    const suffix = randomUUID().slice(0, 12);
    await prisma.gameProvider.create({
      data: {
        id: providerId,
        name: `Round Test ${suffix}`,
        code: `round-test-${suffix}`,
        status: 'ACTIVE',
        walletMode: 'SEAMLESS',
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRaw`DELETE FROM "game_rounds" WHERE "provider_id" = ${providerId}::uuid`;
    await prisma.gameProvider.deleteMany({ where: { id: providerId } });
    await prisma.$disconnect();
  }, 30_000);

  it('accepts only one of two conflicting bets for the same provider round', async () => {
    const roundId = `conflict-${randomUUID()}`;
    const event = (transactionId: string) => ({
      eventType: 'BET',
      providerTransactionId: transactionId,
      roundId,
      payload: { amount: '100.00' },
    });

    const results = await Promise.allSettled([
      prisma.$transaction((tx) => service.applyWebhookEvents(tx, providerId, [event('bet-a')])),
      prisma.$transaction((tx) => service.applyWebhookEvents(tx, providerId, [event('bet-b')])),
    ]);

    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((item) => item.status === 'rejected')).toHaveLength(1);

    const rows = await prisma.$queryRaw<RoundRow[]>`
      SELECT
        "provider_round_id" AS "providerRoundId",
        "state",
        "bet_transaction_id" AS "betTransactionId"
      FROM "game_rounds"
      WHERE "provider_id" = ${providerId}::uuid
        AND "provider_round_id" = ${roundId}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe('BET');
    expect(['bet-a', 'bet-b']).toContain(rows[0]?.betTransactionId);
  }, 30_000);

  it('replays the same concurrent transaction without creating another round', async () => {
    const roundId = `replay-${randomUUID()}`;
    const event = {
      eventType: 'PLACE_BET',
      providerTransactionId: 'same-bet',
      roundId,
      payload: { amount: '50.00' },
    };

    const [first, second] = await Promise.all([
      prisma.$transaction((tx) => service.applyWebhookEvents(tx, providerId, [event])),
      prisma.$transaction((tx) => service.applyWebhookEvents(tx, providerId, [event])),
    ]);

    expect([first[0]?.replay, second[0]?.replay].filter(Boolean)).toHaveLength(1);
    const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS "count"
      FROM "game_rounds"
      WHERE "provider_id" = ${providerId}::uuid
        AND "provider_round_id" = ${roundId}
    `;
    expect(Number(count[0]?.count ?? 0)).toBe(1);
  }, 30_000);
});
