import { GameRoundPersistenceService } from './game-round-persistence.service';

type FakeRound = {
  id: string;
  providerRoundId: string;
  state: 'CREATED' | 'BET' | 'SETTLED' | 'ROLLED_BACK' | 'CLOSED';
  betTransactionId: string | null;
  settleTransactionId: string | null;
  rollbackTransactionId: string | null;
};

const createdRound = (): FakeRound => ({
  id: '11111111-1111-4111-8111-111111111111',
  providerRoundId: 'provider-round-1',
  state: 'CREATED',
  betTransactionId: null,
  settleTransactionId: null,
  rollbackTransactionId: null,
});

describe('GameRoundPersistenceService', () => {
  const service = new GameRoundPersistenceService();

  it('creates and persists a bet transition', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([createdRound()]),
    };
    const result = await service.applyWebhookEvents(tx as never, '22222222-2222-4222-8222-222222222222', [{
      eventType: 'bet_placed', providerTransactionId: 'bet-1', roundId: 'provider-round-1', payload: { amount: '10.00' },
    }]);
    expect(result).toEqual([expect.objectContaining({ providerRoundId: 'provider-round-1', state: 'BET', event: 'PLACE_BET', replay: false })]);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('replays the matching provider transaction without another update', async () => {
    const round = { ...createdRound(), state: 'BET' as const, betTransactionId: 'bet-1' };
    const tx = { $executeRaw: jest.fn().mockResolvedValue(1), $queryRaw: jest.fn().mockResolvedValueOnce([round]) };
    const result = await service.applyWebhookEvents(tx as never, '22222222-2222-4222-8222-222222222222', [{
      eventType: 'BET', providerTransactionId: 'bet-1', roundId: 'provider-round-1', payload: {},
    }]);
    expect(result[0]).toEqual(expect.objectContaining({ state: 'BET', replay: true }));
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('ignores unsupported events', async () => {
    const tx = { $executeRaw: jest.fn(), $queryRaw: jest.fn() };
    const result = await service.applyWebhookEvents(tx as never, 'provider-id', [{ eventType: 'BALANCE_CHANGED', roundId: 'provider-round-1', payload: {} }]);
    expect(result).toEqual([]);
  });
});
