import { Prisma } from '@prisma/client';

type DecimalLike = Prisma.Decimal | string | number | null | undefined;

type FinanceRequestRecord = {
  id: string;
  userId: string;
  amount: Prisma.Decimal;
  currency: string;
  status: string;
  method: string | null;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
    phone: string | null;
    email: string | null;
  } | null;
};

export function mapFinanceRequest(item: FinanceRequestRecord) {
  return {
    id: item.id,
    userId: item.userId,
    shortUserId: item.userId.slice(0, 8),
    amount: item.amount.toString(),
    currency: item.currency,
    status: item.status,
    method: item.method ?? '',
    createdAt: item.createdAt,
    user: item.user ? { ...item.user, shortId: item.user.id.slice(0, 8) } : null,
  };
}

export function addDecimal(a: DecimalLike, b: DecimalLike): string {
  return toDecimal(a).plus(toDecimal(b)).toString();
}

export function subtractDecimal(a: DecimalLike, b: DecimalLike): string {
  return toDecimal(a).minus(toDecimal(b)).toString();
}

function toDecimal(value: DecimalLike): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value ?? 0);
}
