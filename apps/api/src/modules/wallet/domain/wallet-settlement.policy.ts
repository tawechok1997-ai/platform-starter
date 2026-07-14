import { DomainError } from '../../../common/domain/domain-error';
import { Money } from '../../../common/domain/value-objects';

export const WalletSettlementPolicy = {
  assertActive(status: string): void {
    if (status !== 'ACTIVE') throw new DomainError('POLICY_VIOLATION', 'Wallet is not active');
  },
  reserve(balance: Money, locked: Money, amount: Money): Money {
    this.assertSufficientAvailable(balance, locked, amount);
    return locked.add(amount);
  },
  completeDebit(balance: Money, locked: Money, amount: Money): { balanceAfter: Money; lockedAfter: Money } {
    if (locked.minorUnits < amount.minorUnits) throw new DomainError('INSUFFICIENT_BALANCE', 'Locked balance is insufficient');
    return { balanceAfter: balance.subtract(amount), lockedAfter: locked.subtract(amount) };
  },
  releaseReservation(locked: Money, amount: Money): Money {
    return locked.subtract(amount);
  },
  assertSufficientAvailable(balance: Money, locked: Money, amount: Money): void {
    const available = balance.subtract(locked);
    if (available.minorUnits < amount.minorUnits) throw new DomainError('INSUFFICIENT_BALANCE', 'Insufficient available balance');
  },
};
