'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPayloadViewer, AdminRow, AdminSkeleton, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Bucket = { name: string; count: number };
type AuditItem = { id: string; module?: string | null; action: string; targetId?: string | null; adminUser?: { username?: string | null; email?: string | null }; adminUserId: string; createdAt: string; oldData?: unknown; newData?: unknown };
type Summary = { window?: { from: string; to: string }; totals?: { all: number; risky: number; uniqueAdmins: number }; byModule?: Bucket[]; byAction?: Bucket[]; byAdmin?: Bucket[]; recent?: AuditItem[] };

export default function AuditRiskPage() {
  const [summary, setSummary] = useState<Summary>({});
  const [days, setDays] = useState('7');
  const [module, setModule] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const from = useMemo(() => new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString(), [days]);
  const recent = useMemo(() => (summary.recent ?? [])
    .filter((item) => action === 'ALL' || item.action === action)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [action, summary.recent]);

  useEffect(() => { void load(); }, [days, module]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ from });
      if (module !== 'ALL') params.set('module', module);
      const res = await adminApiFetch(`/admin/audit-logs/risk-summary?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('โหลด Audit Risk ไม่สำเร็จ กรุณาลองใหม่');
      setSummary(data ?? {});
    } catch {
      setSummary({});
      setMessage('เชื่อมต่อ Audit Risk ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function openAudit(item: AuditItem) {
    setSelected(item);
    if (!item.targetId) return;
    try {
      const res = await adminApiFetch(`/admin/audit-logs?targetId=${encodeURIComponent(item.targetId)}&take=100`);
      const data = await res.json().catch(() => null);
      if (!res.ok) return;
      const full = (data?.items ?? []).find((entry: AuditItem) => entry.id === item.id);
      if (full) setSelected(full);
    } catch {
      // Keep the summary record visible when the detail request fails.
    }
  }

  function exportCsv() {
    const header = ['timestamp', 'module', 'action', 'target_id', 'admin'];
    const rows = recent.map((item) => [item.createdAt, item.module ?? '', item.action, item.targetId ?? '', item.adminUser?.username ?? item.adminUser?.email ?? item.adminUserId]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `audit-risk-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <AdminPage eyebrow="Security" title="Audit Risk Summary" description="สรุปเหตุการณ์เสี่ยงจาก Audit Log แบบอ่านอย่างเดียว" actions={<><AdminButton tone="secondary" disabled={loading || recent.length === 0} onClick={exportCsv}>Export CSV</AdminButton><AdminButton disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    {message && <AdminNotice tone="danger">{message}</AdminNotice>}
    <AdminToolbar>
      <select value={days} onChange={(event) => setDays(event.target.value)} style={selectStyle} aria-label="เลือกช่วงเวลา"><option value="1">24 ชั่วโมง</option><option value="7">7 วัน</option><option value="30">30 วัน</option></select>
      <select value={module} onChange={(event) => setModule(event.target.value)} style={selectStyle} aria-label="กรองตามโมดูล"><option value="ALL">ทุก Risk Type</option>{(summary.byModule ?? []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
      <select value={action} onChange={(event) => setAction(event.target.value)} style={selectStyle} aria-label="กรองตาม Action"><option value="ALL">ทุก Action</option>{(summary.byAction ?? []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
      <span>ช่วงเวลา: {summary.window ? `${new Date(summary.window.from).toLocaleString('th-TH')} - ${new Date(summary.window.to).toLocaleString('th-TH')}` : '-'}</span>
    </AdminToolbar>
    {loading && !summary.totals ? <AdminSkeleton lines={6} /> : <>
      <AdminMetricGrid><AdminMetric tone="warning" title="Risk Events" value={String(summary.totals?.risky ?? 0)} /><AdminMetric title="Audit Events" value={String(summary.totals?.all ?? 0)} /><AdminMetric tone="warning" title="Admins" value={String(summary.totals?.uniqueAdmins ?? 0)} /><AdminMetric tone="success" title="Mode" value="Read-only" /></AdminMetricGrid>
      <AdminGrid><BucketCard title="By Module" items={summary.byModule ?? []} /><BucketCard title="By Action" items={summary.byAction ?? []} /><BucketCard title="By Admin" items={summary.byAdmin ?? []} /></AdminGrid>
      <AdminCard title="Event Timeline" description={`${recent.length.toLocaleString('th-TH')} เหตุการณ์ · เรียงล่าสุดก่อน`}><AdminStack>{recent.map((item) => <AdminRow key={item.id}><div><strong>{item.module || '-'} · {item.action}</strong><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')} · {item.adminUser?.username ?? item.adminUser?.email ?? item.adminUserId}</p></div><div style={actionStyle}>{relatedHref(item) && <AdminLinkButton href={relatedHref(item)!}>Related Record</AdminLinkButton>}<AdminButton size="compact" tone="secondary" onClick={() => void openAudit(item)}>Before / After</AdminButton></div></AdminRow>)}{recent.length === 0 && <AdminEmpty>ไม่มีเหตุการณ์ตามตัวกรอง</AdminEmpty>}</AdminStack></AdminCard>
    </>}
    <AdminDrawer open={Boolean(selected)} title={selected ? `${selected.module || '-'} · ${selected.action}` : 'รายละเอียด Audit Risk'} description={selected ? new Date(selected.createdAt).toLocaleString('th-TH') : undefined} closeLabel="ปิด" size="wide" onClose={() => setSelected(null)}>
      {selected && <AdminStack><AdminRow><span>ผู้ดำเนินการ</span><strong>{selected.adminUser?.username ?? selected.adminUser?.email ?? selected.adminUserId}</strong></AdminRow><AdminRow><span>Related Record</span><span>{relatedHref(selected) ? <AdminLinkButton href={relatedHref(selected)!}>{selected.targetId ?? 'เปิดรายการ'}</AdminLinkButton> : <strong>{selected.targetId ?? '-'}</strong>}</span></AdminRow><AdminCard title="Before" compact><AdminPayloadViewer payload={selected.oldData} emptyLabel="ไม่มีข้อมูลก่อนเปลี่ยน" /></AdminCard><AdminCard title="After" compact><AdminPayloadViewer payload={selected.newData} emptyLabel="ไม่มีข้อมูลหลังเปลี่ยน" /></AdminCard></AdminStack>}
    </AdminDrawer>
    <AdminNotice>หน้านี้เป็น Read-only ไม่สามารถอนุมัติหรือแก้ยอดเงินได้</AdminNotice>
  </AdminPage>;
}

function BucketCard({ title, items }: { title: string; items: Bucket[] }) { return <AdminCard title={title}>{items.map((item) => <AdminRow key={item.name}><strong>{item.name}</strong><AdminBadge tone={item.count > 0 ? 'warning' : 'success'}>{String(item.count)}</AdminBadge></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminCard>; }
function relatedHref(item: AuditItem) { if (!item.targetId) return ''; const module = (item.module ?? '').toLowerCase(); if (module.includes('topup') || module.includes('deposit')) return `/topups/${item.targetId}`; if (module.includes('withdraw')) return `/withdrawals/${item.targetId}`; if (module.includes('member') || module.includes('kyc')) return `/members/${item.targetId}`; if (module.includes('risk')) return `/risk-alerts/${item.targetId}`; if (module.includes('ledger') || module.includes('wallet')) return `/wallet-ledgers/${item.targetId}`; if (module.includes('provider') || module.includes('game')) return `/game-transfers/${item.targetId}`; return ''; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 160 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const actionStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
