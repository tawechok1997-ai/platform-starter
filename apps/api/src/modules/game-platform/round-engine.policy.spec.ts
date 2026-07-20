import { GameRoundTransitionError, transitionGameRound, type GameRoundSnapshot } from './round-engine.policy';

const created = (): GameRoundSnapshot => ({
  roundId: 'round-1',
  providerRoundId: 'provider-round-1',
  state: 'CREATED',
});

describe('transitionGameRound', () => {
  it('moves a round through bet, settle and close', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    const closed = transitionGameRound(settled, 'CLOSE');

    expect(bet.state).toBe('BET');
    expect(settled.state).toBe('SETTLED');
    expect(closed.state).toBe('CLOSED');
  });

  it('replays matching duplicate transactions without changing state', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    expect(transitionGameRound(bet, 'PLACE_BET', 'bet-1')).toBe(bet);

    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    expect(transitionGameRound(settled, 'SETTLE', 'settle-1')).toBe(settled);
  });

  it('rejects conflicting duplicate bets and settlements', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    expect(() => transitionGameRound(bet, 'PLACE_BET', 'bet-2')).toThrow(GameRoundTransitionError);

    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    expect(() => transitionGameRound(settled, 'SETTLE', 'settle-2')).toThrow(GameRoundTransitionError);
  });

  it('allows rollback from bet or settled and then close', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const rolledBackFromBet = transitionGameRound(bet, 'ROLLBACK', 'rollback-1');
    expect(transitionGameRound(rolledBackFromBet, 'CLOSE').state).toBe('CLOSED');

    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    const rolledBackFromSettle = transitionGameRound(settled, 'ROLLBACK', 'rollback-2');
    expect(rolledBackFromSettle.state).toBe('ROLLED_BACK');
  });

  it('rejects invalid transitions and missing transaction ids', () => {
    expect(() => transitionGameRound(created(), 'SETTLE', 'settle-1')).toThrow('Cannot settle');
    expect(() => transitionGameRound(created(), 'PLACE_BET')).toThrow('transactionId is required');
    expect(() => transitionGameRound(created(), 'CLOSE')).toThrow('Cannot close');
  });
});
