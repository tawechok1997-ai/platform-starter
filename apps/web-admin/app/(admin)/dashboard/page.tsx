'use client';

import { useEffect, useState } from 'react';
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

export default function OperationDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [riskItems, setRiskItems] = useState<RiskAlert[]>([]);
  const [riskSummary, setRiskSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [financeError, setFinanceError] = useState('');
  const [riskError, setRiskError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    setLoading(true);
    setFinanceError('');
    setRiskError('');
    try {
      const [financeRes, riskRes, meRes] = await Promise.all([adminApiFetch('/admin/finance/summary'), adminApiFetch('/admin/risk-alerts?status=OPEN'), adminApiFetch('/admin/auth/me')]);
      const financeData = await financeRes.json().catch(() => null);
      const riskData = await riskRes.json().catch(() => null) as RiskAlertsResponse | null;
      const meData = await meRes.json().catch(() => null) as CurrentAdmin | null;
      if (Array.isArray(meData?.permissions)) setPermissions(meData.permissions);
      if (financeRes.ok) {
        setSummary(financeData);
      } else {
        setFinanceError(financeData?.message ?? 'โหลดสรุปการเงินไม่สำเร็จ');
      }
      if (riskRes.ok && riskData) {
        setRiskItems(riskData.items ?? []);
        setRiskSummary({ openCount: Number(riskData.summary?.openCount ?? 0), criticalCount: Number(riskData.summary?.criticalCount ?? 0) });
      } else {
        setRiskError('โหลดรายการความเสี่ยงไม่สำเร็จ');
      }
      setLastLoadedAt(new Date().toISOString());
    } catch {
      setFinanceError('เชื่อมต่อ Operation Center ไม่สำเร็จ กรุณาลองใหม่');
      setRiskError('เชื่อมต่อคิวความเสี่ยงไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const pendingTotal = summary ? summary.totals.pendingTopUps + summary.totals.pendingWithdrawals : 0;
  const hasPermission = (codes: string[]) => permissions.includes('*') || codes.some((code) => permissions.includes(code));
  const canViewFinance = permissions.length === 0 || hasPermission(['reports.view', 'wallet.view', 'topups.view', 'deposit.view', 'withdraw.view']);
  const canViewRisk = permissions.length === 0 || hasPermission(['risk.view']);
  const canViewTopUps = permissions.length === 0 || hasPermission(['topups.view', 'deposit.view']);
  const canViewWithdrawals = permissions.length === 0 || hasPermission(['withdraw.view']);
  const canViewReports = permissions.length === 0 || hasPermission(['reports.view']);
  const canViewWallet = permissions.length === 0 || hasPermission(['wallet.view']);

  return (
    <div className="admin-dashboard">
      <AdminPage eyebrow="Operation Center" title="Dashboard" description="ศูนย์รวมคิวการเงิน ความเสี่ยง และรายการล่าสุด" actions={<AdminButton onClick={loadSummary} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</AdminButton>}>
        {lastLoadedAt && <AdminNotice>ข้อมูลล่าสุดเมื่อ {new Date(lastLoadedAt).toLocaleString('th-TH')} — หาก API บางส่วนล้มเหลว ระบบจะแสดงข้อมูลล่าสุดที่ยังมีอยู่</AdminNotice>}
        {financeError && !loading && <RetryNotice message={financeError} onRetry={loadSummary} />}
        {riskError && !loading && <RetryNotice message={riskError} onRetry={loadSummary} />}

        {loading && !summary && <div className="admin-dashboard__loading"><AdminSkeleton lines={4} /><AdminSkeleton lines={4} /><AdminSkeleton lines={3} /></div>}

        {summary && canViewFinance && <div className="admin-dashboard__metrics"><AdminMetricGrid>
          <AdminMetric title="Pending queues" value={String(pendingTotal)} helper={`${summary.totals.pendingTopUps} ฝาก · ${summary.totals.pendingWithdrawals} ถอน`} />
          <AdminMetric title="Available" value={formatMoney(summary.totals.totalAvailableBalance)} helper="ยอดที่สมาชิกใช้ได้รวม" />
          <AdminMetric title="Locked" value={formatMoney(summary.totals.totalLockedBalance)} helper="ยอดถูกล็อกระหว่างรอดำเนินการ" />
          <AdminMetric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} helper="จำนวนบัญชีทั้งหมด" />
          {canViewRisk && <AdminMetric title="Risk Alerts" value={`${riskSummary.openCount}`} helper={`${riskSummary.criticalCount} ระดับสูง/วิกฤต`} />}
        </AdminMetricGrid></div>}

        <div className="admin-dashboard__quick">
          {canViewTopUps && <QuickCard title="ตรวจสอบรายการฝาก" href="/topups" count={summary?.totals.pendingTopUps ?? 0} tone="warning" />}
          {canViewWithdrawals && <QuickCard title="ตรวจสอบรายการถอน" href="/withdrawals" count={summary?.totals.pendingWithdrawals ?? 0} tone="danger" />}
          {canViewRisk && <QuickCard title="ความเสี่ยง" href="/risk-alerts" count={riskSummary.openCount} tone="danger" />}
          {canViewFinance && <QuickCard title="ภาพรวมการเงิน" href="/finance" count={summary?.totals.walletCount ?? 0} tone="neutral" />}
          {!loading && permissions.length > 0 && !canViewFinance && !canViewRisk && <AdminEmpty>บัญชีนี้ไม่มีสิทธิ์ดู widget การเงินหรือความเสี่ยงบน Dashboard</AdminEmpty>}
        </div>

        {summary?.today && canViewFinance && <AdminCard title="ปริมาณวันนี้" description={`วันที่ ${summary.today.date}`} action={canViewReports ? <AdminLinkButton href="/reports">ดูรายงาน</AdminLinkButton> : undefined}>
          <AdminMetricGrid>
            <AdminMetric title="ยอดฝากวันนี้" value={formatMoney(summary.today.topUpAmount)} helper={`${summary.today.topUpCount} รายการอนุมัติ`} />
            <AdminMetric title="ยอดถอนวันนี้" value={formatMoney(summary.today.withdrawalAmount)} helper={`${summary.today.withdrawalCount} รายการสำเร็จ`} />
            <AdminMetric title="Net flow" value={formatMoney(summary.today.netFlow)} helper="ยอดฝาก - ยอดถอน" />
          </AdminMetricGrid>
        </AdminCard>}

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
  return <AdminNotice><span>{message}</span><AdminButton tone="secondary" onClick={onRetry}>ลองใหม่</AdminButton></AdminNotice>;
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
