'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

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
    setMessage(`ตรวจยอดแล้ว: ${snapshotStatus(data.snapshot?.status)}`);
    await loadSessions();
  }

  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="เซสชันเกม" description="ตรวจประวัติการเปิดเกม สถานะเซสชัน ข้อผิดพลาด และรายการเงินที่เกี่ยวข้อง" actions={<AdminButton onClick={() => void loadSessions()} disabled={loading}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="เซสชันทั้งหมด" value={String(metrics.total)} helper="รายการล่าสุด" />
      <AdminMetric title="เปิดเกมสำเร็จ" value={String(metrics.launched)} tone="success" />
      <AdminMetric title="กำลังใช้งาน" value={String(metrics.active)} tone="success" />
      <AdminMetric title="เปิดเกมไม่สำเร็จ" value={String(metrics.failed)} tone={metrics.failed ? 'danger' : 'success'} />
    </AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><strong>ประวัติเซสชัน</strong><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}>
      <AdminRow>
        <div><h2 style={titleStyle}>{item.game?.name ?? item.id}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.game?.providerGameCode ?? '-'} · สมาชิก {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>รหัสเซสชันค่าย: {item.providerSessionId ?? '-'} · IP: {item.ipAddress ?? '-'}</p></div>
        <div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton tone="secondary" onClick={() => setPendingReconcile(item)} disabled={reconciling === item.id}>{reconciling === item.id ? 'กำลังตรวจยอด...' : 'ตรวจยอดกับค่าย'}</AdminButton></div>
      </AdminRow>
      {item.launchUrl && <details><summary style={summaryStyle}>ดู URL สำหรับเปิดเกม</summary><p style={urlStyle}>{item.launchUrl}</p></details>}
      {item.errorMessage && <AdminNotice tone="danger">{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}
      <p style={smallMutedStyle}>สร้างเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')} · เริ่มเมื่อ {item.startedAt ? new Date(item.startedAt).toLocaleString('th-TH') : '-'}</p>
    </AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มีเซสชันเกม</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog open={Boolean(pendingReconcile)} title={pendingReconcile ? `ตรวจยอดเซสชัน ${pendingReconcile.game?.name ?? ''}` : ''} description="ระบบจะขอตรวจยอดและสถานะล่าสุดจากค่ายเกม การทำงานนี้ไม่ควรเปลี่ยนยอดเงินโดยตรง" confirmLabel="ตรวจยอด" tone="primary" busy={Boolean(pendingReconcile && reconciling === pendingReconcile.id)} onCancel={() => setPendingReconcile(null)} onConfirm={() => void reconcile()} details={pendingReconcile ? <><p><strong>สมาชิก:</strong> {pendingReconcile.user?.username ?? pendingReconcile.user?.phone ?? '-'}</p><p><strong>ค่าย:</strong> {pendingReconcile.provider?.name ?? '-'}</p><p><strong>สถานะ:</strong> {statusLabel(pendingReconcile.status)}</p></> : null} />
  </AdminPage>;
}

function statusLabel(status: string) { return ({ CREATED: 'สร้างแล้ว', LAUNCHED: 'เปิดเกมแล้ว', ACTIVE: 'กำลังใช้งาน', ENDED: 'สิ้นสุดแล้ว', FAILED: 'ไม่สำเร็จ', EXPIRED: 'หมดอายุ' } as Record<string, string>)[status] ?? status; }
function snapshotStatus(status?: string) { return ({ MATCHED: 'ยอดตรงกัน', MISMATCH: 'ยอดไม่ตรง', UNKNOWN: 'ยังระบุไม่ได้' } as Record<string, string>)[status ?? ''] ?? status ?? '-'; }
function statusTone(status: string) { if (status === 'LAUNCHED' || status === 'ACTIVE' || status === 'ENDED') return 'success'; if (status === 'FAILED' || status === 'EXPIRED') return 'danger'; if (status === 'CREATED') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const urlStyle = { margin: '8px 0 0', padding: 12, borderRadius: 14, background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.18)', color: '#c4b5fd', wordBreak: 'break-all' as const };
const summaryStyle = { cursor: 'pointer', color: '#cbd5e1', fontWeight: 800 } as const;
