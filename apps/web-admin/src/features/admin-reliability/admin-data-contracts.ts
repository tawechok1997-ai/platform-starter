export type AdminLocale = 'th' | 'en';

export type FinanceTrendRow = {
  date: string;
  topUpAmount: string;
  topUpCount: number;
  withdrawalAmount: string;
  withdrawalCount: number;
  netFlow: string;
};

export type FinanceTrendResponse = {
  range: { days: number; from: string; to: string };
  totals: {
    topUpAmount: string;
    topUpCount: number;
    withdrawalAmount: string;
    withdrawalCount: number;
    netFlow: string;
  };
  daily: FinanceTrendRow[];
  generatedAt: string;
};

export type ReconciliationSnapshot = {
  id: string;
  status: string;
  systemBalance: string;
  providerBalance: string;
  difference: string;
  checkedAt: string;
  user?: { username?: string | null; phone?: string | null } | null;
  provider?: { name?: string | null; code?: string | null } | null;
  rawPayload?: unknown;
};

export type ReconciliationPayload = {
  items: ReconciliationSnapshot[];
  summary: { total: number; matched: number; mismatch: number; unknown: number };
};

export type ContractResult<T> = {
  data: T | null;
  issues: string[];
  partial: boolean;
};

type DateRangeFallback = { start: string; end: string };

export function normalizeFinanceTrendResponse(
  input: unknown,
  fallbackRange?: DateRangeFallback,
): ContractResult<FinanceTrendResponse> {
  const issues: string[] = [];
  const root = unwrapData(input);
  if (!isRecord(root)) return { data: null, issues: ['payload_not_object'], partial: false };

  const rawRows = Array.isArray(root.daily)
    ? root.daily
    : Array.isArray(root.items)
      ? root.items
      : [];
  if (!Array.isArray(root.daily) && !Array.isArray(root.items)) issues.push('daily_missing');

  const daily = rawRows
    .map((row, index) => normalizeFinanceRow(row, index, issues))
    .filter((row): row is FinanceTrendRow => Boolean(row));

  const rangeRecord = isRecord(root.range) ? root.range : {};
  const from = dateTimeString(rangeRecord.from)
    ?? dateTimeString(root.from)
    ?? dateTimeString(fallbackRange?.start)
    ?? daily[0]?.date;
  const to = dateTimeString(rangeRecord.to)
    ?? dateTimeString(root.to)
    ?? dateTimeString(fallbackRange?.end)
    ?? daily.at(-1)?.date;

  if (!from || !to) {
    issues.push('range_missing');
    return { data: null, issues, partial: false };
  }

  const totalsRecord = isRecord(root.totals) ? root.totals : null;
  const computedTotals = computeFinanceTotals(daily);
  const totals = {
    topUpAmount: decimalString(totalsRecord?.topUpAmount ?? totalsRecord?.depositAmount) ?? computedTotals.topUpAmount,
    topUpCount: finiteInteger(totalsRecord?.topUpCount ?? totalsRecord?.depositCount) ?? computedTotals.topUpCount,
    withdrawalAmount: decimalString(totalsRecord?.withdrawalAmount) ?? computedTotals.withdrawalAmount,
    withdrawalCount: finiteInteger(totalsRecord?.withdrawalCount) ?? computedTotals.withdrawalCount,
    netFlow: decimalString(totalsRecord?.netFlow ?? totalsRecord?.netAmount) ?? computedTotals.netFlow,
  };
  if (!totalsRecord) issues.push('totals_computed');

  const requestedDays = finiteInteger(rangeRecord.days);
  const inferredDays = inclusiveDayCount(from, to);
  const days = requestedDays && requestedDays > 0 ? requestedDays : inferredDays;
  if (!requestedDays) issues.push('range_days_inferred');

  const generatedAt = dateTimeString(root.generatedAt) ?? new Date().toISOString();
  if (!dateTimeString(root.generatedAt)) issues.push('generated_at_inferred');

  return {
    data: {
      range: { days, from, to },
      totals,
      daily,
      generatedAt,
    },
    issues,
    partial: issues.length > 0,
  };
}

export function normalizeReconciliationPayload(input: unknown): ContractResult<ReconciliationPayload> {
  const issues: string[] = [];
  const root = unwrapData(input);
  if (!isRecord(root)) return { data: null, issues: ['payload_not_object'], partial: false };

  const rawItems = Array.isArray(root.items) ? root.items : [];
  if (!Array.isArray(root.items)) issues.push('items_missing');
  const items = rawItems
    .map((item, index) => normalizeSnapshot(item, index, issues))
    .filter((item): item is ReconciliationSnapshot => Boolean(item));

  const computed = {
    total: items.length,
    matched: items.filter((item) => item.status === 'MATCHED').length,
    mismatch: items.filter((item) => item.status === 'MISMATCH').length,
    unknown: items.filter((item) => item.status === 'UNKNOWN').length,
  };
  const rawSummary = isRecord(root.summary) ? root.summary : null;
  const summary = {
    total: finiteInteger(rawSummary?.total) ?? computed.total,
    matched: finiteInteger(rawSummary?.matched) ?? computed.matched,
    mismatch: finiteInteger(rawSummary?.mismatch) ?? computed.mismatch,
    unknown: finiteInteger(rawSummary?.unknown) ?? computed.unknown,
  };
  if (!rawSummary) issues.push('summary_computed');

  return { data: { items, summary }, issues, partial: issues.length > 0 };
}

export function createAdminIncidentId(prefix = 'ADM') {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  const random = cryptoApi?.randomUUID?.().replaceAll('-', '').slice(0, 12)
    ?? Math.random().toString(36).slice(2, 14).padEnd(12, '0');
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random.toUpperCase()}`;
}

export function readAdminLocale(): AdminLocale {
  if (typeof window === 'undefined') return 'th';
  return window.localStorage.getItem('admin_locale') === 'en' ? 'en' : 'th';
}

export function safeMoneyValue(value: unknown) {
  return decimalString(value) ?? '0';
}

function normalizeFinanceRow(value: unknown, index: number, issues: string[]): FinanceTrendRow | null {
  if (!isRecord(value)) {
    issues.push(`daily_${index}_not_object`);
    return null;
  }
  const date = dateOnlyString(value.date ?? value.day);
  if (!date) {
    issues.push(`daily_${index}_date_invalid`);
    return null;
  }
  const topUpAmount = decimalString(value.topUpAmount ?? value.depositAmount) ?? '0';
  const withdrawalAmount = decimalString(value.withdrawalAmount) ?? '0';
  const topUpCount = finiteInteger(value.topUpCount ?? value.depositCount) ?? 0;
  const withdrawalCount = finiteInteger(value.withdrawalCount) ?? 0;
  const netFlow = decimalString(value.netFlow ?? value.netAmount)
    ?? subtractDecimalStrings(topUpAmount, withdrawalAmount);
  return { date, topUpAmount, topUpCount, withdrawalAmount, withdrawalCount, netFlow };
}

function normalizeSnapshot(value: unknown, index: number, issues: string[]): ReconciliationSnapshot | null {
  if (!isRecord(value)) {
    issues.push(`item_${index}_not_object`);
    return null;
  }
  const id = text(value.id);
  if (!id) {
    issues.push(`item_${index}_id_missing`);
    return null;
  }
  const systemBalance = decimalString(value.systemBalance) ?? '0';
  const providerBalance = decimalString(value.providerBalance) ?? '0';
  const difference = decimalString(value.difference)
    ?? subtractDecimalStrings(systemBalance, providerBalance);
  const checkedAt = dateTimeString(value.checkedAt) ?? new Date(0).toISOString();
  if (!dateTimeString(value.checkedAt)) issues.push(`item_${index}_checked_at_invalid`);
  return {
    id,
    status: normalizeSnapshotStatus(value.status),
    systemBalance,
    providerBalance,
    difference,
    checkedAt,
    user: normalizeUser(value.user),
    provider: normalizeProvider(value.provider),
    rawPayload: value.rawPayload,
  };
}

function normalizeUser(value: unknown): ReconciliationSnapshot['user'] {
  if (!isRecord(value)) return null;
  return { username: nullableText(value.username), phone: nullableText(value.phone) };
}

function normalizeProvider(value: unknown): ReconciliationSnapshot['provider'] {
  if (!isRecord(value)) return null;
  return { name: nullableText(value.name), code: nullableText(value.code) };
}

function normalizeSnapshotStatus(value: unknown) {
  const status = text(value)?.toUpperCase();
  return status === 'MATCHED' || status === 'MISMATCH' || status === 'UNKNOWN' || status === 'REVIEWING' || status === 'RESOLVED'
    ? status
    : 'UNKNOWN';
}

function computeFinanceTotals(rows: readonly FinanceTrendRow[]) {
  return rows.reduce((total, row) => ({
    topUpAmount: addDecimalStrings(total.topUpAmount, row.topUpAmount),
    topUpCount: total.topUpCount + row.topUpCount,
    withdrawalAmount: addDecimalStrings(total.withdrawalAmount, row.withdrawalAmount),
    withdrawalCount: total.withdrawalCount + row.withdrawalCount,
    netFlow: addDecimalStrings(total.netFlow, row.netFlow),
  }), { topUpAmount: '0', topUpCount: 0, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '0' });
}

function inclusiveDayCount(from: string, to: string) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

function addDecimalStrings(left: string, right: string) {
  return String(Number(left) + Number(right));
}

function subtractDecimalStrings(left: string, right: string) {
  return String(Number(left) - Number(right));
}

function decimalString(value: unknown): string | null {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replaceAll(',', '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? normalized : null;
}

function finiteInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

function dateOnlyString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) && Number.isFinite(new Date(`${normalized}T00:00:00.000Z`).getTime())
    ? normalized
    : null;
}

function dateTimeString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? value.trim() : null;
}

function unwrapData(value: unknown): unknown {
  return isRecord(value) && isRecord(value.data) ? value.data : value;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nullableText(value: unknown) {
  return text(value) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
