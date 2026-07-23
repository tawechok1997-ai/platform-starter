'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSkeleton, AdminStack, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type FinanceSummary = {
  totals: { walletCount: number; totalBalance: string; totalLockedBalance: string; totalAvailableBalance: string; pendingTopUps: number; pendingWithdrawals: number };
  today?: { date: string; topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string };
  queues: { topUps: QueueItem[]; withdrawals: QueueItem[] };
  recentLedgers: { id: string; type: string; direction: string; amount: string; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null }[];
  generatedAt: string;
};
type QueueItem = { id: string; shortUserId: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null };
type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: string; title: string; memberId?: string | null; shortMemberId?: string | null; createdAt: string };
type RiskAlertsResponse = { items?: RiskAlert[]; summary?: { openCount?: number; criticalCount?: number } };
type CurrentAdmin = { permissions?: string[] };

type OperationalState = {
  tone: 'success' | 'warning' | 'danger';
  label: string;
  message: string;
};

const QUEUE_TARGET_MINUTES = 30;
const QUEUE_CRITICAL_MINUTES = 60;
const RISK_SEVERITIES: RiskAlert['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

type DashboardCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; liveStatus: string; pending: string; syncing: string; updated: string; latestData: string; partialData: string; financeKpi: string; financeKpiDescription: string; depositsToday: string; withdrawalsToday: string; items: string; netFlow: string; depositsLessWithdrawals: string; totalWallet: string; wallets: string; walletVariance: string; varianceFormula: string; operationsKpi: string; overdue: string; criticalQueue: string; oldestQueue: string; riskAlerts: string; priority: string; criticalRisk: string; reviewFirst: string; withdrawalQueue: string; paymentReview: string; depositQueue: string; evidenceReview: string; financeFlow: string; fullReport: string; deposit: string; withdrawal: string; financeComparison: string; financeComparisonDescription: string; riskPressure: string; open: string; loaded: string; openRiskCenter: string; reviewTopups: string; reviewWithdrawals: string; risk: string; financeOverview: string; noDashboardPermission: string; openRiskQueue: string; member: string; details: string; noImportantAlerts: string; recentLedger: string; viewAll: string; depositQueueTitle: string; withdrawalQueueTitle: string; reviewQueue: string; noQueueItems: string; retry: string; amount: string; count: string; outflow: string; inflow: string; noRiskAlerts: string; riskWeight: string; actionNeeded: string; clear: string; financeUnavailable: string; riskUnavailable: string; bothUnavailable: string; queuePressure: string; controlled: string; dataIncomplete: string;
};

const dashboardCopy: Record<AdminLocale, DashboardCopy> = {
  th: { eyebrow: 'ศูนย์ปฏิบัติการ', title: 'แดชบอร์ด', description: 'งาน การเงิน และความเสี่ยง', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', liveStatus: 'สถานะการปฏิบัติการ', pending: 'งานค้าง', syncing: 'กำลังซิงก์', updated: 'อัปเดต', latestData: 'ข้อมูลล่าสุด', partialData: 'แสดงเฉพาะส่วนที่โหลดสำเร็จ', financeKpi: 'ตัวชี้วัดการเงิน', financeKpiDescription: 'ยอดรวมและกระแสเงินวันนี้', depositsToday: 'ยอดฝากวันนี้', withdrawalsToday: 'ยอดถอนวันนี้', items: 'รายการ', netFlow: 'เงินสุทธิ', depositsLessWithdrawals: 'ฝากลบถอน', totalWallet: 'ยอดกระเป๋าเงินรวม', wallets: 'กระเป๋า', walletVariance: 'ส่วนต่างกระเป๋าเงิน', varianceFormula: 'ยอดรวม - ยอดใช้ได้ - ยอดล็อก', operationsKpi: 'ตัวชี้วัดงาน', overdue: 'เกินเป้าหมาย', criticalQueue: 'คิววิกฤต', oldestQueue: 'คิวเก่าสุด', riskAlerts: 'รายการความเสี่ยง', priority: 'งานสำคัญ', criticalRisk: 'ความเสี่ยงวิกฤต', reviewFirst: 'ตรวจสอบก่อนงานปกติ', withdrawalQueue: 'คิวถอน', paymentReview: 'รออนุมัติหรือจ่ายเงิน', depositQueue: 'คิวฝาก', evidenceReview: 'รอตรวจหลักฐาน', financeFlow: 'กระแสเงินวันนี้', fullReport: 'ดูรายงาน', deposit: 'ฝาก', withdrawal: 'ถอน', financeComparison: 'เปรียบเทียบการเงิน', financeComparisonDescription: 'มูลค่า จำนวน และเงินสุทธิวันนี้', riskPressure: 'ระดับความเสี่ยง', open: 'เปิดอยู่', loaded: 'ที่โหลด', openRiskCenter: 'เปิดศูนย์ความเสี่ยง', reviewTopups: 'ตรวจรายการฝาก', reviewWithdrawals: 'ตรวจรายการถอน', risk: 'ความเสี่ยง', financeOverview: 'ภาพรวมการเงิน', noDashboardPermission: 'ไม่มีสิทธิ์ดูข้อมูลการเงินหรือความเสี่ยง', openRiskQueue: 'เปิดคิวความเสี่ยง', member: 'สมาชิก', details: 'รายละเอียด', noImportantAlerts: 'ไม่มีรายการสำคัญ', recentLedger: 'รายการเงินล่าสุด', viewAll: 'ดูทั้งหมด', depositQueueTitle: 'คิวฝาก', withdrawalQueueTitle: 'คิวถอน', reviewQueue: 'เปิดคิว', noQueueItems: 'ไม่มีรายการรอตรวจ', retry: 'ลองใหม่', amount: 'มูลค่า', count: 'จำนวน', outflow: 'เงินออกมากกว่าเงินเข้า', inflow: 'เงินเข้ามากกว่าหรือเท่ากับเงินออก', noRiskAlerts: 'ไม่มีรายการความเสี่ยง', riskWeight: 'ถ่วงน้ำหนักตามความรุนแรง', actionNeeded: 'ต้องดำเนินการ', clear: 'ปกติ', financeUnavailable: 'ข้อมูลการเงินไม่พร้อม', riskUnavailable: 'ข้อมูลความเสี่ยงไม่พร้อม', bothUnavailable: 'ข้อมูลการเงินและความเสี่ยงไม่พร้อม', queuePressure: 'คิวหนาแน่น', controlled: 'อยู่ในระดับควบคุมได้', dataIncomplete: 'ข้อมูลบางส่วนไม่พร้อม' },
  en: { eyebrow: 'Operations center', title: 'Dashboard', description: 'Work, finance, and risk', refresh: 'Refresh', loading: 'Loading...', liveStatus: 'Live operation status', pending: 'pending', syncing: 'Syncing', updated: 'Updated', latestData: 'Latest data', partialData: 'Showing available sections', financeKpi: 'Finance KPI', financeKpiDescription: 'Totals and today’s flow', depositsToday: 'Deposits today', withdrawalsToday: 'Withdrawals today', items: 'items', netFlow: 'Net flow', depositsLessWithdrawals: 'Deposits less withdrawals', totalWallet: 'Total wallet balance', wallets: 'wallets', walletVariance: 'Wallet variance', varianceFormula: 'Total - available - locked', operationsKpi: 'Operations KPI', overdue: 'Over target', criticalQueue: 'Critical queue', oldestQueue: 'Oldest queue', riskAlerts: 'Risk alerts', priority: 'Priority', criticalRisk: 'Critical risk', reviewFirst: 'Review before routine work', withdrawalQueue: 'Withdrawal queue', paymentReview: 'Awaiting approval or payment', depositQueue: 'Deposit queue', evidenceReview: 'Awaiting evidence review', financeFlow: 'Today’s finance flow', fullReport: 'View report', deposit: 'Deposits', withdrawal: 'Withdrawals', financeComparison: 'Finance comparison', financeComparisonDescription: 'Today’s value, volume, and net flow', riskPressure: 'Risk pressure', open: 'open', loaded: 'loaded', openRiskCenter: 'Open risk center', reviewTopups: 'Review top ups', reviewWithdrawals: 'Review withdrawals', risk: 'Risk', financeOverview: 'Finance overview', noDashboardPermission: 'You do not have access to finance or risk data', openRiskQueue: 'Open risk queue', member: 'Member', details: 'Details', noImportantAlerts: 'No important alerts', recentLedger: 'Recent ledger', viewAll: 'View all', depositQueueTitle: 'Deposit queue', withdrawalQueueTitle: 'Withdrawal queue', reviewQueue: 'Open queue', noQueueItems: 'No pending items', retry: 'Retry', amount: 'Amount', count: 'Count', outflow: 'Outflow exceeds inflow', inflow: 'Inflow meets or exceeds outflow', noRiskAlerts: 'No risk alerts', riskWeight: 'Weighted by severity', actionNeeded: 'Action needed', clear: 'Clear', financeUnavailable: 'Finance data unavailable', riskUnavailable: 'Risk data unavailable', bothUnavailable: 'Finance and risk data unavailable', queuePressure: 'Queue pressure', controlled: 'Controlled', dataIncomplete: 'Some data is unavailable' },
};

export default function OperationDashboardPage() {
  const [locale] = useAdminLocale();
  const t = dashboardCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [riskItems, setRiskItems] = useState<RiskAlert[]>([]);
  const [riskSummary, setRiskSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [financeError, setFinanceError] = useState('');
  const [riskError, setRiskError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void loadSummary(); }, []);

  async function loadSummary() {
    setLoading(true);
    setFinanceError('');
    setRiskError('');
    try {
      const [financeRes, riskRes, meRes] = await Promise.all([
        adminApiFetch('/admin/finance/summary'),
        adminApiFetch('/admin/risk-alerts?status=OPEN'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const financeData = await financeRes.json().catch(() => null);
      const riskData = await riskRes.json().catch(() => null) as RiskAlertsResponse | null;
      const meData = await meRes.json().catch(() => null) as CurrentAdmin | null;
      setPermissions(meRes.ok && Array.isArray(meData?.permissions) ? meData.permissions : []);
      if (financeRes.ok) setSummary(financeData); else setFinanceError(financeData?.message ?? t.financeUnavailable);
      if (riskRes.ok && riskData) {
        setRiskItems(riskData.items ?? []);
        setRiskSummary({ openCount: Number(riskData.summary?.openCount ?? 0), criticalCount: Number(riskData.summary?.criticalCount ?? 0) });
      } else {
        setRiskError((riskData as { message?: string } | null)?.message ?? t.riskUnavailable);
      }
      if (financeRes.ok || riskRes.ok) setLastLoadedAt(new Date().toISOString());
    } catch {
      setFinanceError(t.financeUnavailable);
      setRiskError(t.riskUnavailable);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }

  const pendingTotal = summary ? summary.totals.pendingTopUps + summary.totals.pendingWithdrawals : 0;
  const hasPermission = (codes: string[]) => Boolean(permissions?.includes('*') || codes.some((code) => permissions?.includes(code)));
  const canViewFinance = hasPermission(['reports.view', 'wallet.view', 'topups.view', 'deposit.view', 'withdraw.view']);
  const canViewRisk = hasPermission(['risk.view']);
  const canViewTopUps = hasPermission(['topups.view', 'deposit.view']);
  const canViewWithdrawals = hasPermission(['withdraw.view']);
  const canViewWallet = hasPermission(['wallet.view']);

  const queueMetrics = useMemo(() => {
    const items = [...(summary?.queues.topUps ?? []), ...(summary?.queues.withdrawals ?? [])];
    const now = Date.now();
    const ages = items.map((item) => Math.max(0, Math.floor((now - new Date(item.createdAt).getTime()) / 60000))).filter(Number.isFinite);
    const oldestMinutes = ages.length > 0 ? Math.max(...ages) : 0;
    const overdueCount = ages.filter((minutes) => minutes >= QUEUE_TARGET_MINUTES).length;
    const criticalCount = ages.filter((minutes) => minutes >= QUEUE_CRITICAL_MINUTES).length;
    return { loadedCount: items.length, oldestMinutes, overdueCount, criticalCount };
  }, [summary]);

  const financialKpis = useMemo(() => {
    const total = Number(summary?.totals.totalBalance ?? 0);
    const available = Number(summary?.totals.totalAvailableBalance ?? 0);
    const locked = Number(summary?.totals.totalLockedBalance ?? 0);
    const variance = total - available - locked;
    return {
      total,
      available,
      locked,
      variance: Math.abs(variance) < 0.005 ? 0 : variance,
      deposits: Number(summary?.today?.topUpAmount ?? 0),
      withdrawals: Number(summary?.today?.withdrawalAmount ?? 0),
      netFlow: Number(summary?.today?.netFlow ?? 0),
    };
  }, [summary]);

  const riskMetrics = useMemo(() => {
    const counts = RISK_SEVERITIES.reduce<Record<RiskAlert['severity'], number>>((result, severity) => {
      result[severity] = riskItems.filter((item) => item.severity === severity).length;
      return result;
    }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
    const loadedTotal = RISK_SEVERITIES.reduce((sum, severity) => sum + counts[severity], 0);
    const weightedScore = counts.CRITICAL * 4 + counts.HIGH * 3 + counts.MEDIUM * 2 + counts.LOW;
    const maxScore = Math.max(loadedTotal * 4, 1);
    const pressurePercent = Math.round((weightedScore / maxScore) * 100);
    return { counts, loadedTotal, pressurePercent };
  }, [riskItems]);

  const operationalState = useMemo<OperationalState>(() => {
    if (financeError && riskError) return { tone: 'danger', label: t.bothUnavailable, message: t.bothUnavailable };
    if (riskSummary.criticalCount > 0 || queueMetrics.criticalCount > 0) return { tone: 'danger', label: t.actionNeeded, message: `${riskSummary.criticalCount + queueMetrics.criticalCount} ${t.items}` };
    if (pendingTotal >= 20 || queueMetrics.overdueCount > 0) return { tone: 'warning', label: t.queuePressure, message: `${pendingTotal + queueMetrics.overdueCount} ${t.items}` };
    if (financeError || riskError) return { tone: 'warning', label: t.dataIncomplete, message: t.dataIncomplete };
    return { tone: 'success', label: t.clear, message: t.controlled };
  }, [financeError, pendingTotal, queueMetrics.criticalCount, queueMetrics.overdueCount, riskError, riskSummary.criticalCount, t]);

  return (
    <div className="admin-dashboard">
      <AdminPage eyebrow={t.eyebrow} title={t.title} description={t.description} actions={<AdminButton onClick={loadSummary} disabled={loading}>{loading ? t.loading : t.refresh}</AdminButton>}>
        <section className="admin-command-status" data-tone={operationalState.tone}>
          <div className="admin-command-status__signal"><i /><span>{t.liveStatus}</span></div>
          <div className="admin-command-status__copy"><strong>{operationalState.label}</strong><p>{operationalState.message}</p></div>
          <div className="admin-command-status__meta"><span>{t.pending}</span><strong>{pendingTotal.toLocaleString(dateLocale)}</strong><small>{lastLoadedAt ? `${t.updated} ${new Date(lastLoadedAt).toLocaleTimeString(dateLocale)}` : t.syncing}</small></div>
        </section>

        {lastLoadedAt && <AdminNotice tone="neutral">{t.latestData}: {new Date(lastLoadedAt).toLocaleString(dateLocale)} · {t.partialData}</AdminNotice>}
        {financeError && !loading && <RetryNotice message={financeError} onRetry={loadSummary} label={t.retry} />}
        {riskError && !loading && <RetryNotice message={riskError} onRetry={loadSummary} label={t.retry} />}

        {(loading || permissions === null) && !summary && <div className="admin-dashboard__loading"><AdminSkeleton lines={4} /><AdminSkeleton lines={4} /><AdminSkeleton lines={3} /></div>}

        <section className="admin-command-priority" aria-label={t.priority}>
          {canViewRisk && <PriorityLane label={t.criticalRisk} value={riskSummary.criticalCount} href="/risk-alerts" tone="danger" helper={t.reviewFirst} locale={locale} />}
          {canViewWithdrawals && <PriorityLane label={t.withdrawalQueue} value={summary?.totals.pendingWithdrawals ?? 0} href="/withdrawals" tone="warning" helper={t.paymentReview} locale={locale} />}
          {canViewTopUps && <PriorityLane label={t.depositQueue} value={summary?.totals.pendingTopUps ?? 0} href="/topups" tone="neutral" helper={t.evidenceReview} locale={locale} />}
        </section>

        {summary && canViewFinance && <section className="admin-kpi-groups" aria-label={t.financeKpi}>
          <AdminCard title={t.financeKpi} description={t.financeKpiDescription}>
            <AdminMetricGrid>
              <AdminMetric title={t.depositsToday} value={formatMoney(String(financialKpis.deposits))} helper={`${summary.today?.topUpCount ?? 0} ${t.items}`} />
              <AdminMetric title={t.withdrawalsToday} value={formatMoney(String(financialKpis.withdrawals))} helper={`${summary.today?.withdrawalCount ?? 0} ${t.items}`} />
              <AdminMetric title={t.netFlow} value={formatMoney(String(financialKpis.netFlow))} helper={t.depositsLessWithdrawals} tone={financialKpis.netFlow < 0 ? 'warning' : 'success'} />
              <AdminMetric title={t.totalWallet} value={formatMoney(String(financialKpis.total)).replace(' ', '\u00a0')} helper={`${summary.totals.walletCount.toLocaleString(dateLocale)} ${t.wallets}`} />
              <AdminMetric title={t.walletVariance} value={formatMoney(String(financialKpis.variance))} helper={t.varianceFormula} tone={financialKpis.variance === 0 ? 'success' : 'danger'} />
            </AdminMetricGrid>
          </AdminCard>

          <AdminCard title={t.operationsKpi} description={`${formatDuration(QUEUE_TARGET_MINUTES, locale)} / ${formatDuration(QUEUE_CRITICAL_MINUTES, locale)}`}>
            <AdminMetricGrid>
              <AdminMetric title={t.pending} value={String(pendingTotal)} helper={`${summary.totals.pendingTopUps} ${t.deposit} · ${summary.totals.pendingWithdrawals} ${t.withdrawal}`} tone={pendingTotal > 0 ? 'warning' : 'success'} />
              <AdminMetric title={t.overdue} value={queueMetrics.overdueCount.toLocaleString(dateLocale)} helper={`${queueMetrics.loadedCount} ${t.loaded}`} tone={queueMetrics.overdueCount > 0 ? 'warning' : 'success'} />
              <AdminMetric title={t.criticalQueue} value={queueMetrics.criticalCount.toLocaleString(dateLocale)} helper={formatDuration(QUEUE_CRITICAL_MINUTES, locale)} tone={queueMetrics.criticalCount > 0 ? 'danger' : 'success'} />
              <AdminMetric title={t.oldestQueue} value={formatDuration(queueMetrics.oldestMinutes, locale)} helper={formatSlaCountdown(queueMetrics.oldestMinutes, locale)} tone={queueMetrics.oldestMinutes >= QUEUE_CRITICAL_MINUTES ? 'danger' : queueMetrics.oldestMinutes >= QUEUE_TARGET_MINUTES ? 'warning' : 'success'} />
              {canViewRisk && <AdminMetric title={t.riskAlerts} value={`${riskSummary.openCount}`} helper={`${riskSummary.criticalCount} ${t.criticalRisk}`} tone={riskSummary.criticalCount > 0 ? 'danger' : riskSummary.openCount > 0 ? 'warning' : 'success'} />}
            </AdminMetricGrid>
          </AdminCard>
        </section>}

        {canViewRisk && !riskError && <AdminCard title={t.riskPressure} description={`${riskSummary.openCount} ${t.open} · ${riskMetrics.loadedTotal} ${t.loaded}`} action={<AdminLinkButton href="/risk-alerts">{t.openRiskCenter}</AdminLinkButton>}>
          <RiskSeverityChart metrics={riskMetrics} locale={locale} copy={t} />
        </AdminCard>}

        {summary?.today && canViewFinance && <AdminCard title={t.financeComparison} description={t.financeComparisonDescription}>
          <FinanceComparisonChart today={summary.today} locale={locale} copy={t} />
        </AdminCard>}

        <div className="admin-dashboard__quick">
          {canViewTopUps && <QuickCard title={t.reviewTopups} href="/topups" count={summary?.totals.pendingTopUps ?? 0} tone="warning" locale={locale} copy={t} />}
          {canViewWithdrawals && <QuickCard title={t.reviewWithdrawals} href="/withdrawals" count={summary?.totals.pendingWithdrawals ?? 0} tone="danger" locale={locale} copy={t} />}
          {canViewRisk && <QuickCard title={t.risk} href="/risk-alerts" count={riskSummary.openCount} tone="danger" locale={locale} copy={t} />}
          {canViewFinance && <QuickCard title={t.financeOverview} href="/finance" count={summary?.totals.walletCount ?? 0} tone="neutral" locale={locale} copy={t} />}
          {!loading && permissions !== null && !canViewFinance && !canViewRisk && <AdminEmpty>{t.noDashboardPermission}</AdminEmpty>}
        </div>

        {summary && <AdminGrid>{canViewTopUps && <QueueCard title={t.depositQueueTitle} href="/topups" count={summary.totals.pendingTopUps} items={summary.queues.topUps} locale={locale} copy={t} />}{canViewWithdrawals && <QueueCard title={t.withdrawalQueueTitle} href="/withdrawals" count={summary.totals.pendingWithdrawals} items={summary.queues.withdrawals} locale={locale} copy={t} />}</AdminGrid>}

        <div className="admin-dashboard__sections">
          {canViewRisk && <AdminCard title={t.riskAlerts} description={`${riskSummary.openCount} ${t.open} · ${riskSummary.criticalCount} ${t.criticalRisk}`} action={<AdminLinkButton href="/risk-alerts">{t.openRiskQueue}</AdminLinkButton>}>
            <AdminStack>{riskItems.slice(0, 8).map((item) => <AdminRow key={item.id}><div><div className="admin-dashboard__badge-row"><AdminBadge tone={riskTone(item.severity)}>{severityLabel(item.severity, locale)}</AdminBadge><AdminBadge>{item.type}</AdminBadge></div><strong>{item.title}</strong><p>{new Date(item.createdAt).toLocaleString(dateLocale)}</p></div><div className="admin-dashboard__actions">{item.memberId && <AdminLinkButton href={`/members/${item.memberId}`}>{t.member}</AdminLinkButton>}<AdminLinkButton href={`/risk-alerts/${item.id}`}>{t.details}</AdminLinkButton></div></AdminRow>)}{riskItems.length === 0 && <AdminEmpty>{t.noImportantAlerts}</AdminEmpty>}</AdminStack>
          </AdminCard>}

          {summary && canViewFinance && <AdminCard title={t.recentLedger} description={`${t.updated} ${new Date(summary.generatedAt).toLocaleString(dateLocale)}`} action={canViewWallet ? <AdminLinkButton href="/wallet-ledgers">{t.viewAll}</AdminLinkButton> : undefined}><AdminStack>{summary.recentLedgers.slice(0, 5).map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.user?.username ?? item.user?.shortId ?? '-'}</p></div><div className="admin-dashboard__money"><strong>{formatMoney(item.amount)}</strong><p>{new Date(item.createdAt).toLocaleString(dateLocale)}</p></div></AdminRow>)}</AdminStack></AdminCard>}
        </div>
      </AdminPage>
    </div>
  );
}

function RetryNotice({ message, onRetry, label }: { message: string; onRetry: () => void; label: string }) {
  return <AdminNotice tone="danger"><span>{message}</span><AdminButton tone="secondary" onClick={onRetry}>{label}</AdminButton></AdminNotice>;
}

function PriorityLane({ label, value, href, tone, helper, locale }: { label: string; value: number; href: string; tone: 'neutral' | 'warning' | 'danger'; helper: string; locale: AdminLocale }) {
  return <a className="admin-priority-lane" data-tone={tone} href={href}><span><strong>{label}</strong><small>{helper}</small></span><b>{value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</b></a>;
}

function FinanceComparisonChart({ today, locale, copy }: { today: NonNullable<FinanceSummary['today']>; locale: AdminLocale; copy: DashboardCopy }) {
  const depositAmount = Math.max(Number(today.topUpAmount), 0);
  const withdrawalAmount = Math.max(Number(today.withdrawalAmount), 0);
  const amountMax = Math.max(depositAmount, withdrawalAmount, 1);
  const countMax = Math.max(today.topUpCount, today.withdrawalCount, 1);
  const netFlow = Number(today.netFlow);
  return <div className="admin-finance-chart">
    <div className="admin-finance-chart__plot" aria-label={`${copy.deposit} ${formatMoney(today.topUpAmount)} ${copy.withdrawal} ${formatMoney(today.withdrawalAmount)}`}>
      <ChartColumn label={copy.deposit} amount={depositAmount} count={today.topUpCount} amountPercent={(depositAmount / amountMax) * 100} countPercent={(today.topUpCount / countMax) * 100} kind="deposit" locale={locale} copy={copy} />
      <ChartColumn label={copy.withdrawal} amount={withdrawalAmount} count={today.withdrawalCount} amountPercent={(withdrawalAmount / amountMax) * 100} countPercent={(today.withdrawalCount / countMax) * 100} kind="withdrawal" locale={locale} copy={copy} />
    </div>
    <div className="admin-finance-chart__net" data-tone={netFlow < 0 ? 'negative' : 'positive'}><span>{copy.netFlow}</span><strong>{formatMoney(today.netFlow)}</strong><small>{netFlow < 0 ? copy.outflow : copy.inflow}</small></div>
  </div>;
}

function ChartColumn({ label, amount, count, amountPercent, countPercent, kind, locale, copy }: { label: string; amount: number; count: number; amountPercent: number; countPercent: number; kind: 'deposit' | 'withdrawal'; locale: AdminLocale; copy: DashboardCopy }) {
  return <div className="admin-finance-chart__column" data-kind={kind}>
    <div className="admin-finance-chart__bars">
      <div className="admin-finance-chart__bar"><span style={{ height: `${Math.max(amountPercent, amount > 0 ? 4 : 0)}%` }} /><small>{copy.amount}</small></div>
      <div className="admin-finance-chart__bar admin-finance-chart__bar--count"><span style={{ height: `${Math.max(countPercent, count > 0 ? 4 : 0)}%` }} /><small>{copy.count}</small></div>
    </div>
    <strong>{label}</strong><span>{formatMoney(String(amount))}</span><small>{count.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')} {copy.items}</small>
  </div>;
}

function RiskSeverityChart({ metrics, locale, copy }: { metrics: { counts: Record<RiskAlert['severity'], number>; loadedTotal: number; pressurePercent: number }; locale: AdminLocale; copy: DashboardCopy }) {
  const maxCount = Math.max(...RISK_SEVERITIES.map((severity) => metrics.counts[severity]), 1);
  if (metrics.loadedTotal === 0) return <AdminEmpty>{copy.noRiskAlerts}</AdminEmpty>;
  return <div className="admin-risk-chart">
    <div className="admin-risk-chart__pressure" data-tone={metrics.pressurePercent >= 60 ? 'danger' : metrics.pressurePercent >= 30 ? 'warning' : 'normal'}>
      <span>{copy.riskPressure}</span><strong>{metrics.pressurePercent}%</strong><small>{copy.riskWeight}</small>
    </div>
    <div className="admin-risk-chart__plot" aria-label={copy.riskAlerts}>
      {RISK_SEVERITIES.map((severity) => {
        const count = metrics.counts[severity];
        const percent = (count / maxCount) * 100;
        return <div className="admin-risk-chart__row" data-severity={severity.toLowerCase()} key={severity}>
          <span>{severityLabel(severity, locale)}</span>
          <div><i style={{ width: `${Math.max(percent, count > 0 ? 3 : 0)}%` }} /></div>
          <strong>{count.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</strong>
        </div>;
      })}
    </div>
  </div>;
}

function QuickCard({ title, href, count, tone, locale, copy }: { title: string; href: string; count: number; tone: 'neutral' | 'warning' | 'danger'; locale: AdminLocale; copy: DashboardCopy }) {
  return <AdminCard><div className="admin-dashboard__quick-card"><AdminBadge tone={tone}>{count > 0 ? copy.actionNeeded : copy.clear}</AdminBadge><h2>{title}</h2><strong className="admin-dashboard__quick-value">{count.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</strong><AdminLinkButton href={href}>{copy.details}</AdminLinkButton></div></AdminCard>;
}

function QueueCard({ title, href, count, items, locale, copy }: { title: string; href: string; count: number; items: QueueItem[]; locale: AdminLocale; copy: DashboardCopy }) {
  return <AdminCard title={title} description={`${count.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')} ${copy.items}`} action={<AdminLinkButton href={href}>{copy.reviewQueue}</AdminLinkButton>}><AdminStack>{items.slice(0, 5).map((item) => <AdminRow key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</p></div><strong>{formatMoney(item.amount)}</strong></AdminRow>)}{items.length === 0 && <AdminEmpty>{copy.noQueueItems}</AdminEmpty>}</AdminStack></AdminCard>;
}

function formatSlaCountdown(minutes: number, locale: AdminLocale) {
  if (minutes <= 0) return locale === 'th' ? 'ไม่มีคิวค้าง' : 'No pending queue';
  if (minutes < QUEUE_TARGET_MINUTES) {
    const remaining = QUEUE_TARGET_MINUTES - minutes;
    return locale === 'th' ? `เหลือ ${formatDuration(remaining, locale)} ก่อน SLA` : `${formatDuration(remaining, locale)} until SLA`;
  }
  const overdue = minutes - QUEUE_TARGET_MINUTES;
  return locale === 'th' ? `เกิน SLA ${formatDuration(overdue, locale)}` : `${formatDuration(overdue, locale)} over SLA`;
}

function formatDuration(minutes: number, locale: AdminLocale) {
  if (minutes < 60) return locale === 'th' ? `${minutes} นาที` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return locale === 'th' ? (remainder > 0 ? `${hours} ชม. ${remainder} นาที` : `${hours} ชม.`) : (remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`);
}

function severityLabel(severity: RiskAlert['severity'], locale: AdminLocale) { if (locale === 'en') return severity; return ({ CRITICAL: 'วิกฤต', HIGH: 'สูง', MEDIUM: 'กลาง', LOW: 'ต่ำ' } as const)[severity]; }

function riskTone(severity: RiskAlert['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}
