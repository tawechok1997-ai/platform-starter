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

  it('supports multiple distinct bets and settlements', () => {
    const firstBet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const secondBet = transitionGameRound(firstBet, 'PLACE_BET', 'bet-2');
    const firstWin = transitionGameRound(secondBet, 'SETTLE', 'win-1');
    const secondWin = transitionGameRound(firstWin, 'SETTLE', 'win-2');
    expect(secondBet.betTransactionId).toBe('bet-2');
    expect(secondWin.settleTransactionId).toBe('win-2');
  });

  it('records refund without collapsing it into rollback', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const refunded = transitionGameRound(bet, 'REFUND', 'refund-1');
    expect(refunded.state).toBe('BET');
    expect(refunded.refundTransactionId).toBe('refund-1');
  });

  it('records cancel separately from rollback', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const cancelled = transitionGameRound(bet, 'CANCEL', 'cancel-1');
    expect(cancelled.state).toBe('ROLLED_BACK');
    expect(cancelled.cancelTransactionId).toBe('cancel-1');
    expect(cancelled.rollbackTransactionId).toBeUndefined();
  });

  it('replays matching duplicate transactions without changing state', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    expect(transitionGameRound(bet, 'PLACE_BET', 'bet-1')).toBe(bet);
    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    expect(transitionGameRound(settled, 'SETTLE', 'settle-1')).toBe(settled);
  });

  it('allows rollback from bet or settled and then close', () => {
    const bet = transitionGameRound(created(), 'PLACE_BET', 'bet-1');
    const rolledBackFromBet = transitionGameRound(bet, 'ROLLBACK', 'rollback-1');
    expect(transitionGameRound(rolledBackFromBet, 'CLOSE').state).toBe('CLOSED');
    const settled = transitionGameRound(bet, 'SETTLE', 'settle-1');
    expect(transitionGameRound(settled, 'ROLLBACK', 'rollback-2').state).toBe('ROLLED_BACK');
  });

  it('rejects invalid transitions and mutations after close', () => {
    expect(() => transitionGameRound(created(), 'SETTLE', 'settle-1')).toThrow(GameRoundTransitionError);
    expect(() => transitionGameRound(created(), 'PLACE_BET')).toThrow('transactionId is required');
    expect(() => transitionGameRound(created(), 'CLOSE')).toThrow('Cannot close');
    const closed: GameRoundSnapshot = { ...created(), state: 'CLOSED' };
    expect(() => transitionGameRound(closed, 'PLACE_BET', 'bet-1')).toThrow('Cannot mutate a closed round');
  });
});
