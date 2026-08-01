'use client';

import { useMemo, useState } from 'react';
import { useMemberRuntime } from '../../member-runtime-provider';
import MobileMemberPopupRuntime, { openMobileMemberPopup } from './mobile-member-popup-runtime';
import styles from './mobile-member-commission-page.module.css';

type UnknownRecord = Record<string, unknown>;
type RangeKey = 'all' | 'today' | 'last-week' | 'last-month';

type CommissionRow = {
  id: string;
  amount: number;
  currency: string;
  basis: string;
  status: string;
  payoutStatus: string;
  createdAt: Date | null;
};

type Props = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
};

const RANGE_OPTIONS: ReadonlyArray<{ key: RangeKey; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'today', label: 'วันนี้' },
  { key: 'last-week', label: 'สัปดาห์ที่แล้ว' },
  { key: 'last-month', label: 'เดือนที่แล้ว' },
];

export default function MobileMemberCommissionPage({
  payload,
  loading,
  error,
  onBack,
  onRefresh,
}: Props) {
  const { summary } = useMemberRuntime();
  const [range, setRange] = useState<RangeKey>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rows = useMemo(() => normalizeCommissions(payload), [payload]);
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesRange(row, range) && matchesSearch(row, query)),
    [query, range, rows],
  );
  const available = runtimeNumber(summary, 'commissionBalance');
  const selectedTotal = sumAmounts(filteredRows);
  const currentMonthTotal = sumAmounts(rows.filter((row) => inCurrentMonth(row.createdAt)));
  const previousMonthTotal = sumAmounts(rows.filter((row) => inPreviousMonth(row.createdAt)));
  const comparison = percentageChange(currentMonthTotal, previousMonthTotal);

  return (
    <main className={styles.page} data-mobile-member-page="commission" data-mobile-commission-income-page="true">
      <MobileMemberPopupRuntime />

      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>รายได้คอมมิชชั่น</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.scroller}>
        <section className={styles.incomeHero} aria-label="รายได้คอมมิชชั่น">
          <div className={styles.heroTexture} aria-hidden="true" />
          <SourcePlate title="รายได้คอมมิชชั่น" />
          <div className={styles.availableCard}>
            <div className={styles.availableCopy}>
              <span>รายได้ที่ถอนได้</span>
              <div>
                <strong>{formatMoney(available)}</strong>
                <button type="button" aria-label="รีเฟรชรายได้" onClick={onRefresh}><RefreshIcon /></button>
              </div>
            </div>
            <button
              type="button"
              className={styles.withdrawButton}
              disabled={available <= 0}
              onClick={() => openMobileMemberPopup('commission-income')}
            >
              ถอนรายได้
            </button>
          </div>
        </section>

        <nav className={styles.rangeTabs} aria-label="ช่วงเวลารายได้คอมมิชชั่น">
          {RANGE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.key}
              className={range === option.key ? styles.rangeTabActive : styles.rangeTab}
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </nav>

        <section className={styles.summaryCard}>
          <div>
            <span>รายได้คอมมิชชั่นทั้งหมด</span>
            <strong>{formatMoney(selectedTotal)}</strong>
          </div>
          <div className={styles.comparison} data-positive={comparison > 0 ? 'true' : 'false'} data-negative={comparison < 0 ? 'true' : 'false'}>
            <span><TrendIcon direction={comparison} /><strong>{formatPercent(comparison)}</strong></span>
            <small>จากเดือนที่แล้ว</small>
          </div>
        </section>

        <section className={styles.detailsSection}>
          <div className={styles.detailsHeading}>
            <h2>รายละเอียดรายได้คอมมิชชั่น</h2>
            <button type="button" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}>
              <span>ค้นหา</span><FilterIcon />
            </button>
          </div>

          {searchOpen ? (
            <label className={styles.searchField}>
              <span className="sr-only">ค้นหารายได้คอมมิชชั่น</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาประเภทหรือสถานะ"
                autoFocus
              />
            </label>
          ) : null}

          <div className={styles.tableWrap} aria-busy={loading}>
            <table>
              <thead><tr><th>ประเภท</th><th>รายได้</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2}><div className={styles.tableState}>กำลังโหลดข้อมูล...</div></td></tr>
                ) : null}
                {!loading && error ? (
                  <tr><td colSpan={2}><div className={styles.tableError}>{error}</div></td></tr>
                ) : null}
                {!loading && !error && filteredRows.length === 0 ? (
                  <tr><td colSpan={2}><EmptyState /></td></tr>
                ) : null}
                {!loading && !error ? filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{commissionType(row)}</strong>
                      <span>{commissionMeta(row)}</span>
                    </td>
                    <td>
                      <strong>{formatMoney(row.amount)}</strong>
                      <span>{row.currency || 'THB'}</span>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SourcePlate({ title }: { title: string }) {
  return (
    <div className={styles.sourcePlate}>
      <svg viewBox="0 0 194 38" fill="none" aria-hidden="true">
        <path
          d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
          fill="url(#commission-title-fill)"
          stroke="url(#commission-title-stroke)"
          strokeOpacity=".2"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id="commission-title-fill" x1="96" y1="38" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#505050" /><stop offset=".32" stopColor="#474747" /><stop offset=".79" stopColor="#313131" />
          </linearGradient>
          <linearGradient id="commission-title-stroke" x1="142.5" y1="48.75" x2="142" y2="6.72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f2f2f2" /><stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <strong>{title}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty} role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
        <path d="M87.431 36.608H23.215V72.73a8.027 8.027 0 0 0 8.027 8.027h48.162a8.027 8.027 0 0 0 8.027-8.027V36.608Z" fill="#e0b1f1" />
        <rect x="47.898" y="46.667" width="14.737" height="4.912" rx="2.456" fill="#a800cb" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.754 17.313a8.027 8.027 0 0 0-5.676 9.831l2.077 7.754a8.027 8.027 0 0 0 9.831 5.676l56.86-15.236a8.027 8.027 0 0 0 5.675-9.831l-2.077-7.753a8.027 8.027 0 0 0-9.831-5.676L7.753 17.313Z" fill="#a800cb" />
        <path d="M68.773 35s19.65-5.526 16.58-11.668c-1.665-3.329-6.44-3.099-9.211-.613-3.193 2.864-3.061 10.438 1.228 10.438 3.07 0 10.439.614 15.966-2.456 8.655-4.809 10.439-8.597 12.895-14.123" stroke="#e0b1f1" strokeWidth="1.228" strokeLinecap="round" strokeDasharray="2.46 2.46" />
        <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.827c.31-1.004-.96-1.731-1.669-.953l-.083.091a2.917 2.917 0 0 1-3.159.765c-1.018-.372-1.786.957-.953 1.652a2.917 2.917 0 0 1 .912 3.132l-.033.105c-.32 1.001.944 1.738 1.659.967l.088-.094a2.917 2.917 0 0 1 3.169-.761c1.021.374 1.79-.958.955-1.655a2.917 2.917 0 0 1-.902-3.201l.016-.048Z" fill="#e0b1f1" />
      </svg>
      <span>ไม่พบข้อมูล</span>
    </div>
  );
}

function normalizeCommissions(payload: unknown): CommissionRow[] {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const source = Array.isArray(data.commissions)
    ? data.commissions
    : Array.isArray(root.commissions)
      ? root.commissions
      : [];

  return source.map((value, index) => {
    const item = asRecord(value) ?? {};
    const createdAtValue = firstString(item.createdAt, item.earnedAt, item.updatedAt);
    const createdAt = createdAtValue ? new Date(createdAtValue) : null;
    return {
      id: firstString(item.id, item.code, String(index)),
      amount: safeNumber(item.amount),
      currency: firstString(item.currency, 'THB'),
      basis: firstString(item.basis, item.type, item.category, 'คอมมิชชั่น'),
      status: firstString(item.status),
      payoutStatus: firstString(item.payoutStatus),
      createdAt: createdAt && Number.isFinite(createdAt.getTime()) ? createdAt : null,
    };
  }).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

function matchesRange(row: CommissionRow, range: RangeKey) {
  if (range === 'all') return true;
  if (!row.createdAt) return false;
  if (range === 'today') return sameLocalDay(row.createdAt, new Date());
  if (range === 'last-week') {
    const { start, end } = previousWeekBounds();
    return row.createdAt >= start && row.createdAt < end;
  }
  return inPreviousMonth(row.createdAt);
}

function matchesSearch(row: CommissionRow, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [row.basis, row.status, row.payoutStatus, row.currency]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

function previousWeekBounds() {
  const today = startOfLocalDay(new Date());
  const currentMonday = new Date(today);
  const day = currentMonday.getDay() || 7;
  currentMonday.setDate(currentMonday.getDate() - day + 1);
  const start = new Date(currentMonday);
  start.setDate(start.getDate() - 7);
  return { start, end: currentMonday };
}

function inCurrentMonth(value: Date | null) {
  if (!value) return false;
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
}

function inPreviousMonth(value: Date | null) {
  if (!value) return false;
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return value.getFullYear() === previous.getFullYear() && value.getMonth() === previous.getMonth();
}

function sameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function percentageChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function sumAmounts(rows: CommissionRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function commissionType(row: CommissionRow) {
  const value = row.basis.trim();
  if (!value) return 'คอมมิชชั่น';
  const labels: Record<string, string> = {
    TURNOVER: 'คอมมิชชั่นจากยอดเล่น',
    REFERRAL: 'คอมมิชชั่นแนะนำเพื่อน',
    REVENUE_SHARE: 'ส่วนแบ่งรายได้',
    MANUAL: 'ปรับยอดคอมมิชชั่น',
  };
  return labels[value.toUpperCase()] ?? value;
}

function commissionMeta(row: CommissionRow) {
  const status = [row.status, row.payoutStatus].filter(Boolean).join(' • ');
  const date = row.createdAt ? row.createdAt.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
  return [status, date].filter(Boolean).join(' · ');
}

function runtimeNumber(summary: unknown, key: string) {
  if (!summary || typeof summary !== 'object') return 0;
  return safeNumber((summary as UnknownRecord)[key]);
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function safeNumber(value: unknown) {
  const normalized = typeof value === 'string' ? value.replace(/[,%\s]/g, '') : value;
  const number = Number(normalized ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return safeNumber(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${Math.abs(safe).toLocaleString('th-TH', { maximumFractionDigits: 2 })}%`;
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function RefreshIcon() {
  return <svg viewBox="0 0 16 14" aria-hidden="true"><path d="M13.667 2.89A7 7 0 0 0 1.038 6.264l-.069.663 1.326.139.069-.663A5.667 5.667 0 0 1 12.809 4h-2.476v1.333H15V.667h-1.333V2.89Zm.038 4.044-.07.663A5.667 5.667 0 0 1 3.191 10h2.476V8.667H1v4.666h1.333V11.11a7 7 0 0 0 12.628-3.374l.07-.663-1.326-.139Z" /></svg>;
}

function FilterIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.333 14v-4h1.334v1.333H14v1.334H8.667V14H7.333ZM2 12.667v-1.334h4v1.334H2ZM4.667 10V8.667H2V7.333h2.667V6H6v4H4.667Zm2.666-1.333V7.333H14v1.334H7.333ZM10 6V2h1.333v1.333H14v1.334h-2.667V6H10ZM2 4.667V3.333h6.667v1.334H2Z" /></svg>;
}

function TrendIcon({ direction }: { direction: number }) {
  if (direction === 0) return null;
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d={direction > 0 ? 'M3 11 7 7l2.5 2.5L14 5' : 'M3 5l4 4 2.5-2.5L14 11'} /></svg>;
}
