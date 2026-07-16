import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export function parseDateBoundary(value: string | undefined, endOfDay = false, label = 'date'): Date | undefined {
  const text = String(value ?? '').trim();
  if (!text) return undefined;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${label}: ${text}`);
  }

  return date;
}

export function buildDateRange(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  if (from && to && from > to) throw new BadRequestException('from must be before to');

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}
