'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; requestPayload?: unknown; responsePayload?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; session?: { id: string; providerSessionId?: string | null; game?: { name: string; providerGameCode: string } } };
type Payload = { items?: Transfer[]; summary?: { total: number; success: number; failed: number; pending: number } };
type PendingAction = { item: Transfer; action: 'review' | 'retry' };

export default function GameTransfersPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [message, setMessage] = useState('กำลังโหลดรายการโยกเงิน...');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { void loadTransfers(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code, item.session?.game?.name, item.user?.username, item.user?.phone].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, success: items.filter((item) => item.status === 'SUCCESS').length, failed: items.filter((item) => item.status === 'FAILED').length, pending: items.filter((item) => item.status === 'PENDING').length }, [payload.summary, items]);

  async function loadTransfers() {
    setLoading(true);
    setMessage('กำลังโหลดรายการโยกเงิน...');
    const res = await adminApiFetch('/admin/game-transfers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage('โหลดรายการโยกเงินไม่สำเร็จ กรุณาลองใหม่'); return; }
    setPayload(data ?? {});
    setMessage('');
  }

  function requestAction(item: Transfer, action: PendingAction['action']) {
    setPendingAction({ item, action });
    setNote('');
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const reason = note.trim();
    if (!reason) { setMessage('กรุณาระบุเหตุผลหรือหมายเหตุก่อนดำเนินการ'); return; }
    const { item, action } = pendingAction;
    setWorking(item.id);
    const endpoint = action === 'review' ? `/admin/game-transfers/${item.id}/review` : `/admin/game-transfers/${item.id}/retry-dry-run`;
    const res = await adminApiFetch(endpoint, { method: action === 'review' ? 'PATCH' : 'POST', body: JSON.stringify({ note: reason }) });
    const data = await res.json().catch(() => null);
    setWorking('');
    if (!res.ok || (action === 'retry' && !data?.ok)) { setMessage('ดำเนินการไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และสถานะรายการ'); return; }
    setPendingAction(null);
    setNote('');
    setMessage(action === 'review' ? 'บันทึกหมายเหตุแล้ว' : 'ทดสอบรายการใหม่สำเร็จ');
    await loadTransfers();
  }

  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="รายการโยกเงินเกม" description="ตรวจเงินเข้าเกม เงินกลับกระเป๋า การคืนรายการ และรายการที่ต้องติดตาม" actions={<AdminButton onClick={() => void loadTransfers()} disabled={loading}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="ทั้งหมด" value={String(metrics.total)} />
      <AdminMetric title="สำเร็จ" value={String(metrics.success)} tone="success" />
      <AdminMetric title="กำลังดำเนินการ" value={String(metrics.pending)} tone={metrics.pending ? 'warning' : 'success'} />
      <AdminMetric title="มีปัญหา" value={String(metrics.failed)} tone={metrics.failed ? 'danger' : 'success'} />
    </AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาสมาชิก ค่าย หรือรหัสรายการ" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">ทุกสถานะ</option><option value="SUCCESS">สำเร็จ</option><option value="FAILED">มีปัญหา</option><option value="PENDING">กำลังดำเนินการ</option><option value="REVERSED">คืนแล้ว</option></select><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${filtered.length}/${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}>
      <AdminRow>
        <div><h2 style={titleStyle}>{transferLabel(item.type)} · {formatMoney(item.amount, item.currency)}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.session?.game?.name ?? '-'} · สมาชิก {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>รหัสกันรายการซ้ำ: {item.idempotencyKey}</p><p style={smallMutedStyle}>เลขอ้างอิงค่าย: {item.providerTransactionId ?? '-'}</p></div>
        <div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>ดูรายละเอียด</AdminLinkButton><AdminButton tone="secondary" onClick={() => requestAction(item, 'review')} disabled={working === item.id}>{working === item.id ? 'กำลังทำ...' : 'บันทึกผลตรวจ'}</AdminButton>{item.status === 'FAILED' && <AdminButton tone="secondary" onClick={() => requestAction(item, 'retry')} disabled={working === item.id}>ทดสอบใหม่</AdminButton>}</div>
      </AdminRow>
      {item.status === 'FAILED' && <AdminNotice tone="danger">รายการนี้ดำเนินการไม่สำเร็จ กรุณาตรวจสอบขั้นตอนและลองใหม่ตามสิทธิ์ที่ได้รับ</AdminNotice>}
      <p style={smallMutedStyle}>สร้างเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}</p>
    </AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มีรายการโยกเงินตามตัวกรอง</AdminEmpty>}</AdminStack>

    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction ? (pendingAction.action === 'review' ? 'บันทึกผลตรวจรายการ' : 'ทดสอบรายการใหม่') : ''} description={pendingAction?.action === 'review' ? 'หมายเหตุจะถูกบันทึกไว้กับรายการเพื่อใช้ติดตามและตรวจสอบย้อนหลัง' : 'ระบบจะเรียกขั้นตอนทดสอบซ้ำแบบไม่ควรเปลี่ยนยอดเงินจริง'} confirmLabel={pendingAction?.action === 'review' ? 'บันทึกผลตรวจ' : 'ทดสอบใหม่'} tone={pendingAction?.action === 'retry' ? 'primary' : 'success'} busy={Boolean(pendingAction && working === pendingAction.item.id)} onCancel={() => { setPendingAction(null); setNote(''); }} onConfirm={() => void confirmAction()} details={<label style={noteStyle}><span>เหตุผล / หมายเหตุ</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="ระบุข้อมูลให้ผู้ตรวจคนถัดไปเข้าใจ" style={textareaStyle} /></label>} />
  </AdminPage>;
}

function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function humanStatus(status: string) { const map: Record<string, string> = { SUCCESS: 'สำเร็จ', FAILED: 'มีปัญหา', PENDING: 'กำลังดำเนินการ', REVERSED: 'คืนแล้ว', CANCELLED: 'ยกเลิก' }; return map[status] ?? status ?? '-'; }
function transferLabel(type: string) { const map: Record<string, string> = { TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับกระเป๋า', ROLLBACK: 'คืนเงิน', SYNC: 'ซิงก์ยอด', ADJUSTMENT: 'ปรับยอด' }; return map[type] ?? type ?? 'โยกเงิน'; }
function formatMoney(value: string | number | null | undefined, currency: string) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };

const noteStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const textareaStyle = { minHeight: 100, width: '100%', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const };
