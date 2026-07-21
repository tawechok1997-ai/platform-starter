import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GAME_CATALOG } from './provider-simulator-catalog';
import { ProviderSimulatorRoundService } from './provider-simulator-round.service';
import { ProviderSimulatorService } from './provider-simulator.service';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

const databaseUrl = process.env.GAME_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const testGame = GAME_CATALOG[0];

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('GAME_TEST_DATABASE_URL must point to an isolated test database');
}

function roundId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

describeWithDatabase('provider simulator concurrency with PostgreSQL', () => {
  let prisma: PrismaClient;
  let transactions: ProviderSimulatorTransactionService;
  const userId = randomUUID();

  beforeAll(async () => {
    if (!testGame) throw new Error('Simulator game catalog must contain at least one game');
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    const suffix = randomUUID().slice(0, 12);
    await prisma.user.create({
      data: {
        id: userId,
        username: `game-ci-${suffix}`,
        email: `game-ci-${suffix}@example.test`,
        passwordHash: 'not-used-in-concurrency-test',
      },
    });
    await prisma.wallet.create({ data: { userId, currency: 'THB', balance: 1000, lockedBalance: 0 } });
    const prismaService = prisma as unknown as PrismaService;
    const wallet = new WalletService(prismaService);
    const rounds = new ProviderSimulatorRoundService(wallet);
    const simulator = new ProviderSimulatorService(wallet, rounds);
    transactions = new ProviderSimulatorTransactionService(simulator, {
      create: jest.fn(),
    } as never);
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.walletLedger.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }, 30_000);

  it('accepts only one of two conflicting bets for the same round', async () => {
    const activeRoundId = roundId('parallel-round');
    const base = { userId, amount: '100.00', roundId: activeRoundId, gameCode: testGame!.code };
    const results = await Promise.allSettled([
      transactions.gameTransaction('BET', { ...base, transactionId: `${activeRoundId}-bet-a` }),
      transactions.gameTransaction('BET', { ...base, transactionId: `${activeRoundId}-bet-b` }),
    ]);

    const fulfilled = results.filter((item) => item.status === 'fulfilled');
    const rejected = results.filter((item) => item.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const ledgers = await prisma.walletLedger.findMany({
      where: { userId, referenceType: 'game_bet', metadata: { path: ['roundId'], equals: activeRoundId } },
    });
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(ledgers).toHaveLength(1);
    expect(wallet.balance.toString()).toBe('900');
  }, 30_000);

  it('replays duplicate callback without changing balance twice', async () => {
    const activeRoundId = roundId('retry-round');
    const transactionId = `${activeRoundId}-bet`;
    const input = { userId, amount: '50.00', transactionId, roundId: activeRoundId, gameCode: testGame!.code };
    const results = await Promise.allSettled([
      transactions.gameTransaction('BET', input),
      transactions.gameTransaction('BET', input),
    ]);

    expect(results.every((item) => item.status === 'fulfilled')).toBe(true);
    const fulfilled = results.filter((item): item is PromiseFulfilledResult<Awaited<ReturnType<ProviderSimulatorTransactionService['gameTransaction']>>> => item.status === 'fulfilled');
    expect(fulfilled.map((item) => item.value.replayed).filter(Boolean)).toHaveLength(1);

    const ledgers = await prisma.walletLedger.findMany({ where: { userId, referenceId: `sim_bet_${transactionId}` } });
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(ledgers).toHaveLength(1);
    expect(wallet.balance.toString()).toBe('850');
  }, 30_000);
});
