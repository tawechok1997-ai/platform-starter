import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ProviderSimulatorService } from './provider-simulator.service';

describe('ProviderSimulatorService', () => {
  let service: ProviderSimulatorService;
  let balances: Map<string, number>;
  let ledgers: Map<string, any>;
  let roundService: { enforceInTransaction: jest.Mock };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.PROVIDER_SIMULATOR_API_KEY = 'test-api-key';
    process.env.PROVIDER_SIMULATOR_MERCHANT_ID = 'test-merchant';
    process.env.PROVIDER_SIMULATOR_SECRET = 'test-secret';
    balances = new Map([['member-1', 100], ['member-2', 50], ['member-3', 10]]);
    ledgers = new Map();
    roundService = { enforceInTransaction: jest.fn(async () => undefined) };

    const walletService = {
      getMemberWallet: jest.fn(async (userId: string) => ({ balance: (balances.get(userId) ?? 0).toFixed(2), currency: 'THB' })),
      getMemberLedger: jest.fn(async (userId: string) => ({
        walletId: `wallet-${userId}`,
        items: Array.from(ledgers.values()).filter((item) => item.userId === userId),
      })),
      mutateGameBalance: jest.fn(async (input: any) => {
        const existing = ledgers.get(input.idempotencyKey);
        if (existing) return { wallet: { balance: existing.balanceAfter, currency: 'THB' }, ledger: existing, replayed: true };
        if (input.beforeMutation) await input.beforeMutation({ walletLedger: {} });
        const before = balances.get(input.userId) ?? 0;
        const amount = Number(input.amount);
        const after = input.direction === 'CREDIT' ? before + amount : before - amount;
        if (after < 0) throw new BadRequestException('Balance cannot be negative');
        balances.set(input.userId, after);
        const ledger = {
          userId: input.userId,
          amount: amount.toFixed(2),
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          metadata: input.metadata,
        };
        ledgers.set(input.idempotencyKey, ledger);
        return { wallet: { balance: after.toFixed(2), currency: 'THB' }, ledger, replayed: false };
      }),
    };

    service = new ProviderSimulatorService(walletService as any, roundService as any);
  });

  afterEach(() => {
    delete process.env.PROVIDER_SIMULATOR_API_KEY;
    delete process.env.PROVIDER_SIMULATOR_MERCHANT_ID;
    delete process.env.PROVIDER_SIMULATOR_SECRET;
  });

  it('uses the existing platform wallet for balance and transfers', async () => {
    const balance = await service.getBalance({ userId: 'member-1' });
    expect(balance.balance).toBe('100.00');

    const transferIn = await service.transfer('TRANSFER_IN', {
      userId: 'member-1', amount: '35.50', currency: 'THB', idempotencyKey: 'in-1',
    });
    expect(transferIn.beforeBalance).toBe('100.00');
    expect(transferIn.afterBalance).toBe('64.50');

    const transferOut = await service.transfer('TRANSFER_OUT', {
      userId: 'member-1', amount: '10.00', currency: 'THB', idempotencyKey: 'out-1',
    });
    expect(transferOut.beforeBalance).toBe('64.50');
    expect(transferOut.afterBalance).toBe('74.50');
  });

  it('returns the original result for an idempotent retry', async () => {
    const input = { userId: 'member-2', amount: '20.00', currency: 'THB', idempotencyKey: 'retry-safe-1' };
    const first = await service.transfer('TRANSFER_IN', input);
    const retry = await service.transfer('TRANSFER_IN', input);
    expect(retry.beforeBalance).toBe(first.beforeBalance);
    expect(retry.afterBalance).toBe(first.afterBalance);
    expect(retry.replayed).toBe(true);
    expect((await service.getBalance({ userId: 'member-2' })).balance).toBe('30.00');
  });

  it('rejects an overdraft through the wallet contract', async () => {
    await expect(service.transfer('TRANSFER_IN', {
      userId: 'member-3', amount: '11.00', idempotencyKey: 'out-no-funds',
    })).rejects.toThrow('Balance cannot be negative');
  });

  it('records explicit bet, win, refund and rollback-bet operations', async () => {
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'bet-1', roundId: 'round-1', gameCode: 'fortune-tiger' });
    await service.gameTransaction('WIN', { userId: 'member-1', amount: '25.00', transactionId: 'win-1', roundId: 'round-1', gameCode: 'fortune-tiger' });
    await service.gameTransaction('REFUND', { userId: 'member-1', amount: '5.00', transactionId: 'refund-1', originalTransactionId: 'bet-2', roundId: 'round-2', gameCode: 'fortune-tiger' });
    await service.gameTransaction('ROLLBACK', { userId: 'member-1', amount: '2.00', transactionId: 'rollback-1', originalTransactionId: 'bet-2', rollbackTarget: 'BET', roundId: 'round-2', gameCode: 'fortune-tiger' });
    expect((await service.getBalance({ userId: 'member-1' })).balance).toBe('122.00');
    const history = await service.betHistory({ userId: 'member-1' });
    expect(history.items).toHaveLength(4);
    expect(history.items.map((item: any) => item.metadata.gameOperation)).toEqual(['BET', 'WIN', 'REFUND', 'ROLLBACK_BET']);
    expect(roundService.enforceInTransaction).toHaveBeenCalledTimes(4);
  });

  it('debits the wallet when rolling back a win', async () => {
    await service.gameTransaction('WIN', { userId: 'member-1', amount: '25.00', transactionId: 'win-rb-source', roundId: 'round-win-rb', gameCode: 'fortune-tiger' });
    const rollback = await service.gameTransaction('ROLLBACK', {
      userId: 'member-1', amount: '25.00', transactionId: 'win-rb', originalTransactionId: 'win-rb-source', rollbackTarget: 'WIN', roundId: 'round-win-rb', gameCode: 'fortune-tiger',
    });
    expect(rollback.beforeBalance).toBe('125.00');
    expect(rollback.afterBalance).toBe('100.00');
    expect((await service.betHistory({ userId: 'member-1' })).items.at(-1)?.metadata.gameOperation).toBe('ROLLBACK_WIN');
  });

  it('requires source transaction context for refunds and rollbacks', async () => {
    await expect(service.gameTransaction('REFUND', {
      userId: 'member-1', amount: '5.00', transactionId: 'refund-missing-source', roundId: 'round-1', gameCode: 'fortune-tiger',
    })).rejects.toThrow('originalTransactionId is required');

    await expect(service.gameTransaction('ROLLBACK', {
      userId: 'member-1', amount: '5.00', transactionId: 'rollback-missing-target', originalTransactionId: 'bet-1', roundId: 'round-1', gameCode: 'fortune-tiger',
    })).rejects.toThrow('rollbackTarget is required');
  });

  it('passes a stable per-round concurrency key to the wallet transaction', async () => {
    const wallet = (service as any).walletService;
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'bet-lock-1', roundId: 'round-lock', gameCode: 'fortune-tiger' });
    expect(wallet.mutateGameBalance).toHaveBeenCalledWith(expect.objectContaining({
      concurrencyKey: 'provider-simulator:member-1:fortune-tiger:round-lock', beforeMutation: expect.any(Function),
    }));
  });

  it('validates the HMAC contract used by the provider adapter', () => {
    const body = { ping: true };
    const timestamp = new Date().toISOString();
    const signature = createHmac('sha256', 'test-secret').update(`${timestamp}.${JSON.stringify(body)}`).digest('hex');
    expect(() => service.verifyRequest({
      'x-api-key': 'test-api-key', 'x-merchant-id': 'test-merchant', 'x-timestamp': timestamp, 'x-signature': signature,
    }, body)).not.toThrow();
  });

  it('rejects fallback simulator credentials outside development and test', () => {
    delete process.env.PROVIDER_SIMULATOR_API_KEY;
    delete process.env.PROVIDER_SIMULATOR_MERCHANT_ID;
    delete process.env.PROVIDER_SIMULATOR_SECRET;
    process.env.NODE_ENV = 'production';
    expect(() => service.verifyRequest({}, {})).toThrow('PROVIDER_SIMULATOR_API_KEY must be configured');
  });

  it('returns a game catalog with loadable API icon URLs', () => {
    const result = service.games('https://api.example.test');
    expect(result.success).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(8);
    expect(result.items[0]?.iconUrl).toMatch(/^https:\/\/api\.example\.test\/provider-simulator\/icons\/.+\.svg$/);
    expect(result.pagination.total).toBe(result.items.length);
    expect(service.icon('fortune-tiger.svg')).toContain('<svg');
  });

  it('keeps mobile and pc catalogs separated', () => {
    const mobile = service.games('https://api.example.test', { platform: 'mobile' });
    const pc = service.games('https://api.example.test', { platform: 'pc' });
    expect(mobile.items.length).toBeGreaterThan(0);
    expect(pc.items.length).toBeGreaterThan(0);
    expect(mobile.items.every((item) => item.platform === 'mobile')).toBe(true);
    expect(pc.items.every((item) => item.platform === 'pc')).toBe(true);
    expect(new Set([...mobile.items, ...pc.items].map((item) => item.id)).size).toBe(mobile.items.length + pc.items.length);
  });

  it('filters by provider category and search text', () => {
    const result = service.games('https://api.example.test', { provider: 'pg-soft', category: 'slot', search: 'tiger' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ code: 'fortune-tiger', provider: 'pg-soft', category: 'slot' });
  });

  it('paginates and sorts catalog results deterministically', () => {
    const firstPage = service.games('https://api.example.test', { page: 1, limit: 2, sort: 'code-asc' });
    const secondPage = service.games('https://api.example.test', { page: 2, limit: 2, sort: 'code-asc' });
    expect(firstPage.items).toHaveLength(2);
    expect(secondPage.items).toHaveLength(2);
    expect(firstPage.pagination).toMatchObject({ page: 1, limit: 2, total: 8, totalPages: 4 });
    expect(firstPage.items.map((item) => item.code)).not.toEqual(secondPage.items.map((item) => item.code));
  });

  it('includes provider and platform details in launch responses', () => {
    const result = service.launch({ userId: 'member-1', gameCode: 'fortune-tiger', sessionId: 'session-1' });
    expect(result.success).toBe(true);
    expect(result.game).toEqual({ code: 'fortune-tiger', name: 'Fortune Tiger', provider: 'pg-soft', platform: 'mobile' });
    expect(result.launchUrl).toContain('provider=pg-soft');
  });
});