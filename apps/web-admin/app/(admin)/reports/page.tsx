'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminDataValue, AdminEmpty, AdminFilterBar, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminStack, formatMoney } from '../_components/admin-ui';
import { humanStatus } from '../_components/human-labels';

type Group = { status: string; count: number; amount: string };
type DailyReport = { range: { from: string; to: string }; topUps: Group[]; withdrawals: Group[]; adjustments: { direction: string; count: number; amount: string }[]; wallets: { count: number; totalBalance: string; totalLockedBalance: string }; ledgers: { count: number; amount: string }; pendingQueues?: { topUps: { count: number; amount: string }; withdrawals: { count: number; amount: string } }; generatedAt: string };
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
  const [exporting, setExporting] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { void loadReports(); }, []);

  const maxNetFlow = useMemo(() => Math.max(...(trends?.daily ?? []).map((item) => Math.abs(Number(item.netFlow))), 1), [trends]);

  async function loadReports(nextTrendDays = trendDays, nextRange = range) {
    if (nextRange.from && nextRange.to && nextRange.from > nextRange.to) {
      setMessage('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด');
      return;
    }
    setLoading(true);
    setMessage('กำลังโหลดรายงาน...');
    try {
      const dailyParams = new URLSearchParams();
      if (nextRange.from) dailyParams.set('from', nextRange.from);
      if (nextRange.to) dailyParams.set('to', nextRange.to);
      const [dailyRes, reconRes, trendsRes, agingRes] = await Promise.all([
        adminApiFetch(`/admin/reports/daily${dailyParams.size ? `?${dailyParams.toString()}` : ''}`),
        adminApiFetch('/admin/reports/reconciliation?limit=100'),
        adminApiFetch(`/admin/reports/trends?days=${nextTrendDays}`),
        adminApiFetch('/admin/reports/queue-aging'),
      ]);
      const [dailyData, reconData, trendsData, agingData] = await Promise.all([
        dailyRes.json().catch(() => null), reconRes.json().catch(() => null), trendsRes.json().catch(() => null), agingRes.json().catch(() => null),
      ]);
      if (!dailyRes.ok || !reconRes.ok || !trendsRes.ok || !agingRes.ok) throw new Error('โหลดรายงานไม่สำเร็จ');
      setDaily(dailyData); setRecon(reconData); setTrends(trendsData); setAging(agingData); setTrendDays(nextTrendDays); setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบรายงานไม่สำเร็จ');
    } finally { setLoading(false); }
  }

  function clearRange() { const empty = { from: '', to: '' }; setRange(empty); void loadReports(trendDays, empty); }

  async function downloadCsv(path: string, filename: string) {
    if (exporting) return;
    setExporting(filename); setMessage('กำลังเตรียมไฟล์ CSV...');
    try {
      const response = await adminApiFetch(path);
      if (!response.ok) throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ');
      const blob = new Blob([await response.text()], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage('ดาวน์โหลดไฟล์เรียบร้อยแล้ว');
    } catch { setMessage('ดาวน์โหลดไฟล์ไม่สำเร็จ'); }
    finally { setExporting(''); }
  }

  return <AdminPage eyebrow="การเงินและการตรวจสอบ" title="รายงานระบบ" description="ดูภาพรวมเงินเข้าออก รายการค้าง แนวโน้ม และผลตรวจสอบยอดจากหน้าเดียว" actions={<><AdminButton disabled={loading} onClick={() => void loadReports()}>รีเฟรช</AdminButton><AdminLinkButton href="/exports">ศูนย์ส่งออกข้อมูล</AdminLinkButton></>}>
    <section className="admin-reports" aria-busy={loading}>
      {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('วันที่') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
      {exporting && <span className="admin-reports__export-state" role="status">กำลังส่งออก {exporting}</span>}
      {loading && !daily && <div className="admin-reports__skeleton" aria-label="กำลังโหลดรายงาน"><span /><span /><span /><span /></div>}

      <AdminCard title="ช่วงวันที่" description="ใช้กับรายงานสรุปรายวัน ส่วนแนวโน้มเลือกช่วงเวลาแยกด้านล่าง">
        <AdminFilterBar resultText={range.from || range.to ? 'กำหนดช่วงวันที่แล้ว' : 'ใช้ช่วงวันที่เริ่มต้น'}>
          <label style={fieldStyle}><span>ตั้งแต่วันที่</span><input type="date" value={range.from} max={range.to || undefined} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /></label>
          <label style={fieldStyle}><span>ถึงวันที่</span><input type="date" value={range.to} min={range.from || undefined} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></label>
          <AdminButton disabled={loading} onClick={() => void loadReports()}>ใช้ช่วงวันที่</AdminButton>
          <AdminButton tone="secondary" disabled={loading || (!range.from && !range.to)} onClick={clearRange}>ล้างช่วงวันที่</AdminButton>
        </AdminFilterBar>
      </AdminCard>

      {daily && <AdminMetricGrid>
        <AdminMetric title="กระเป๋าเงิน" value={daily.wallets.count.toLocaleString('th-TH')} />
        <AdminMetric title="ยอดเงินรวม" value={formatMoney(daily.wallets.totalBalance)} />
        <AdminMetric title="ยอดที่ถูกล็อก" value={formatMoney(daily.wallets.totalLockedBalance)} />
        <AdminMetric title="รายการบัญชี" value={daily.ledgers.count.toLocaleString('th-TH')} />
        {daily.pendingQueues && <AdminMetric title="ฝากรอดำเนินการ" value={String(daily.pendingQueues.topUps.count)} helper={formatMoney(daily.pendingQueues.topUps.amount)} tone={daily.pendingQueues.topUps.count ? 'warning' : 'success'} />}
        {daily.pendingQueues && <AdminMetric title="ถอนรอดำเนินการ" value={String(daily.pendingQueues.withdrawals.count)} helper={formatMoney(daily.pendingQueues.withdrawals.amount)} tone={daily.pendingQueues.withdrawals.count ? 'warning' : 'success'} />}
        {recon && <AdminMetric title="กระเป๋าที่ตรวจแล้ว" value={(recon.checkedCount ?? recon.items.length).toLocaleString('th-TH')} />}
        {recon && <AdminMetric title="ยอดไม่ตรงกัน" value={recon.mismatchCount.toLocaleString('th-TH')} tone={recon.mismatchCount ? 'danger' : 'success'} />}
      </AdminMetricGrid>}

      {aging && <AdminCard title="อายุรายการที่ยังค้าง" description={`รายการเก่าสุด ${aging.summary.oldestAgeMinutes.toLocaleString('th-TH')} นาที`}>
        <AdminMetricGrid><AdminMetric title="ฝากค้าง" value={String(aging.summary.pendingTopUps)} /><AdminMetric title="ถอนค้าง" value={String(aging.summary.pendingWithdrawals)} /><AdminMetric title="เกิน 15 นาที" value={String(aging.summary.over15Minutes)} tone={aging.summary.over15Minutes ? 'warning' : 'success'} /><AdminMetric title="เกิน 60 นาที" value={String(aging.summary.over60Minutes)} tone={aging.summary.over60Minutes ? 'danger' : 'success'} /><AdminMetric title="เกิน 24 ชั่วโมง" value={String(aging.summary.over24Hours)} tone={aging.summary.over24Hours ? 'danger' : 'success'} /></AdminMetricGrid>
        <AdminStack>{aging.oldest.map((item) => <AdminSectionRow key={`${item.type}-${item.id}`}><div style={stackStyle}><div style={actionsStyle}><AdminBadge tone={item.type === 'TOPUP' ? 'warning' : 'danger'}>{item.type === 'TOPUP' ? 'ฝากเงิน' : 'ถอนเงิน'}</AdminBadge><AdminBadge>{item.ageLabel}</AdminBadge></div><strong>{item.username}</strong><small>{new Date(item.createdAt).toLocaleString('th-TH')}</small><AdminDataValue label="สมาชิก" mono>{item.userId}</AdminDataValue></div><div style={stackStyle}><strong>{formatMoney(item.amount)}</strong><AdminLinkButton href={item.type === 'TOPUP' ? '/topups' : '/withdrawals'}>เปิดคิวงาน</AdminLinkButton></div></AdminSectionRow>)}{aging.oldest.length === 0 && <AdminEmpty>ไม่มีรายการค้าง</AdminEmpty>}</AdminStack>
      </AdminCard>}

      {trends && <AdminCard title="แนวโน้มการเงิน" description={`${trends.range.days} วัน`} action={<div style={actionsStyle}>{[7,14,30,90].map((days) => <AdminButton key={days} tone={trendDays === days ? 'primary' : 'secondary'} disabled={loading} onClick={() => void loadReports(days)}>{days} วัน</AdminButton>)}<AdminButton tone="secondary" disabled={Boolean(exporting)} onClick={() => void downloadCsv(`/admin/exports/report-trends.csv?days=${trendDays}`, `report-trends-${trendDays}d.csv`)}>{exporting ? 'กำลังส่งออก...' : 'ดาวน์โหลด CSV'}</AdminButton></div>}>
        <AdminMetricGrid><AdminMetric title="ยอดฝากรวม" value={formatMoney(trends.totals.topUpAmount)} helper={`${trends.totals.topUpCount} รายการ`} /><AdminMetric title="ยอดถอนรวม" value={formatMoney(trends.totals.withdrawalAmount)} helper={`${trends.totals.withdrawalCount} รายการ`} /><AdminMetric title="เงินเข้าสุทธิ" value={formatMoney(trends.totals.netFlow)} tone={Number(trends.totals.netFlow) >= 0 ? 'success' : 'danger'} /></AdminMetricGrid>
        {trends.daily.length > 0 ? <div className="admin-reports__chart" role="img" aria-label="กราฟเงินเข้าสุทธิรายวัน">{trends.daily.map((item) => { const value = Number(item.netFlow); const height = Math.max(Math.abs(value) / maxNetFlow * 100, 3); return <div key={item.date} className={`admin-reports__bar${value < 0 ? ' is-negative' : ''}`} title={`${new Date(item.date).toLocaleDateString('th-TH')}: ${formatMoney(item.netFlow)}`}><div className="admin-reports__bar-track"><span className="admin-reports__bar-fill" style={{ height: `${height}%` }} /></div><small>{new Date(item.date).toLocaleDateString('th-TH',{day:'2-digit',month:'short'})}</small></div>; })}</div> : <div className="admin-reports__empty">ยังไม่มีข้อมูลแนวโน้มในช่วงนี้</div>}
      </AdminCard>}

      {daily && <AdminCard title="สรุปรายวัน" description={`${new Date(daily.range.from).toLocaleDateString('th-TH')} ถึง ${new Date(daily.range.to).toLocaleDateString('th-TH')}`}><AdminGrid><GroupCard title="รายการฝากเงิน" items={daily.topUps} /><GroupCard title="รายการถอนเงิน" items={daily.withdrawals} /><GroupCard title="การปรับยอด" items={daily.adjustments.map((item) => ({ status: item.direction, count: item.count, amount: item.amount }))} /></AdminGrid></AdminCard>}

      {recon && <AdminCard title="ตรวจสอบยอดกระเป๋าเงิน" description={`พบยอดไม่ตรงกัน ${recon.mismatchCount.toLocaleString('th-TH')} รายการ`} action={<AdminButton tone="secondary" disabled={Boolean(exporting)} onClick={() => void downloadCsv('/admin/exports/reconciliation.csv?limit=1000','reconciliation.csv')}>ดาวน์โหลด CSV</AdminButton>}><AdminStack>{recon.items.slice(0,20).map((item) => <AdminSectionRow key={item.walletId}><div style={stackStyle}><AdminBadge tone={item.status === 'MATCHED' ? 'success' : 'danger'}>{humanStatus(item.status)}</AdminBadge><strong>{item.username ?? item.shortUserId}</strong><AdminDataValue label="กระเป๋า" mono>{item.shortUserId}</AdminDataValue></div><div style={amountGridStyle}><ReconAmount label="ยอดจริง" value={item.actualBalance} /><ReconAmount label="ยอดในบัญชี" value={item.latestLedgerBalance} /><ReconAmount label="ยอดล็อก" value={item.lockedBalance} />{item.availableBalance && <ReconAmount label="ยอดพร้อมใช้" value={item.availableBalance} />}</div></AdminSectionRow>)}{recon.items.length === 0 && <AdminEmpty>ไม่พบยอดที่ไม่ตรงกัน</AdminEmpty>}</AdminStack></AdminCard>}

      {!loading && !daily && !recon && !trends && !aging && <div className="admin-reports__empty">ยังไม่มีข้อมูลรายงาน</div>}
    </section>
  </AdminPage>;
}

function GroupCard({ title, items }: { title: string; items: Group[] }) { return <AdminCard title={title}><AdminStack>{items.map((item) => <AdminRow key={item.status}><strong>{humanStatus(item.status)}</strong><span>{item.count.toLocaleString('th-TH')} รายการ · {formatMoney(item.amount)}</span></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminStack></AdminCard>; }
function ReconAmount({ label, value }: { label: string; value: string }) { return <AdminDataValue label={label}>{formatMoney(value)}</AdminDataValue>; }
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 800, minWidth: 0 } as const;
const stackStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const amountGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(160px,100%),1fr))', gap: 10, minWidth: 0 };
