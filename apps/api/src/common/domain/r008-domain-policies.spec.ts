import { DomainError, InvalidStateTransitionError } from './domain-error';
import { BankAccountNumber, Money, PhoneNumber } from './value-objects';
import { DepositPolicy } from '../../modules/topups/domain/deposit.policy';
import { WithdrawalPolicy } from '../../modules/withdrawals/domain/withdrawal.policy';
import { WalletSettlementPolicy } from '../../modules/wallet/domain/wallet-settlement.policy';
import { AdminOwnershipPolicy } from '../../modules/admin-access/domain/admin-ownership.policy';
import { KycReviewPolicy } from '../../modules/risk-alerts/domain/kyc-review.policy';
import { WatchlistPolicy } from '../../modules/risk-alerts/domain/watchlist.policy';
import { SupportTicketPolicy } from '../../modules/support/domain/support-ticket.policy';
import { NotificationPreferencePolicy } from '../../modules/notifications/domain/notification-preference.policy';

describe('R-008 domain policies', () => {
  it('represents THB money without floating-point drift', () => {
    expect(Money.fromMajor('10.25').add(Money.fromMajor('0.75')).toMajorString()).toBe('11.00');
  });

  it('normalizes phone and bank account values', () => {
    expect(PhoneNumber.create('+66 81-234-5678').value).toBe('+66812345678');
    expect(BankAccountNumber.create('123-4-56789-0').value).toBe('1234567890');
  });

  it('blocks invalid deposit and withdrawal transitions', () => {
    expect(() => DepositPolicy.assertTransition('COMPLETED', 'PENDING')).toThrow(InvalidStateTransitionError);
    expect(() => WithdrawalPolicy.assertTransition('COMPLETED', 'PENDING_REVIEW')).toThrow(InvalidStateTransitionError);
  });

  it('reserves and settles wallet balances consistently', () => {
    const balance = Money.fromMajor('100.00');
    const locked = Money.fromMajor('10.00');
    const requested = Money.fromMajor('25.00');
    expect(WalletSettlementPolicy.reserve(balance, locked, requested).toMajorString()).toBe('35.00');
    expect(WalletSettlementPolicy.completeDebit(balance, Money.fromMajor('25.00'), requested)).toEqual({
      balanceAfter: Money.fromMajor('75.00'),
      lockedAfter: Money.fromMajor('0.00'),
    });
  });

  it('protects last-owner and ownership transfer invariants', () => {
    expect(() => AdminOwnershipPolicy.assertCanDeactivate({ targetIsOwner: true, activeOwnerCount: 1, actorId: 'a', targetId: 'b' })).toThrow(DomainError);
    expect(() => AdminOwnershipPolicy.assertCanTransfer({ actorIsOwner: false, actorId: 'a', targetId: 'b', targetActive: true })).toThrow(DomainError);
  });

  it('requires KYC rejection reasons and classifies watchlist matches', () => {
    expect(() => KycReviewPolicy.assertReviewReason('REJECTED')).toThrow(DomainError);
    expect(WatchlistPolicy.classify(0.91)).toBe('BLOCK');
    expect(WatchlistPolicy.classify(0.7)).toBe('REVIEW');
  });

  it('models support and notification policy independently from NestJS', () => {
    expect(SupportTicketPolicy.nextStatusForReply('MEMBER', 'RESOLVED')).toBe('REVIEWING');
    expect(SupportTicketPolicy.nextStatusForReply('MEMBER', 'OPEN')).toBe('OPEN');
    expect(SupportTicketPolicy.canReopen('DISMISSED')).toBe(true);
    expect(() => SupportTicketPolicy.assertResolutionReason('DISMISSED')).toThrow(DomainError);
    expect(NotificationPreferencePolicy.normalize({ category: 'SECURITY', channels: ['EMAIL'] }).channels).toEqual(['IN_APP', 'EMAIL']);
    expect(() => NotificationPreferencePolicy.assertMutable('FINANCE', [])).toThrow(DomainError);
  });
});
