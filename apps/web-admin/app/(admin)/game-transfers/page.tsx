'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; requestPayload?: unknown; responsePayload?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; session?: { id: string; providerSessionId?: string | null; game?: { name: string; providerGameCode: string } } };
type Payload = { items?: Transfer[]; summary?: { total: number; success: number; failed: number; pending: number } };

export default function GameTransfersPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลดการโยกเงิน...');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState('');
  useEffect(() => { loadTransfers(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code, item.session?.game?.name, item.user?.username, item.user?.phone].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, success: items.filter((item) => item.status === 'SUCCESS').length, failed: items.filter((item) => item.status === 'FAILED').length, pending: items.filter((item) => item.status === 'PENDING').length }, [payload.summary, items]);
  async function loadTransfers() { setLoading(true); setMessage('กำลังโหลดการโยกเงิน...'); const res = await adminApiFetch('/admin/game-transfers'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลดการโยกเงินไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function reviewTransfer(item: Transfer) { const note = window.prompt('หมายเหตุตรวจสอบ'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok) { setMessage(data?.message ?? 'บันทึกหมายเหตุไม่สำเร็จ'); return; } setMessage('บันทึกหมายเหตุแล้ว'); await loadTransfers(); }
  async function retryTransfer(item: Transfer) { const note = window.prompt('เหตุผลที่ลองใหม่'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/retry-dry-run`, { method: 'POST', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok || !data?.ok) { setMessage(data?.message ?? data?.errorMessage ?? 'ลองโยกใหม่ไม่สำเร็จ'); return; } setMessage('ลองโยกใหม่สำเร็จ'); await loadTransfers(); }
  return <AdminPage eyebrow="เกม" title="การโยกเงินเกม" description="ดูว่าเงินเข้าเกม/กลับวอเลตสำเร็จไหม พร้อมตรวจ rollback และรายการที่มีปัญหา" actions={<AdminButton onClick={loadTransfers} disabled={loading}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(metrics.total)} helper="ล่าสุด" /><AdminMetric title="สำเร็จ" value={String(metrics.success)} helper="เงินตรงแล้ว" /><AdminMetric title="กำลังทำ" value={String(metrics.pending)} helper="รอผล" /><AdminMetric title="มีปัญหา" value={String(metrics.failed)} helper="ต้องตรวจ" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา user / ค่าย / tx" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">ทุกสถานะ</option><option value="SUCCESS">สำเร็จ</option><option value="FAILED">มีปัญหา</option><option value="PENDING">กำลังทำ</option><option value="REVERSED">คืนแล้ว</option></select><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${filtered.length}/${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{transferLabel(item.type)} · {formatMoney(item.amount, item.currency)}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.session?.game?.name ?? '-'} · สมาชิก {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>รหัสกันรายการซ้ำ: {item.idempotencyKey}</p><p style={smallMutedStyle}>เลขอ้างอิงค่าย: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>ดู</AdminLinkButton><AdminButton tone="secondary" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'ซ่อนข้อมูลเทคนิค' : 'ข้อมูลเทคนิค'}</AdminButton><AdminButton tone="secondary" onClick={() => reviewTransfer(item)} disabled={working === item.id}>{working === item.id ? 'กำลังทำ...' : 'บันทึกหมายเหตุ'}</AdminButton>{item.status === 'FAILED' && <AdminButton tone="secondary" onClick={() => retryTransfer(item)} disabled={working === item.id}>ลองใหม่</AdminButton>}</div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorMessage}</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{JSON.stringify({ requestPayload: item.requestPayload, responsePayload: item.responsePayload }, null, 2)}</pre>}<p style={smallMutedStyle}>สร้างเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มีรายการโยกเงิน</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function humanStatus(status: string) { const map: Record<string, string> = { SUCCESS: 'สำเร็จ', FAILED: 'มีปัญหา', PENDING: 'กำลังทำ', REVERSED: 'คืนแล้ว', CANCELLED: 'ยกเลิก' }; return map[status] ?? status ?? '-'; }
function transferLabel(type: string) { const map: Record<string, string> = { TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', ROLLBACK: 'คืนเงิน', SYNC: 'ซิงก์ยอด', ADJUSTMENT: 'ปรับยอด' }; return map[type] ?? type ?? 'โยกเงิน'; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
