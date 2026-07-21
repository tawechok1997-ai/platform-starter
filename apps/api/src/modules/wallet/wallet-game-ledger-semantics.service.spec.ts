import { Decimal } from '@prisma/client/runtime/library';
import { WalletService } from './wallet.service';

describe('WalletService game ledger semantics', () => {
  const wallet = {
    id: 'wallet-1',
    userId: 'member-1',
    currency: 'THB',
    balance: new Decimal(100),
    lockedBalance: new Decimal(0),
    status: 'ACTIVE',
    updatedAt: new Date('2026-07-20T00:00:00.000Z'),
  };

  const ledger = (overrides: Record<string, unknown> = {}) => ({
    id: 'ledger-1',
    walletId: wallet.id,
    userId: wallet.userId,
    type: 'TRANSFER',
    direction: 'DEBIT',
    amount: new Decimal(10),
    balanceBefore: new Decimal(100),
    balanceAfter: new Decimal(90),
    referenceType: 'game_bet',
    referenceId: 'sim_bet_bet-1',
    idempotencyKey: 'game:provider-simulator:BET:bet-1',
    metadata: {
      gameOperation: 'BET',
      provider: 'provider-simulator',
      gameCode: 'thai-hi-lo-2',
      roundId: 'round-1',
      originalTransactionId: null,
    },
    createdByAdminId: null,
    createdAt: new Date('2026-07-20T00:00:00.000Z'),
    ...overrides,
  });

  function createService(items: ReturnType<typeof ledger>[]) {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue(wallet) },
      walletLedger: { findMany: jest.fn().mockResolvedValue(items) },
    };
    return { service: new WalletService(prisma as never), prisma };
  }

  it('filters member history by operation, provider, game and round', async () => {
    const matching = ledger();
    const other = ledger({
      id: 'ledger-2',
      referenceType: 'game_win',
      metadata: { gameOperation: 'WIN', provider: 'other-provider', gameCode: 'other-game', roundId: 'round-2' },
    });
    const { service, prisma } = createService([matching, other]);

    const result = await service.getMemberLedger('member-1', 50, {
      operation: 'bet',
      provider: 'provider-simulator',
      gameCode: 'thai-hi-lo-2',
      roundId: 'round-1',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      gameOperation: 'BET',
      provider: 'provider-simulator',
      gameCode: 'thai-hi-lo-2',
      roundId: 'round-1',
    });
    expect(result.filters).toEqual({
      operation: 'BET',
      provider: 'provider-simulator',
      gameCode: 'thai-hi-lo-2',
      roundId: 'round-1',
    });
    expect(prisma.walletLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 500 }));
  });

  it('derives legacy game operations from reference type when metadata is absent', async () => {
    const { service } = createService([
      ledger({ referenceType: 'game_rollback_win', metadata: null, direction: 'DEBIT', type: 'REVERSAL' }),
    ]);

    const result = await service.getMemberLedger('member-1', 50, { operation: 'ROLLBACK_WIN' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      gameOperation: 'ROLLBACK_WIN',
      provider: null,
      gameCode: null,
      roundId: null,
      originalTransactionId: null,
    });
  });
});
