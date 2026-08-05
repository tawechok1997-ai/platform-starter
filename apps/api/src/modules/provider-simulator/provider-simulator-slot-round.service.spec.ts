import { ProviderSimulatorSlotRoundService } from './provider-simulator-slot-round.service';

const SESSION = {
  id: '7dc41e16-79dd-41ca-809c-820255c72737',
  game: { providerGameCode: 'demo-slot-001', name: 'Demo Fortune Slot', category: 'slot', status: 'ACTIVE' },
  provider: { code: 'simulator-provider', name: 'Simulator Provider', currency: 'THB', status: 'ACTIVE' },
};
const ROUND_ID = 'slot_b2176507-2df4-4e4b-b2cb-1929959eb683';

function ledger(operation: string, amount: string, transactionId: string, balanceBefore: string, balanceAfter: string) {
  return {
    id: `${operation}-${transactionId}`,
    referenceType: `game_${operation.toLowerCase()}`,
    direction: operation === 'BET' || operation === 'ROLLBACK_WIN' ? 'DEBIT' : 'CREDIT',
    amount: { toString: () => amount },
    balanceBefore: { toString: () => balanceBefore },
    balanceAfter: { toString: () => balanceAfter },
    createdAt: new Date(`2026-08-03T01:0${operation === 'BET' ? '0' : '1'}:00.000Z`),
    metadata: {
      sessionId: SESSION.id,
      gameCode: 'demo-slot-001',
      roundId: ROUND_ID,
      gameOperation: operation,
      transactionId,
    },
  };
}

describe('ProviderSimulatorSlotRoundService', () => {
  it('reverses WIN before BET with one deterministic rollback id', async () => {
    const source = [
      ledger('WIN', '75.00', 'win-spin', '950.00', '1025.00'),
      ledger('BET', '50.00', 'bet-spin', '1000.00', '950.00'),
    ];
    const rolledBack = [
      ledger('ROLLBACK_BET', '50.00', `rollback_${ROUND_ID}`, '950.00', '1000.00'),
      ledger('ROLLBACK_WIN', '75.00', `rollback_${ROUND_ID}`, '1025.00', '950.00'),
      ...source,
    ];
    const repository = {
      findOwnedSession: jest.fn().mockResolvedValue(SESSION),
      listOwnedSessionLedgers: jest.fn().mockResolvedValueOnce(source).mockResolvedValueOnce(rolledBack),
      metadata: (value: unknown) => value as Record<string, unknown>,
    };
    const transactions = {
      gameTransaction: jest.fn()
        .mockResolvedValueOnce({ afterBalance: '950.00', replayed: false })
        .mockResolvedValueOnce({ afterBalance: '1000.00', replayed: false }),
    };
    const service = new ProviderSimulatorSlotRoundService(repository as any, transactions as any);

    const result = await service.rollback('member-1', SESSION.id, ROUND_ID);

    expect(transactions.gameTransaction).toHaveBeenNthCalledWith(1, 'ROLLBACK', expect.objectContaining({
      rollbackTarget: 'WIN',
      originalTransactionId: 'win-spin',
      transactionId: `rollback_${ROUND_ID}`,
      amount: '75.00',
    }));
    expect(transactions.gameTransaction).toHaveBeenNthCalledWith(2, 'ROLLBACK', expect.objectContaining({
      rollbackTarget: 'BET',
      originalTransactionId: 'bet-spin',
      transactionId: `rollback_${ROUND_ID}`,
      amount: '50.00',
    }));
    expect(result.balance).toBe('1000.00');
    expect(result.round).toEqual(expect.objectContaining({ status: 'ROLLED_BACK', netAmount: '0.00' }));
  });

  it('does not credit an already rolled-back round twice', async () => {
    const entries = [
      ledger('ROLLBACK_BET', '50.00', `rollback_${ROUND_ID}`, '950.00', '1000.00'),
      ledger('BET', '50.00', 'bet-spin', '1000.00', '950.00'),
    ];
    const repository = {
      findOwnedSession: jest.fn().mockResolvedValue(SESSION),
      listOwnedSessionLedgers: jest.fn().mockResolvedValue(entries),
      metadata: (value: unknown) => value as Record<string, unknown>,
    };
    const transactions = { gameTransaction: jest.fn() };
    const service = new ProviderSimulatorSlotRoundService(repository as any, transactions as any);

    const result = await service.rollback('member-1', SESSION.id, ROUND_ID);

    expect(result.replayed).toBe(true);
    expect(result.balance).toBe('1000.00');
    expect(transactions.gameTransaction).not.toHaveBeenCalled();
  });

  it('rejects rollback after the original bet was refunded', async () => {
    const entries = [
      ledger('REFUND', '50.00', 'refund-spin', '950.00', '1000.00'),
      ledger('BET', '50.00', 'bet-spin', '1000.00', '950.00'),
    ];
    const repository = {
      findOwnedSession: jest.fn().mockResolvedValue(SESSION),
      listOwnedSessionLedgers: jest.fn().mockResolvedValue(entries),
      metadata: (value: unknown) => value as Record<string, unknown>,
    };
    const transactions = { gameTransaction: jest.fn() };
    const service = new ProviderSimulatorSlotRoundService(repository as any, transactions as any);

    await expect(service.rollback('member-1', SESSION.id, ROUND_ID))
      .rejects.toThrow('Refunded simulator rounds cannot be rolled back');
    expect(transactions.gameTransaction).not.toHaveBeenCalled();
  });

  it('returns ledger-backed round history rather than browser-only history', async () => {
    const repository = {
      findOwnedSession: jest.fn().mockResolvedValue(SESSION),
      listOwnedSessionLedgers: jest.fn().mockResolvedValue([
        ledger('WIN', '75.00', 'win-spin', '950.00', '1025.00'),
        ledger('BET', '50.00', 'bet-spin', '1000.00', '950.00'),
      ]),
      metadata: (value: unknown) => value as Record<string, unknown>,
    };
    const service = new ProviderSimulatorSlotRoundService(repository as any, { gameTransaction: jest.fn() } as any);

    const result = await service.history('member-1', SESSION.id);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(expect.objectContaining({
      roundId: ROUND_ID,
      status: 'SETTLED',
      betAmount: '50.00',
      winAmount: '75.00',
      netAmount: '25.00',
      canRollback: true,
    }));
  });
});
