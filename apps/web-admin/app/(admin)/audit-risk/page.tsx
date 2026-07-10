'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Bucket = { name: string; count: number };
type AuditItem = { id: string; module?: string | null; action: string; targetId?: string | null; adminUser?: { username?: string | null; email?: string | null }; adminUserId: string; createdAt: string };
type Summary = { window?: { from: string; to: string }; totals?: { all: number; risky: number; uniqueAdmins: number }; byModule?: Bucket[]; byAction?: Bucket[]; byAdmin?: Bucket[]; recent?: AuditItem[] };

export default function AuditRiskPage() {
  const [summary, setSummary] = useState<Summary>({});
  const [days, setDays] = useState('7');
  const [message, setMessage] = useState('กำลังโหลด audit risk...');
  useEffect(() => { load(); }, [days]);
  const from = useMemo(() => new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString(), [days]);
  async function load() { setMessage('กำลังโหลด audit risk...'); const params = new URLSearchParams({ from }); const res = await adminApiFetch(`/admin/audit-logs/risk-summary?${params.toString()}`); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลด audit risk ไม่สำเร็จ'); return; } setSummary(data ?? {}); setMessage(''); }
  return <AdminPage eyebrow="Security" title="Audit Risk Summary" description="สรุป event เสี่ยงจาก audit log แบบ read-only สำหรับตรวจ growth/money/provider actions" actions={<AdminButton onClick={load}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><select value={days} onChange={(event) => setDays(event.target.value)} style={selectStyle}><option value="1">24 ชั่วโมง</option><option value="7">7 วัน</option><option value="30">30 วัน</option></select><span>ช่วงเวลา: {summary.window ? `${new Date(summary.window.from).toLocaleString('th-TH')} - ${new Date(summary.window.to).toLocaleString('th-TH')}` : '-'}</span></AdminToolbar>
    <AdminMetricGrid><AdminMetric tone="warning" title="Risk events" value={String(summary.totals?.risky ?? 0)} /><AdminMetric tone="neutral" title="Audit events" value={String(summary.totals?.all ?? 0)} /><AdminMetric tone="warning" title="Admins" value={String(summary.totals?.uniqueAdmins ?? 0)} /><AdminMetric tone="success" title="Mode" value="Read-only" /></AdminMetricGrid>
    <AdminGrid><BucketCard title="By module" items={summary.byModule ?? []} /><BucketCard title="By action" items={summary.byAction ?? []} /><BucketCard title="By admin" items={summary.byAdmin ?? []} /></AdminGrid>
    <AdminCard title="Recent risky audit events" description="รายการล่าสุดที่เกี่ยวกับเงิน โบนัส ตัวแทน ค่ายเกม และการอนุมัติ"><AdminStack>{(summary.recent ?? []).map((item) => <AdminRow key={item.id}><div><strong>{item.module || '-'} · {item.action}</strong><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')} · {item.adminUser?.username ?? item.adminUser?.email ?? item.adminUserId}</p></div><AdminBadge tone="warning">{item.targetId ?? '-'}</AdminBadge></AdminRow>)}{(summary.recent ?? []).length === 0 && <AdminEmpty>ยังไม่มี risky audit event ในช่วงนี้</AdminEmpty>}</AdminStack></AdminCard>
    <AdminNotice>หน้านี้ไม่แก้ข้อมูล ไม่อนุมัติรายการ และไม่แตะ wallet ใช้สำหรับดูความเสี่ยงเท่านั้น เพราะปุ่มแก้เงินควรถูกแยก ไม่ใช่รวมในหน้าสวย ๆ ให้เผลอกดแล้วร้องไห้</AdminNotice>
  </AdminPage>;
}
function BucketCard({ title, items }: { title: string; items: Bucket[] }) { return <AdminCard title={title}>{items.map((item) => <AdminRow key={item.name}><strong>{item.name}</strong><AdminBadge tone={item.count > 0 ? 'warning' : 'success'}>{String(item.count)}</AdminBadge></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminCard>; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 160 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
