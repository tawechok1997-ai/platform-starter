type DomainErrorCode =
  | 'INVALID_AMOUNT'
  | 'INVALID_STATE_TRANSITION'
  | 'INSUFFICIENT_BALANCE'
  | 'RESOURCE_LOCKED'
  | 'POLICY_VIOLATION'
  | 'INVALID_IDENTIFIER'
  | 'INVALID_PHONE'
  | 'INVALID_BANK_ACCOUNT';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super('INVALID_STATE_TRANSITION', `${entity} cannot transition from ${from} to ${to}`, {
      entity,
      from,
      to,
    });
  }
}
