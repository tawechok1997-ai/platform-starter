'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Snapshot = { id: string; systemBalance: string; providerBalance: string; difference: string; status: string; rawPayload?: unknown; checkedAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string } };
type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };

export default function ProviderWalletSnapshotsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลด reconciliation...');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState('');
  useEffect(() => { loadSnapshots(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.provider?.name, item.provider?.code, item.user?.username, item.user?.phone, item.difference].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, matched: items.filter((item) => item.status === 'MATCHED').length, mismatch: items.filter((item) => item.status === 'MISMATCH').length, unknown: items.filter((item) => item.status === 'UNKNOWN').length }, [payload.summary, items]);
  async function loadSnapshots() { setLoading(true); setMessage('กำลังโหลด reconciliation...'); const res = await adminApiFetch('/admin/provider-wallet-snapshots'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด reconciliation ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function reviewSnapshot(item: Snapshot, status: 'REVIEWED' | 'RESOLVED' | 'IGNORED') { const note = window.prompt(`${status} note`); if (!note) return; setReviewing(item.id); const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status }) }); const data = await res.json().catch(() => null); setReviewing(''); if (!res.ok) { setMessage(data?.message ?? 'review snapshot ไม่สำเร็จ'); return; } setMessage(`บันทึก ${status} แล้ว`); await loadSnapshots(); }
  return <AdminPage eyebrow="Game Platform" title="Reconciliation" description="ดู snapshot เทียบยอดระบบกับยอด provider ก่อนเปิดเงินจริง" actions={<AdminButton onClick={loadSnapshots} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Snapshots" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Matched" value={String(metrics.matched)} helper="ยอดตรง" /><AdminMetric title="Mismatch" value={String(metrics.mismatch)} helper="ต้องตรวจ" /><AdminMetric title="Unknown" value={String(metrics.unknown)} helper="adapter/error" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search provider / user / diff" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">All status</option><option value="MATCHED">MATCHED</option><option value="MISMATCH">MISMATCH</option><option value="UNKNOWN">UNKNOWN</option></select><span style={mutedStyle}>{loading ? 'Loading...' : `${filtered.length}/${items.length} snapshots`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.provider?.name ?? '-'} · {item.user?.username ?? item.user?.phone ?? '-'}</h2><p style={mutedStyle}>system {item.systemBalance} · provider {item.providerBalance} · diff {item.difference}</p><p style={smallMutedStyle}>checked {new Date(item.checkedAt).toLocaleString('th-TH')}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminButton tone="secondary" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'Hide payload' : 'Payload'}</AdminButton><AdminButton tone="secondary" disabled={reviewing === item.id} onClick={() => reviewSnapshot(item, 'REVIEWED')}>Review</AdminButton><AdminButton tone="success" disabled={reviewing === item.id} onClick={() => reviewSnapshot(item, 'RESOLVED')}>Resolve</AdminButton></div></AdminRow>{item.status === 'MISMATCH' && <AdminNotice>ยอดไม่ตรง ต้อง manual review ก่อนเปิดเงินจริง</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{JSON.stringify({ rawPayload: item.rawPayload }, null, 2)}</pre>}</AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มี reconciliation snapshot</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
