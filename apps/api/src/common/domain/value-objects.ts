import { DomainError } from './domain-error';

export class Money {
  private constructor(
    public readonly minorUnits: bigint,
    public readonly currency: string,
  ) {}

  static fromMajor(value: string | number, currency = 'THB'): Money {
    const normalized = typeof value === 'number' ? value.toFixed(2) : value.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      throw new DomainError('INVALID_AMOUNT', 'Money must be a non-negative decimal with at most two decimal places');
    }
    const [whole, fraction = ''] = normalized.split('.');
    return new Money(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')), currency.toUpperCase());
  }

  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (this.minorUnits < other.minorUnits)
      throw new DomainError('INSUFFICIENT_BALANCE', 'Money cannot become negative');
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  toMajorString(): string {
    const whole = this.minorUnits / 100n;
    const fraction = (this.minorUnits % 100n).toString().padStart(2, '0');
    return `${whole}.${fraction}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) throw new DomainError('POLICY_VIOLATION', 'Currency mismatch');
  }
}

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static create(input: string): PhoneNumber {
    const normalized = input.replace(/[\s()-]/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(normalized)) throw new DomainError('INVALID_PHONE', 'Invalid phone number');
    return new PhoneNumber(normalized);
  }
}

export class BankAccountNumber {
  private constructor(public readonly value: string) {}

  static create(input: string): BankAccountNumber {
    const normalized = input.replace(/[\s-]/g, '');
    if (!/^\d{6,20}$/.test(normalized)) throw new DomainError('INVALID_BANK_ACCOUNT', 'Invalid bank account number');
    return new BankAccountNumber(normalized);
  }
}

export class EntityId {
  private constructor(public readonly value: string) {}

  static create(input: string): EntityId {
    const normalized = input.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
      throw new DomainError('INVALID_IDENTIFIER', 'Invalid entity identifier');
    }
    return new EntityId(normalized);
  }
}
