import { Prisma } from '@prisma/client';
import { addDecimal, mapFinanceRequest, subtractDecimal } from './finance-report.mapper';

describe('finance report mapper', () => {
  it('adds and subtracts decimal values without number coercion', () => {
    expect(addDecimal(new Prisma.Decimal('0.1'), new Prisma.Decimal('0.2'))).toBe('0.3');
    expect(subtractDecimal(new Prisma.Decimal('10.50'), new Prisma.Decimal('2.25'))).toBe('8.25');
  });

  it('maps queue requests into the stable admin response shape', () => {
    const createdAt = new Date('2026-07-14T00:00:00.000Z');
    expect(mapFinanceRequest({
      id: 'request-1',
      userId: '1234567890abcdef',
      amount: new Prisma.Decimal('125.50'),
      currency: 'THB',
      status: 'PENDING',
      method: 'BANK_TRANSFER',
      createdAt,
      user: {
        id: '1234567890abcdef',
        username: 'member',
        phone: null,
        email: 'member@example.com',
      },
    })).toEqual({
      id: 'request-1',
      userId: '1234567890abcdef',
      shortUserId: '12345678',
      amount: '125.5',
      currency: 'THB',
      status: 'PENDING',
      method: 'BANK_TRANSFER',
      createdAt,
      user: {
        id: '1234567890abcdef',
        shortId: '12345678',
        username: 'member',
        phone: null,
        email: 'member@example.com',
      },
    });
  });
});
