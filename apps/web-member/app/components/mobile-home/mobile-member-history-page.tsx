'use client';

import { useMemo, useState } from 'react';
import MobileMemberEmptyState from './mobile-member-empty-state';
import styles from './mobile-member-history-page.module.css';

type Props = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
};

type UnknownRecord = Record<string, unknown>;
type Category = 'deposit' | 'withdraw' | 'bonus' | 'affiliate' | 'commission';
type Period = 'all' | 'today' | 'last-week' | 'last-month' | 'custom';

type HistoryRow = {
  id: string;
  category: Category;
  type: string;
  createdAt: string;
  slipAt: string;
  amount: number;
};

const CATEGORIES: ReadonlyArray<{ id: Category; label: string }> = [
  { id: 'deposit', label: 'ฝากเงิน' },
  { id: 'withdraw', label: 'ถอนเงิน' },
  { id: 'bonus', label: 'โบนัสโปรโมชั่น' },
  { id: 'affiliate', label: 'ค่าแนะนำเพื่อน' },
  { id: 'commission', label: 'ค่าคอมมิชชั่น' },
];

const PERIODS: ReadonlyArray<{ id: Exclude<Period, 'custom'>; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'today', label: 'วันนี้' },
  { id: 'last-week', label: 'สัปดาห์ที่แล้ว' },
  { id: 'last-month', label: 'เดือนที่แล้ว' },
];

export default function MobileMemberHistoryPage({ payload, loading, error, onBack, onRefresh }: Props) {
  const [category, setCategory] = useState<Category>('deposit');
  const [period, setPeriod] = useState<Period>('all');
  const [customDate, setCustomDate] = useState('');
  const rows = useMemo(() => normalizeHistory(payload), [payload]);
  const filtered = useMemo(
    () => rows.filter((row) => row.category === category && matchesPeriod(row.createdAt, period, customDate)),
    [category, customDate, period, rows],
  );

  return (
    <main className={styles.page} data-mobile-member-page="history">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>ประวัติการทำรายการ</h1>
      </header>

      <nav className={styles.categoryTabs} aria-label="ประเภทประวัติการทำรายการ">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? styles.activeCategory : ''}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className={styles.content} aria-busy={loading}>
        <div className={styles.periodTabs}>
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={period === item.id ? styles.activePeriod : ''}
              aria-pressed={period === item.id}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
          <label className={period === 'custom' ? styles.activePeriod : ''} aria-label="เลือกวันที่">
            <CalendarIcon />
            <input
              type="date"
              value={customDate}
              onChange={(event) => {
                setCustomDate(event.target.value);
                setPeriod('custom');
              }}
            />
          </label>
        </div>

        <div className={styles.tableFrame}>
          <table>
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>ว/ด/ป</th>
                <th>เวลา</th>
                <th>เวลาสลิป</th>
                <th>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><LoadingState /></td></tr>
              ) : error ? (
                <tr><td colSpan={5}><ErrorState message={error} onRetry={onRefresh} /></td></tr>
              ) : filtered.length > 0 ? filtered.map((row) => {
                const created = parseDate(row.createdAt);
                const slip = parseDate(row.slipAt || row.createdAt);
                return (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>{created.date}</td>
                    <td>{created.time}</td>
                    <td>{slip.time}</td>
                    <td data-credit={row.amount >= 0 ? 'true' : 'false'}>{formatMoney(row.amount)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5}><MobileMemberEmptyState className={styles.emptyState} label="ไม่พบข้อมูล" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function normalizeHistory(payload: unknown): HistoryRow[] {
  const source = arrayFromPayload(payload);
  return source.map((value, index) => {
    const item = asRecord(value) ?? {};
    const rawType = firstString(item.type, item.transactionType, item.category, item.kind, item.direction, '');
    const category = inferCategory(rawType, item);
    const amount = signedAmount(item);
    return {
      id: firstString(item.id, item.transactionId, item.reference, String(index)),
      category,
      type: historyLabel(category, rawType),
      createdAt: firstString(item.createdAt, item.completedAt, item.updatedAt, item.date, ''),
      slipAt: firstString(item.slipCreatedAt, item.evidenceCreatedAt, item.completedAt, ''),
      amount,
    };
  });
}

function inferCategory(rawType: string, item: UnknownRecord): Category {
  const value = [rawType, firstString(item.source, item.reason, item.description)].join(' ').toUpperCase();
  if (value.includes('WITHDRAW')) return 'withdraw';
  if (value.includes('AFFILIATE') || value.includes('REFERRAL') || value.includes('NETWORK')) return 'affiliate';
  if (value.includes('COMMISSION')) return 'commission';
  if (value.includes('BONUS') || value.includes('PROMOTION') || value.includes('REWARD')) return 'bonus';
  return 'deposit';
}

function historyLabel(category: Category, rawType: string) {
  if (category === 'deposit') return 'ฝากเงิน';
  if (category === 'withdraw') return 'ถอนเงิน';
  if (category === 'bonus') return 'โบนัสโปรโมชั่น';
  if (category === 'affiliate') return 'ค่าแนะนำเพื่อน';
  if (category === 'commission') return 'ค่าคอมมิชชั่น';
  return rawType || 'รายการ';
}

function signedAmount(item: UnknownRecord) {
  const amount = firstNumber(item.amount, item.netAmount, item.value, item.credit, item.debit);
  const direction = firstString(item.direction, item.entryType, '').toUpperCase();
  const type = firstString(item.type, item.transactionType, '').toUpperCase();
  if (direction === 'DEBIT' || type.includes('WITHDRAW')) return -Math.abs(amount);
  return Math.abs(amount);
}

function matchesPeriod(createdAt: string, period: Period, customDate: string) {
  if (period === 'all' || !createdAt) return true;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return date >= startToday;
  if (period === 'last-week') {
    const start = new Date(startToday);
    start.setDate(start.getDate() - 7);
    return date >= start && date < startToday;
  }
  if (period === 'last-month') {
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date >= startLastMonth && date < startThisMonth;
  }
  if (!customDate) return true;
  const target = new Date(`${customDate}T00:00:00`);
  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate();
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  for (const key of ['items', 'transactions', 'ledger', 'entries', 'results', 'data']) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '-' };
  return {
    date: date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    time: date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={styles.errorState}><span>{message}</span><button type="button" onClick={onRetry}>ลองใหม่</button></div>;
}

function LoadingState() {
  return <div className={styles.loadingState}><span />กำลังโหลดข้อมูล...</div>;
}

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20 4 12l8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}

function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 2v3M17 2v3M3.5 9h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function formatMoney(value: number) {
  const sign = value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
