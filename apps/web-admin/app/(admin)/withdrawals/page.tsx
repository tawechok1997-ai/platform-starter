'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type WithdrawalStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED_FOR_PAYMENT' | 'PAYMENT_PROOF_UPLOADED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type Item = { id: string; userId: string; amount: string; status: WithdrawalStatus; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; claimedBy?: string | null; createdAt: string; paymentTransactionRef?: string | null; user?: { username?: string; phone?: string | null } };
type ProofDraft = { dataUrl: string; transactionRef: string };
type WithdrawalAction = 'approve-for-payment' | 'verify-payment' | 'reject';
type PendingAction = { item: Item; action: WithdrawalAction };
const FILTERS: WithdrawalStatus[] = ['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'PENDING'];
const PAGE_SIZE = 20;

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string>('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proofs, setProofs] = useState<Record<string, ProofDraft>>({});
  const [uploadedProofs, setUploadedProofs] = useState<Record<string, { dataUrl: string; transactionRef?: string | null }>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadProofs(items); }, [items]);
  const totals = useMemo(() => ({ review: items.filter((item) => item.status === 'PENDING_REVIEW').length, payment: items.filter((item) => item.status === 'APPROVED_FOR_PAYMENT').length, verify: items.filter((item) => item.status === 'PAYMENT_PROOF_UPLOADED').length, done: items.filter((item) => item.status === 'COMPLETED').length }), [items]);

  function showMessage(nextMessage: string, tone: NoticeTone) {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function loadItems(nextStatus = status, nextPage = page) {
    showMessage('กำลังโหลดรายการถอน...', 'neutral');
    const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
    if (nextStatus !== 'ALL') query.set('status', nextStatus);
    const res = await adminApiFetch(`/admin/withdrawals?${query}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) return showMessage(data?.message ?? 'โหลดรายการถอนไม่สำเร็จ', 'danger');
    setItems(data.items ?? []); setPageCount(Math.max(Number(data.pageCount ?? 1), 1)); setMessage('');
  }

  async function loadProofs(nextItems: Item[]) {
    const targets = nextItems.filter((item) => ['PAYMENT_PROOF_UPLOADED', 'COMPLETED'].includes(item.status) && !uploadedProofs[item.id]);
    await Promise.all(targets.map(async (item) => { const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`); const data = await res.json().catch(() => null); if (res.ok && data?.dataUrl) setUploadedProofs((current) => ({ ...current, [item.id]: data })); }));
  }

  async function claim(item: Item, action: 'claim' | 'release') {
    setBusyId(item.id); const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST' }); const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) return showMessage(data?.message ?? 'ทำรายการไม่สำเร็จ', 'danger');
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data } : entry)); showMessage(action === 'claim' ? 'รับงานตรวจถอนแล้ว' : 'ปล่อยงานแล้ว', 'success');
  }

  function requestRun(item: Item, action: WithdrawalAction) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) {
      showMessage('กรุณาระบุเหตุผลก่อนปฏิเสธ', 'warning');
      return;
    }
    setPendingAction({ item, action });
  }

  async function confirmRun() {
    if (!pendingAction) return;
    const { item, action } = pendingAction;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST', body: JSON.stringify(action === 'reject' ? { adminNote } : { note: adminNote }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) return showMessage(data?.message ?? 'ทำรายการไม่สำเร็จ', 'danger');
    setPendingAction(null);
    showMessage(action === 'approve-for-payment' ? 'อนุมัติให้เตรียมจ่ายแล้ว' : action === 'verify-payment' ? 'ตรวจหลักฐานและตัดยอดสำเร็จ' : 'ปฏิเสธและคืนยอดล็อกแล้ว', 'success');
    void loadItems(status, page);
  }

  async function selectProof(item: Item, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) return showMessage('กรุณาเลือกไฟล์รูปภาพ', 'warning');
    const reader = new FileReader(); reader.onload = () => setProofs((current) => ({ ...current, [item.id]: { dataUrl: String(reader.result), transactionRef: current[item.id]?.transactionRef ?? '' } })); reader.onerror = () => showMessage('อ่านไฟล์หลักฐานไม่สำเร็จ', 'danger'); reader.readAsDataURL(file);
  }

  async function uploadProof(item: Item) {
    const proof = proofs[item.id]; if (!proof?.dataUrl || !proof.transactionRef.trim()) return showMessage('กรุณาแนบหลักฐานและระบุเลขอ้างอิงการโอน', 'warning');
    setBusyId(item.id); const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`, { method: 'POST', body: JSON.stringify({ slipImageData: proof.dataUrl, slipImageName: 'payment-proof', transactionRef: proof.transactionRef.trim(), note: (notes[item.id] ?? '').trim() }) }); const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) return showMessage(data?.message ?? 'อัปโหลดหลักฐานไม่สำเร็จ', 'danger');
    setUploadedProofs((current) => ({ ...current, [item.id]: { dataUrl: proof.dataUrl, transactionRef: proof.transactionRef } })); showMessage('อัปโหลดหลักฐานแล้ว รอตรวจยืนยัน', 'success'); void loadItems(status, page);
  }

  return <AdminPage eyebrow="Withdrawal Operations" title="ตรวจถอน" description="อนุมัติ เตรียมจ่าย แนบหลักฐาน และยืนยันการจ่ายเป็นขั้นตอน" actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid><AdminMetric tone="warning" title="รอตรวจ" value={`${totals.review}`} /><AdminMetric tone="warning" title="รอจ่าย" value={`${totals.payment}`} /><AdminMetric tone="warning" title="รอตรวจหลักฐาน" value={`${totals.verify}`} /><AdminMetric tone="success" title="สำเร็จ" value={`${totals.done}`} /></AdminMetricGrid>
    <AdminToolbar><label className="admin-queue-filter"><span>สถานะ</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}<option value="ALL">ทั้งหมด</option></select></label><div className="admin-queue-pager"><AdminButton disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div></AdminToolbar>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminStack>{items.map((item) => {
      const uploadedProof = uploadedProofs[item.id];
      const draftProof = proofs[item.id];
      return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'neutral'}><AdminSectionRow><div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status)}</AdminBadge><h2>{formatMoney(item.amount)}</h2><p>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>{item.accountName ?? '-'} · {item.bankName ?? '-'} · {mask(item.accountNumber)}</p></div>{uploadedProof?.dataUrl && <img src={uploadedProof.dataUrl} alt="หลักฐานการโอน" className="admin-topup-modal-slip" />}</AdminSectionRow><AdminCard title="การดำเนินการ" description="ต้องรับงานก่อนทำขั้นตอนที่เปลี่ยนยอดเงิน"><AdminRow><strong>เลขอ้างอิงจ่าย</strong><span>{uploadedProof?.transactionRef ?? item.paymentTransactionRef ?? '-'}</span></AdminRow><label className="admin-topup-note-field"><span>หมายเหตุแอดมิน</span><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" /></label></AdminCard>{!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) ? <div className="admin-topup-operations"><div className="admin-topup-action-grid"><AdminButton disabled={busyId === item.id} onClick={() => void claim(item, 'claim')}>รับงาน</AdminButton><AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => void claim(item, 'release')}>ปล่อยงาน</AdminButton></div>{item.status === 'PENDING_REVIEW' && <AdminButton tone="success" disabled={busyId === item.id || !item.claimedBy} onClick={() => requestRun(item, 'approve-for-payment')}>อนุมัติเตรียมจ่าย</AdminButton>}{item.status === 'APPROVED_FOR_PAYMENT' && <div className="admin-topup-action-grid"><input type="file" accept="image/*" onChange={(event) => void selectProof(item, event)} /><input value={draftProof?.transactionRef ?? ''} onChange={(event) => setProofs((current) => ({ ...current, [item.id]: { dataUrl: current[item.id]?.dataUrl ?? '', transactionRef: event.target.value } }))} placeholder="เลขอ้างอิงการโอน" /><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => void uploadProof(item)}>อัปโหลดหลักฐาน</AdminButton></div>}{item.status === 'PAYMENT_PROOF_UPLOADED' && <AdminButton tone="success" disabled={busyId === item.id || !item.claimedBy || !uploadedProof?.dataUrl} onClick={() => requestRun(item, 'verify-payment')}>ตรวจหลักฐานและตัดยอด</AdminButton>}<AdminButton tone="danger" disabled={busyId === item.id || !item.claimedBy} onClick={() => requestRun(item, 'reject')}>ปฏิเสธและคืนยอดล็อก</AdminButton></div> : <AdminNotice tone="warning">รายการนี้สิ้นสุดแล้ว</AdminNotice>}</AdminCard>;
    })}{items.length === 0 && <AdminEmpty>ไม่มีรายการในสถานะนี้</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction ? actionTitle(pendingAction.action) : 'ยืนยันการทำรายการถอน'}
      description={pendingAction ? actionDescription(pendingAction.action) : ''}
      confirmLabel={pendingAction ? actionConfirmLabel(pendingAction.action) : 'ยืนยัน'}
      tone={pendingAction?.action === 'reject' ? 'danger' : 'success'}
      busy={Boolean(pendingAction && busyId === pendingAction.item.id)}
      details={pendingAction ? <div><strong>{formatMoney(pendingAction.item.amount)}</strong><p>{pendingAction.item.user?.username ?? pendingAction.item.user?.phone ?? pendingAction.item.userId}</p>{(notes[pendingAction.item.id] ?? '').trim() && <p>หมายเหตุ: {(notes[pendingAction.item.id] ?? '').trim()}</p>}</div> : null}
      onCancel={() => { if (!busyId) setPendingAction(null); }}
      onConfirm={() => void confirmRun()}
    />
  </AdminPage>;
}

function mask(value?: string | null) { if (!value) return '-'; return value.length <= 4 ? value : `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`; }
function statusLabel(status: WithdrawalStatus) { return ({ PENDING: 'รอดำเนินการ', PENDING_REVIEW: 'รอตรวจ', APPROVED_FOR_PAYMENT: 'รอโอนเงิน', PAYMENT_PROOF_UPLOADED: 'รอตรวจหลักฐาน', COMPLETED: 'สำเร็จ', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิก' } as Record<WithdrawalStatus, string>)[status]; }
function badgeTone(status: WithdrawalStatus): 'success' | 'warning' | 'danger' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (status === 'REJECTED') return 'danger'; if (['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(status)) return 'warning'; return 'neutral'; }
function actionTitle(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'อนุมัติให้เตรียมจ่าย' : action === 'verify-payment' ? 'ยืนยันหลักฐานและตัดยอด' : 'ปฏิเสธรายการถอน'; }
function actionDescription(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'รายการจะเข้าสู่ขั้นตอนโอนเงินจริง กรุณาตรวจข้อมูลบัญชีและยอดเงินอีกครั้ง' : action === 'verify-payment' ? 'ระบบจะยืนยันการจ่ายและตัดยอดจริง การกระทำนี้ย้อนกลับไม่ได้' : 'ระบบจะปฏิเสธรายการและคืนยอดเงินที่ล็อกไว้ให้สมาชิก'; }
function actionConfirmLabel(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'อนุมัติเตรียมจ่าย' : action === 'verify-payment' ? 'ยืนยันและตัดยอด' : 'ปฏิเสธและคืนยอด'; }
