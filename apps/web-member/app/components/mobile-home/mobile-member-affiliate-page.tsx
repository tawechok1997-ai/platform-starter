'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import styles from './mobile-member-affiliate-page.module.css';

type Props = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
};

type UnknownRecord = Record<string, unknown>;
type Period = 'all' | 'today' | 'last-week' | 'last-month';

type AffiliateRow = {
  id: string;
  type: string;
  turnover: number;
  income: number;
  createdAt: string;
};

const PERIODS: ReadonlyArray<{ id: Period; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'today', label: 'วันนี้' },
  { id: 'last-week', label: 'สัปดาห์ที่แล้ว' },
  { id: 'last-month', label: 'เดือนที่แล้ว' },
];

const INCOME_BACKGROUND = resolveLocalAssetByBasename('/images/income_bg.webp', 'pc') || '/images/income_bg.webp';

export default function MobileMemberAffiliatePage({ payload, loading, error, onBack, onRefresh }: Props) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('all');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const normalized = useMemo(() => normalizeAffiliate(payload), [payload]);
  const referralUrl = normalized.referralCode
    ? `${origin}/register?ref=${encodeURIComponent(normalized.referralCode)}`
    : '';
  const rows = useMemo(
    () => normalized.rows.filter((row) => matchesPeriod(row.createdAt, period)),
    [normalized.rows, period],
  );
  const totalIncome = rows.reduce((total, row) => total + row.income, 0);
  const previousIncome = normalized.previousMonthIncome;
  const growth = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;

  async function copyReferral() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const field = document.createElement('textarea');
      field.value = referralUrl;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <main className={styles.page} data-mobile-member-page="affiliate">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>แนะนำเพื่อน</h1>
      </header>

      <section className={styles.body} aria-busy={loading}>
        <article className={styles.incomeCard}>
          <img className={styles.incomeBackground} src={INCOME_BACKGROUND} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          <div className={styles.ribbon} aria-hidden="true"><span>รายได้จากเครือข่าย</span></div>

          <div className={styles.balanceBox}>
            <div>
              <div className={styles.balanceLabel}>รายได้ที่ถอนได้</div>
              <div className={styles.balanceValue}>{money(normalized.withdrawableBalance)}</div>
            </div>
            <button type="button" className={styles.refreshButton} aria-label="รีเฟรชยอดรายได้" onClick={onRefresh}><RefreshIcon /></button>
            <button type="button" className={styles.withdrawButton} onClick={() => router.push('/withdraw')}>ถอนรายได้</button>
          </div>

          <div className={styles.infoRows}>
            <div className={styles.infoRow}>
              <strong>ลิงก์แนะนำเพื่อน</strong>
              <span title={referralUrl}>{referralUrl || 'ยังไม่มีลิงก์แนะนำเพื่อน'}</span>
              <button type="button" aria-label="คัดลอกลิงก์แนะนำเพื่อน" disabled={!referralUrl} onClick={copyReferral}><CopyIcon /></button>
            </div>
            <button type="button" className={styles.guideRow} onClick={() => router.push('/guide')}>
              <strong>วิธีการสร้างเครือข่าย</strong>
              <span><ArrowCircleIcon /></span>
            </button>
          </div>
        </article>

        {copied ? <div className={styles.toast} role="status">คัดลอกลิงก์แล้ว</div> : null}

        <nav className={styles.periodTabs} aria-label="ช่วงเวลารายได้">
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
        </nav>

        <article className={styles.summaryCard}>
          <div>
            <strong>รายได้จากเครือข่ายทั้งหมด</strong>
            <b>{money(totalIncome)}</b>
          </div>
          <div className={styles.growth}>
            <strong>{formatPercent(growth)}</strong>
            <span>จากเดือนที่แล้ว</span>
          </div>
        </article>

        <section className={styles.detailsSection}>
          <div className={styles.detailsHeader}>
            <h2>รายละเอียดการทำรายได้</h2>
            <button type="button" onClick={onRefresh}>ค้นหา <FilterIcon /></button>
          </div>

          <div className={styles.tableFrame}>
            <table>
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>ยอดแทง</th>
                  <th>รายได้</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3}><LoadingState /></td></tr>
                ) : error ? (
                  <tr><td colSpan={3}><div className={styles.errorState}>{error}<button type="button" onClick={onRefresh}>ลองใหม่</button></div></td></tr>
                ) : rows.length > 0 ? rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>{money(row.turnover)}</td>
                    <td>{money(row.income)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3}><AffiliateEmptyState /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function normalizeAffiliate(payload: unknown) {
  const root = asRecord(payload) ?? {};
  const profile = asRecord(root.profile) ?? {};
  const commissions = asArray(root.commissions);
  const rows = commissions.map((value, index): AffiliateRow => {
    const item = asRecord(value) ?? {};
    return {
      id: firstString(item.id, `commission-${index}`),
      type: firstString(item.basis, item.type, item.category, item.status, 'รายได้เครือข่าย'),
      turnover: firstNumber(item.turnover, item.turnoverAmount, item.wagerAmount, item.basisAmount, item.betAmount),
      income: firstNumber(item.amount, item.commissionAmount, item.income, item.netAmount),
      createdAt: firstString(item.createdAt, item.updatedAt, ''),
    };
  });

  const approvedUnpaid = commissions.reduce((total, value) => {
    const item = asRecord(value) ?? {};
    const payout = firstString(item.payoutStatus, '').toUpperCase();
    const status = firstString(item.status, '').toUpperCase();
    if (payout === 'PAID' || payout === 'COMPLETED' || status === 'REJECTED') return total;
    return total + firstNumber(item.amount, item.commissionAmount, item.income, item.netAmount);
  }, 0);

  return {
    referralCode: firstString(profile.referralCode, root.referralCode, ''),
    withdrawableBalance: firstNumber(
      root.withdrawableBalance,
      root.affiliateBalance,
      profile.withdrawableBalance,
      profile.affiliateBalance,
      approvedUnpaid,
    ),
    previousMonthIncome: firstNumber(root.previousMonthIncome, profile.previousMonthIncome),
    rows,
  };
}

function matchesPeriod(createdAt: string, period: Period) {
  if (period === 'all' || !createdAt) return true;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return date >= startOfToday;
  if (period === 'last-week') {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 7);
    return date >= start && date < startOfToday;
  }
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return date >= startOfLastMonth && date < startOfThisMonth;
}

function AffiliateEmptyState() {
  return (
    <div className={styles.emptyState} role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
        <path d="M87.4313 36.6079H23.2148V72.7297C23.2148 74.8586 24.0605 76.9003 25.5659 78.4057C27.0713 79.911 29.113 80.7567 31.2419 80.7567H79.4043C81.5332 80.7567 83.5749 79.911 85.0803 78.4057C86.5856 76.9003 87.4313 74.8586 87.4313 72.7297V36.6079Z" fill="#e0b1f1" />
        <rect x="47.8984" y="46.6665" width="14.7373" height="4.91244" rx="2.45622" fill="#a800cb" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.75354 17.3131C5.69718 17.8641 3.94392 19.2094 2.87946 21.0531C1.81501 22.8968 1.52655 25.0878 2.07756 27.1442L4.15511 34.8977C4.70611 36.9541 6.05144 38.7073 7.89513 39.7718C9.73881 40.8362 11.9298 41.1247 13.9862 40.5737L70.8455 25.3383C72.9019 24.7873 74.6552 23.442 75.7196 21.5983C76.7841 19.7546 77.0725 17.5636 76.5215 15.5072L74.444 7.75365C73.893 5.69728 72.5476 3.94402 70.7039 2.87957C68.8603 1.81511 66.6692 1.52666 64.6129 2.07766L7.75354 17.3131Z" fill="#a800cb" />
        <path d="M68.7734 34.9999C68.7734 34.9999 88.4232 29.4736 85.3529 23.3325C83.6882 20.0027 78.9134 20.2331 76.1421 22.7188C72.9487 25.5831 73.0805 33.1571 77.3702 33.1571C80.4405 33.1571 87.8092 33.7712 93.3356 30.7009C101.991 25.8924 103.775 22.1041 106.231 16.5776" stroke="#e0b1f1" strokeWidth="1.22811" strokeLinecap="round" strokeDasharray="2.46 2.46" />
        <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.82712C112.565 6.82343 111.295 6.09573 110.586 6.87357L110.558 6.90437L110.503 6.9649C110.112 7.39089 109.603 7.69103 109.04 7.82732C108.478 7.96361 107.888 7.9299 107.344 7.73046C106.326 7.3579 105.558 8.68737 106.391 9.38219C106.837 9.75445 107.162 10.2512 107.324 10.8089C107.487 11.3667 107.479 11.9602 107.303 12.5137L107.27 12.6186C106.95 13.6205 108.214 14.3572 108.929 13.5858L109.017 13.492C109.411 13.067 109.922 12.768 110.486 12.6326C111.05 12.4972 111.642 12.5314 112.186 12.7309C113.207 13.1047 113.976 11.7731 113.141 11.076C112.686 10.6957 112.355 10.1864 112.194 9.61509C112.033 9.04372 112.049 8.43699 112.239 7.87458L112.255 7.82712Z" fill="#e0b1f1" />
      </svg>
      <span>ไม่พบข้อมูล</span>
    </div>
  );
}

function LoadingState() {
  return <div className={styles.loadingState}><span />กำลังโหลดข้อมูล...</div>;
}

function BackIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20 4 12l8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>; }
function RefreshIcon() { return <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true"><path d="M13.667 2.89A7 7 0 0 0 1.038 6.264l-.07.663 1.327.139.069-.663A5.67 5.67 0 0 1 12.809 4h-2.476v1.333H15V.667h-1.333V2.89Zm.038 4.044-.07.663A5.67 5.67 0 0 1 3.191 10h2.476V8.667H1v4.666h1.333V11.11a7 7 0 0 0 12.628-3.374l.07-.663-1.326-.139Z" fill="currentColor" /></svg>; }
function CopyIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 12c-.367 0-.681-.13-.942-.391a1.283 1.283 0 0 1-.391-.942v-8c0-.367.13-.681.391-.942A1.283 1.283 0 0 1 6 1.333h6c.367 0 .681.13.942.392.26.26.391.575.391.942v8c0 .366-.13.68-.391.942A1.283 1.283 0 0 1 12 12H6Zm0-1.333h6v-8H6v8ZM3.333 14.667c-.366 0-.68-.13-.941-.391A1.283 1.283 0 0 1 2 13.333V4h1.333v9.333h7.334v1.334H3.333Z" fill="currentColor" /></svg>; }
function ArrowCircleIcon() { return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="m5.868 5.399-2.24 2.24.57.56L7.398 5l-3.2-3.201-.57.56 2.24 2.24H.998v.8h4.87Z" fill="#0a1737" /></svg>; }
function FilterIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7.333 14v-4h1.334v1.333H14v1.334H8.667V14H7.333ZM2 12.667v-1.334h4v1.334H2ZM4.667 10V8.667H2V7.333h2.667V6H6v4H4.667Zm2.666-1.333V7.333H14v1.334H7.333ZM10 6V2h1.333v1.333H14v1.334h-2.667V6H10ZM2 4.667V3.333h6.667v1.334H2Z" fill="currentColor" /></svg>; }

function asRecord(value: unknown): UnknownRecord | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null; }
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function firstString(...values: unknown[]) { for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim(); return ''; }
function firstNumber(...values: unknown[]) { for (const value of values) { const number = Number(value); if (Number.isFinite(number) && number >= 0) return number; } return 0; }
function money(value: number) { return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatPercent(value: number) { const safe = Number.isFinite(value) ? value : 0; return `${safe > 0 ? '+' : ''}${safe.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`; }
