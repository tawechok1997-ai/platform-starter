import { Prisma } from '@prisma/client';
import {
  addReportDecimal,
  formatAgeLabel,
  mapQueueAgingItem,
  mapReportGroup,
  subtractReportDecimal,
} from './report.mapper';

describe('report.mapper', () => {
  it('preserves decimal precision', () => {
    expect(addReportDecimal(new Prisma.Decimal('0.1'), new Prisma.Decimal('0.2'))).toBe('0.3');
    expect(subtractReportDecimal(new Prisma.Decimal('10.5'), new Prisma.Decimal('0.5'))).toBe('10');
  });

  it('formats grouped report totals', () => {
    expect(
      mapReportGroup({
        status: 'APPROVED',
        _count: { _all: 2 },
        _sum: { amount: new Prisma.Decimal('25.50') },
      }),
    ).toEqual({ status: 'APPROVED', count: 2, amount: '25.5' });
  });

  it('formats queue aging without leaking database decimals', () => {
    const now = Date.parse('2026-07-14T12:00:00.000Z');
    expect(
      mapQueueAgingItem(
        'TOPUP',
        {
          id: 'topup-1',
          userId: '1234567890',
          amount: new Prisma.Decimal('100.00'),
          currency: 'THB',
          createdAt: new Date('2026-07-14T10:30:00.000Z'),
          user: { username: 'member1', email: null },
        },
        now,
      ),
    ).toMatchObject({
      id: 'topup-1',
      type: 'TOPUP',
      username: 'member1',
      amount: '100',
      ageMinutes: 90,
      ageLabel: '1h 30m',
    });
  });

  it('formats minute, hour and day age labels', () => {
    expect(formatAgeLabel(15)).toBe('15m');
    expect(formatAgeLabel(61)).toBe('1h 1m');
    expect(formatAgeLabel(1500)).toBe('1d 1h');
  });
});
