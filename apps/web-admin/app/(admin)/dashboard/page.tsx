'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSkeleton, AdminStack, formatMoney } from '../_components/admin-ui';

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

export default function OperationDashboardPage() {
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
      if (financeRes.ok) setSummary(financeData); else setFinanceError(financeData?.message ?? 'โหลดสรุปการเงินไม่สำเร็จ');
      if (riskRes.ok && riskData) {
        setRiskItems(riskData.items ?? []);
        setRiskSummary({ openCount: Number(riskData.summary?.openCount ?? 0), criticalCount: Number(riskData.summary?.criticalCount ?? 0) });
      } else {
        setRiskError((riskData as { message?: string } | null)?.message ?? 'โหลดรายการความเสี่ยงไม่สำเร็จ');
      }
      if (financeRes.ok || riskRes.ok) setLastLoadedAt(new Date().toISOString());
    } catch {
      setFinanceError('เชื่อมต่อ Operation Center ไม่สำเร็จ กรุณาลองใหม่');
      setRiskError('เชื่อมต่อคิวความเสี่ยงไม่สำเร็จ กรุณาลองใหม่');
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
  const canViewReports = hasPermission(['reports.view']);
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
    if (financeError && riskError) return { tone: 'danger', label: 'DEGRADED', message: 'ข้อมูลการเงินและความเสี่ยงไม่พร้อมใช้งานพร้อมกัน' };
    if (riskSummary.criticalCount > 0 || queueMetrics.criticalCount > 0) return { tone: 'danger', label: 'ACTION REQUIRED', message: `มีงานวิกฤต ${riskSummary.criticalCount + queueMetrics.criticalCount} รายการที่ต้องตรวจทันที` };
    if (pendingTotal >= 20 || queueMetrics.overdueCount > 0) return { tone: 'warning', label: 'QUEUE PRESSURE', message: `มีงานค้าง ${pendingTotal} รายการ และเกินเป้าหมาย ${queueMetrics.overdueCount} รายการ` };
    if (financeError || riskError) return { tone: 'warning', label: 'PARTIAL DATA', message: 'ข้อมูลบางส่วนยังไม่พร้อม ระบบคงข้อมูลที่โหลดสำเร็จไว้' };
    return { tone: 'success', label: 'OPERATIONAL', message: 'คิวหลักและข้อมูลความเสี่ยงอยู่ในระดับควบคุมได้' };
  }, [financeError, pendingTotal, queueMetrics.criticalCount, queueMetrics.overdueCount, riskError, riskSummary.criticalCount]);

  const financeFlow = useMemo(() => {
    const deposits = Math.max(Number(summary?.today?.topUpAmount ?? 0), 0);
    const withdrawals = Math.max(Number(summary?.today?.withdrawalAmount ?? 0), 0);
    const total = deposits + withdrawals;
    return {
      deposits,
      withdrawals,
      depositPercent: total > 0 ? Math.round((deposits / total) * 100) : 0,
      withdrawalPercent: total > 0 ? Math.round((withdrawals / total) * 100) : 0,
    };
  }, [summary]);

  return (
    <div className="admin-dashboard">
      <AdminPage eyebrow="Operations Command Center" title="Dashboard" description="มองเห็นภาระงาน การเงิน และความเสี่ยงจากจุดเดียว" actions={<AdminButton onClick={loadSummary} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</AdminButton>}>
        <section className="admin-command-status" data-tone={operationalState.tone}>
          <div className="admin-command-status__signal"><i /><span>LIVE OPERATION STATUS</span></div>
          <div className="admin-command-status__copy"><strong>{operationalState.label}</strong><p>{operationalState.message}</p></div>
          <div className="admin-command-status__meta"><span>งานค้าง</span><strong>{pendingTotal.toLocaleString('th-TH')}</strong><small>{lastLoadedAt ? `อัปเดต ${new Date(lastLoadedAt).toLocaleTimeString('th-TH')}` : 'กำลังซิงก์ข้อมูล'}</small></div>
        </section>

        {lastLoadedAt && <AdminNotice tone="neutral">ข้อมูลล่าสุดเมื่อ {new Date(lastLoadedAt).toLocaleString('th-TH')} · แต่ละส่วนแสดงข้อมูลล่าสุดที่โหลดสำเร็จแยกกัน</AdminNotice>}
        {financeError && !loading && <RetryNotice message={financeError} onRetry={loadSummary} />}
        {riskError && !loading && <RetryNotice message={riskError} onRetry={loadSummary} />}

        {(loading || permissions === null) && !summary && <div className="admin-dashboard__loading"><AdminSkeleton lines={4} /><AdminSkeleton lines={4} /><AdminSkeleton lines={3} /></div>}

        {summary && canViewFinance && <section className="admin-kpi-groups" aria-label="ตัวชี้วัดการเงินและการดำเนินงาน">
          <AdminCard title="Finance KPI" description="ยอดรวม กระแสเงินวันนี้ และความสอดคล้องของ Wallet">
            <AdminMetricGrid>
              <AdminMetric title="ยอดฝากวันนี้" value={formatMoney(String(financialKpis.deposits))} helper={`${summary.today?.topUpCount ?? 0} รายการ`} />
              <AdminMetric title="ยอดถอนวันนี้" value={formatMoney(String(financialKpis.withdrawals))} helper={`${summary.today?.withdrawalCount ?? 0} รายการ`} />
              <AdminMetric title="Net flow" value={formatMoney(String(financialKpis.netFlow))} helper="ฝากลบถอน" tone={financialKpis.netFlow < 0 ? 'warning' : 'success'} />
              <AdminMetric title="ยอด Wallet รวม" value={formatMoney(String(financialKpis.total))} helper={`${summary.totals.walletCount.toLocaleString('th-TH')} Wallet`} />
              <AdminMetric title="Wallet variance" value={formatMoney(String(financialKpis.variance))} helper="ยอดรวม - ยอดใช้ได้ - ยอดล็อก" tone={financialKpis.variance === 0 ? 'success' : 'danger'} />
            </AdminMetricGrid>
          </AdminCard>

          <AdminCard title="Operations KPI" description={`เป้าหมายคิวภายใน ${QUEUE_TARGET_MINUTES} นาที · วิกฤตเมื่อเกิน ${QUEUE_CRITICAL_MINUTES} นาที`}>
            <AdminMetricGrid>
              <AdminMetric title="Pending queues" value={String(pendingTotal)} helper={`${summary.totals.pendingTopUps} ฝาก · ${summary.totals.pendingWithdrawals} ถอน`} tone={pendingTotal > 0 ? 'warning' : 'success'} />
              <AdminMetric title="เกินเป้าหมาย" value={queueMetrics.overdueCount.toLocaleString('th-TH')} helper={`จาก ${queueMetrics.loadedCount} รายการที่โหลด`} tone={queueMetrics.overdueCount > 0 ? 'warning' : 'success'} />
              <AdminMetric title="คิววิกฤต" value={queueMetrics.criticalCount.toLocaleString('th-TH')} helper={`เกิน ${QUEUE_CRITICAL_MINUTES} นาที`} tone={queueMetrics.criticalCount > 0 ? 'danger' : 'success'} />
              <AdminMetric title="คิวเก่าสุด" value={formatDuration(queueMetrics.oldestMinutes)} helper="อายุรายการที่เก่าสุดในชุดข้อมูล" tone={queueMetrics.oldestMinutes >= QUEUE_CRITICAL_MINUTES ? 'danger' : queueMetrics.oldestMinutes >= QUEUE_TARGET_MINUTES ? 'warning' : 'success'} />
              {canViewRisk && <AdminMetric title="Risk Alerts" value={`${riskSummary.openCount}`} helper={`${riskSummary.criticalCount} ระดับวิกฤต`} tone={riskSummary.criticalCount > 0 ? 'danger' : riskSummary.openCount > 0 ? 'warning' : 'success'} />}
            </AdminMetricGrid>
          </AdminCard>
        </section>}

        <section className="admin-command-priority" aria-label="ลำดับงานสำคัญ">
          {canViewRisk && <PriorityLane label="Critical risk" value={riskSummary.criticalCount} href="/risk-alerts" tone="danger" helper="ตรวจสอบก่อนงานปกติ" />}
          {canViewWithdrawals && <PriorityLane label="Withdrawal queue" value={summary?.totals.pendingWithdrawals ?? 0} href="/withdrawals" tone="warning" helper="รายการรออนุมัติหรือชำระ" />}
          {canViewTopUps && <PriorityLane label="Deposit queue" value={summary?.totals.pendingTopUps ?? 0} href="/topups" tone="neutral" helper="รายการรอตรวจสอบหลักฐาน" />}
        </section>

        {summary?.today && canViewFinance && <AdminCard title="Finance flow วันนี้" description={`วันที่ ${summary.today.date}`} action={canViewReports ? <AdminLinkButton href="/reports">ดูรายงานเต็ม</AdminLinkButton> : undefined}>
          <div className="admin-finance-flow">
            <div className="admin-finance-flow__summary">
              <div><span>ยอดฝาก</span><strong>{formatMoney(summary.today.topUpAmount)}</strong><small>{summary.today.topUpCount} รายการ</small></div>
              <div><span>ยอดถอน</span><strong>{formatMoney(summary.today.withdrawalAmount)}</strong><small>{summary.today.withdrawalCount} รายการ</small></div>
              <div><span>Net flow</span><strong>{formatMoney(summary.today.netFlow)}</strong><small>ฝากลบถอน</small></div>
            </div>
            <div className="admin-finance-flow__bar" aria-label={`ฝาก ${financeFlow.depositPercent}% ถอน ${financeFlow.withdrawalPercent}%`}>
              <span style={{ width: `${financeFlow.depositPercent}%` }} data-kind="deposit" />
              <span style={{ width: `${financeFlow.withdrawalPercent}%` }} data-kind="withdrawal" />
            </div>
            <div className="admin-finance-flow__legend"><span data-kind="deposit">ฝาก {financeFlow.depositPercent}%</span><span data-kind="withdrawal">ถอน {financeFlow.withdrawalPercent}%</span></div>
          </div>
        </AdminCard>}

        {summary?.today && canViewFinance && <AdminCard title="Finance comparison" description="เปรียบเทียบมูลค่า ปริมาณรายการ และ Net flow ของวันนี้">
          <FinanceComparisonChart today={summary.today} />
        </AdminCard>}

        {canViewRisk && !riskError && <AdminCard title="Risk pressure" description={`${riskSummary.openCount} alerts เปิดอยู่ · แสดง ${riskMetrics.loadedTotal} รายการที่โหลด`} action={<AdminLinkButton href="/risk-alerts">เปิด Risk Center</AdminLinkButton>}>
          <RiskSeverityChart metrics={riskMetrics} />
        </AdminCard>}

        <div className="admin-dashboard__quick">
          {canViewTopUps && <QuickCard title="ตรวจสอบรายการฝาก" href="/topups" count={summary?.totals.pendingTopUps ?? 0} tone="warning" />}
          {canViewWithdrawals && <QuickCard title="ตรวจสอบรายการถอน" href="/withdrawals" count={summary?.totals.pendingWithdrawals ?? 0} tone="danger" />}
          {canViewRisk && <QuickCard title="ความเสี่ยง" href="/risk-alerts" count={riskSummary.openCount} tone="danger" />}
          {canViewFinance && <QuickCard title="ภาพรวมการเงิน" href="/finance" count={summary?.totals.walletCount ?? 0} tone="neutral" />}
          {!loading && permissions !== null && !canViewFinance && !canViewRisk && <AdminEmpty>บัญชีนี้ไม่มีสิทธิ์ดู widget การเงินหรือความเสี่ยงบน Dashboard</AdminEmpty>}
        </div>

        <div className="admin-dashboard__sections">
          {canViewRisk && <AdminCard title="Risk Alerts" description={`${riskSummary.openCount} เปิดอยู่ · ${riskSummary.criticalCount} ระดับสูง/วิกฤต`} action={<AdminLinkButton href="/risk-alerts">เปิดคิวความเสี่ยง</AdminLinkButton>}>
            <AdminStack>{riskItems.slice(0, 8).map((item) => <AdminRow key={item.id}><div><div className="admin-dashboard__badge-row"><AdminBadge tone={riskTone(item.severity)}>{item.severity}</AdminBadge><AdminBadge>{item.type}</AdminBadge></div><strong>{item.title}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div className="admin-dashboard__actions">{item.memberId && <AdminLinkButton href={`/members/${item.memberId}`}>สมาชิก</AdminLinkButton>}<AdminLinkButton href={`/risk-alerts/${item.id}`}>รายละเอียด</AdminLinkButton></div></AdminRow>)}{riskItems.length === 0 && <AdminEmpty>ยังไม่พบ alert สำคัญ</AdminEmpty>}</AdminStack>
          </AdminCard>}

          {summary && canViewFinance && <AdminCard title="Recent Ledger" description={`อัปเดต ${new Date(summary.generatedAt).toLocaleString('th-TH')}`} action={canViewWallet ? <AdminLinkButton href="/wallet-ledgers">ดูทั้งหมด</AdminLinkButton> : undefined}><AdminStack>{summary.recentLedgers.map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.user?.username ?? item.user?.shortId ?? '-'}</p></div><div className="admin-dashboard__money"><strong>{formatMoney(item.amount)}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div></AdminRow>)}</AdminStack></AdminCard>}
        </div>

        {summary && <AdminGrid>{canViewTopUps && <QueueCard title="คิวฝาก" href="/topups" count={summary.totals.pendingTopUps} items={summary.queues.topUps} />}{canViewWithdrawals && <QueueCard title="คิวถอน" href="/withdrawals" count={summary.totals.pendingWithdrawals} items={summary.queues.withdrawals} />}</AdminGrid>}
      </AdminPage>
    </div>
  );
}

function RetryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <AdminNotice tone="danger"><span>{message}</span><AdminButton tone="secondary" onClick={onRetry}>ลองใหม่</AdminButton></AdminNotice>;
}

function PriorityLane({ label, value, href, tone, helper }: { label: string; value: number; href: string; tone: 'neutral' | 'warning' | 'danger'; helper: string }) {
  return <a className="admin-priority-lane" data-tone={tone} href={href}><span><strong>{label}</strong><small>{helper}</small></span><b>{value.toLocaleString('th-TH')}</b></a>;
}

function FinanceComparisonChart({ today }: { today: NonNullable<FinanceSummary['today']> }) {
  const depositAmount = Math.max(Number(today.topUpAmount), 0);
  const withdrawalAmount = Math.max(Number(today.withdrawalAmount), 0);
  const amountMax = Math.max(depositAmount, withdrawalAmount, 1);
  const countMax = Math.max(today.topUpCount, today.withdrawalCount, 1);
  const netFlow = Number(today.netFlow);
  return <div className="admin-finance-chart">
    <div className="admin-finance-chart__plot" aria-label={`ยอดฝาก ${formatMoney(today.topUpAmount)} ยอดถอน ${formatMoney(today.withdrawalAmount)}`}>
      <ChartColumn label="ฝาก" amount={depositAmount} count={today.topUpCount} amountPercent={(depositAmount / amountMax) * 100} countPercent={(today.topUpCount / countMax) * 100} kind="deposit" />
      <ChartColumn label="ถอน" amount={withdrawalAmount} count={today.withdrawalCount} amountPercent={(withdrawalAmount / amountMax) * 100} countPercent={(today.withdrawalCount / countMax) * 100} kind="withdrawal" />
    </div>
    <div className="admin-finance-chart__net" data-tone={netFlow < 0 ? 'negative' : 'positive'}><span>Net flow</span><strong>{formatMoney(today.netFlow)}</strong><small>{netFlow < 0 ? 'เงินไหลออกมากกว่าไหลเข้า' : 'เงินไหลเข้ามากกว่าหรือเท่ากับไหลออก'}</small></div>
  </div>;
}

function ChartColumn({ label, amount, count, amountPercent, countPercent, kind }: { label: string; amount: number; count: number; amountPercent: number; countPercent: number; kind: 'deposit' | 'withdrawal' }) {
  return <div className="admin-finance-chart__column" data-kind={kind}>
    <div className="admin-finance-chart__bars">
      <div className="admin-finance-chart__bar"><span style={{ height: `${Math.max(amountPercent, amount > 0 ? 4 : 0)}%` }} /><small>มูลค่า</small></div>
      <div className="admin-finance-chart__bar admin-finance-chart__bar--count"><span style={{ height: `${Math.max(countPercent, count > 0 ? 4 : 0)}%` }} /><small>จำนวน</small></div>
    </div>
    <strong>{label}</strong><span>{formatMoney(String(amount))}</span><small>{count.toLocaleString('th-TH')} รายการ</small>
  </div>;
}

function RiskSeverityChart({ metrics }: { metrics: { counts: Record<RiskAlert['severity'], number>; loadedTotal: number; pressurePercent: number } }) {
  const maxCount = Math.max(...RISK_SEVERITIES.map((severity) => metrics.counts[severity]), 1);
  if (metrics.loadedTotal === 0) return <AdminEmpty>ไม่มี Risk Alert ในชุดข้อมูลปัจจุบัน</AdminEmpty>;
  return <div className="admin-risk-chart">
    <div className="admin-risk-chart__pressure" data-tone={metrics.pressurePercent >= 60 ? 'danger' : metrics.pressurePercent >= 30 ? 'warning' : 'normal'}>
      <span>Risk pressure</span><strong>{metrics.pressurePercent}%</strong><small>ถ่วงน้ำหนักตามระดับความรุนแรงของรายการที่โหลด</small>
    </div>
    <div className="admin-risk-chart__plot" aria-label="จำนวน Risk Alert แยกตามระดับความรุนแรง">
      {RISK_SEVERITIES.map((severity) => {
        const count = metrics.counts[severity];
        const percent = (count / maxCount) * 100;
        return <div className="admin-risk-chart__row" data-severity={severity.toLowerCase()} key={severity}>
          <span>{severity}</span>
          <div><i style={{ width: `${Math.max(percent, count > 0 ? 3 : 0)}%` }} /></div>
          <strong>{count.toLocaleString('th-TH')}</strong>
        </div>;
      })}
    </div>
  </div>;
}

function QuickCard({ title, href, count, tone }: { title: string; href: string; count: number; tone: 'neutral' | 'warning' | 'danger' }) {
  return <AdminCard><div className="admin-dashboard__quick-card"><AdminBadge tone={tone}>{count > 0 ? 'ต้องดำเนินการ' : 'เรียบร้อย'}</AdminBadge><h2>{title}</h2><strong className="admin-dashboard__quick-value">{count.toLocaleString('th-TH')}</strong><AdminLinkButton href={href}>เปิดดู</AdminLinkButton></div></AdminCard>;
}

function QueueCard({ title, href, count, items }: { title: string; href: string; count: number; items: QueueItem[] }) {
  return <AdminCard title={title} description={`${count} รายการรอตรวจ`} action={<AdminLinkButton href={href}>เปิดคิว</AdminLinkButton>}><AdminStack>{items.slice(0, 5).map((item) => <AdminRow key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong>{formatMoney(item.amount)}</strong></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีรายการรอตรวจ</AdminEmpty>}</AdminStack></AdminCard>;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} ชม. ${remainder} นาที` : `${hours} ชม.`;
}

function riskTone(severity: RiskAlert['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}
