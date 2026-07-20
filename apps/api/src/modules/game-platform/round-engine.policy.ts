export type GameRoundState = 'CREATED' | 'BET' | 'SETTLED' | 'ROLLED_BACK' | 'CLOSED';
export type GameRoundEvent = 'PLACE_BET' | 'SETTLE' | 'ROLLBACK' | 'CLOSE';

export type GameRoundSnapshot = {
  roundId: string;
  providerRoundId: string;
  state: GameRoundState;
  betTransactionId?: string;
  settleTransactionId?: string;
  rollbackTransactionId?: string;
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

  switch (event) {
    case 'PLACE_BET':
      if (round.state === 'BET' && round.betTransactionId === id) return round;
      if (round.state !== 'CREATED') {
        throw new GameRoundTransitionError(`Cannot place bet while round is ${round.state}`);
      }
      return { ...round, state: 'BET', betTransactionId: id };

    case 'SETTLE':
      if (round.state === 'SETTLED' && round.settleTransactionId === id) return round;
      if (round.state !== 'BET') {
        throw new GameRoundTransitionError(`Cannot settle while round is ${round.state}`);
      }
      return { ...round, state: 'SETTLED', settleTransactionId: id };

    case 'ROLLBACK':
      if (round.state === 'ROLLED_BACK' && round.rollbackTransactionId === id) return round;
      if (round.state !== 'BET' && round.state !== 'SETTLED') {
        throw new GameRoundTransitionError(`Cannot rollback while round is ${round.state}`);
      }
      return { ...round, state: 'ROLLED_BACK', rollbackTransactionId: id };

    case 'CLOSE':
      if (round.state === 'CLOSED') return round;
      if (round.state !== 'SETTLED' && round.state !== 'ROLLED_BACK') {
        throw new GameRoundTransitionError(`Cannot close while round is ${round.state}`);
      }
      return { ...round, state: 'CLOSED' };
  }
}
