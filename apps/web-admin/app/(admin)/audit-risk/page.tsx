'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPayloadViewer, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Bucket = { name: string; count: number };
type AuditItem = { id: string; module?: string | null; action: string; targetId?: string | null; adminUser?: { username?: string | null; email?: string | null }; adminUserId: string; createdAt: string; oldData?: unknown; newData?: unknown };
type Summary = { window?: { from: string; to: string }; totals?: { all: number; risky: number; uniqueAdmins: number }; byModule?: Bucket[]; byAction?: Bucket[]; byAdmin?: Bucket[]; recent?: AuditItem[] };

export default function AuditRiskPage() {
  const [summary, setSummary] = useState<Summary>({});
  const [days, setDays] = useState('7');
  const [module, setModule] = useState('ALL');
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [message, setMessage] = useState('กำลังโหลด audit risk...');
  useEffect(() => { load(); }, [days, module]);
  const from = useMemo(() => new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString(), [days]);
  async function load() { setMessage('กำลังโหลด audit risk...'); const params = new URLSearchParams({ from }); if (module !== 'ALL') params.set('module', module); const res = await adminApiFetch(`/admin/audit-logs/risk-summary?${params.toString()}`); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลด audit risk ไม่สำเร็จ'); return; } setSummary(data ?? {}); setMessage(''); }
  async function openAudit(item: AuditItem) { if (!item.targetId) { setSelected(item); return; } const res = await adminApiFetch(`/admin/audit-logs?targetId=${encodeURIComponent(item.targetId)}&take=100`); const data = await res.json().catch(() => null); const full = res.ok ? (data?.items ?? []).find((entry: AuditItem) => entry.id === item.id) : null; setSelected(full ?? item); }
  function exportCsv() {
    const header = ['timestamp', 'module', 'action', 'target_id', 'admin'];
    const rows = (summary.recent ?? []).map((item) => [item.createdAt, item.module ?? '', item.action, item.targetId ?? '', item.adminUser?.username ?? item.adminUser?.email ?? item.adminUserId]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `audit-risk-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <AdminPage eyebrow="Security" title="Audit Risk Summary" description="สรุป event เสี่ยงจาก audit log แบบ read-only สำหรับตรวจ growth/money/provider actions" actions={<><AdminButton tone="secondary" disabled={(summary.recent ?? []).length === 0} onClick={exportCsv}>Export CSV</AdminButton><AdminButton onClick={load}>รีเฟรช</AdminButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><select value={days} onChange={(event) => setDays(event.target.value)} style={selectStyle}><option value="1">24 ชั่วโมง</option><option value="7">7 วัน</option><option value="30">30 วัน</option></select><select value={module} onChange={(event) => setModule(event.target.value)} style={selectStyle}><option value="ALL">ทุก risk type</option>{(summary.byModule ?? []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select><span>ช่วงเวลา: {summary.window ? `${new Date(summary.window.from).toLocaleString('th-TH')} - ${new Date(summary.window.to).toLocaleString('th-TH')}` : '-'}</span></AdminToolbar>
    <AdminMetricGrid><AdminMetric tone="warning" title="Risk events" value={String(summary.totals?.risky ?? 0)} /><AdminMetric tone="neutral" title="Audit events" value={String(summary.totals?.all ?? 0)} /><AdminMetric tone="warning" title="Admins" value={String(summary.totals?.uniqueAdmins ?? 0)} /><AdminMetric tone="success" title="Mode" value="Read-only" /></AdminMetricGrid>
    <AdminGrid><BucketCard title="By module" items={summary.byModule ?? []} /><BucketCard title="By action" items={summary.byAction ?? []} /><BucketCard title="By admin" items={summary.byAdmin ?? []} /></AdminGrid>
    <AdminCard title="Recent risky audit events" description="เลือกเหตุการณ์เพื่อดู before/after และ related record"><AdminStack>{(summary.recent ?? []).map((item) => <AdminRow key={item.id}><div><strong>{item.module || '-'} · {item.action}</strong><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')} · {item.adminUser?.username ?? item.adminUser?.email ?? item.adminUserId}</p></div><AdminButton size="compact" tone="secondary" onClick={() => void openAudit(item)}>รายละเอียด</AdminButton></AdminRow>)}{(summary.recent ?? []).length === 0 && <AdminEmpty>ยังไม่มี risky audit event ในช่วงนี้</AdminEmpty>}</AdminStack></AdminCard>
    {selected && <div style={drawerLayerStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><aside style={drawerStyle} aria-label="รายละเอียด audit"><AdminStack><AdminRow><div><strong>{selected.module || '-'} · {selected.action}</strong><p style={mutedStyle}>{new Date(selected.createdAt).toLocaleString('th-TH')}</p></div><AdminButton tone="ghost" onClick={() => setSelected(null)}>ปิด</AdminButton></AdminRow><AdminRow><span>ผู้ดำเนินการ</span><strong>{selected.adminUser?.username ?? selected.adminUser?.email ?? selected.adminUserId}</strong></AdminRow><AdminRow><span>Related record</span><strong>{selected.targetId ?? '-'}</strong></AdminRow><AdminCard title="Before" compact><AdminPayloadViewer payload={selected.oldData} emptyLabel="ไม่มีข้อมูลก่อนเปลี่ยน" /></AdminCard><AdminCard title="After" compact><AdminPayloadViewer payload={selected.newData} emptyLabel="ไม่มีข้อมูลหลังเปลี่ยน" /></AdminCard></AdminStack></aside></div>}
    <AdminNotice>หน้านี้เป็น read-only สำหรับตรวจความเสี่ยง ไม่สามารถอนุมัติหรือแก้ยอดเงินได้</AdminNotice>
  </AdminPage>;
}
function BucketCard({ title, items }: { title: string; items: Bucket[] }) { return <AdminCard title={title}>{items.map((item) => <AdminRow key={item.name}><strong>{item.name}</strong><AdminBadge tone={item.count > 0 ? 'warning' : 'success'}>{String(item.count)}</AdminBadge></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminCard>; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 160 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const drawerLayerStyle = { position: 'fixed' as const, inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(2,6,23,.62)', backdropFilter: 'blur(5px)' };
const drawerStyle = { width: 'min(680px, 100%)', height: '100%', overflow: 'auto' as const, padding: 24, background: '#111823', borderLeft: '1px solid rgba(148,163,184,.22)' };
