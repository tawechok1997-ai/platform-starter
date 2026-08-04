import { BadRequestException } from '@nestjs/common';
import { MAX_ADMIN_TREND_RANGE_DAYS, resolveAdminTrendRange } from './report-range';

describe('resolveAdminTrendRange', () => {
  const now = new Date('2026-08-05T03:00:00.000Z');

  test('keeps a requested 90-day preset instead of truncating to 31 days', () => {
    const range = resolveAdminTrendRange({ days: 90 }, now);

    expect(range.days).toBe(90);
    expect(range.from.toISOString()).toBe('2026-05-08T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-08-05T23:59:59.999Z');
  });

  test('resolves an inclusive custom range', () => {
    const range = resolveAdminTrendRange({ from: '2026-07-01', to: '2026-07-31' }, now);

    expect(range.days).toBe(31);
    expect(range.from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-07-31T23:59:59.999Z');
  });

  test('supports the maximum historical range', () => {
    const range = resolveAdminTrendRange({ days: MAX_ADMIN_TREND_RANGE_DAYS }, now);
    expect(range.days).toBe(MAX_ADMIN_TREND_RANGE_DAYS);
  });

  test.each([
    [{ from: '2026-07-01' }, 'both from and to'],
    [{ to: '2026-07-31' }, 'both from and to'],
    [{ from: '2026-07-32', to: '2026-08-01' }, 'invalid date'],
    [{ from: '2026-08-02', to: '2026-08-01' }, 'reversed range'],
    [{ from: '2025-01-01', to: '2026-08-05' }, 'range over maximum'],
  ])('rejects invalid custom range: %s (%s)', (query) => {
    expect(() => resolveAdminTrendRange(query, now)).toThrow(BadRequestException);
  });
});
