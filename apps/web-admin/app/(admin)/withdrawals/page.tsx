'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminConfirmDialog, ConfirmDetailRow } from '../_components/admin-confirm-dialog';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type WithdrawalItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; reviewedBy?: string | null; reviewedAt?: string | null; claimedBy?: string | null; claimedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type PendingAction = { id: string; action: 'complete' | 'reject' } | null;

const PAGE_SIZE = 20;

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => { loadItems(status, page); }, [status, page]);
  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, claimed: items.filter((item) => item.claimedBy).length, completed: items.filter((item) => item.status === 'COMPLETED').length, rejected: items.filter((item) => item.status === 'REJECTED').length }), [items]);
  const pendingItem = pendingAction ? items.find((item) => item.id === pendingAction.id) ?? null : null;
  const pendingNote = pendingAction ? (reviewNotes[pendingAction.id] ?? '').trim() : '';

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการถอน...');
    const params = new URLSearchParams();
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/withdrawals?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการถอนไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  function changeStatus(value: string) { setStatus(value); setPage(1); }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id); setMessage(action === 'claim' ? 'กำลังรับงานตรวจถอน...' : 'กำลังปล่อยงานตรวจถอน...');
    const res = await adminApiFetch(`/admin/withdrawals/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานตรวจถอนแล้ว' : 'ปล่อยงานแล้ว');
  }

  function setItemNote(id: string, value: string) { setReviewNotes((current) => ({ ...current, [id]: value })); }

  function requestReview(id: string, action: 'complete' | 'reject') {
    const current = items.find((item) => item.id === id);
    if (!current?.claimedBy) { setMessage('ต้องกดรับงานก่อนตรวจรายการ'); return; }
    if (action === 'reject' && !(reviewNotes[id] ?? '').trim()) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการถอน'); return; }
    setPendingAction({ id, action });
  }

  async function reviewItem(id: string, action: 'complete' | 'reject') {
    const current = items.find((item) => item.id === id);
    const note = (reviewNotes[id] ?? '').trim();
    if (!current?.claimedBy) { setMessage('ต้องกดรับงานก่อนตรวจรายการ'); return; }
    if (action === 'reject' && !note) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการถอน'); return; }
    const nextStatus = action === 'complete' ? 'COMPLETED' : 'REJECTED';
    setBusyId(id); setMessage(action === 'complete' ? 'กำลังปิดรายการถอน...' : 'กำลังปฏิเสธและคืนยอดล็อก...');
    const res = await adminApiFetch(`/admin/withdrawals/${id}/${action}`, { method: 'POST', body: JSON.stringify({ adminNote: note }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const updated = data?.item ?? data?.withdrawal ?? data;
    setItems((current) => { const patched = current.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? note } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNotes((current) => { const next = { ...current }; delete next[id]; return next; });
    setPendingAction(null); setMessage(action === 'complete' ? 'ทำรายการถอนสำเร็จ ระบบตัดยอดแล้ว' : 'ปฏิเสธรายการถอนแล้ว และคืนยอดล็อกแล้ว');
    window.setTimeout(() => loadItems(status, page), 400);
  }

  return <AdminPage eyebrow="Withdrawal Queue" title="ตรวจถอน" description="รับงาน ตรวจบัญชีปลายทาง ยืนยันจ่ายเงินจริง หรือปฏิเสธเพื่อคืนยอดล็อกให้สมาชิก" actions={<AdminButton onClick={() => loadItems()}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid><AdminMetric tone={counts.pending > 0 ? 'warning' : 'success'} title="รอดำเนินการในหน้านี้" value={`${counts.pending}`} /><AdminMetric tone={counts.claimed > 0 ? 'brand' : 'neutral'} title="กำลังตรวจ" value={`${counts.claimed}`} /><AdminMetric tone="success" title="สำเร็จในหน้านี้" value={`${counts.completed}`} /><AdminMetric title="ทั้งหมด" value={`${items.length}`} helper={`${total} รายการ`} /></AdminMetricGrid>
    <AdminToolbar><select value={status} onChange={(event) => changeStatus(event.target.value)} style={selectStyle}><option value="PENDING">รอดำเนินการ</option><option value="COMPLETED">สำเร็จแล้ว</option><option value="REJECTED">ไม่อนุมัติ</option><option value="ALL">ทั้งหมด</option></select><div style={pagerStyle}><AdminButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><span style={pageLabelStyle}>หน้า {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div></AdminToolbar>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminStack>{items.map((item) => {
      const isPending = item.status === 'PENDING';
      const itemNote = reviewNotes[item.id] ?? '';
      return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : item.claimedBy ? 'warning' : 'neutral'}>
        <AdminSectionRow>
          <div style={summaryStyle}><div style={badgeRowStyle}><AdminBadge tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{statusLabel(item.status)}</AdminBadge>{item.claimedBy && <AdminBadge tone="warning">มีคนรับงานแล้ว</AdminBadge>}</div><h2 style={amountStyle}>{formatMoney(item.amount)}</h2><p>สมาชิก: {memberLabel(item)}</p><p>ช่องทาง: {methodLabel(item.method)}</p><p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div>
          <section style={bankBoxStyle}><strong>บัญชีรับเงินปลายทาง</strong><span>{item.accountName || '-'}</span><span>{item.bankName || '-'}</span><span style={accountNumberStyle}>{item.accountNumber || '-'}</span><span>หมายเหตุสมาชิก: {item.note || '-'}</span></section>
        </AdminSectionRow>
        <AdminCard title="ข้อมูลตรวจสอบ" description="รายการถอนต้องจ่ายเงินจริงก่อนกดยืนยันสำเร็จ เพราะปุ่มนี้ไม่ใช่ปุ่มเสริมดวง" tone="neutral"><div style={timelineStyle}><AdminRow><strong>แจ้งถอน</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>{item.claimedAt && <AdminRow><strong>รับงาน</strong><span>{new Date(item.claimedAt).toLocaleString('th-TH')}</span></AdminRow>}{item.reviewedAt && <AdminRow><strong>ตรวจเสร็จ</strong><span>{new Date(item.reviewedAt).toLocaleString('th-TH')}</span></AdminRow>}<AdminRow><strong>ผลต่อยอด</strong><span>{item.status === 'COMPLETED' ? 'ตัดยอดจริงและลด locked balance' : item.status === 'REJECTED' ? 'คืนยอด locked balance' : 'ยอดยังถูกล็อกจนกว่าจะตรวจเสร็จ'}</span></AdminRow>{item.adminNote && <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote}</span></AdminRow>}</div></AdminCard>
        {isPending ? <div style={operationBoxStyle}><div style={actionGridStyle}><AdminButton disabled={busyId === item.id} onClick={() => queueAction(item.id, 'claim')}>รับงาน</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => queueAction(item.id, 'release')} tone="secondary">ปล่อยงาน</AdminButton></div><label style={noteLabelStyle}>หมายเหตุแอดมิน<textarea value={itemNote} onChange={(event) => setItemNote(item.id, event.target.value)} placeholder="จำเป็นเมื่อไม่อนุมัติ / คืนยอด" style={textareaStyle} /></label><div style={dangerActionGridStyle}><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'complete')} tone="success">จ่ายแล้ว / สำเร็จ</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'reject')} tone="danger">ไม่อนุมัติ / คืนยอด</AdminButton></div></div> : <AdminNotice>รายการนี้ตรวจสอบแล้ว: {statusLabel(item.status)}</AdminNotice>}
      </AdminCard>;
    })}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการถอน</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog open={Boolean(pendingAction && pendingItem)} tone={pendingAction?.action === 'complete' ? 'success' : 'danger'} title={pendingAction?.action === 'complete' ? 'ยืนยันปิดรายการถอน' : 'ยืนยันปฏิเสธรายการถอน'} description={pendingAction?.action === 'complete' ? 'ยืนยันเฉพาะเมื่อจ่ายเงินจริงให้สมาชิกแล้วเท่านั้น ระบบจะตัดยอดและลด locked balance' : 'รายการนี้จะถูกปฏิเสธและคืนยอด locked balance ให้สมาชิก'} confirmLabel={pendingAction?.action === 'complete' ? 'ยืนยันว่าจ่ายแล้ว' : 'ยืนยันคืนยอด'} loading={Boolean(busyId)} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction && reviewItem(pendingAction.id, pendingAction.action)} details={pendingItem && <div style={modalDetailsStyle}><ConfirmDetailRow label="สมาชิก" value={memberLabel(pendingItem)} /><ConfirmDetailRow label="จำนวน" value={formatMoney(pendingItem.amount)} /><section style={bankBoxStyle}><strong>บัญชีรับเงินปลายทาง</strong><span>{pendingItem.accountName ?? '-'}</span><span>{pendingItem.bankName ?? '-'}</span><span style={accountNumberStyle}>{pendingItem.accountNumber ?? '-'}</span></section><ConfirmDetailRow label="หมายเหตุสมาชิก" value={pendingItem.note || '-'} /><ConfirmDetailRow label="หมายเหตุแอดมิน" value={pendingNote || '-'} />{pendingAction?.action === 'reject' && <ConfirmDetailRow label="จำเป็น" value="ไม่อนุมัติต้องมีเหตุผล" />}</div>} />
  </AdminPage>;
}

function memberLabel(item: WithdrawalItem) { return item.user?.username ?? item.user?.phone ?? item.userId; }
function methodLabel(method?: string | null) { const map: Record<string, string> = { bank_transfer: 'โอนธนาคาร', promptpay: 'พร้อมเพย์', wallet: 'วอเลต', other: 'อื่น ๆ' }; return method ? map[method] ?? method : '-'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอดำเนินการ', COMPLETED: 'สำเร็จแล้ว', REJECTED: 'ไม่อนุมัติ' }; return map[status] ?? status; }

const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%' } as const;
const pagerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', alignItems: 'center', gap: 10 } as const;
const pageLabelStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 850 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const summaryStyle = { display: 'grid', gap: 6, minWidth: 0 } as const;
const amountStyle = { margin: '4px 0', fontSize: 'clamp(28px, 7vw, 34px)', lineHeight: 1.05, overflowWrap: 'anywhere' as const };
const bankBoxStyle = { border: '1px solid rgba(245,197,66,.28)', borderRadius: 16, padding: 12, display: 'grid', gap: 5, background: 'rgba(245,197,66,.08)', overflowWrap: 'anywhere' as const, minWidth: 0 };
const accountNumberStyle = { fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 950, letterSpacing: '.02em', color: '#f5c542', overflowWrap: 'anywhere' as const };
const operationBoxStyle = { display: 'grid', gap: 12, marginTop: 14, minWidth: 0 } as const;
const actionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 10, minWidth: 0 } as const;
const dangerActionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 10, minWidth: 0 } as const;
const noteLabelStyle = { display: 'grid', gap: 6, fontWeight: 850, minWidth: 0 } as const;
const textareaStyle = { minHeight: 92, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const timelineStyle = { display: 'grid', gap: 8 } as const;
const modalDetailsStyle = { display: 'grid', gap: 10, minWidth: 0 } as const;
