'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminEmpty, AdminPage, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import styles from './dashboard-professional.module.css';

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

type LedgerItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
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
  recentLedgers: LedgerItem[];
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

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  refreshing: string;
  systemStatus: string;
  healthy: string;
  healthyDescription: string;
  actionRequired: string;
  pendingDescription: string;
  updated: string;
  unavailable: string;
  retry: string;
  noAccess: string;
  priorities: string;
  prioritiesDescription: string;
  criticalRisk: string;
  openRisk: string;
  withdrawalQueue: string;
  depositQueue: string;
  review: string;
  insights: string;
  insightsDescription: string;
  financeChart: string;
  deposit: string;
  withdrawal: string;
  netFlow: string;
  items: string;
  walletChart: string;
  available: string;
  locked: string;
  variance: string;
  total: string;
  riskChart: string;
  open: string;
  noOpenRisk: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  overview: string;
  overviewDescription: string;
  depositsToday: string;
  withdrawalsToday: string;
  totalWallet: string;
  walletCount: string;
  pendingWork: string;
  oldestQueue: string;
  queues: string;
  queuesDescription: string;
  recentActivity: string;
  recentActivityDescription: string;
  recentRisk: string;
  recentLedger: string;
  viewAll: string;
  member: string;
  details: string;
  minutes: string;
  hours: string;
  noQueueRows: string;
};

const copy: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'ศูนย์ปฏิบัติการ',
    title: 'ภาพรวมการดำเนินงาน',
    description: 'ติดตามสถานะ งานเร่งด่วน การเงิน และความเสี่ยงจากข้อมูลล่าสุด',
    refresh: 'อัปเดตข้อมูล',
    refreshing: 'กำลังอัปเดต',
    systemStatus: 'สถานะการดำเนินงาน',
    healthy: 'ระบบอยู่ในภาวะปกติ',
    healthyDescription: 'ไม่มีคิววิกฤตหรือความเสี่ยงที่ต้องจัดการทันที',
    actionRequired: 'มีรายการที่ต้องดำเนินการ',
    pendingDescription: 'เปิดรายการด้านล่างเพื่อดำเนินการตามลำดับความสำคัญ',
    updated: 'อัปเดตล่าสุด',
    unavailable: 'ข้อมูลบางส่วนยังไม่พร้อม',
    retry: 'ลองใหม่',
    noAccess: 'บัญชีนี้ไม่มีสิทธิ์ดูข้อมูลในแดชบอร์ด',
    priorities: 'งานเร่งด่วน',
    prioritiesDescription: 'แสดงเฉพาะรายการที่มีงานค้างจริง',
    criticalRisk: 'ความเสี่ยงวิกฤต',
    openRisk: 'ความเสี่ยงที่เปิดอยู่',
    withdrawalQueue: 'รายการถอนรอดำเนินการ',
    depositQueue: 'รายการฝากรอตรวจ',
    review: 'เปิดตรวจสอบ',
    insights: 'ข้อมูลเพื่อการตัดสินใจ',
    insightsDescription: 'กราฟสำคัญแสดงก่อนรายการเคลื่อนไหวล่าสุด',
    financeChart: 'ฝากเทียบถอนวันนี้',
    deposit: 'ฝาก',
    withdrawal: 'ถอน',
    netFlow: 'กระแสเงินสุทธิ',
    items: 'รายการ',
    walletChart: 'องค์ประกอบยอดกระเป๋า',
    available: 'ใช้ได้',
    locked: 'ล็อก',
    variance: 'ส่วนต่าง',
    total: 'ยอดรวม',
    riskChart: 'ระดับความเสี่ยงที่เปิดอยู่',
    open: 'เปิดอยู่',
    noOpenRisk: 'ไม่มีความเสี่ยงเปิดอยู่',
    critical: 'วิกฤต',
    high: 'สูง',
    medium: 'กลาง',
    low: 'ต่ำ',
    overview: 'ตัวเลขสำคัญ',
    overviewDescription: 'ค่าหลักสำหรับติดตามผลการดำเนินงานวันนี้',
    depositsToday: 'ยอดฝากวันนี้',
    withdrawalsToday: 'ยอดถอนวันนี้',
    totalWallet: 'ยอดกระเป๋ารวม',
    walletCount: 'กระเป๋า',
    pendingWork: 'งานการเงินค้าง',
    oldestQueue: 'คิวเก่าสุด',
    queues: 'คิวที่ต้องตรวจสอบ',
    queuesDescription: 'รายการที่ต้องให้เจ้าหน้าที่ตัดสินใจ',
    recentActivity: 'กิจกรรมล่าสุด',
    recentActivityDescription: 'ข้อมูลรายละเอียดแสดงหลังภาพรวมและกราฟ',
    recentRisk: 'ความเสี่ยงล่าสุด',
    recentLedger: 'รายการเงินล่าสุด',
    viewAll: 'ดูทั้งหมด',
    member: 'สมาชิก',
    details: 'รายละเอียด',
    minutes: 'นาที',
    hours: 'ชม.',
    noQueueRows: 'ไม่มีรายการในคิวที่โหลดมา',
  },
  en: {
    eyebrow: 'Operations center',
    title: 'Operations overview',
    description: 'Monitor status, priority work, finance, and risk from the latest data',
    refresh: 'Refresh data',
    refreshing: 'Refreshing',
    systemStatus: 'Operating status',
    healthy: 'Operations are healthy',
    healthyDescription: 'No critical queue or risk requires immediate action',
    actionRequired: 'Items require action',
    pendingDescription: 'Open the items below and work through them by priority',
    updated: 'Last updated',
    unavailable: 'Some data is unavailable',
    retry: 'Retry',
    noAccess: 'This account cannot view dashboard data',
    priorities: 'Priority work',
    prioritiesDescription: 'Only queues with actual pending work are shown',
    criticalRisk: 'Critical risk',
    openRisk: 'Open risk alerts',
    withdrawalQueue: 'Withdrawals awaiting action',
    depositQueue: 'Deposits awaiting review',
    review: 'Open review',
    insights: 'Decision insights',
    insightsDescription: 'Important charts appear before recent activity',
    financeChart: 'Deposits vs withdrawals today',
    deposit: 'Deposits',
    withdrawal: 'Withdrawals',
    netFlow: 'Net cash flow',
    items: 'items',
    walletChart: 'Wallet balance composition',
    available: 'Available',
    locked: 'Locked',
    variance: 'Variance',
    total: 'Total',
    riskChart: 'Open risk severity',
    open: 'open',
    noOpenRisk: 'No open risks',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    overview: 'Key figures',
    overviewDescription: 'Core figures for monitoring today’s operations',
    depositsToday: 'Deposits today',
    withdrawalsToday: 'Withdrawals today',
    totalWallet: 'Total wallet balance',
    walletCount: 'wallets',
    pendingWork: 'Pending finance work',
    oldestQueue: 'Oldest queue',
    queues: 'Review queues',
    queuesDescription: 'Items that require an operator decision',
    recentActivity: 'Recent activity',
    recentActivityDescription: 'Detail appears after the overview and charts',
    recentRisk: 'Recent risk alerts',
    recentLedger: 'Recent ledger activity',
    viewAll: 'View all',
    member: 'Member',
    details: 'Details',
    minutes: 'min',
    hours: 'hr',
    noQueueRows: 'No loaded rows in this queue',
  },
};

const severities: RiskAlert['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function ProfessionalAdminDashboard() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [riskItems, setRiskItems] = useState<RiskAlert[]>([]);
  const [riskSummary, setRiskSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [financeError, setFinanceError] = useState(false);
  const [riskError, setRiskError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    setFinanceError(false);
    setRiskError(false);
    try {
      const [financeResponse, riskResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/finance/summary'),
        adminApiFetch('/admin/risk-alerts?status=OPEN'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [financeData, riskData, meData] = await Promise.all([
        financeResponse.json().catch(() => null) as Promise<FinanceSummary | null>,
        riskResponse.json().catch(() => null) as Promise<RiskResponse | null>,
        meResponse.json().catch(() => null) as Promise<{ permissions?: string[] } | null>,
      ]);
      setPermissions(meResponse.ok && Array.isArray(meData?.permissions) ? meData.permissions : []);
      if (financeResponse.ok && financeData) setSummary(financeData);
      else setFinanceError(true);
      if (riskResponse.ok && riskData) {
        setRiskItems(riskData.items ?? []);
        setRiskSummary({
          openCount: Number(riskData.summary?.openCount ?? 0),
          criticalCount: Number(riskData.summary?.criticalCount ?? 0),
        });
      } else setRiskError(true);
      if (financeResponse.ok || riskResponse.ok) setLastLoadedAt(new Date().toISOString());
    } catch {
      setPermissions([]);
      setFinanceError(true);
      setRiskError(true);
    } finally {
      setLoading(false);
    }
  }

  const hasPermission = (codes: string[]) => Boolean(permissions?.includes('*') || codes.some((code) => permissions?.includes(code)));
  const canViewFinance = hasPermission(['reports.view', 'wallet.view', 'topups.view', 'deposit.view', 'withdraw.view']);
  const canViewWallet = hasPermission(['wallet.view']);
  const canViewTopUps = hasPermission(['topups.view', 'deposit.view']);
  const canViewWithdrawals = hasPermission(['withdraw.view']);
  const canViewRisk = hasPermission(['risk.view']);
  const canViewAnything = canViewFinance || canViewRisk;

  const metrics = useMemo(() => {
    const deposit = Math.max(0, Number(summary?.today?.topUpAmount ?? 0));
    const withdrawal = Math.max(0, Number(summary?.today?.withdrawalAmount ?? 0));
    const net = Number(summary?.today?.netFlow ?? deposit - withdrawal);
    const maxFlow = Math.max(deposit, withdrawal, 1);
    const total = Math.max(0, Number(summary?.totals.totalBalance ?? 0));
    const available = Math.max(0, Number(summary?.totals.totalAvailableBalance ?? 0));
    const locked = Math.max(0, Number(summary?.totals.totalLockedBalance ?? 0));
    const variance = total - available - locked;
    const walletBase = Math.max(total, available + locked + Math.max(variance, 0), 1);
    const pendingTopUps = Number(summary?.totals.pendingTopUps ?? 0);
    const pendingWithdrawals = Number(summary?.totals.pendingWithdrawals ?? 0);
    const pendingTotal = pendingTopUps + pendingWithdrawals;
    const queueItems = [...(summary?.queues.topUps ?? []), ...(summary?.queues.withdrawals ?? [])];
    const ages = queueItems.map((item) => Math.max(0, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60_000))).filter(Number.isFinite);
    const oldestMinutes = ages.length ? Math.max(...ages) : 0;
    const riskCounts = severities.reduce<Record<RiskAlert['severity'], number>>((result, severity) => {
      result[severity] = riskItems.filter((item) => item.severity === severity).length;
      return result;
    }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
    if (riskCounts.CRITICAL === 0 && riskSummary.criticalCount > 0) riskCounts.CRITICAL = riskSummary.criticalCount;
    const countedRiskTotal = severities.reduce((sum, severity) => sum + riskCounts[severity], 0);
    const openRiskTotal = Math.max(countedRiskTotal, riskSummary.openCount);
    const donutBase = Math.max(countedRiskTotal, 1);
    const criticalEnd = (riskCounts.CRITICAL / donutBase) * 100;
    const highEnd = criticalEnd + (riskCounts.HIGH / donutBase) * 100;
    const mediumEnd = highEnd + (riskCounts.MEDIUM / donutBase) * 100;
    const donut = countedRiskTotal === 0
      ? 'conic-gradient(rgb(148 163 184 / 16%) 0 100%)'
      : `conic-gradient(#fb7185 0 ${criticalEnd}%, #f59e0b ${criticalEnd}% ${highEnd}%, #facc15 ${highEnd}% ${mediumEnd}%, #2dd4bf ${mediumEnd}% 100%)`;
    return {
      deposit, withdrawal, net, maxFlow, total, available, locked, variance, walletBase,
      pendingTopUps, pendingWithdrawals, pendingTotal, oldestMinutes,
      riskCounts, openRiskTotal, donut,
    };
  }, [riskItems, riskSummary.criticalCount, riskSummary.openCount, summary]);

  const priorityItems = useMemo(() => {
    const items: Array<{ key: string; label: string; helper: string; value: number; href: string; tone: 'warning' | 'danger' }> = [];
    if (canViewRisk && metrics.openRiskTotal > 0) items.push({ key: 'risk', label: metrics.riskCounts.CRITICAL > 0 ? t.criticalRisk : t.openRisk, helper: `${metrics.riskCounts.CRITICAL} ${t.critical}`, value: metrics.openRiskTotal, href: '/risk-alerts', tone: metrics.riskCounts.CRITICAL > 0 ? 'danger' : 'warning' });
    if (canViewWithdrawals && metrics.pendingWithdrawals > 0) items.push({ key: 'withdrawals', label: t.withdrawalQueue, helper: t.actionRequired, value: metrics.pendingWithdrawals, href: '/withdrawals', tone: 'danger' });
    if (canViewTopUps && metrics.pendingTopUps > 0) items.push({ key: 'topups', label: t.depositQueue, helper: t.actionRequired, value: metrics.pendingTopUps, href: '/topups', tone: 'warning' });
    return items;
  }, [canViewRisk, canViewTopUps, canViewWithdrawals, metrics.openRiskTotal, metrics.pendingTopUps, metrics.pendingWithdrawals, metrics.riskCounts.CRITICAL, t]);

  const actionCount = metrics.pendingTotal + metrics.openRiskTotal;
  const hasError = (financeError && canViewFinance) || (riskError && canViewRisk);
  const statusTone = hasError ? 'warning' : actionCount > 0 ? 'warning' : 'success';

  return (
    <AdminPage
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      actions={<AdminButton onClick={() => void loadDashboard()} disabled={loading}>{loading ? t.refreshing : t.refresh}</AdminButton>}
    >
      <section className={styles.statusBar} data-tone={statusTone}>
        <span className={styles.statusDot} aria-hidden="true" />
        <div className={styles.statusCopy}>
          <small>{t.systemStatus}</small>
          <strong>{actionCount > 0 ? t.actionRequired : t.healthy}</strong>
          <span>{actionCount > 0 ? t.pendingDescription : t.healthyDescription}</span>
        </div>
        <div className={styles.statusMeta}>
          {actionCount > 0 && <strong>{actionCount.toLocaleString(numberLocale)}</strong>}
          <span>{lastLoadedAt ? `${t.updated} ${new Date(lastLoadedAt).toLocaleTimeString(numberLocale)}` : t.refreshing}</span>
        </div>
      </section>

      {hasError && !loading && <div className={styles.errorRow} role="status"><span>{t.unavailable}</span><button type="button" onClick={() => void loadDashboard()}>{t.retry}</button></div>}
      {loading && !summary && permissions === null && <DashboardSkeleton />}
      {!loading && permissions !== null && !canViewAnything && <AdminEmpty>{t.noAccess}</AdminEmpty>}

      {canViewAnything && priorityItems.length > 0 && (
        <DashboardSection title={t.priorities} description={t.prioritiesDescription}>
          <div className={styles.priorityGrid}>
            {priorityItems.map((item) => <Link className={styles.priorityCard} data-tone={item.tone} href={item.href} key={item.key}><span><strong>{item.label}</strong><small>{item.helper}</small></span><b>{item.value.toLocaleString(numberLocale)}</b><em>{t.review}</em></Link>)}
          </div>
        </DashboardSection>
      )}

      {canViewAnything && (
        <DashboardSection title={t.insights} description={t.insightsDescription}>
          <div className={styles.insightGrid}>
            {canViewFinance && <FinanceInsight summary={summary} metrics={metrics} copy={t} />}
            {canViewWallet && <WalletInsight metrics={metrics} copy={t} />}
            {canViewRisk && <RiskInsight metrics={metrics} copy={t} locale={locale} />}
          </div>
        </DashboardSection>
      )}

      {canViewAnything && (
        <DashboardSection title={t.overview} description={t.overviewDescription}>
          <div className={styles.metricGrid}>
            {canViewFinance && <Metric label={t.depositsToday} value={formatMoney(metrics.deposit)} helper={`${summary?.today?.topUpCount ?? 0} ${t.items}`} />}
            {canViewFinance && <Metric label={t.withdrawalsToday} value={formatMoney(metrics.withdrawal)} helper={`${summary?.today?.withdrawalCount ?? 0} ${t.items}`} />}
            {canViewFinance && <Metric label={t.netFlow} value={formatMoney(metrics.net)} helper={`${t.deposit} − ${t.withdrawal}`} tone={metrics.net < 0 ? 'warning' : 'success'} />}
            {canViewWallet && <Metric label={t.totalWallet} value={formatMoney(metrics.total)} helper={`${summary?.totals.walletCount ?? 0} ${t.walletCount}`} />}
            {(canViewTopUps || canViewWithdrawals) && <Metric label={t.pendingWork} value={metrics.pendingTotal.toLocaleString(numberLocale)} helper={`${metrics.pendingTopUps} ${t.deposit} · ${metrics.pendingWithdrawals} ${t.withdrawal}`} tone={metrics.pendingTotal > 0 ? 'warning' : 'success'} />}
            {(canViewTopUps || canViewWithdrawals) && <Metric label={t.oldestQueue} value={formatQueueAge(metrics.oldestMinutes, t)} helper={`${metrics.pendingTotal} ${t.items}`} tone={metrics.oldestMinutes >= 60 ? 'danger' : metrics.oldestMinutes > 0 ? 'warning' : 'success'} />}
          </div>
        </DashboardSection>
      )}

      {summary && ((canViewTopUps && metrics.pendingTopUps > 0) || (canViewWithdrawals && metrics.pendingWithdrawals > 0)) && (
        <DashboardSection title={t.queues} description={t.queuesDescription}>
          <div className={styles.twoColumnGrid}>
            {canViewTopUps && metrics.pendingTopUps > 0 && <QueuePanel title={t.depositQueue} href="/topups" items={summary.queues.topUps} total={metrics.pendingTopUps} locale={locale} copy={t} />}
            {canViewWithdrawals && metrics.pendingWithdrawals > 0 && <QueuePanel title={t.withdrawalQueue} href="/withdrawals" items={summary.queues.withdrawals} total={metrics.pendingWithdrawals} locale={locale} copy={t} />}
          </div>
        </DashboardSection>
      )}

      {((canViewRisk && riskItems.length > 0) || (canViewWallet && (summary?.recentLedgers.length ?? 0) > 0)) && (
        <DashboardSection title={t.recentActivity} description={t.recentActivityDescription}>
          <div className={styles.twoColumnGrid}>
            {canViewRisk && riskItems.length > 0 && <RecentRiskPanel items={riskItems} locale={locale} copy={t} />}
            {canViewWallet && (summary?.recentLedgers.length ?? 0) > 0 && <RecentLedgerPanel items={summary?.recentLedgers ?? []} locale={locale} copy={t} />}
          </div>
        </DashboardSection>
      )}
    </AdminPage>
  );
}

function DashboardSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className={styles.section}><header className={styles.sectionHeading}><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>;
}

function DashboardSkeleton() {
  return <section className={styles.skeletonGrid} aria-label="loading">{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</section>;
}

function FinanceInsight({ summary, metrics, copy }: { summary: FinanceSummary | null; metrics: ReturnType<typeof useDashboardMetrics>; copy: Copy }) {
  return <article className={styles.insightCard}><header><div><h3>{copy.financeChart}</h3><p>{copy.netFlow}: <strong data-tone={metrics.net < 0 ? 'danger' : 'success'}>{formatMoney(metrics.net)}</strong></p></div></header><div className={styles.flowChart}><FlowRow label={copy.deposit} value={metrics.deposit} count={summary?.today?.topUpCount ?? 0} max={metrics.maxFlow} tone="deposit" items={copy.items} /><FlowRow label={copy.withdrawal} value={metrics.withdrawal} count={summary?.today?.withdrawalCount ?? 0} max={metrics.maxFlow} tone="withdrawal" items={copy.items} /></div></article>;
}

function WalletInsight({ metrics, copy }: { metrics: ReturnType<typeof useDashboardMetrics>; copy: Copy }) {
  return <article className={styles.insightCard}><header><div><h3>{copy.walletChart}</h3><p>{copy.total}: <strong>{formatMoney(metrics.total)}</strong></p></div></header><div className={styles.walletBar}><span data-tone="available" style={{ width: `${Math.max((metrics.available / metrics.walletBase) * 100, metrics.available > 0 ? 2 : 0)}%` }} /><span data-tone="locked" style={{ width: `${Math.max((metrics.locked / metrics.walletBase) * 100, metrics.locked > 0 ? 2 : 0)}%` }} />{metrics.variance > 0 && <span data-tone="variance" style={{ width: `${Math.max((metrics.variance / metrics.walletBase) * 100, 2)}%` }} />}</div><div className={styles.walletLegend}><InsightMetric label={copy.available} value={metrics.available} tone="available" /><InsightMetric label={copy.locked} value={metrics.locked} tone="locked" /><InsightMetric label={copy.variance} value={metrics.variance} tone={metrics.variance === 0 ? 'available' : 'variance'} /></div></article>;
}

function RiskInsight({ metrics, copy, locale }: { metrics: ReturnType<typeof useDashboardMetrics>; copy: Copy; locale: AdminLocale }) {
  return <article className={styles.insightCard}><header><div><h3>{copy.riskChart}</h3><p>{metrics.openRiskTotal.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')} {copy.open}</p></div></header><div className={styles.riskLayout}><div className={styles.donut} style={{ background: metrics.donut }}><span>{metrics.openRiskTotal}</span><small>{copy.open}</small></div><div className={styles.riskLegend}><RiskMetric label={copy.critical} value={metrics.riskCounts.CRITICAL} tone="critical" /><RiskMetric label={copy.high} value={metrics.riskCounts.HIGH} tone="high" /><RiskMetric label={copy.medium} value={metrics.riskCounts.MEDIUM} tone="medium" /><RiskMetric label={copy.low} value={metrics.riskCounts.LOW} tone="low" /></div></div>{metrics.openRiskTotal === 0 && <p className={styles.empty}>{copy.noOpenRisk}</p>}</article>;
}

function FlowRow({ label, value, count, max, tone, items }: { label: string; value: number; count: number; max: number; tone: 'deposit' | 'withdrawal'; items: string }) {
  const width = value > 0 ? Math.max((value / max) * 100, 3) : 0;
  return <div className={styles.flowRow} data-tone={tone}><div><strong>{label}</strong><span>{formatMoney(value)}</span></div><div className={styles.track}><i style={{ width: `${width}%` }} /></div><small>{count.toLocaleString()} {items}</small></div>;
}

function InsightMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={styles.insightMetric} data-tone={tone}><span>{label}</span><strong>{formatMoney(value)}</strong></div>;
}

function RiskMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={styles.riskMetric} data-tone={tone}><i /><span>{label}</span><strong>{value.toLocaleString()}</strong></div>;
}

function Metric({ label, value, helper, tone = 'neutral' }: { label: string; value: string; helper: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <article className={styles.metric} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{helper}</small></article>;
}

function QueuePanel({ title, href, items, total, locale, copy }: { title: string; href: string; items: QueueItem[]; total: number; locale: AdminLocale; copy: Copy }) {
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  return <article className={styles.panel}><PanelHeader title={title} description={`${total.toLocaleString(dateLocale)} ${copy.items}`} href={href} action={copy.viewAll} /><div className={styles.list}>{items.slice(0, 5).map((item) => <div className={styles.listRow} key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><small>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString(dateLocale)}</small></div><div className={styles.money}><strong>{formatMoney(item.amount)}</strong><Link href={href}>{copy.review}</Link></div></div>)}{items.length === 0 && <p className={styles.empty}>{copy.noQueueRows}</p>}</div></article>;
}

function RecentRiskPanel({ items, locale, copy }: { items: RiskAlert[]; locale: AdminLocale; copy: Copy }) {
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  return <article className={styles.panel}><PanelHeader title={copy.recentRisk} href="/risk-alerts" action={copy.viewAll} /><div className={styles.list}>{items.slice(0, 6).map((item) => <div className={styles.listRow} key={item.id}><div><span className={styles.severity} data-severity={item.severity.toLowerCase()}>{item.severity}</span><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString(dateLocale)}</small></div><div className={styles.rowActions}>{item.memberId && <Link href={`/members/${item.memberId}`}>{copy.member}</Link>}<Link href={`/risk-alerts/${item.id}`}>{copy.details}</Link></div></div>)}</div></article>;
}

function RecentLedgerPanel({ items, locale, copy }: { items: LedgerItem[]; locale: AdminLocale; copy: Copy }) {
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  return <article className={styles.panel}><PanelHeader title={copy.recentLedger} href="/wallet-ledgers" action={copy.viewAll} /><div className={styles.list}>{items.slice(0, 6).map((item) => <div className={styles.listRow} key={item.id}><div><strong>{item.type} / {item.direction}</strong><small>{item.user?.username ?? item.user?.shortId ?? '-'}</small></div><div className={styles.money}><strong>{formatMoney(item.amount)}</strong><small>{new Date(item.createdAt).toLocaleString(dateLocale)}</small></div></div>)}</div></article>;
}

function PanelHeader({ title, description, href, action }: { title: string; description?: string; href?: string; action?: string }) {
  return <header className={styles.panelHeader}><div><h3>{title}</h3>{description && <p>{description}</p>}</div>{href && action && <Link href={href}>{action}</Link>}</header>;
}

function formatQueueAge(minutes: number, copy: Copy) {
  if (minutes < 60) return `${minutes} ${copy.minutes}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} ${copy.hours} ${remainder} ${copy.minutes}` : `${hours} ${copy.hours}`;
}

function useDashboardMetrics() {
  return {
    deposit: 0,
    withdrawal: 0,
    net: 0,
    maxFlow: 1,
    total: 0,
    available: 0,
    locked: 0,
    variance: 0,
    walletBase: 1,
    pendingTopUps: 0,
    pendingWithdrawals: 0,
    pendingTotal: 0,
    oldestMinutes: 0,
    riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<RiskAlert['severity'], number>,
    openRiskTotal: 0,
    donut: '',
  };
}
