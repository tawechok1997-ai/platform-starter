'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminEmpty, AdminFilterBar, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type MemberInsights = {
  totals: { total: number; active30d: number; inactive30d: number; newToday: number; new30d: number; newInRange: number; returningInRange: number };
  status: Record<'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'CLOSED', number>;
  trend: { date: string; newMembers: number; returningMembers: number }[];
  segment: { newMembers: number; returningMembers: number; inactiveMembers: number; restrictedMembers: number };
  period: { from: string; to: string; days: number };
  dataSource: string;
  generatedAt: string;
};

type InsightsCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; loadFailed: string; networkFailed: string; from: string; to: string; days: string; applyRange: string; totalMembers: string; activeNow: string; active30Days: string; inactive: string; newToday: string; selectedRange: string; new30Days: string; recentWindow: string;
  trendTitle: string; trendDescription: string; trendAria: string; newMembers: string; returningMembers: string; segmentation: string; segmentationDescription: string; signedUpInRange: string; returningHelp: string; inactive30Days: string; followUp: string; restricted: string; restrictedHelp: string; accountStatus: string; accountStatusDescription: string; active: string; suspended: string; locked: string; closed: string; dataSource: string; primaryDataSource: string; synced: string; empty: string;
};

const insightsCopy: Record<AdminLocale, InsightsCopy> = {
  th: {
    eyebrow: 'ข้อมูลสมาชิก', title: 'แนวโน้มสมาชิก', description: 'การเติบโต สมาชิกกลับมา และสถานะบัญชี', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', loadFailed: 'โหลดแนวโน้มสมาชิกไม่สำเร็จ ลองใหม่', networkFailed: 'เชื่อมต่อข้อมูลสมาชิกไม่สำเร็จ ลองใหม่', from: 'ตั้งแต่', to: 'ถึง', days: 'วัน', applyRange: 'ใช้ช่วงวันที่', totalMembers: 'สมาชิกทั้งหมด', activeNow: 'ใช้งานได้', active30Days: 'ใช้งานใน 30 วัน', inactive: 'ยังไม่กลับมา', newToday: 'สมาชิกใหม่วันนี้', selectedRange: 'ในช่วงที่เลือก', new30Days: 'สมาชิกใหม่ 30 วัน', recentWindow: 'ช่วงล่าสุด',
    trendTitle: 'แนวโน้มการเติบโต', trendDescription: 'สมาชิกใหม่และสมาชิกที่กลับมา', trendAria: 'แนวโน้มสมาชิกใหม่และสมาชิกกลับมา', newMembers: 'สมาชิกใหม่', returningMembers: 'กลับมาใช้งาน', segmentation: 'การแบ่งกลุ่ม', segmentationDescription: 'พฤติกรรมในช่วงวันที่เลือก', signedUpInRange: 'สมัครในช่วงที่เลือก', returningHelp: 'สมาชิกเดิมที่เข้าใช้', inactive30Days: 'ไม่ใช้งาน 30 วัน', followUp: 'ต้องติดตาม', restricted: 'บัญชีถูกจำกัด', restrictedHelp: 'ระงับหรือล็อก', accountStatus: 'สถานะบัญชี', accountStatusDescription: 'จำนวนสมาชิกตามสถานะปัจจุบัน', active: 'ใช้งานได้', suspended: 'ระงับ', locked: 'ล็อก', closed: 'ปิดบัญชี', dataSource: 'แหล่งข้อมูล', primaryDataSource: 'ฐานข้อมูลหลัก', synced: 'ซิงก์', empty: 'ยังไม่มีข้อมูลแนวโน้มสมาชิก',
  },
  en: {
    eyebrow: 'Member intelligence', title: 'Member trends', description: 'Growth, returning members, and account status', refresh: 'Refresh', loading: 'Loading...', loadFailed: 'Unable to load member trends. Try again.', networkFailed: 'Unable to connect to member data. Try again.', from: 'From', to: 'To', days: 'days', applyRange: 'Apply range', totalMembers: 'Total members', activeNow: 'active', active30Days: 'Active in 30 days', inactive: 'not returned', newToday: 'New today', selectedRange: 'in selected range', new30Days: 'New in 30 days', recentWindow: 'Recent window',
    trendTitle: 'Growth trend', trendDescription: 'New and returning members', trendAria: 'New and returning member trend', newMembers: 'New members', returningMembers: 'Returning members', segmentation: 'Segments', segmentationDescription: 'Behavior in the selected range', signedUpInRange: 'Signed up in range', returningHelp: 'Existing members who signed in', inactive30Days: 'Inactive for 30 days', followUp: 'Needs follow-up', restricted: 'Restricted accounts', restrictedHelp: 'Suspended or locked', accountStatus: 'Account status', accountStatusDescription: 'Members by current status', active: 'Active', suspended: 'Suspended', locked: 'Locked', closed: 'Closed', dataSource: 'Data source', primaryDataSource: 'Primary database', synced: 'Synced', empty: 'No member trend data yet',
  },
};

export default function MemberInsightsPage() {
  const [locale] = useAdminLocale();
  const copy = insightsCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [data, setData] = useState<MemberInsights | null>(null);
  const [state, setState] = useState<'loading' | 'failed' | 'network' | ''>('loading');
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => toInputDate(daysAgo(13)));
  const [to, setTo] = useState(() => toInputDate(new Date()));

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true);
    setState('loading');
    const params = new URLSearchParams({ from, to });
    try {
      const response = await adminApiFetch(`/admin/members/insights?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.totals) { setState('failed'); return; }
      setData(payload as MemberInsights);
      setState('');
    } catch { setState('network'); } finally { setLoading(false); }
  }

  const max = useMemo(() => Math.max(...(data?.trend ?? []).flatMap((item) => [item.newMembers, item.returningMembers]), 1), [data]);
  const notice = state === 'loading' ? copy.loading : state === 'failed' ? copy.loadFailed : state === 'network' ? copy.networkFailed : '';

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton onClick={() => void load()} disabled={loading}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    {notice && <AdminNotice tone={state === 'loading' ? 'neutral' : 'warning'}>{notice}</AdminNotice>}
    {data ? <>
      <AdminFilterBar resultText={`${data.period.days} ${copy.days} · ${copy.dataSource}: ${copy.primaryDataSource}`}>
        <label>{copy.from}<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label><label>{copy.to}<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} /></label>
        <AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(6))); setTo(toInputDate(new Date())); }}>7 {copy.days}</AdminButton><AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(29))); setTo(toInputDate(new Date())); }}>30 {copy.days}</AdminButton><AdminButton tone="secondary" onClick={() => { setFrom(toInputDate(daysAgo(89))); setTo(toInputDate(new Date())); }}>90 {copy.days}</AdminButton><AdminButton onClick={() => void load()} disabled={loading}>{copy.applyRange}</AdminButton>
      </AdminFilterBar>
      <AdminMetricGrid><AdminMetric title={copy.totalMembers} value={formatNumber(data.totals.total, locale)} helper={`${formatNumber(data.status.ACTIVE, locale)} ${copy.activeNow}`} /><AdminMetric title={copy.active30Days} value={formatNumber(data.totals.active30d, locale)} helper={`${formatNumber(data.totals.inactive30d, locale)} ${copy.inactive}`} tone={data.totals.active30d > 0 ? 'success' : 'neutral'} /><AdminMetric title={copy.newToday} value={formatNumber(data.totals.newToday, locale)} helper={`${formatNumber(data.totals.newInRange, locale)} ${copy.selectedRange}`} /><AdminMetric title={copy.new30Days} value={formatNumber(data.totals.new30d, locale)} helper={copy.recentWindow} /></AdminMetricGrid>
      <AdminCard title={copy.trendTitle} description={`${data.period.days} ${copy.days} · ${copy.synced} ${new Date(data.generatedAt).toLocaleString(dateLocale)}`}><div className="admin-member-insights"><div className="admin-member-insights__chart" aria-label={copy.trendAria}>{data.trend.map((item) => <div className="admin-member-insights__day" key={item.date}><div className="admin-member-insights__bars" title={`${item.date}: ${copy.newMembers} ${formatNumber(item.newMembers, locale)}, ${copy.returningMembers} ${formatNumber(item.returningMembers, locale)}`}><span className="admin-member-insights__bar" style={{ height: `${Math.max((item.newMembers / max) * 100, item.newMembers > 0 ? 4 : 0)}%` }} /><span className="admin-member-insights__bar" data-kind="active" style={{ height: `${Math.max((item.returningMembers / max) * 100, item.returningMembers > 0 ? 4 : 0)}%` }} /></div><small>{new Date(`${item.date}T00:00:00`).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' })}</small></div>)}</div><div className="admin-member-insights__legend"><span>{copy.newMembers}</span><span data-kind="active">{copy.returningMembers}</span></div></div></AdminCard>
      <AdminCard title={copy.segmentation} description={copy.segmentationDescription}><AdminMetricGrid><AdminMetric title={copy.newMembers} value={formatNumber(data.segment.newMembers, locale)} helper={copy.signedUpInRange} /><AdminMetric title={copy.returningMembers} value={formatNumber(data.segment.returningMembers, locale)} helper={copy.returningHelp} tone="success" /><AdminMetric title={copy.inactive30Days} value={formatNumber(data.segment.inactiveMembers, locale)} helper={copy.followUp} tone={data.segment.inactiveMembers > 0 ? 'warning' : 'neutral'} /><AdminMetric title={copy.restricted} value={formatNumber(data.segment.restrictedMembers, locale)} helper={copy.restrictedHelp} tone={data.segment.restrictedMembers > 0 ? 'danger' : 'neutral'} /></AdminMetricGrid></AdminCard>
      <AdminCard title={copy.accountStatus} description={copy.accountStatusDescription}><AdminMetricGrid><AdminMetric title={copy.active} value={formatNumber(data.status.ACTIVE, locale)} helper={copy.active} tone="success" /><AdminMetric title={copy.suspended} value={formatNumber(data.status.SUSPENDED, locale)} helper={copy.suspended} tone={data.status.SUSPENDED > 0 ? 'warning' : 'neutral'} /><AdminMetric title={copy.locked} value={formatNumber(data.status.LOCKED, locale)} helper={copy.locked} tone={data.status.LOCKED > 0 ? 'danger' : 'neutral'} /><AdminMetric title={copy.closed} value={formatNumber(data.status.CLOSED, locale)} helper={copy.closed} /></AdminMetricGrid></AdminCard>
    </> : !loading && <AdminEmpty>{copy.empty}</AdminEmpty>}
  </AdminPage>;
}

function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function daysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return date; }
function toInputDate(date: Date) { return date.toISOString().slice(0, 10); }
