'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminEmpty, AdminFilterBar, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';
import { safeAdminErrorMessage } from '../_components/human-labels';

type MemberInsights = {
  totals: { total: number; active30d: number; inactive30d: number; newToday: number; new30d: number; newInRange: number; returningInRange: number };
  status: Record<'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'CLOSED', number>;
  trend: { date: string; newMembers: number; returningMembers: number }[];
  segment: { newMembers: number; returningMembers: number; inactiveMembers: number; restrictedMembers: number };
  period: { from: string; to: string; days: number };
  dataSource: string;
  generatedAt: string;
};

export default function MemberInsightsPage() {
  const [data, setData] = useState<MemberInsights | null>(null);
  const [message, setMessage] = useState('กำลังโหลดแนวโน้มสมาชิก...');
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => toInputDate(daysAgo(13)));
  const [to, setTo] = useState(() => toInputDate(new Date()));

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    const params = new URLSearchParams({ from, to });
    try {
      const response = await adminApiFetch(`/admin/members/insights?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.totals) {
        setMessage(safeAdminErrorMessage(payload?.message, 'โหลดแนวโน้มสมาชิกไม่สำเร็จ กรุณาลองใหม่'));
        setLoading(false);
        return;
      }
      setData(payload as MemberInsights);
    } catch {
      setMessage('เชื่อมต่อข้อมูลสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const max = useMemo(() => Math.max(...(data?.trend ?? []).flatMap((item) => [item.newMembers, item.returningMembers]), 1), [data]);

  return <AdminPage eyebrow="Member Intelligence" title="แนวโน้มสมาชิก" description="ติดตามการเติบโต สมาชิกที่กลับมาใช้งาน และสถานะบัญชีจากข้อมูลฐานจริง" actions={<AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={data ? 'neutral' : 'warning'}>{message}</AdminNotice>}
    {data ? <>
      <AdminFilterBar resultText={data ? `${data.period.days} วัน · ${data.dataSource}` : undefined}>
        <label>ตั้งแต่<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>ถึง<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} /></label>
        <AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(6))); setTo(toInputDate(new Date())); }}>7 วัน</AdminButton>
        <AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(29))); setTo(toInputDate(new Date())); }}>30 วัน</AdminButton>
        <AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(89))); setTo(toInputDate(new Date())); }}>90 วัน</AdminButton>
        <AdminButton onClick={() => void load()} disabled={loading}>ใช้ช่วงวันที่</AdminButton>
      </AdminFilterBar>
      <AdminMetricGrid>
        <AdminMetric title="สมาชิกทั้งหมด" value={data.totals.total.toLocaleString('th-TH')} helper={`${data.status.ACTIVE} ใช้งานได้`} />
        <AdminMetric title="Active 30 วัน" value={data.totals.active30d.toLocaleString('th-TH')} helper={`${data.totals.inactive30d} ยังไม่กลับมา`} tone={data.totals.active30d > 0 ? 'success' : 'neutral'} />
        <AdminMetric title="สมาชิกใหม่วันนี้" value={data.totals.newToday.toLocaleString('th-TH')} helper={`${data.totals.newInRange} ในช่วงที่เลือก`} />
        <AdminMetric title="สมาชิกใหม่ 30 วัน" value={data.totals.new30d.toLocaleString('th-TH')} helper="Growth window ล่าสุด" />
      </AdminMetricGrid>

      <AdminCard title="Growth และ Returning trend" description={`${data.period.days} วัน · ซิงก์ ${new Date(data.generatedAt).toLocaleString('th-TH')}`}>
        <div className="admin-member-insights">
          <div className="admin-member-insights__chart" aria-label="แนวโน้มสมาชิกใหม่และสมาชิกที่กลับมาใช้งาน">
            {data.trend.map((item) => <div className="admin-member-insights__day" key={item.date}>
              <div className="admin-member-insights__bars" title={`${item.date}: ใหม่ ${item.newMembers}, กลับมา ${item.returningMembers}`}>
                <span className="admin-member-insights__bar" style={{ height: `${Math.max((item.newMembers / max) * 100, item.newMembers > 0 ? 4 : 0)}%` }} />
                <span className="admin-member-insights__bar" data-kind="active" style={{ height: `${Math.max((item.returningMembers / max) * 100, item.returningMembers > 0 ? 4 : 0)}%` }} />
              </div>
              <small>{new Date(`${item.date}T00:00:00`).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}</small>
            </div>)}
          </div>
          <div className="admin-member-insights__legend"><span>สมาชิกใหม่</span><span data-kind="active">กลับมาใช้งาน</span></div>
        </div>
      </AdminCard>

      <AdminCard title="Segmentation" description="แบ่งกลุ่มตามพฤติกรรมในช่วงวันที่เลือก">
        <AdminMetricGrid>
          <AdminMetric title="สมาชิกใหม่" value={data.segment.newMembers.toLocaleString('th-TH')} helper="สมัครในช่วงที่เลือก" />
          <AdminMetric title="กลับมาใช้งาน" value={data.segment.returningMembers.toLocaleString('th-TH')} helper="สมาชิกเดิมที่ล็อกอิน" tone="success" />
          <AdminMetric title="ไม่ active 30 วัน" value={data.segment.inactiveMembers.toLocaleString('th-TH')} helper="ต้องติดตาม" tone={data.segment.inactiveMembers > 0 ? 'warning' : 'neutral'} />
          <AdminMetric title="บัญชีถูกจำกัด" value={data.segment.restrictedMembers.toLocaleString('th-TH')} helper="Suspended + Locked" tone={data.segment.restrictedMembers > 0 ? 'danger' : 'neutral'} />
        </AdminMetricGrid>
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

function daysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return date; }
function toInputDate(date: Date) { return date.toISOString().slice(0, 10); }
