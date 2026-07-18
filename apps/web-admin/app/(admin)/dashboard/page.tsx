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

  const operationalState = useMemo<OperationalState>(() => {
    if (financeError && riskError) return { tone: 'danger', label: 'DEGRADED', message: 'ข้อมูลการเงินและความเสี่ยงไม่พร้อมใช้งานพร้อมกัน' };
    if (riskSummary.criticalCount > 0) return { tone: 'danger', label: 'ACTION REQUIRED', message: `มี Risk Alert วิกฤต ${riskSummary.criticalCount} รายการที่ต้องตรวจทันที` };
    if (pendingTotal >= 20) return { tone: 'warning', label: 'QUEUE PRESSURE', message: `มีงานค้าง ${pendingTotal} รายการ ควรจัดลำดับเจ้าหน้าที่ดำเนินการ` };
    if (financeError || riskError) return { tone: 'warning', label: 'PARTIAL DATA', message: 'ข้อมูลบางส่วนยังไม่พร้อม ระบบคงข้อมูลที่โหลดสำเร็จไว้' };
    return { tone: 'success', label: 'OPERATIONAL', message: 'คิวหลักและข้อมูลความเสี่ยงอยู่ในระดับควบคุมได้' };
  }, [financeError, pendingTotal, riskError, riskSummary.criticalCount]);

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

        {summary && canViewFinance && <div className="admin-dashboard__metrics"><AdminMetricGrid>
          <AdminMetric title="Pending queues" value={String(pendingTotal)} helper={`${summary.totals.pendingTopUps} ฝาก · ${summary.totals.pendingWithdrawals} ถอน`} tone={pendingTotal > 0 ? 'warning' : 'success'} />
          <AdminMetric title="Available" value={formatMoney(summary.totals.totalAvailableBalance)} helper="ยอดที่สมาชิกใช้ได้รวม" />
          <AdminMetric title="Locked" value={formatMoney(summary.totals.totalLockedBalance)} helper="ยอดถูกล็อกระหว่างรอดำเนินการ" tone={Number(summary.totals.totalLockedBalance) > 0 ? 'warning' : 'neutral'} />
          <AdminMetric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} helper="จำนวนบัญชีทั้งหมด" />
          {canViewRisk && <AdminMetric title="Risk Alerts" value={`${riskSummary.openCount}`} helper={`${riskSummary.criticalCount} ระดับสูง/วิกฤต`} tone={riskSummary.criticalCount > 0 ? 'danger' : riskSummary.openCount > 0 ? 'warning' : 'success'} />}
        </AdminMetricGrid></div>}

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

function QuickCard({ title, href, count, tone }: { title: string; href: string; count: number; tone: 'neutral' | 'warning' | 'danger' }) {
  return <AdminCard><div className="admin-dashboard__quick-card"><AdminBadge tone={tone}>{count > 0 ? 'ต้องดำเนินการ' : 'เรียบร้อย'}</AdminBadge><h2>{title}</h2><strong className="admin-dashboard__quick-value">{count.toLocaleString('th-TH')}</strong><AdminLinkButton href={href}>เปิดดู</AdminLinkButton></div></AdminCard>;
}

function QueueCard({ title, href, count, items }: { title: string; href: string; count: number; items: QueueItem[] }) {
  return <AdminCard title={title} description={`${count} รายการรอตรวจ`} action={<AdminLinkButton href={href}>เปิดคิว</AdminLinkButton>}><AdminStack>{items.slice(0, 5).map((item) => <AdminRow key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong>{formatMoney(item.amount)}</strong></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีรายการรอตรวจ</AdminEmpty>}</AdminStack></AdminCard>;
}

function riskTone(severity: RiskAlert['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}
