'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminStack, formatMoney } from '../_components/admin-ui';

type DailyReport = { range: { from: string; to: string }; topUps: Group[]; withdrawals: Group[]; adjustments: { direction: string; count: number; amount: string }[]; wallets: { count: number; totalBalance: string; totalLockedBalance: string }; ledgers: { count: number; amount: string }; pendingQueues?: { topUps: { count: number; amount: string }; withdrawals: { count: number; amount: string } }; generatedAt: string };
type Group = { status: string; count: number; amount: string };
type Reconciliation = { checkedCount?: number; mismatchCount: number; items: { walletId: string; shortUserId: string; username?: string | null; actualBalance: string; latestLedgerBalance: string; lockedBalance: string; availableBalance?: string; status: string }[]; generatedAt: string };
type TrendRow = { date: string; topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string };
type Trends = { range: { days: number; from: string; to: string }; totals: { topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string }; daily: TrendRow[]; generatedAt: string };
type QueueAging = { summary: { pendingTopUps: number; pendingWithdrawals: number; oldestAgeMinutes: number; over15Minutes: number; over60Minutes: number; over24Hours: number }; oldest: { id: string; type: 'TOPUP' | 'WITHDRAWAL'; userId: string; username: string; amount: string; currency: string; createdAt: string; ageMinutes: number; ageLabel: string }[]; generatedAt: string };

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [aging, setAging] = useState<QueueAging | null>(null);
  const [trendDays, setTrendDays] = useState(7);
  const [range, setRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { loadReports(); }, []);

  async function loadReports(nextTrendDays = trendDays) {
    setLoading(true);
    setMessage('กำลังโหลดรายงาน...');
    const dailyParams = new URLSearchParams();
    if (range.from) dailyParams.set('from', range.from);
    if (range.to) dailyParams.set('to', range.to);
    const [dailyRes, reconRes, trendsRes, agingRes] = await Promise.all([
      adminApiFetch(`/admin/reports/daily${dailyParams.size ? `?${dailyParams.toString()}` : ''}`),
      adminApiFetch('/admin/reports/reconciliation?limit=100'),
      adminApiFetch(`/admin/reports/trends?days=${nextTrendDays}`),
      adminApiFetch('/admin/reports/queue-aging'),
    ]);
    const dailyData = await dailyRes.json().catch(() => null);
    const reconData = await reconRes.json().catch(() => null);
    const trendsData = await trendsRes.json().catch(() => null);
    const agingData = await agingRes.json().catch(() => null);
    if (!dailyRes.ok || !reconRes.ok || !trendsRes.ok || !agingRes.ok) { setMessage(dailyData?.message ?? reconData?.message ?? trendsData?.message ?? agingData?.message ?? 'โหลดรายงานไม่สำเร็จ'); setLoading(false); return; }
    setDaily(dailyData);
    setRecon(reconData);
    setTrends(trendsData);
    setAging(agingData);
    setMessage('');
    setLoading(false);
  }

  function changeTrendDays(nextDays: number) {
    setTrendDays(nextDays);
    loadReports(nextDays);
  }

  async function downloadCsv(path: string, filename: string) {
    setMessage('กำลังดาวน์โหลด CSV...');
    const res = await adminApiFetch(path);
    if (!res.ok) { setMessage((await res.json().catch(() => null))?.message ?? 'ดาวน์โหลด CSV ไม่สำเร็จ'); return; }
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('ดาวน์โหลด CSV แล้ว');
  }

  return (
    <AdminPage eyebrow="Finance Reports" title="Reports" description="รายงานรายวัน ตรวจยอด wallet แนวโน้มเงินเข้าออก และคิวที่ค้างนาน" actions={<><AdminButton onClick={() => loadReports()}>Refresh</AdminButton><AdminLinkButton href="/exports">Exports</AdminLinkButton></>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {loading && !daily && !recon && !trends && !aging && <AdminEmpty>กำลังโหลดรายงาน...</AdminEmpty>}
      <AdminCard title="Report Filters" description="เลือกช่วงวันที่สำหรับ daily aggregate และใช้ปุ่ม export ในแต่ละรายงานเพื่อดาวน์โหลด CSV"><div style={filterGridStyle}><label style={filterLabelStyle}><span>From</span><input type="date" value={range.from} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} style={inputStyle} /></label><label style={filterLabelStyle}><span>To</span><input type="date" value={range.to} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} style={inputStyle} /></label><div style={filterActionStyle}><AdminButton disabled={loading} onClick={() => loadReports()}>Apply</AdminButton><AdminButton tone="secondary" disabled={loading || (!range.from && !range.to)} onClick={() => { setRange({ from: '', to: '' }); setTimeout(() => loadReports(), 0); }}>Reset</AdminButton></div></div></AdminCard>
      {daily && <AdminMetricGrid><AdminMetric title="Wallets" value={daily.wallets.count.toLocaleString('th-TH')} /><AdminMetric title="Total Balance" value={formatMoney(daily.wallets.totalBalance)} /><AdminMetric title="Locked" value={formatMoney(daily.wallets.totalLockedBalance)} /><AdminMetric title="Ledger Items" value={daily.ledgers.count.toLocaleString('th-TH')} />{daily.pendingQueues && <AdminMetric title="Pending Top-ups" value={`${daily.pendingQueues.topUps.count}`} helper={formatMoney(daily.pendingQueues.topUps.amount)} />}{daily.pendingQueues && <AdminMetric title="Pending Withdrawals" value={`${daily.pendingQueues.withdrawals.count}`} helper={formatMoney(daily.pendingQueues.withdrawals.amount)} />}{recon && <AdminMetric title="Recon Checked" value={(recon.checkedCount ?? recon.items.length).toLocaleString('th-TH')} />}{recon && <AdminMetric title="Mismatch" value={recon.mismatchCount.toLocaleString('th-TH')} />}</AdminMetricGrid>}

      {aging && <AdminCard title="Pending Queue Aging" description={`Oldest pending: ${aging.summary.oldestAgeMinutes} minutes · Generated ${new Date(aging.generatedAt).toLocaleString('th-TH')}`}>
        <AdminMetricGrid>
          <AdminMetric title="Pending Top-ups" value={aging.summary.pendingTopUps.toLocaleString('th-TH')} />
          <AdminMetric title="Pending Withdrawals" value={aging.summary.pendingWithdrawals.toLocaleString('th-TH')} />
          <AdminMetric title="Over 15m" value={aging.summary.over15Minutes.toLocaleString('th-TH')} />
          <AdminMetric title="Over 60m" value={aging.summary.over60Minutes.toLocaleString('th-TH')} />
          <AdminMetric title="Over 24h" value={aging.summary.over24Hours.toLocaleString('th-TH')} />
        </AdminMetricGrid>
        <AdminStack>{aging.oldest.map((item) => <AdminSectionRow key={`${item.type}-${item.id}`}><div style={queueInfoStyle}><div style={badgeRowStyle}><AdminBadge tone={item.type === 'TOPUP' ? 'warning' : 'danger'}>{item.type}</AdminBadge><AdminBadge>{item.ageLabel}</AdminBadge></div><strong>{item.username}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')} · User {item.userId}</p></div><div style={queueActionStyle}><strong>{formatMoney(item.amount)}</strong><p>{item.currency}</p><AdminLinkButton href={item.type === 'TOPUP' ? '/topups' : '/withdrawals'}>Open queue</AdminLinkButton></div></AdminSectionRow>)}{aging.oldest.length === 0 && <AdminEmpty>ไม่มีคิว pending</AdminEmpty>}</AdminStack>
      </AdminCard>}

      {trends && <AdminCard title="Finance Trend" description={`${trends.range.days} days · ${new Date(trends.range.from).toLocaleDateString('th-TH')} - ${new Date(trends.range.to).toLocaleDateString('th-TH')}`} action={<div style={toolbarStyle}>{[7, 14, 30].map((item) => <AdminButton key={item} tone={trendDays === item ? 'primary' : 'secondary'} disabled={loading} onClick={() => changeTrendDays(item)}>{item}d</AdminButton>)}<AdminButton tone="secondary" onClick={() => downloadCsv(`/admin/exports/report-trends.csv?days=${trendDays}`, `report-trends-${trendDays}d.csv`)}>Export CSV</AdminButton></div>}>
        <AdminMetricGrid>
          <AdminMetric title="Top-up volume" value={formatMoney(trends.totals.topUpAmount)} helper={`${trends.totals.topUpCount} approved`} />
          <AdminMetric title="Withdrawal volume" value={formatMoney(trends.totals.withdrawalAmount)} helper={`${trends.totals.withdrawalCount} completed`} />
          <AdminMetric title="Net flow" value={formatMoney(trends.totals.netFlow)} helper="topup - withdrawal" />
        </AdminMetricGrid>
        <AdminStack>{trends.daily.map((item) => <div key={item.date} style={trendRowStyle}><div style={trendDateStyle}><strong>{item.date}</strong><p>{item.topUpCount} topups · {item.withdrawalCount} withdrawals</p></div><div style={trendAmountStyle}><TrendAmount label="Top-up" value={item.topUpAmount} tone="success" /><TrendAmount label="Withdraw" value={item.withdrawalAmount} tone="warning" /><TrendAmount label="Net" value={item.netFlow} tone={Number(item.netFlow) >= 0 ? 'success' : 'danger'} /></div></div>)}</AdminStack>
      </AdminCard>}

      {daily && <AdminCard title="Daily Summary" description={`${new Date(daily.range.from).toLocaleDateString('th-TH')} - ${new Date(daily.range.to).toLocaleDateString('th-TH')}`}><AdminGrid><GroupCard title="Top-ups" items={daily.topUps} /><GroupCard title="Withdrawals" items={daily.withdrawals} /><GroupCard title="Adjustments" items={daily.adjustments.map((item) => ({ status: item.direction, count: item.count, amount: item.amount }))} /></AdminGrid></AdminCard>}
      {recon && <AdminCard title="Reconciliation" description={`Mismatch: ${recon.mismatchCount} · Generated ${new Date(recon.generatedAt).toLocaleString('th-TH')}`} action={<AdminButton tone="secondary" onClick={() => downloadCsv('/admin/exports/reconciliation.csv?limit=1000', 'reconciliation.csv')}>Export CSV</AdminButton>}><AdminStack>{recon.items.slice(0, 20).map((item) => <AdminSectionRow key={item.walletId}><div style={reconInfoStyle}><AdminBadge tone={item.status === 'MATCHED' ? 'success' : 'danger'}>{item.status}</AdminBadge><strong>{item.username ?? item.shortUserId}</strong><p>Wallet: {item.shortUserId}</p></div><div style={reconAmountGridStyle}><ReconAmount label="Actual" value={item.actualBalance} /><ReconAmount label="Ledger" value={item.latestLedgerBalance} /><ReconAmount label="Locked" value={item.lockedBalance} />{item.availableBalance && <ReconAmount label="Available" value={item.availableBalance} />}</div></AdminSectionRow>)}{recon.items.length === 0 && <AdminEmpty>ไม่มี mismatch</AdminEmpty>}</AdminStack></AdminCard>}
    </AdminPage>
  );
}

function GroupCard({ title, items }: { title: string; items: Group[] }) {
  return <AdminCard title={title}><AdminStack>{items.map((item) => <AdminRow key={item.status}><strong>{item.status}</strong><span>{item.count} / {formatMoney(item.amount)}</span></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminStack></AdminCard>;
}

function TrendAmount({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) {
  return <div style={trendAmountItemStyle}><AdminBadge tone={tone}>{label}</AdminBadge><strong>{formatMoney(value)}</strong></div>;
}

function ReconAmount({ label, value }: { label: string; value: string }) {
  return <div style={reconAmountStyle}><span>{label}</span><strong>{formatMoney(value)}</strong></div>;
}

const toolbarStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const queueInfoStyle = { display: 'grid', gap: 7, minWidth: 0 };
const queueActionStyle = { display: 'grid', gap: 8, alignContent: 'start', minWidth: 0 };
const reconInfoStyle = { display: 'grid', gap: 7, minWidth: 0 };
const reconAmountGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10, minWidth: 0 };
const reconAmountStyle = { display: 'grid', gap: 5, border: '1px solid rgba(148,163,184,.14)', borderRadius: 12, padding: 10, background: 'rgba(15,23,42,.34)', minWidth: 0 };
const trendRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.045)', minWidth: 0, overflow: 'hidden' as const };
const trendDateStyle = { display: 'grid', gap: 4, minWidth: 0 };
const trendAmountStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10, textAlign: 'left' as const, minWidth: 0, width: '100%' };
const trendAmountItemStyle = { display: 'grid', gap: 6, minWidth: 0 };

const filterGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, alignItems: 'end' };
const filterLabelStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const filterActionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
