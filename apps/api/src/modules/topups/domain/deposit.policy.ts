import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';
import { Money } from '../../../common/domain/value-objects';

export type DepositStatus = 'PENDING' | 'PENDING_SLIP_REVIEW' | 'PENDING_CREDIT' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

const TRANSITIONS: Readonly<Record<DepositStatus, readonly DepositStatus[]>> = {
  PENDING: ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'REJECTED', 'CANCELLED'],
  PENDING_SLIP_REVIEW: ['PENDING_CREDIT', 'REJECTED', 'CANCELLED'],
  PENDING_CREDIT: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export const DepositPolicy = {
  assertAmount(amount: Money): void {
    if (!amount.isPositive()) throw new DomainError('INVALID_AMOUNT', 'Deposit amount must be greater than zero');
  },

  assertTransition(from: DepositStatus, to: DepositStatus): void {
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('Deposit', from, to);
  },

  canBeClaimed(status: DepositStatus): boolean {
    return status === 'PENDING' || status === 'PENDING_SLIP_REVIEW' || status === 'PENDING_CREDIT';
  },

  assertClaim(status: DepositStatus, claimedBy: string | null, actorId: string, claimedAt: Date | null, timeoutMs: number, now = Date.now()): void {
    if (!this.canBeClaimed(status)) throw new DomainError('POLICY_VIOLATION', 'Deposit is not available for claim');
    if (claimedBy && claimedBy !== actorId && claimedAt && now - claimedAt.getTime() < timeoutMs) {
      throw new DomainError('RESOURCE_LOCKED', 'Deposit is being reviewed by another administrator');
    }
  },
};
