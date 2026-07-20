'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, formatMoney } from '../_components/admin-ui';

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

  const peak = useMemo(() => {
    if (!trends?.daily.length) return null;
    return [...trends.daily].sort((a, b) => Math.abs(Number(b.netFlow)) - Math.abs(Number(a.netFlow)))[0];
  }, [trends]);

  async function loadAnalytics(nextDays = days) {
    setLoading(true);
    setMessage('');
    try {
      const [trendResponse, dailyResponse] = await Promise.all([
        adminApiFetch(`/admin/reports/trends?days=${nextDays}`),
        adminApiFetch('/admin/reports/daily'),
      ]);
      const [trendData, dailyData] = await Promise.all([
        trendResponse.json().catch(() => null),
        dailyResponse.json().catch(() => null),
      ]);
      if (!trendResponse.ok || !dailyResponse.ok) throw new Error(trendData?.message ?? dailyData?.message ?? 'โหลด Wallet Analytics ไม่สำเร็จ');
      setTrends(trendData);
      setDaily(dailyData);
      setDays(nextDays);
    } catch (error) {
      setTrends(null);
      setDaily(null);
      setMessage(error instanceof Error ? error.message : 'โหลด Wallet Analytics ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return <AdminPage eyebrow="การเงิน" title="Wallet Analytics" description="ติดตามเงินเข้า เงินออก สภาพคล่อง และแนวโน้มกระเป๋าเงินจากข้อมูลระบบจริง" actions={<AdminButton disabled={loading} onClick={() => void loadAnalytics(days)}>รีเฟรชข้อมูล</AdminButton>}>
    {message && <AdminNotice tone="danger">{message}</AdminNotice>}

    <div className="admin-wallet-analytics__range" role="group" aria-label="เลือกช่วงเวลาวิเคราะห์">
      {[7, 14, 30, 90].map((value) => <AdminButton key={value} tone={days === value ? 'primary' : 'secondary'} disabled={loading} onClick={() => void loadAnalytics(value)}>{value} วัน</AdminButton>)}
    </div>

    {daily && trends && <>
      <AdminMetricGrid>
        <AdminMetric title="ยอดเงินในระบบ" value={formatMoney(daily.wallets.totalBalance)} helper={`${daily.wallets.count.toLocaleString('th-TH')} กระเป๋า`} />
        <AdminMetric title="ยอดถูกล็อก" value={formatMoney(daily.wallets.totalLockedBalance)} tone={Number(daily.wallets.totalLockedBalance) > 0 ? 'warning' : 'success'} />
        <AdminMetric title="ยอดฝากรวม" value={formatMoney(trends.totals.topUpAmount)} helper={`${trends.totals.topUpCount.toLocaleString('th-TH')} รายการ`} />
        <AdminMetric title="ยอดถอนรวม" value={formatMoney(trends.totals.withdrawalAmount)} helper={`${trends.totals.withdrawalCount.toLocaleString('th-TH')} รายการ`} />
        <AdminMetric title="เงินเข้าสุทธิ" value={formatMoney(trends.totals.netFlow)} tone={Number(trends.totals.netFlow) >= 0 ? 'success' : 'danger'} />
        <AdminMetric title="Ledger ทั้งหมด" value={daily.ledgers.count.toLocaleString('th-TH')} helper={formatMoney(daily.ledgers.amount)} />
      </AdminMetricGrid>

      <AdminCard title="ภาพรวมสภาพคล่อง" description={`ข้อมูล ${trends.range.days} วัน · อัปเดต ${new Date(trends.generatedAt).toLocaleString('th-TH')}`}>
        <div className="admin-wallet-analytics__health">
          <HealthItem label="อัตราถอนต่อฝาก" value={ratio(trends.totals.withdrawalAmount, trends.totals.topUpAmount)} tone={Number(trends.totals.withdrawalAmount) > Number(trends.totals.topUpAmount) ? 'danger' : 'success'} />
          <HealthItem label="ยอดล็อกต่อยอดรวม" value={ratio(daily.wallets.totalLockedBalance, daily.wallets.totalBalance)} tone={Number(daily.wallets.totalLockedBalance) > Number(daily.wallets.totalBalance) * 0.2 ? 'warning' : 'success'} />
          <HealthItem label="รายการฝากค้าง" value={String(daily.pendingQueues?.topUps.count ?? 0)} tone={(daily.pendingQueues?.topUps.count ?? 0) > 0 ? 'warning' : 'success'} />
          <HealthItem label="รายการถอนค้าง" value={String(daily.pendingQueues?.withdrawals.count ?? 0)} tone={(daily.pendingQueues?.withdrawals.count ?? 0) > 0 ? 'danger' : 'success'} />
        </div>
      </AdminCard>

      <AdminCard title="แนวโน้มรายวัน" description={peak ? `วันที่ผันผวนสูงสุด ${new Date(peak.date).toLocaleDateString('th-TH')} · สุทธิ ${formatMoney(peak.netFlow)}` : 'ยังไม่มีข้อมูลแนวโน้ม'}>
        <div className="admin-wallet-analytics__chart" role="img" aria-label="กราฟเงินเข้าสุทธิรายวัน">
          {trends.daily.map((item) => {
            const max = Math.max(...trends.daily.map((row) => Math.abs(Number(row.netFlow))), 1);
            const height = Math.max((Math.abs(Number(item.netFlow)) / max) * 100, 4);
            const positive = Number(item.netFlow) >= 0;
            return <div key={item.date} className="admin-wallet-analytics__bar-item" title={`${new Date(item.date).toLocaleDateString('th-TH')}: ${formatMoney(item.netFlow)}`}>
              <span className={positive ? 'is-positive' : 'is-negative'} style={{ height: `${height}%` }} />
              <small>{new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}</small>
            </div>;
          })}
        </div>
      </AdminCard>

      <AdminCard title="รายละเอียดรายวัน">
        <div className="admin-wallet-analytics__table-wrap"><table className="admin-wallet-analytics__table"><thead><tr><th>วันที่</th><th>ฝาก</th><th>ถอน</th><th>สุทธิ</th><th>สถานะ</th></tr></thead><tbody>{trends.daily.map((item) => <tr key={item.date}><td>{new Date(item.date).toLocaleDateString('th-TH')}</td><td>{formatMoney(item.topUpAmount)}<small>{item.topUpCount.toLocaleString('th-TH')} รายการ</small></td><td>{formatMoney(item.withdrawalAmount)}<small>{item.withdrawalCount.toLocaleString('th-TH')} รายการ</small></td><td>{formatMoney(item.netFlow)}</td><td><AdminBadge tone={Number(item.netFlow) >= 0 ? 'success' : 'danger'}>{Number(item.netFlow) >= 0 ? 'เงินเข้าสุทธิ' : 'เงินออกสุทธิ'}</AdminBadge></td></tr>)}</tbody></table></div>
      </AdminCard>
    </>}

    {!loading && !daily && !trends && !message && <AdminEmpty>ยังไม่มีข้อมูล Wallet Analytics</AdminEmpty>}
    {loading && !daily && <AdminEmpty>กำลังโหลดข้อมูลวิเคราะห์...</AdminEmpty>}
  </AdminPage>;
}

function ratio(value: string, total: string) { const denominator = Number(total); return denominator > 0 ? `${((Number(value) / denominator) * 100).toFixed(1)}%` : '0.0%'; }
function HealthItem({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) { return <article><span>{label}</span><strong>{value}</strong><AdminBadge tone={tone}>{tone === 'success' ? 'ปกติ' : tone === 'warning' ? 'เฝ้าระวัง' : 'ต้องตรวจ'}</AdminBadge></article>; }
