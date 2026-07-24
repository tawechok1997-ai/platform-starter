'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSkeleton, formatMoney } from '../_components/admin-ui';

type TrendRow = { date: string; topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string };
type Trends = { range: { days: number; from: string; to: string }; totals: { topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string }; daily: TrendRow[]; generatedAt: string };
type DailyReport = { wallets: { count: number; totalBalance: string; totalLockedBalance: string }; ledgers: { count: number; amount: string }; pendingQueues?: { topUps: { count: number; amount: string }; withdrawals: { count: number; amount: string } }; generatedAt: string };

export default function WalletAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { void loadAnalytics(days); }, []);

  const peak = useMemo(() => !trends?.daily.length ? null : [...trends.daily].sort((a, b) => Math.abs(Number(b.netFlow)) - Math.abs(Number(a.netFlow)))[0], [trends]);
  const maxNetFlow = useMemo(() => Math.max(...(trends?.daily.map((row) => Math.abs(Number(row.netFlow))) ?? [1]), 1), [trends]);

  async function loadAnalytics(nextDays = days) {
    setLoading(true); setMessage('');
    try {
      const [trendResponse, dailyResponse] = await Promise.all([adminApiFetch(`/admin/reports/trends?days=${nextDays}`), adminApiFetch('/admin/reports/daily')]);
      const [trendData, dailyData] = await Promise.all([trendResponse.json().catch(() => null), dailyResponse.json().catch(() => null)]);
      if (!trendResponse.ok || !dailyResponse.ok) throw new Error(trendData?.message ?? dailyData?.message ?? 'โหลด Wallet Analytics ไม่สำเร็จ');
      setTrends(trendData); setDaily(dailyData); setDays(nextDays);
    } catch (error) {
      setTrends(null); setDaily(null); setMessage(error instanceof Error ? error.message : 'โหลด Wallet Analytics ไม่สำเร็จ');
    } finally { setLoading(false); }
  }

  return <AdminPage eyebrow="การเงิน" title="Wallet Analytics" description="ติดตามเงินเข้า เงินออก สภาพคล่อง และความเสี่ยงของกระเป๋าเงินจากข้อมูลจริง" actions={<AdminButton size="compact" disabled={loading} onClick={() => void loadAnalytics(days)}>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</AdminButton>}>
    <section className="admin-wallet-analytics" aria-busy={loading}>
      <div className="admin-wallet-analytics__toolbar" role="group" aria-label="เลือกช่วงเวลาวิเคราะห์">{[7,14,30,90].map((value) => <AdminButton key={value} size="compact" tone={days === value ? 'primary' : 'secondary'} disabled={loading} onClick={() => void loadAnalytics(value)}>{value} วัน</AdminButton>)}</div>
      {message && <AdminNotice tone="danger">{message}</AdminNotice>}
      {loading && !daily ? <AdminSkeleton lines={6} /> : daily && trends ? <>
        <div className="admin-wallet-analytics__stats">
          <Stat label="ยอดเงินในระบบ" value={formatMoney(daily.wallets.totalBalance)} />
          <Stat label="ยอดถูกล็อก" value={formatMoney(daily.wallets.totalLockedBalance)} />
          <Stat label="ยอดฝากรวม" value={formatMoney(trends.totals.topUpAmount)} />
          <Stat label="ยอดถอนรวม" value={formatMoney(trends.totals.withdrawalAmount)} />
        </div>
        <div className="admin-wallet-analytics__hero">
          <AdminCard title="ภาพรวมสภาพคล่อง" description={`ข้อมูล ${trends.range.days} วัน · อัปเดต ${new Date(trends.generatedAt).toLocaleString('th-TH')}`}>
            <div className="admin-wallet-analytics__stats"><Health label="อัตราถอนต่อฝาก" value={ratio(trends.totals.withdrawalAmount, trends.totals.topUpAmount)} tone={Number(trends.totals.withdrawalAmount) > Number(trends.totals.topUpAmount) ? 'danger' : 'success'} /><Health label="ยอดล็อกต่อยอดรวม" value={ratio(daily.wallets.totalLockedBalance, daily.wallets.totalBalance)} tone={Number(daily.wallets.totalLockedBalance) > Number(daily.wallets.totalBalance) * .2 ? 'warning' : 'success'} /><Health label="ฝากค้าง" value={String(daily.pendingQueues?.topUps.count ?? 0)} tone={(daily.pendingQueues?.topUps.count ?? 0) > 0 ? 'warning' : 'success'} /><Health label="ถอนค้าง" value={String(daily.pendingQueues?.withdrawals.count ?? 0)} tone={(daily.pendingQueues?.withdrawals.count ?? 0) > 0 ? 'danger' : 'success'} /></div>
          </AdminCard>
          <AdminCard title="สถานะวันนี้" description="ภาพรวมจาก daily report"><Stat label="จำนวนกระเป๋า" value={daily.wallets.count.toLocaleString('th-TH')} /><Stat label="Ledger ทั้งหมด" value={daily.ledgers.count.toLocaleString('th-TH')} /><Stat label="เงินเข้าสุทธิ" value={formatMoney(trends.totals.netFlow)} /><Stat label="วันที่ผันผวนสูงสุด" value={peak ? new Date(peak.date).toLocaleDateString('th-TH') : '-'} /></AdminCard>
        </div>
        <AdminCard title="แนวโน้มรายวัน" description={peak ? `วันที่ผันผวนสูงสุด ${new Date(peak.date).toLocaleDateString('th-TH')} · สุทธิ ${formatMoney(peak.netFlow)}` : 'ยังไม่มีข้อมูลแนวโน้ม'}>
          <div className="admin-wallet-analytics__legend" aria-label="คำอธิบายกราฟ" style={legendStyle}><span><i className="is-positive" style={legendDotStyle} />เงินเข้าสุทธิ</span><span><i className="is-negative" style={legendDotStyle} />เงินออกสุทธิ</span><small>แตะหรือวางเมาส์บนแท่งเพื่อดูรายละเอียด</small></div>
          <div className="admin-wallet-analytics__chart" role="img" aria-label="กราฟเงินเข้าสุทธิรายวัน">{trends.daily.map((item) => { const height = Math.max((Math.abs(Number(item.netFlow)) / maxNetFlow) * 100, 4); const positive = Number(item.netFlow) >= 0; const tooltip = `${new Date(item.date).toLocaleDateString('th-TH')} · ฝาก ${formatMoney(item.topUpAmount)} (${item.topUpCount.toLocaleString('th-TH')} รายการ) · ถอน ${formatMoney(item.withdrawalAmount)} (${item.withdrawalCount.toLocaleString('th-TH')} รายการ) · สุทธิ ${formatMoney(item.netFlow)}`; return <div key={item.date} className="admin-wallet-analytics__bar-item" title={tooltip} aria-label={tooltip} tabIndex={0}><span className={positive ? 'is-positive' : 'is-negative'} style={{ height: `${height}%` }} /><small>{new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}</small></div>; })}</div>
        </AdminCard>
        <div className="admin-wallet-analytics__table-shell"><table className="admin-wallet-analytics__table"><thead><tr><th>วันที่</th><th>ฝาก</th><th>ถอน</th><th>สุทธิ</th><th>สถานะ</th></tr></thead><tbody>{trends.daily.map((item) => <tr key={item.date}><td>{new Date(item.date).toLocaleDateString('th-TH')}</td><td>{formatMoney(item.topUpAmount)}<br /><small>{item.topUpCount.toLocaleString('th-TH')} รายการ</small></td><td>{formatMoney(item.withdrawalAmount)}<br /><small>{item.withdrawalCount.toLocaleString('th-TH')} รายการ</small></td><td className="admin-wallet-analytics__amount">{formatMoney(item.netFlow)}</td><td><AdminBadge tone={Number(item.netFlow) >= 0 ? 'success' : 'danger'}>{Number(item.netFlow) >= 0 ? 'เงินเข้าสุทธิ' : 'เงินออกสุทธิ'}</AdminBadge></td></tr>)}</tbody></table></div>
      </> : <div className="admin-wallet-analytics__state"><AdminEmpty>ยังไม่มีข้อมูล Wallet Analytics</AdminEmpty></div>}
    </section>
  </AdminPage>;
}

function ratio(value: string, total: string) { const denominator = Number(total); return denominator > 0 ? `${((Number(value) / denominator) * 100).toFixed(1)}%` : '0.0%'; }
function Stat({ label, value }: { label: string; value: string }) { return <article className="admin-wallet-analytics__stat"><span>{label}</span><strong>{value}</strong></article>; }
function Health({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) { return <article className="admin-wallet-analytics__stat"><span>{label}</span><strong>{value}</strong><AdminBadge tone={tone}>{tone === 'success' ? 'ปกติ' : tone === 'warning' ? 'เฝ้าระวัง' : 'ต้องตรวจ'}</AdminBadge></article>; }
const legendStyle = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 12, color: '#94a3b8', fontSize: 13 } as const;
const legendDotStyle = { display: 'inline-block', width: 10, height: 10, borderRadius: 999, marginRight: 6 } as const;
