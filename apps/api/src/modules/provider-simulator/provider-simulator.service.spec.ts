import { BadRequestException } from '@nestjs/common';
import { GAME_CATALOG } from './provider-simulator-catalog';
import { ProviderSimulatorService } from './provider-simulator.service';

const TEST_GAME = GAME_CATALOG[0];

if (!TEST_GAME) {
  throw new Error('Provider simulator catalog must contain at least one game for service tests');
}

describe('ProviderSimulatorService', () => {
  let service: ProviderSimulatorService;
  let balances: Map<string, number>;
  let ledgers: Map<string, any>;
  let roundService: { enforceInTransaction: jest.Mock };

  const catalogGame = GAME_CATALOG[0]!;

  beforeEach(() => {
    balances = new Map([['member-1', 100], ['member-2', 50], ['member-3', 10]]);
    ledgers = new Map();
    roundService = { enforceInTransaction: jest.fn(async () => undefined) };

    const walletService = {
      getMemberWallet: jest.fn(async (userId: string) => ({
        balance: (balances.get(userId) ?? 0).toFixed(2),
        currency: 'THB',
      })),
      getMemberLedger: jest.fn(async (userId: string) => ({
        walletId: `wallet-${userId}`,
        items: Array.from(ledgers.values()).filter((item) => item.userId === userId),
      })),
      mutateGameBalance: jest.fn(async (input: any) => {
        const existing = ledgers.get(input.idempotencyKey);
        if (existing) {
          return {
            wallet: { balance: existing.balanceAfter, currency: 'THB' },
            ledger: existing,
            replayed: true,
          };
        }

        const transactionClient = {
          walletLedger: {
            findMany: jest.fn(async ({ where }: any) => Array.from(ledgers.values()).filter((item) => {
              if (where?.userId && item.userId !== where.userId) return false;
              if (where?.referenceType && item.referenceType !== where.referenceType) return false;
              return true;
            })),
          },
        };
        if (input.beforeMutation) await input.beforeMutation(transactionClient);

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
        return {
          wallet: { balance: after.toFixed(2), currency: 'THB' },
          ledger,
          replayed: false,
        };
      }),
    };

    service = new ProviderSimulatorService(walletService as any, roundService as any);
  });

  it('uses the existing platform wallet for balance and transfers', async () => {
    expect((await service.getBalance({ userId: 'member-1' })).balance).toBe('100.00');

    const transferIn = await service.transfer('TRANSFER_IN', {
      userId: 'member-1', amount: '35.50', currency: 'THB', idempotencyKey: 'in-1',
    });
    expect(transferIn).toMatchObject({ beforeBalance: '100.00', afterBalance: '64.50' });

    const transferOut = await service.transfer('TRANSFER_OUT', {
      userId: 'member-1', amount: '10.00', currency: 'THB', idempotencyKey: 'out-1',
    });
    expect(transferOut).toMatchObject({ beforeBalance: '64.50', afterBalance: '74.50' });
  });

  it('returns the original result for an idempotent retry', async () => {
    const input = { userId: 'member-2', amount: '20.00', currency: 'THB', idempotencyKey: 'retry-safe-1' };
    const first = await service.transfer('TRANSFER_IN', input);
    const retry = await service.transfer('TRANSFER_IN', input);
    expect(retry).toMatchObject({
      beforeBalance: first.beforeBalance,
      afterBalance: first.afterBalance,
      replayed: true,
    });
    expect((await service.getBalance({ userId: 'member-2' })).balance).toBe('30.00');
  });

  it('rejects an overdraft through the wallet contract', async () => {
    await expect(service.transfer('TRANSFER_IN', {
      userId: 'member-3', amount: '11.00', idempotencyKey: 'out-no-funds',
    })).rejects.toThrow('Balance cannot be negative');
  });

  it('records explicit bet, win, refund and rollback-bet operations', async () => {
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'bet-1', roundId: 'round-1', gameCode: TEST_GAME.code });
    await service.gameTransaction('WIN', { userId: 'member-1', amount: '25.00', transactionId: 'win-1', roundId: 'round-1', gameCode: TEST_GAME.code });
    await service.gameTransaction('BET', { userId: 'member-1', amount: '7.00', transactionId: 'bet-2', roundId: 'round-2', gameCode: TEST_GAME.code });
    await service.gameTransaction('REFUND', { userId: 'member-1', amount: '5.00', transactionId: 'refund-1', originalTransactionId: 'bet-2', roundId: 'round-2', gameCode: TEST_GAME.code });
    await service.gameTransaction('ROLLBACK', { userId: 'member-1', amount: '2.00', transactionId: 'rollback-1', originalTransactionId: 'bet-2', rollbackTarget: 'BET', roundId: 'round-2', gameCode: TEST_GAME.code });

    expect((await service.getBalance({ userId: 'member-1' })).balance).toBe('115.00');
    const history = await service.betHistory({ userId: 'member-1' });
    expect(history.items.map((item: any) => item.metadata.gameOperation))
      .toEqual(['BET', 'WIN', 'BET', 'REFUND', 'ROLLBACK_BET']);
    expect(roundService.enforceInTransaction).toHaveBeenCalledTimes(5);
  });

  it('debits the wallet when rolling back a win', async () => {
    await service.gameTransaction('WIN', { userId: 'member-1', amount: '25.00', transactionId: 'win-source', roundId: 'round-win', gameCode: TEST_GAME.code });
    const rollback = await service.gameTransaction('ROLLBACK', {
      userId: 'member-1', amount: '25.00', transactionId: 'win-rollback', originalTransactionId: 'win-source', rollbackTarget: 'WIN', roundId: 'round-win', gameCode: TEST_GAME.code,
    });
    expect(rollback).toMatchObject({ beforeBalance: '125.00', afterBalance: '100.00' });
  });

  it('requires and validates original transaction context', async () => {
    await expect(service.gameTransaction('REFUND', {
      userId: 'member-1', amount: '5.00', transactionId: 'refund-missing', roundId: 'round-1', gameCode: TEST_GAME.code,
    })).rejects.toThrow('originalTransactionId is required');

    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'bet-source', roundId: 'source-round', gameCode: TEST_GAME.code });
    await expect(service.gameTransaction('REFUND', {
      userId: 'member-1', amount: '5.00', transactionId: 'refund-wrong-round', originalTransactionId: 'bet-source', roundId: 'other-round', gameCode: TEST_GAME.code,
    })).rejects.toThrow('Original bet transaction was not found');
  });

  it('supports partial refunds but prevents over-refunding', async () => {
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'partial-bet', roundId: 'partial-round', gameCode: TEST_GAME.code });
    await service.gameTransaction('REFUND', { userId: 'member-1', amount: '4.00', transactionId: 'refund-1', originalTransactionId: 'partial-bet', roundId: 'partial-round', gameCode: TEST_GAME.code });
    await service.gameTransaction('REFUND', { userId: 'member-1', amount: '6.00', transactionId: 'refund-2', originalTransactionId: 'partial-bet', roundId: 'partial-round', gameCode: TEST_GAME.code });
    await expect(service.gameTransaction('REFUND', {
      userId: 'member-1', amount: '0.01', transactionId: 'refund-over', originalTransactionId: 'partial-bet', roundId: 'partial-round', gameCode: TEST_GAME.code,
    })).rejects.toThrow('Cumulative refund amount cannot exceed');
  });

  it('passes a stable concurrency key and canonical payload hash to the wallet boundary', async () => {
    const wallet = (service as any).walletService;
    await service.gameTransaction('BET', { userId: 'member-1', amount: '10.00', transactionId: 'hash-bet', roundId: 'hash-round', gameCode: TEST_GAME.code });
    expect(wallet.mutateGameBalance).toHaveBeenLastCalledWith(expect.objectContaining({
      concurrencyKey: `provider-simulator:member-1:${TEST_GAME.code}:hash-round`,
      beforeMutation: expect.any(Function),
      metadata: expect.objectContaining({ payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    }));
  });

  it('returns deterministic catalog and launch contracts', () => {
    const mobile = service.games('https://api.example.test', { platform: 'mobile' });
    const pc = service.games('https://api.example.test', { platform: 'pc' });
    expect(mobile.items.length).toBeGreaterThan(0);
    expect(pc.items.length).toBeGreaterThan(0);
    expect(mobile.items.every((item) => item.platform === 'mobile')).toBe(true);
    expect(pc.items.every((item) => item.platform === 'pc')).toBe(true);
    expect(service.icon(`${TEST_GAME.code}.svg`)).toContain('<svg');

    const launch = service.launch({ userId: 'member-1', gameCode: TEST_GAME.code, sessionId: 'session-1' });
    expect(launch.game).toEqual({ code: TEST_GAME.code, name: TEST_GAME.name, provider: TEST_GAME.provider, platform: TEST_GAME.platform });
    expect(launch.launchUrl).toContain(`provider=${TEST_GAME.provider}`);
  });
});
