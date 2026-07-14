import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';
import { Money } from '../../../common/domain/value-objects';

export type WithdrawalStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED_FOR_PAYMENT' | 'PAYMENT_PROOF_UPLOADED' | 'PAYMENT_VERIFIED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

const TRANSITIONS: Readonly<Record<WithdrawalStatus, readonly WithdrawalStatus[]>> = {
  PENDING: ['APPROVED_FOR_PAYMENT', 'REJECTED', 'CANCELLED'],
  PENDING_REVIEW: ['APPROVED_FOR_PAYMENT', 'REJECTED', 'CANCELLED'],
  APPROVED_FOR_PAYMENT: ['PAYMENT_PROOF_UPLOADED', 'PAYMENT_VERIFIED', 'COMPLETED', 'REJECTED'],
  PAYMENT_PROOF_UPLOADED: ['PAYMENT_VERIFIED', 'REJECTED'],
  PAYMENT_VERIFIED: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export const WithdrawalPolicy = {
  assertAmount(amount: Money): void {
    if (!amount.isPositive()) throw new DomainError('INVALID_AMOUNT', 'Withdrawal amount must be greater than zero');
  },

  assertTransition(from: WithdrawalStatus, to: WithdrawalStatus): void {
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('Withdrawal', from, to);
  },

  canBeClaimed(status: WithdrawalStatus): boolean {
    return ['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(status);
  },

  assertAvailableBalance(balance: Money, locked: Money, requested: Money): void {
    const available = balance.subtract(locked);
    if (available.minorUnits < requested.minorUnits) throw new DomainError('INSUFFICIENT_BALANCE', 'Insufficient available balance');
  },

  assertCompletionBalance(balance: Money, locked: Money, requested: Money): void {
    if (balance.minorUnits < requested.minorUnits || locked.minorUnits < requested.minorUnits) {
      throw new DomainError('INSUFFICIENT_BALANCE', 'Wallet balance is not enough to complete withdrawal');
    }
  },
};
