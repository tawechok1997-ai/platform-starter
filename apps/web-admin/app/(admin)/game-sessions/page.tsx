'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminCode, AdminConfirmDialog, AdminDataValue, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Session = { id: string; status: string; launchUrl?: string | null; providerSessionId?: string | null; ipAddress?: string | null; userAgent?: string | null; startedAt?: string | null; endedAt?: string | null; errorCode?: string | null; errorMessage?: string | null; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; game?: { name: string; providerGameCode: string; category: string }; transfers?: Array<{ id: string; type: string; status: string; amount: string; currency: string; createdAt: string }> };
type Payload = { items?: Session[]; summary?: { total: number; launched: number; failed: number; active: number } };

export default function GameSessionsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลดเซสชันเกม...');
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState('');
  const [pendingReconcile, setPendingReconcile] = useState<Session | null>(null);

  useEffect(() => { void loadSessions(); }, []);
  const items = payload.items ?? [];
  const metrics = useMemo(() => payload.summary ?? { total: items.length, launched: items.filter((item) => item.status === 'LAUNCHED').length, failed: items.filter((item) => item.status === 'FAILED').length, active: items.filter((item) => item.status === 'ACTIVE').length }, [payload.summary, items]);

  async function loadSessions() {
    setLoading(true);
    setMessage('กำลังโหลดเซสชันเกม...');
    const res = await adminApiFetch('/admin/game-sessions');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดเซสชันเกมไม่สำเร็จ'); return; }
    setPayload(data ?? {});
    setMessage('');
  }

  async function reconcile() {
    if (!pendingReconcile) return;
    const item = pendingReconcile;
    setReconciling(item.id);
    setMessage(`กำลังตรวจยอด ${item.game?.name ?? item.id}...`);
    const res = await adminApiFetch(`/admin/game-sessions/${item.id}/reconcile`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setReconciling('');
    if (!res.ok) { setMessage(data?.message ?? 'ตรวจยอดเซสชันไม่สำเร็จ'); return; }
    setPendingReconcile(null);
    setMessage(`ผลตรวจยอด: ${snapshotStatus(data.snapshot?.status)}`);
    await loadSessions();
  }

  return <AdminPage eyebrow="เกม" title="เซสชันเกม" description="ตรวจสถานะการเปิดเกมและรายการที่ต้องติดตาม" actions={<AdminButton size="compact" onClick={() => void loadSessions()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="ทั้งหมด" value={String(metrics.total)} helper="รายการล่าสุด" />
      <AdminMetric title="เปิดสำเร็จ" value={String(metrics.launched)} tone="success" />
      <AdminMetric title="กำลังใช้งาน" value={String(metrics.active)} tone="success" />
      <AdminMetric title="ไม่สำเร็จ" value={String(metrics.failed)} tone={metrics.failed ? 'danger' : 'success'} />
    </AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminToolbar><strong>รายการล่าสุด</strong><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id} compact tone={item.status === 'FAILED' ? 'danger' : 'neutral'}>
      <AdminRow>
        <div style={mainInfoStyle}><h2 style={titleStyle}>{item.game?.name ?? item.id}</h2><span style={mutedStyle}>{item.provider?.name ?? '-'} · สมาชิก {item.user?.username ?? item.user?.phone ?? '-'}</span></div>
        <div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton size="compact" tone="ghost" onClick={() => setPendingReconcile(item)} disabled={reconciling === item.id}>{reconciling === item.id ? 'กำลังตรวจ...' : 'ตรวจยอด'}</AdminButton></div>
      </AdminRow>
      <div style={detailGridStyle}>
        <AdminDataValue label="รหัสเซสชัน"><AdminCode title={item.providerSessionId ?? item.id}>{shortId(item.providerSessionId ?? item.id)}</AdminCode></AdminDataValue>
        <AdminDataValue label="IP"><AdminCode>{item.ipAddress ?? '-'}</AdminCode></AdminDataValue>
        <AdminDataValue label="สร้างเมื่อ">{new Date(item.createdAt).toLocaleString('th-TH')}</AdminDataValue>
      </div>
      <section style={timelineStyle} aria-label="ไทม์ไลน์เซสชัน"><strong>ไทม์ไลน์</strong><div style={timelineItemsStyle}><TimelineItem label="สร้าง" value={item.createdAt} /><TimelineItem label="เริ่ม" value={item.startedAt} /><TimelineItem label="สิ้นสุด" value={item.endedAt} /></div></section>
      {item.launchUrl && <details><summary style={summaryStyle}>ข้อมูลเปิดเกม</summary><AdminCode title={item.launchUrl}>{item.launchUrl}</AdminCode></details>}
      {item.errorMessage && <AdminNotice tone="danger">{sessionErrorLabel(item.errorCode)}</AdminNotice>}
    </AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มีเซสชันเกม</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog open={Boolean(pendingReconcile)} title={pendingReconcile ? `ตรวจยอด ${pendingReconcile.game?.name ?? ''}` : ''} description="ระบบจะตรวจยอดและสถานะล่าสุดจากค่าย โดยไม่ควรเปลี่ยนยอดเงินจริง" confirmLabel="เริ่มตรวจยอด" tone="primary" busy={Boolean(pendingReconcile && reconciling === pendingReconcile.id)} onCancel={() => setPendingReconcile(null)} onConfirm={() => void reconcile()} details={pendingReconcile ? <><AdminDataValue label="สมาชิก">{pendingReconcile.user?.username ?? pendingReconcile.user?.phone ?? '-'}</AdminDataValue><AdminDataValue label="ค่าย">{pendingReconcile.provider?.name ?? '-'}</AdminDataValue><AdminDataValue label="สถานะ">{statusLabel(pendingReconcile.status)}</AdminDataValue></> : null} />
  </AdminPage>;
}

function shortId(value?: string | null) { if (!value) return '-'; return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value; }
function TimelineItem({ label, value }: { label: string; value?: string | null }) { return <span style={timelineItemStyle}><strong>{label}</strong><small>{value ? new Date(value).toLocaleString('th-TH') : '-'}</small></span>; }
function statusLabel(status: string) { return ({ CREATED: 'สร้างแล้ว', LAUNCHED: 'เปิดเกมแล้ว', ACTIVE: 'กำลังใช้งาน', ENDED: 'สิ้นสุดแล้ว', FAILED: 'ไม่สำเร็จ', EXPIRED: 'หมดอายุ' } as Record<string, string>)[status] ?? status; }
function snapshotStatus(status?: string) { return ({ MATCHED: 'ยอดตรงกัน', MISMATCH: 'ยอดไม่ตรง', UNKNOWN: 'ยังระบุไม่ได้' } as Record<string, string>)[status ?? ''] ?? status ?? '-'; }
function statusTone(status: string) { if (status === 'LAUNCHED' || status === 'ACTIVE' || status === 'ENDED') return 'success'; if (status === 'FAILED' || status === 'EXPIRED') return 'danger'; if (status === 'CREATED') return 'warning'; return 'neutral'; }
function sessionErrorLabel(code?: string | null) { const labels: Record<string, string> = { TIMEOUT: 'ค่ายตอบกลับช้า กรุณาลองใหม่ภายหลัง', UNAUTHORIZED: 'ข้อมูลเชื่อมต่อค่ายไม่ถูกต้อง', PROVIDER_UNAVAILABLE: 'ค่ายเกมไม่พร้อมใช้งาน', GAME_NOT_FOUND: 'ไม่พบเกมจากค่าย' }; return labels[code ?? ''] ?? 'เปิดเกมไม่สำเร็จ กรุณาตรวจข้อมูลค่ายและลองใหม่'; }
const mainInfoStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const detailGridStyle = { display: 'grid', gap: 8, marginTop: 2 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.45, overflowWrap: 'anywhere' as const };
const titleStyle = { margin: 0, fontSize: 19, lineHeight: 1.18 } as const;
const badgeStackStyle = { display: 'flex', gap: 7, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const summaryStyle = { cursor: 'pointer', color: '#cbd5e1', fontWeight: 800, fontSize: 13, marginBottom: 8 } as const;
const timelineStyle = { display: 'grid', gap: 8, paddingTop: 4 } as const;
const timelineItemsStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 8 } as const;
const timelineItemStyle = { display: 'grid', gap: 3, padding: 10, borderRadius: 10, background: 'rgba(15,23,42,.5)', color: '#cbd5e1' } as const;
