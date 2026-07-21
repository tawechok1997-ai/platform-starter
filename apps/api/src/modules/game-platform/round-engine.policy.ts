export type GameRoundState = 'CREATED' | 'BET' | 'SETTLED' | 'ROLLED_BACK' | 'CLOSED';
export type GameRoundEvent = 'PLACE_BET' | 'SETTLE' | 'REFUND' | 'ROLLBACK' | 'CANCEL' | 'CLOSE';

export type GameRoundSnapshot = {
  roundId: string;
  providerRoundId: string;
  state: GameRoundState;
  betTransactionId?: string;
  settleTransactionId?: string;
  refundTransactionId?: string;
  rollbackTransactionId?: string;
  cancelTransactionId?: string;
};

export class GameRoundTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameRoundTransitionError';
  }
}

export function transitionGameRound(
  round: GameRoundSnapshot,
  event: GameRoundEvent,
  transactionId?: string,
): GameRoundSnapshot {
  const id = transactionId?.trim();

  if (event !== 'CLOSE' && !id) {
    throw new GameRoundTransitionError('transactionId is required for a round mutation');
  }

  if (round.state === 'CLOSED' && event !== 'CLOSE') {
    throw new GameRoundTransitionError('Cannot mutate a closed round');
  }

  switch (event) {
    case 'PLACE_BET':
      if (round.betTransactionId === id) return round;
      if (round.betTransactionId) {
        throw new GameRoundTransitionError('Round already has a different bet transaction');
      }
      if (round.state !== 'CREATED') {
        throw new GameRoundTransitionError(`Cannot place bet while round is ${round.state}`);
      }
      return { ...round, state: 'BET', betTransactionId: id };

    case 'SETTLE':
      if (round.settleTransactionId === id) return round;
      if (round.settleTransactionId) {
        throw new GameRoundTransitionError('Round already has a different settlement transaction');
      }
      if (round.state !== 'BET') {
        throw new GameRoundTransitionError(`Cannot settle while round is ${round.state}`);
      }
      return { ...round, state: 'SETTLED', settleTransactionId: id };

    case 'REFUND':
      if (round.refundTransactionId === id) return round;
      if (round.state !== 'BET' && round.state !== 'SETTLED' && round.state !== 'ROLLED_BACK') {
        throw new GameRoundTransitionError(`Cannot refund while round is ${round.state}`);
      }
      return { ...round, refundTransactionId: id };

    case 'ROLLBACK':
      if (round.rollbackTransactionId === id) return round;
      if (round.state !== 'BET' && round.state !== 'SETTLED' && round.state !== 'ROLLED_BACK') {
        throw new GameRoundTransitionError(`Cannot rollback while round is ${round.state}`);
      }
      return { ...round, state: 'ROLLED_BACK', rollbackTransactionId: id };

    case 'CANCEL':
      if (round.cancelTransactionId === id) return round;
      if (round.state !== 'CREATED' && round.state !== 'BET') {
        throw new GameRoundTransitionError(`Cannot cancel while round is ${round.state}`);
      }
      return { ...round, state: 'ROLLED_BACK', cancelTransactionId: id };

    case 'CLOSE':
      if (round.state === 'CLOSED') return round;
      if (round.state !== 'SETTLED' && round.state !== 'ROLLED_BACK') {
        throw new GameRoundTransitionError(`Cannot close while round is ${round.state}`);
      }
      return { ...round, state: 'CLOSED' };
  }
}
