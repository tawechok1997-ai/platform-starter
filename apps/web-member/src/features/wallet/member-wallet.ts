export type MemberWalletSummary = {
  currency: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
  status: string;
};

export const MEMBER_WALLET_REFRESH_EVENT = 'platform:wallet-refresh';

export function normalizeMemberWallet(payload: unknown): MemberWalletSummary | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = 'wallet' in payload && payload.wallet && typeof payload.wallet === 'object'
    ? payload.wallet
    : payload;
  if (!candidate || typeof candidate !== 'object') return null;

  const wallet = candidate as Record<string, unknown>;
  const balance = normalizeMoneyValue(wallet.balance);
  const availableBalance = normalizeMoneyValue(wallet.availableBalance);
  const lockedBalance = normalizeMoneyValue(wallet.lockedBalance);
  if (balance === null || availableBalance === null || lockedBalance === null) return null;

  return {
    currency: typeof wallet.currency === 'string' && wallet.currency.trim() ? wallet.currency.trim().toUpperCase() : 'THB',
    balance,
    availableBalance,
    lockedBalance,
    status: typeof wallet.status === 'string' ? wallet.status : '',
  };
}

export function formatMemberWalletBalance(wallet: MemberWalletSummary | null): string {
  if (!wallet) return '—';
  const amount = Number(wallet.availableBalance);
  if (!Number.isFinite(amount)) return '—';
  return `${wallet.currency} ${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeMoneyValue(value: unknown): string | null {
  const amount = typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(amount) ? String(value) : null;
}
