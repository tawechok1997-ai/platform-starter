import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ProviderSimulatorService } from './provider-simulator.service';

describe('ProviderSimulatorService', () => {
  let service: ProviderSimulatorService;
  let balances: Map<string, number>;
  let ledgers: Map<string, any>;

  beforeEach(() => {
    process.env.PROVIDER_SIMULATOR_API_KEY = 'test-api-key';
    process.env.PROVIDER_SIMULATOR_MERCHANT_ID = 'test-merchant';
    process.env.PROVIDER_SIMULATOR_SECRET = 'test-secret';
    balances = new Map([['member-1', 100], ['member-2', 50], ['member-3', 10]]);
    ledgers = new Map();

    const walletService = {
      getMemberWallet: jest.fn(async (userId: string) => ({ balance: (balances.get(userId) ?? 0).toFixed(2), currency: 'THB' })),
      getMemberLedger: jest.fn(async (userId: string) => ({
        walletId: `wallet-${userId}`,
        items: Array.from(ledgers.values()).filter((item) => item.userId === userId),
      })),
      mutateGameBalance: jest.fn(async (input: any) => {
        const existing = ledgers.get(input.idempotencyKey);
        if (existing) return { wallet: { balance: existing.balanceAfter, currency: 'THB' }, ledger: existing, replayed: true };
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

    service = new ProviderSimulatorService(walletService as any);
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
      userId: 'member-1',
      amount: '35.50',
      currency: 'THB',
      idempotencyKey: 'in-1',
    });
    expect(transferIn.beforeBalance).toBe('100.00');
    expect(transferIn.afterBalance).toBe('64.50');

    const transferOut = await service.transfer('TRANSFER_OUT', {
      userId: 'member-1',
      amount: '10.00',
      currency: 'THB',
      idempotencyKey: 'out-1',
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
      userId: 'member-3',
      amount: '11.00',
      idempotencyKey: 'out-no-funds',
    })).rejects.toThrow('Balance cannot be negative');
  });

  it('records bet, win, refund and rollback against the same wallet', async () => {
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'bet-1', roundId: 'round-1', gameCode: 'fortune-tiger' });
    await service.gameTransaction('WIN', { userId: 'member-1', amount: '25.00', transactionId: 'win-1', roundId: 'round-1', gameCode: 'fortune-tiger' });
    await service.gameTransaction('REFUND', { userId: 'member-1', amount: '5.00', transactionId: 'refund-1', roundId: 'round-2', gameCode: 'fortune-tiger' });
    await service.gameTransaction('ROLLBACK', { userId: 'member-1', amount: '2.00', transactionId: 'rollback-1', roundId: 'round-2', gameCode: 'fortune-tiger' });
    expect((await service.getBalance({ userId: 'member-1' })).balance).toBe('122.00');
    expect((await service.betHistory({ userId: 'member-1' })).items).toHaveLength(4);
  });

  it('validates the HMAC contract used by the provider adapter', () => {
    const body = { ping: true };
    const timestamp = new Date().toISOString();
    const signature = createHmac('sha256', 'test-secret').update(`${timestamp}.${JSON.stringify(body)}`).digest('hex');
    expect(() => service.verifyRequest({
      'x-api-key': 'test-api-key',
      'x-merchant-id': 'test-merchant',
      'x-timestamp': timestamp,
      'x-signature': signature,
    }, body)).not.toThrow();
  });

  it('returns a game catalog with loadable API icon URLs', () => {
    const result = service.games('https://api.example.test');
    expect(result.items.length).toBeGreaterThanOrEqual(8);
    expect(result.items[0]?.iconUrl).toMatch(/^https:\/\/api\.example\.test\/provider-simulator\/icons\/.+\.svg$/);
    expect(service.icon('fortune-tiger.svg')).toContain('<svg');
  });
});
