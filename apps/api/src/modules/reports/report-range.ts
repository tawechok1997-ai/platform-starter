import { BadRequestException } from '@nestjs/common';
import type { ReportQuery } from './report.mapper';

export const MAX_ADMIN_TREND_RANGE_DAYS = 366;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export type AdminTrendRange = {
  days: number;
  from: Date;
  to: Date;
};

export function resolveAdminTrendRange(
  query: ReportQuery = {},
  now = new Date(),
): AdminTrendRange {
  const hasFrom = typeof query.from === 'string' && query.from.trim().length > 0;
  const hasTo = typeof query.to === 'string' && query.to.trim().length > 0;

  if (hasFrom || hasTo) {
    if (!hasFrom || !hasTo) {
      throw new BadRequestException('Trend range requires both from and to dates');
    }
    const from = parseUtcDate(query.from as string, 'from');
    const endDay = parseUtcDate(query.to as string, 'to');
    const days = Math.round((endDay.getTime() - from.getTime()) / DAY_MS) + 1;
    if (days < 1) throw new BadRequestException('Trend range start must not be after end');
    if (days > MAX_ADMIN_TREND_RANGE_DAYS) {
      throw new BadRequestException(`Trend range cannot exceed ${MAX_ADMIN_TREND_RANGE_DAYS} days`);
    }
    return { days, from, to: endOfUtcDay(endDay) };
  }

  if (!Number.isFinite(now.getTime())) throw new BadRequestException('Invalid trend reference date');
  const requestedDays = Number(query.days ?? 7);
  const days = Math.min(
    Math.max(Number.isFinite(requestedDays) ? Math.trunc(requestedDays) : 7, 1),
    MAX_ADMIN_TREND_RANGE_DAYS,
  );
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(today.getTime() - ((days - 1) * DAY_MS));
  return { days, from, to: endOfUtcDay(today) };
}

function parseUtcDate(value: string, field: 'from' | 'to'): Date {
  const normalized = value.trim();
  if (!ISO_DATE_PATTERN.test(normalized)) {
    throw new BadRequestException(`Trend ${field} date must use YYYY-MM-DD`);
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new BadRequestException(`Trend ${field} date is invalid`);
  }
  return parsed;
}

function endOfUtcDay(value: Date): Date {
  return new Date(value.getTime() + DAY_MS - 1);
}
