import { ProviderSimulatorRoundService } from './provider-simulator-round.service';

describe('ProviderSimulatorRoundService', () => {
  let items: any[];
  let service: ProviderSimulatorRoundService;

  beforeEach(() => {
    items = [];
    service = new ProviderSimulatorRoundService({
      getMemberLedger: jest.fn(async () => ({ walletId: 'wallet-1', items })),
    } as any);
  });

  it('allows bet then win for the same round', async () => {
    const bet = await service.enforce('BET', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'bet-1',
    });
    expect(bet.state).toBe('BET');

    items.push(ledger('BET', 'bet-1'));
    const win = await service.enforce('WIN', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'win-1',
    });
    expect(win.state).toBe('SETTLED');
  });

  it('replays a matching duplicate bet safely', async () => {
    items.push(ledger('BET', 'bet-1'));
    const result = await service.enforce('BET', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'bet-1',
    });
    expect(result).toMatchObject({ state: 'BET', betTransactionId: 'bet-1' });
  });

  it('allows an additional bet in an active round', async () => {
    items.push(ledger('BET', 'bet-1'));
    const result = await service.enforce('BET', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'bet-2',
    });
    expect(result).toMatchObject({ state: 'BET', betTransactionId: 'bet-2' });
  });

  it('rejects settlement before a bet', async () => {
    await expect(service.enforce('WIN', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'win-1',
    })).rejects.toThrow('Cannot settle while round is CREATED');
  });

  it('keeps refund separate from rollback', async () => {
    items.push(ledger('BET', 'bet-1'));
    const result = await service.enforce('REFUND', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'refund-1',
    });
    expect(result).toMatchObject({ state: 'BET', refundTransactionId: 'refund-1' });
  });

  it('allows rollback after settlement', async () => {
    items.push(ledger('WIN', 'win-1'), ledger('BET', 'bet-1'));
    const result = await service.enforce('ROLLBACK', {
      userId: 'member-1', roundId: 'round-1', gameCode: 'fortune-tiger', transactionId: 'rollback-1',
    });
    expect(result.state).toBe('ROLLED_BACK');
  });

  function ledger(kind: string, transactionId: string) {
    return {
      referenceType: `game_${kind.toLowerCase()}`,
      referenceId: `sim_${kind.toLowerCase()}_${transactionId}`,
      metadata: {
        roundId: 'round-1',
        gameCode: 'fortune-tiger',
        transactionKind: kind,
        providerTransactionId: `sim_${kind.toLowerCase()}_${transactionId}`,
      },
    };
  }
});
