'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';

type MemberInsights = {
  totals: { total: number; active30d: number; inactive30d: number; newToday: number; new7d: number; new30d: number };
  status: Record<'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'CLOSED', number>;
  trend: { date: string; newMembers: number; activeMembers: number }[];
  generatedAt: string;
};

export default function MemberInsightsPage() {
  const [data, setData] = useState<MemberInsights | null>(null);
  const [message, setMessage] = useState('กำลังโหลดแนวโน้มสมาชิก...');
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    const response = await adminApiFetch('/admin/members/insights', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.totals) {
      setMessage(payload?.message ?? 'โหลดแนวโน้มสมาชิกไม่สำเร็จ');
      setLoading(false);
      return;
    }
    setData(payload as MemberInsights);
    setLoading(false);
  }

  const max = useMemo(() => Math.max(...(data?.trend ?? []).flatMap((item) => [item.newMembers, item.activeMembers]), 1), [data]);

  return <AdminPage eyebrow="Member Intelligence" title="แนวโน้มสมาชิก" description="ติดตามการเติบโต สมาชิกที่กลับมาใช้งาน และสถานะบัญชีจากข้อมูลฐานจริง" actions={<AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={data ? 'neutral' : 'warning'}>{message}</AdminNotice>}
    {data ? <>
      <AdminMetricGrid>
        <AdminMetric title="สมาชิกทั้งหมด" value={data.totals.total.toLocaleString('th-TH')} helper={`${data.status.ACTIVE} ใช้งานได้`} />
        <AdminMetric title="Active 30 วัน" value={data.totals.active30d.toLocaleString('th-TH')} helper={`${data.totals.inactive30d} ยังไม่กลับมา`} tone={data.totals.active30d > 0 ? 'success' : 'neutral'} />
        <AdminMetric title="สมาชิกใหม่วันนี้" value={data.totals.newToday.toLocaleString('th-TH')} helper={`${data.totals.new7d} ใน 7 วัน`} />
        <AdminMetric title="สมาชิกใหม่ 30 วัน" value={data.totals.new30d.toLocaleString('th-TH')} helper="Growth window ล่าสุด" />
      </AdminMetricGrid>

      <AdminCard title="Growth และ Active trend" description={`14 วันล่าสุด · อัปเดต ${new Date(data.generatedAt).toLocaleString('th-TH')}`}>
        <div className="admin-member-insights">
          <div className="admin-member-insights__chart" aria-label="แนวโน้มสมาชิกใหม่และสมาชิกที่เข้าใช้งาน 14 วัน">
            {data.trend.map((item) => <div className="admin-member-insights__day" key={item.date}>
              <div className="admin-member-insights__bars" title={`${item.date}: ใหม่ ${item.newMembers}, active ${item.activeMembers}`}>
                <span className="admin-member-insights__bar" style={{ height: `${Math.max((item.newMembers / max) * 100, item.newMembers > 0 ? 4 : 0)}%` }} />
                <span className="admin-member-insights__bar" data-kind="active" style={{ height: `${Math.max((item.activeMembers / max) * 100, item.activeMembers > 0 ? 4 : 0)}%` }} />
              </div>
              <small>{new Date(`${item.date}T00:00:00`).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}</small>
            </div>)}
          </div>
          <div className="admin-member-insights__legend"><span>สมาชิกใหม่</span><span data-kind="active">เข้าใช้งานล่าสุด</span></div>
        </div>
      </AdminCard>

      <AdminCard title="สถานะบัญชี" description="จำนวนสมาชิกตามสถานะปัจจุบัน">
        <AdminMetricGrid>
          <AdminMetric title="ACTIVE" value={data.status.ACTIVE.toLocaleString('th-TH')} helper="ใช้งานได้" tone="success" />
          <AdminMetric title="SUSPENDED" value={data.status.SUSPENDED.toLocaleString('th-TH')} helper="ถูกระงับ" tone={data.status.SUSPENDED > 0 ? 'warning' : 'neutral'} />
          <AdminMetric title="LOCKED" value={data.status.LOCKED.toLocaleString('th-TH')} helper="ถูกล็อก" tone={data.status.LOCKED > 0 ? 'danger' : 'neutral'} />
          <AdminMetric title="CLOSED" value={data.status.CLOSED.toLocaleString('th-TH')} helper="ปิดบัญชี" />
        </AdminMetricGrid>
      </AdminCard>
    </> : !loading && <AdminEmpty>ยังไม่มีข้อมูล Member Intelligence</AdminEmpty>}
  </AdminPage>;
}
