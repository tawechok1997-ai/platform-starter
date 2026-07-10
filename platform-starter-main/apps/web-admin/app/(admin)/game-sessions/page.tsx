'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Session = { id: string; status: string; launchUrl?: string | null; providerSessionId?: string | null; ipAddress?: string | null; userAgent?: string | null; startedAt?: string | null; endedAt?: string | null; errorCode?: string | null; errorMessage?: string | null; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; game?: { name: string; providerGameCode: string; category: string }; transfers?: Array<{ id: string; type: string; status: string; amount: string; currency: string; createdAt: string }> };
type Payload = { items?: Session[]; summary?: { total: number; launched: number; failed: number; active: number } };

export default function GameSessionsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลด session...');
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState('');
  useEffect(() => { loadSessions(); }, []);
  const items = payload.items ?? [];
  const metrics = useMemo(() => payload.summary ?? { total: items.length, launched: items.filter((item) => item.status === 'LAUNCHED').length, failed: items.filter((item) => item.status === 'FAILED').length, active: items.filter((item) => item.status === 'ACTIVE').length }, [payload.summary, items]);
  async function loadSessions() { setLoading(true); setMessage('กำลังโหลด session...'); const res = await adminApiFetch('/admin/game-sessions'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด session ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function reconcile(item: Session) { setReconciling(item.id); setMessage(`กำลัง reconcile ${item.game?.name ?? item.id}...`); const res = await adminApiFetch(`/admin/game-sessions/${item.id}/reconcile`, { method: 'POST' }); const data = await res.json().catch(() => null); setReconciling(''); if (!res.ok) { setMessage(data?.message ?? 'reconcile ไม่สำเร็จ'); return; } setMessage(`reconcile แล้ว: ${data.snapshot?.status ?? '-'}`); }
  return <AdminPage eyebrow="Game Platform" title="Game Sessions" description="ดู log การ launch เกมแบบ dry-run และ provider session id" actions={<AdminButton onClick={loadSessions} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Sessions" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Launched" value={String(metrics.launched)} helper="launch success" /><AdminMetric title="Active" value={String(metrics.active)} helper="active sessions" /><AdminMetric title="Failed" value={String(metrics.failed)} helper="launch failed" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><strong>Session log</strong><span style={mutedStyle}>{loading ? 'Loading...' : `${items.length} sessions loaded`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.game?.name ?? item.id}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.game?.providerGameCode ?? '-'} · user {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>providerSessionId: {item.providerSessionId ?? '-'} · ip {item.ipAddress ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminButton tone="secondary" onClick={() => reconcile(item)} disabled={reconciling === item.id}>{reconciling === item.id ? 'Reconciling...' : 'Reconcile'}</AdminButton></div></AdminRow>{item.launchUrl && <p style={urlStyle}>{item.launchUrl}</p>}{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}<p style={smallMutedStyle}>created {new Date(item.createdAt).toLocaleString('th-TH')} · started {item.startedAt ? new Date(item.startedAt).toLocaleString('th-TH') : '-'}</p></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี game session</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'LAUNCHED' || status === 'ACTIVE') return 'success'; if (status === 'FAILED' || status === 'EXPIRED') return 'danger'; if (status === 'CREATED') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const urlStyle = { margin: 0, padding: 12, borderRadius: 14, background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.18)', color: '#c4b5fd', wordBreak: 'break-all' as const };
