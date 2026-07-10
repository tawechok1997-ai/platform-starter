import { ReactNode } from 'react';
import { AdminEmpty, AdminRow, AdminStack } from '../_components/admin-ui';

export function RiskMetadataView({ metadata }: { metadata?: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) return <AdminEmpty>ไม่มี metadata</AdminEmpty>;
  const entries = Object.entries(metadata);
  return <AdminStack>{entries.map(([key, value]) => <AdminRow key={key}><strong>{labelFor(key)}</strong><span style={valueStyle}>{formatValue(key, value)}</span></AdminRow>)}</AdminStack>;
}

export function RiskMetadataRaw({ metadata }: { metadata?: Record<string, unknown> | null }) {
  if (!metadata) return null;
  return <details style={detailsStyle}><summary>Raw JSON</summary><pre style={preStyle}>{JSON.stringify(metadata, null, 2)}</pre></details>;
}

function labelFor(key: string) {
  const labels: Record<string, string> = {
    count: 'จำนวนรายการ',
    windowMinutes: 'ช่วงเวลา',
    totalAmount: 'ยอดรวม',
    topUpIds: 'Top-up IDs',
    withdrawalId: 'Withdrawal ID',
    withdrawalIds: 'Withdrawal IDs',
    topUpId: 'Top-up ID',
    topUpAmount: 'Top-up amount',
    withdrawalAmount: 'Withdrawal amount',
    threshold: 'Threshold',
    amount: 'Amount',
    walletId: 'Wallet ID',
    walletBalance: 'Wallet balance',
    latestLedgerId: 'Latest ledger ID',
    latestLedgerBalanceAfter: 'Latest ledger balance',
    bankAccountId: 'Bank account ID',
    bankUpdatedAt: 'Bank updated at',
  };
  return labels[key] ?? key;
}

function formatValue(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.map((item) => shortText(String(item))).join(', ') : '-';
  if (typeof value === 'number') return key.toLowerCase().includes('amount') || key === 'threshold' || key === 'walletBalance' ? formatMoney(value) : String(value);
  if (typeof value === 'string') {
    if (key.toLowerCase().includes('amount') || key === 'threshold' || key === 'walletBalance' || key.includes('Balance')) return formatMoney(value);
    if (key.toLowerCase().includes('minutes')) return `${value} นาที`;
    if (key.toLowerCase().includes('at')) return safeDate(value);
    return shortText(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatMoney(value: string | number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return String(value);
  return `THB ${next.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

function safeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('th-TH');
}

function shortText(value: string) {
  return value.length > 32 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

const valueStyle = { textAlign: 'right' as const, color: '#cbd5e1', overflowWrap: 'anywhere' as const };
const detailsStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(15,23,42,.45)' };
const preStyle = { margin: '10px 0 0', whiteSpace: 'pre-wrap' as const, overflowX: 'auto' as const, color: '#cbd5e1', fontSize: 12, lineHeight: 1.55 };
