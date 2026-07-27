'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import styles from './dashboard-redesigned.module.css';

type QueueItem = {
  id: string;
  shortUserId: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  createdAt: string;
  user?: { username?: string | null; shortId?: string | null } | null;
};

type FinanceSummary = {
  totals: {
    walletCount: number;
    totalBalance: string;
    totalLockedBalance: string;
    totalAvailableBalance: string;
    pendingTopUps: number;
    pendingWithdrawals: number;
  };
  today?: {
    date: string;
    topUpAmount: string;
    topUpCount: number;
    withdrawalAmount: string;
    withdrawalCount: number;
    netFlow: string;
  };
  queues: { topUps: QueueItem[]; withdrawals: QueueItem[] };
  recentLedgers: Array<{
    id: string;
    type: string;
    direction: string;
    amount: string;
    createdAt: string;
    user?: { username?: string | null; shortId?: string | null } | null;
  }>;
  generatedAt: string;
};

type RiskAlert = {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  memberId?: string | null;
  createdAt: string;
};

type RiskResponse = {
  items?: RiskAlert[];
  summary?: { openCount?: number; criticalCount?: number };
};

type DashboardCopy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  refreshing: string;
  live: string;
  clear: string;
  clearDescription: string;
  actionNeeded: string;
  queuePressure: string;
  partialData: string;
  financeUnavailable: string;
  riskUnavailable: string;
  noAccess: string;
  priorities: string;
  prioritiesDescription: string;
  criticalRisk: string;
  openRisk: string;
  withdrawalQueue: string;
  depositQueue: string;
  review: string;
  overview: string;
  overviewDescription: string;
  depositsToday: string;
  withdrawalsToday: string;
  netFlow: string;
  totalWallet: string;
  pendingWork: string;
  oldestQueue: string;
  openRisks: string;
  items: string;
  wallets: string;
  updated: string;
  financeFlow: string;
  financeFlowDescription: string;
  deposit: string;
  withdrawal: string;
  queues: string;
  queuesDescription: string;
  recentRisk: string;
  recentRiskDescription: string;
  recentLedger: string;
  recentLedgerDescription: string;
  viewAll: string;
  member: string;
  details: string;
  minutes: string;
  hours: string;
};

const dashboardCopy: Record<AdminLocale, DashboardCopy> = {
  th: {
    eyebrow: 'ศูนย์ปฏิบัติการ',
    title: 'แดชบอร์ด',
    description: 'งานสำคัญ การเงิน และความเสี่ยงในหน้าจอเดียว',
    refresh: 'รีเฟรช',
    refreshing: 'กำลังโหลด',
    live: 'สถานะระบบ',
    clear: 'ไม่มีงานเร่งด่วน',
    clearDescription: 'คิวหลักและความเสี่ยงอยู่ในระดับควบคุมได้',
    actionNeeded: 'ต้องดำเนินการ',
    queuePressure: 'มีงานรอตรวจ',
    partialData: 'ข้อมูลบางส่วนยังไม่พร้อม',
    financeUnavailable: 'โหลดข้อมูลการเงินไม่สำเร็จ',
    riskUnavailable: 'โหลดข้อมูลความเสี่ยงไม่สำเร็จ',
    noAccess: 'บัญชีนี้ไม่มีสิทธิ์ดูข้อมูล Dashboard',
    priorities: 'งานที่ต้องจัดการ',
    prioritiesDescription: 'แสดงเฉพาะรายการที่มีงานค้างจริง',
    criticalRisk: 'ความเสี่ยงวิกฤต',
    openRisk: 'ความเสี่ยงที่เปิดอยู่',
    withdrawalQueue: 'คิวถอนเงิน',
    depositQueue: 'คิวฝากเงิน',
    review: 'เปิดตรวจ',
    overview: 'ภาพรวมวันนี้',
    overviewDescription: 'ตัวเลขหลักโดยไม่แสดงข้อมูลซ้ำ',
    depositsToday: 'ฝากวันนี้',
    withdrawalsToday: 'ถอนวันนี้',
    netFlow: 'เงินสุทธิ',
    totalWallet: 'ยอดกระเป๋ารวม',
    pendingWork: 'งานการเงินค้าง',
    oldestQueue: 'คิวเก่าสุด',
    openRisks: 'ความเสี่ยงเปิด',
    items: 'รายการ',
    wallets: 'กระเป๋า',
    updated: 'อัปเดต',
    financeFlow: 'กระแสเงินวันนี้',
    financeFlowDescription: 'เปรียบเทียบยอดฝากและถอนเมื่อมีรายการเกิดขึ้น',
    deposit: 'ฝาก',
    withdrawal: 'ถอน',
    queues: 'คิวตรวจสอบ',
    queuesDescription: 'รายการที่ต้องให้เจ้าหน้าที่ดำเนินการ',
    recentRisk: 'ความเสี่ยงล่าสุด',
    recentRiskDescription: 'เรียงจากรายการที่ควรตรวจสอบก่อน',
    recentLedger: 'รายการเงินล่าสุด',
    recentLedgerDescription: 'ความเคลื่อนไหวล่าสุดของกระเป๋าเงิน',
    viewAll: 'ดูทั้งหมด',
    member: 'สมาชิก',
    details: 'รายละเอียด',
    minutes: 'นาที',
    hours: 'ชม.',
  },
  en: {
    eyebrow: 'Operations center',
    title: 'Dashboard',
    description: 'Priority work, finance, and risk in one focused view',
    refresh: 'Refresh',
    refreshing: 'Loading',
    live: 'System status',
    clear: 'No urgent work',
    clearDescription: 'Core queues and risk remain under control',
    actionNeeded: 'Action required',
    queuePressure: 'Work is waiting',
    partialData: 'Some data is unavailable',
    financeUnavailable: 'Finance data could not be loaded',
    riskUnavailable: 'Risk data could not be loaded',
    noAccess: 'This account cannot view dashboard data',
    priorities: 'Work to handle',
    prioritiesDescription: 'Only queues with actual pending work are shown',
    criticalRisk: 'Critical risk',
    openRisk: 'Open risk alerts',
    withdrawalQueue: 'Withdrawal queue',
    depositQueue: 'Deposit queue',
    review: 'Review',
    overview: 'Today at a glance',
    overviewDescription: 'Key figures without repeated summaries',
    depositsToday: 'Deposits today',
    withdrawalsToday: 'Withdrawals today',
    netFlow: 'Net flow',
    totalWallet: 'Total wallet balance',
    pendingWork: 'Pending finance work',
    oldestQueue: 'Oldest queue',
    openRisks: 'Open risks',
    items: 'items',
    wallets: 'wallets',
    updated: 'Updated',
    financeFlow: 'Today’s money flow',
    financeFlowDescription: 'Deposit and withdrawal comparison when activity exists',
    deposit: 'Deposits',
    withdrawal: 'Withdrawals',
    queues: 'Review queues',
    queuesDescription: 'Items that require an operator decision',
    recentRisk: 'Recent risk alerts',
    recentRiskDescription: 'Highest-priority alerts appear first',
    recentLedger: 'Recent ledger activity',
    recentLedgerDescription: 'Latest wallet movements',
    viewAll: 'View all',
    member: 'Member',
    details: 'Details',
    minutes: 'min',
    hours: 'hr',
  },
};

export default function RedesignedAdminDashboard() {
  const [locale] = useAdminLocale();
  const t = dashboardCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [riskItems, setRiskItems] = useState<RiskAlert[]>([]);
  const [riskSummary, setRiskSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [financeError, setFinanceError] = useState('');
  const [riskError, setRiskError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    setFinanceError('');
    setRiskError('');
    try {
      const [financeResponse, riskResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/finance/summary'),
        adminApiFetch('/admin/risk-alerts?status=OPEN'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const financeData = await financeResponse.json().catch(() => null) as FinanceSummary | null;
      const riskData = await riskResponse.json().catch(() => null) as RiskResponse | null;
      const meData = await meResponse.json().catch(() => null) as { permissions?: string[] } | null;

      setPermissions(meResponse.ok && Array.isArray(meData?.permissions) ? meData.permissions : []);
      if (financeResponse.ok && financeData) setSummary(financeData);
      else setFinanceError(t.financeUnavailable);
      if (riskResponse.ok && riskData) {
        setRiskItems(riskData.items ?? []);
        setRiskSummary({
          openCount: Number(riskData.summary?.openCount ?? 0),
          criticalCount: Number(riskData.summary?.criticalCount ?? 0),
        });
      } else setRiskError(t.riskUnavailable);
      if (financeResponse.ok || riskResponse.ok) setLastLoadedAt(new Date().toISOString());
    } catch {
      setPermissions([]);
      setFinanceError(t.financeUnavailable);
      setRiskError(t.riskUnavailable);
    } finally {
      setLoading(false);
    }
  }

  const hasPermission = (codes: string[]) => Boolean(permissions?.includes('*') || codes.some((code) => permissions?.includes(code)));
  const canViewFinance = hasPermission(['reports.view', 'wallet.view', 'topups.view', 'deposit.view', 'withdraw.view']);
  const canViewTopUps = hasPermission(['topups.view', 'deposit.view']);
  const canViewWithdrawals = hasPermission(['withdraw.view']);
  const canViewWallet = hasPermission(['wallet.view']);
  const canViewRisk = hasPermission(['risk.view']);

  const dashboard = useMemo(() => {
    const deposits = Number(summary?.today?.topUpAmount ?? 0);
    const withdrawals = Number(summary?.today?.withdrawalAmount ?? 0);
    const netFlow = Number(summary?.today?.netFlow ?? 0);
    const pendingTopUps = Number(summary?.totals.pendingTopUps ?? 0);
    const pendingWithdrawals = Number(summary?.totals.pendingWithdrawals ?? 0);
    const pendingTotal = pendingTopUps + pendingWithdrawals;
    const queueItems = [...(summary?.queues.topUps ?? []), ...(summary?.queues.withdrawals ?? [])];
    const now = Date.now();
    const ages = queueItems
      .map((item) => Math.max(0, Math.floor((now - new Date(item.createdAt).getTime()) / 60_000)))
      .filter(Number.isFinite);
    const oldestMinutes = ages.length ? Math.max(...ages) : 0;
    const criticalQueueCount = ages.filter((minutes) => minutes >= 60).length;
    const hasFinanceActivity = deposits !== 0 || withdrawals !== 0
      || Number(summary?.today?.topUpCount ?? 0) > 0
      || Number(summary?.today?.withdrawalCount ?? 0) > 0;
    return {
      deposits,
      withdrawals,
      netFlow,
      pendingTopUps,
      pendingWithdrawals,
      pendingTotal,
      oldestMinutes,
      criticalQueueCount,
      hasFinanceActivity,
    };
  }, [summary]);

  const priorityItems = useMemo(() => {
    const items: Array<{ key: string; label: string; helper: string; value: number; href: string; tone: 'danger' | 'warning' | 'neutral' }> = [];
    if (canViewRisk && riskSummary.openCount > 0) items.push({
      key: 'risk',
      label: riskSummary.criticalCount > 0 ? t.criticalRisk : t.openRisk,
      helper: `${riskSummary.criticalCount} ${t.criticalRisk}`,
      value: riskSummary.openCount,
      href: '/risk-alerts',
      tone: riskSummary.criticalCount > 0 ? 'danger' : 'warning',
    });
    if (canViewWithdrawals && dashboard.pendingWithdrawals > 0) items.push({
      key: 'withdrawals', label: t.withdrawalQueue, helper: t.actionNeeded, value: dashboard.pendingWithdrawals, href: '/withdrawals', tone: 'danger',
    });
    if (canViewTopUps && dashboard.pendingTopUps > 0) items.push({
      key: 'topups', label: t.depositQueue, helper: t.actionNeeded, value: dashboard.pendingTopUps, href: '/topups', tone: 'warning',
    });
    return items;
  }, [canViewRisk, canViewTopUps, canViewWithdrawals, dashboard.pendingTopUps, dashboard.pendingWithdrawals, riskSummary.criticalCount, riskSummary.openCount, t]);

  const statusTone = financeError && riskError
    ? 'danger'
    : riskSummary.criticalCount > 0 || dashboard.criticalQueueCount > 0
      ? 'danger'
      : dashboard.pendingTotal > 0 || riskSummary.openCount > 0
        ? 'warning'
        : 'success';
  const statusLabel = statusTone === 'danger' ? t.actionNeeded : statusTone === 'warning' ? t.queuePressure : t.clear;
  const actionCount = dashboard.pendingTotal + riskSummary.openCount;
  const canViewAnything = canViewFinance || canViewRisk;

  return (
    <main className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className={styles.description}>{t.description}</p>
        </div>
        <button
          className={styles.refreshButton}
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          style={{ height: 40, minHeight: 40, maxHeight: 40, alignSelf: 'flex-end' }}
        >
          {loading ? t.refreshing : t.refresh}
        </button>
      </header>

      <section className={styles.statusBar} data-tone={statusTone} aria-label={t.live}>
        <span className={styles.statusDot} aria-hidden="true" />
        <div className={styles.statusCopy}>
          <small>{t.live}</small>
          <strong>{statusLabel}</strong>
          <span>{statusTone === 'success' ? t.clearDescription : `${actionCount} ${t.items}`}</span>
        </div>
        <div className={styles.statusMeta}>
          {actionCount > 0 && <strong>{actionCount}</strong>}
          <span>{lastLoadedAt ? `${t.updated} ${new Date(lastLoadedAt).toLocaleTimeString(dateLocale)}` : t.refreshing}</span>
        </div>
      </section>

      {(financeError || riskError) && !loading && (
        <div className={styles.errorRow} role="status">
          {financeError && <span>{financeError}</span>}
          {riskError && <span>{riskError}</span>}
          <button type="button" onClick={() => void loadDashboard()}>{t.refresh}</button>
        </div>
      )}

      {loading && !summary && permissions === null && (
        <section className={styles.skeletonGrid} aria-label={t.refreshing}>
          {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
        </section>
      )}

      {!loading && permissions !== null && !canViewAnything && (
        <section className={styles.emptyState}>{t.noAccess}</section>
      )}

      {canViewAnything && priorityItems.length > 0 && (
        <section className={styles.section}>
          <SectionHeading title={t.priorities} description={t.prioritiesDescription} />
          <div className={styles.priorityGrid}>
            {priorityItems.map((item) => (
              <Link className={styles.priorityCard} data-tone={item.tone} href={item.href} key={item.key}>
                <span><strong>{item.label}</strong><small>{item.helper}</small></span>
                <b>{item.value.toLocaleString(dateLocale)}</b>
                <em>{t.review}</em>
              </Link>
            ))}
          </div>
        </section>
      )}

      {canViewAnything && (
        <section className={styles.section}>
          <SectionHeading title={t.overview} description={t.overviewDescription} />
          <div className={styles.metricGrid}>
            {canViewFinance && <Metric label={t.depositsToday} value={formatMoney(String(dashboard.deposits))} helper={`${summary?.today?.topUpCount ?? 0} ${t.items}`} />}
            {canViewFinance && <Metric label={t.withdrawalsToday} value={formatMoney(String(dashboard.withdrawals))} helper={`${summary?.today?.withdrawalCount ?? 0} ${t.items}`} />}
            {canViewFinance && <Metric label={t.netFlow} value={formatMoney(String(dashboard.netFlow))} helper={`${t.deposit} − ${t.withdrawal}`} tone={dashboard.netFlow < 0 ? 'warning' : 'success'} />}
            {canViewWallet && <Metric label={t.totalWallet} value={formatMoney(summary?.totals.totalBalance ?? '0')} helper={`${summary?.totals.walletCount ?? 0} ${t.wallets}`} />}
            {(canViewTopUps || canViewWithdrawals) && dashboard.pendingTotal > 0 && <Metric label={t.pendingWork} value={dashboard.pendingTotal.toLocaleString(dateLocale)} helper={`${dashboard.pendingTopUps} ${t.deposit} · ${dashboard.pendingWithdrawals} ${t.withdrawal}`} tone="warning" />}
            {(canViewTopUps || canViewWithdrawals) && dashboard.pendingTotal > 0 && <Metric label={t.oldestQueue} value={formatQueueAge(dashboard.oldestMinutes, t)} helper={`${dashboard.criticalQueueCount} ${t.actionNeeded}`} tone={dashboard.criticalQueueCount > 0 ? 'danger' : 'warning'} />}
            {canViewRisk && riskSummary.openCount > 0 && <Metric label={t.openRisks} value={riskSummary.openCount.toLocaleString(dateLocale)} helper={`${riskSummary.criticalCount} ${t.criticalRisk}`} tone={riskSummary.criticalCount > 0 ? 'danger' : 'warning'} />}
          </div>
        </section>
      )}

      {canViewFinance && summary?.today && dashboard.hasFinanceActivity && (
        <section className={styles.panel}>
          <SectionHeading title={t.financeFlow} description={t.financeFlowDescription} />
          <div className={styles.flowGrid}>
            <FlowBar label={t.deposit} amount={dashboard.deposits} max={Math.max(dashboard.deposits, dashboard.withdrawals, 1)} tone="deposit" />
            <FlowBar label={t.withdrawal} amount={dashboard.withdrawals} max={Math.max(dashboard.deposits, dashboard.withdrawals, 1)} tone="withdrawal" />
            <div className={styles.netFlow} data-tone={dashboard.netFlow < 0 ? 'danger' : 'success'}>
              <span>{t.netFlow}</span><strong>{formatMoney(String(dashboard.netFlow))}</strong>
            </div>
          </div>
        </section>
      )}

      {summary && ((canViewTopUps && dashboard.pendingTopUps > 0) || (canViewWithdrawals && dashboard.pendingWithdrawals > 0)) && (
        <section className={styles.section}>
          <SectionHeading title={t.queues} description={t.queuesDescription} />
          <div className={styles.twoColumnGrid}>
            {canViewTopUps && dashboard.pendingTopUps > 0 && <QueuePanel title={t.depositQueue} href="/topups" items={summary.queues.topUps} total={dashboard.pendingTopUps} locale={locale} copy={t} />}
            {canViewWithdrawals && dashboard.pendingWithdrawals > 0 && <QueuePanel title={t.withdrawalQueue} href="/withdrawals" items={summary.queues.withdrawals} total={dashboard.pendingWithdrawals} locale={locale} copy={t} />}
          </div>
        </section>
      )}

      {(canViewRisk && riskItems.length > 0) || (canViewFinance && (summary?.recentLedgers.length ?? 0) > 0) ? (
        <section className={styles.twoColumnGrid}>
          {canViewRisk && riskItems.length > 0 && (
            <article className={styles.panel}>
              <SectionHeading title={t.recentRisk} description={t.recentRiskDescription} action={{ href: '/risk-alerts', label: t.viewAll }} />
              <div className={styles.list}>
                {riskItems.slice(0, 6).map((item) => (
                  <div className={styles.listRow} key={item.id}>
                    <div><span className={styles.severity} data-severity={item.severity.toLowerCase()}>{item.severity}</span><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString(dateLocale)}</small></div>
                    <div className={styles.rowActions}>{item.memberId && <Link href={`/members/${item.memberId}`}>{t.member}</Link>}<Link href={`/risk-alerts/${item.id}`}>{t.details}</Link></div>
                  </div>
                ))}
              </div>
            </article>
          )}
          {canViewFinance && (summary?.recentLedgers.length ?? 0) > 0 && (
            <article className={styles.panel}>
              <SectionHeading title={t.recentLedger} description={t.recentLedgerDescription} {...(canViewWallet ? { action: { href: '/wallet-ledgers', label: t.viewAll } } : {})} />
              <div className={styles.list}>
                {summary?.recentLedgers.slice(0, 6).map((item) => (
                  <div className={styles.listRow} key={item.id}>
                    <div><strong>{item.type} / {item.direction}</strong><small>{item.user?.username ?? item.user?.shortId ?? '-'}</small></div>
                    <div className={styles.money}><strong>{formatMoney(item.amount)}</strong><small>{new Date(item.createdAt).toLocaleString(dateLocale)}</small></div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      ) : null}
    </main>
  );
}

function SectionHeading({ title, description, action }: { title: string; description: string; action?: { href: string; label: string } }) {
  return <header className={styles.sectionHeading}><div><h2>{title}</h2><p>{description}</p></div>{action && <Link href={action.href}>{action.label}</Link>}</header>;
}

function Metric({ label, value, helper, tone = 'neutral' }: { label: string; value: string; helper: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <article className={styles.metric} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{helper}</small></article>;
}

function FlowBar({ label, amount, max, tone }: { label: string; amount: number; max: number; tone: 'deposit' | 'withdrawal' }) {
  const width = amount > 0 ? Math.max((amount / max) * 100, 4) : 0;
  return <div className={styles.flowBar} data-tone={tone}><header><span>{label}</span><strong>{formatMoney(String(amount))}</strong></header><div><i style={{ width: `${width}%` }} /></div></div>;
}

function QueuePanel({ title, href, items, total, locale, copy }: { title: string; href: string; items: QueueItem[]; total: number; locale: AdminLocale; copy: DashboardCopy }) {
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  return <article className={styles.panel}><SectionHeading title={title} description={`${total.toLocaleString(dateLocale)} ${copy.items}`} action={{ href, label: copy.viewAll }} /><div className={styles.list}>{items.slice(0, 5).map((item) => <div className={styles.listRow} key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><small>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString(dateLocale)}</small></div><div className={styles.money}><strong>{formatMoney(item.amount)}</strong><Link href={href}>{copy.review}</Link></div></div>)}</div></article>;
}

function formatQueueAge(minutes: number, copy: DashboardCopy) {
  if (minutes < 60) return `${minutes} ${copy.minutes}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} ${copy.hours} ${remainder} ${copy.minutes}` : `${hours} ${copy.hours}`;
}
