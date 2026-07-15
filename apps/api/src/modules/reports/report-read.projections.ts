export const TREND_PROJECTION = {
  amount: true,
  reviewedAt: true,
} as const;

export const QUEUE_AGING_PROJECTION = {
  id: true,
  userId: true,
  amount: true,
  currency: true,
  createdAt: true,
  user: { select: { username: true, email: true } },
} as const;

export const RECONCILIATION_WALLET_PROJECTION = {
  id: true,
  userId: true,
  balance: true,
  lockedBalance: true,
  user: { select: { username: true } },
} as const;

export const RECONCILIATION_LEDGER_PROJECTION = {
  balanceAfter: true,
  createdAt: true,
} as const;
