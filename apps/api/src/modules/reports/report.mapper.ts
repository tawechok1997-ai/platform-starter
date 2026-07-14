import { Prisma } from '@prisma/client';

export type ReportQuery = { from?: string; to?: string; limit?: string; days?: string | number };
type DecimalLike = Prisma.Decimal | string | number | null | undefined;

type GroupItem = {
  status: string;
  _count: { _all: number };
  _sum: { amount: Prisma.Decimal | null };
};

type AgingItem = {
  id: string;
  userId: string;
  amount: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  user?: { username?: string | null; email?: string | null } | null;
};

export function resolveReportDateRange(query: ReportQuery) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = query.to ? new Date(query.to) : now;
  return { from, to };
}

export function mapReportGroup(item: GroupItem) {
  return {
    status: item.status,
    count: item._count._all,
    amount: item._sum.amount?.toString() ?? '0',
  };
}

export function mapQueueAgingItem(type: 'TOPUP' | 'WITHDRAWAL', item: AgingItem, now: number) {
  const ageMinutes = Math.max(Math.floor((now - item.createdAt.getTime()) / 60_000), 0);
  return {
    id: item.id,
    type,
    userId: item.userId,
    username: item.user?.username ?? item.user?.email ?? item.userId.slice(0, 8),
    amount: item.amount.toString(),
    currency: item.currency,
    createdAt: item.createdAt.toISOString(),
    ageMinutes,
    ageLabel: formatAgeLabel(ageMinutes),
  };
}

export function formatAgeLabel(minutes: number) {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function addReportDecimal(a: DecimalLike, b: DecimalLike) {
  return toDecimal(a).plus(toDecimal(b)).toString();
}

export function subtractReportDecimal(a: DecimalLike, b: DecimalLike) {
  return toDecimal(a).minus(toDecimal(b)).toString();
}

function toDecimal(value: DecimalLike) {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value ?? 0);
}
