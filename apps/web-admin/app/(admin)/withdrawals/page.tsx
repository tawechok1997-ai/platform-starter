'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminSkeleton, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type WithdrawalStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED_FOR_PAYMENT' | 'PAYMENT_PROOF_UPLOADED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type WithdrawalAction = 'approve-for-payment' | 'verify-payment' | 'reject';
type Item = { id: string; userId: string; amount: string; status: WithdrawalStatus; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; claimedBy?: string | null; createdAt: string; paymentTransactionRef?: string | null; user?: { username?: string; phone?: string | null } };
type ProofDraft = { dataUrl: string; transactionRef: string };
type PendingAction = { item: Item; action: WithdrawalAction };

const FILTERS: WithdrawalStatus[] = ['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'PENDING'];
const PAGE_SIZE = 20;

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string>('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proofs, setProofs] = useState<Record<string, ProofDraft>>({});
  const [uploadedProofs, setUploadedProofs] = useState<Record<string, { dataUrl: string; transactionRef?: string | null }>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadProofs(items); }, [items]);

  const totals = useMemo(() => ({
    review: items.filter((item) => item.status === 'PENDING_REVIEW').length,
    payment: items.filter((item) => item.status === 'APPROVED_FOR_PAYMENT').length,
    verify: items.filter((item) => item.status === 'PAYMENT_PROOF_UPLOADED').length,
    amount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  }), [items]);

  function showMessage(nextMessage: string, tone: NoticeTone) { setMessage(nextMessage); setMessageTone(tone); }

  async function loadItems(nextStatus = status, nextPage = page) {
    setLoading(true);
    showMessage('กำลังโหลดรายการถอน...', 'neutral');
    try {
      const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (nextStatus !== 'ALL') query.set('status', nextStatus);
      const res = await adminApiFetch(`/admin/withdrawals?${query}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'โหลดรายการถอนไม่สำเร็จ');
      setItems(Array.isArray(data?.items) ? data.items : []);
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setMessage('');
    } catch (error) {
      setItems([]);
      setPageCount(1);
      setTotal(0);
      showMessage(error instanceof Error ? error.message : 'โหลดรายการถอนไม่สำเร็จ', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function loadProofs(nextItems: Item[]) {
    const targets = nextItems.filter((item) => ['PAYMENT_PROOF_UPLOADED', 'COMPLETED'].includes(item.status) && !uploadedProofs[item.id]);
    await Promise.all(targets.map(async (item) => {
      try {
        const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`);
        const data = await res.json().catch(() => null);
        if (res.ok && data?.dataUrl) setUploadedProofs((current) => ({ ...current, [item.id]: data }));
      } catch {
        // Proof preview is non-blocking; the queue can still be processed from server state.
      }
    }));
  }

  async function claim(item: Item, action: 'claim' | 'release') {
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'ทำรายการไม่สำเร็จ');
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data } : entry));
      showMessage(action === 'claim' ? 'รับงานตรวจถอนแล้ว' : 'ปล่อยงานแล้ว', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ', 'danger');
    } finally {
      setBusyId('');
    }
  }

  function requestAction(item: Item, action: WithdrawalAction) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) return showMessage('กรุณาระบุเหตุผลก่อนปฏิเสธ', 'warning');
    setPendingAction({ item, action });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { item, action } = pendingAction;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST', body: JSON.stringify(action === 'reject' ? { adminNote } : { note: adminNote }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'ทำรายการไม่สำเร็จ');
      setPendingAction(null);
      showMessage(action === 'approve-for-payment' ? 'อนุมัติให้เตรียมจ่ายแล้ว' : action === 'verify-payment' ? 'ตรวจหลักฐานและตัดยอดสำเร็จ' : 'ปฏิเสธและคืนยอดล็อกแล้ว', 'success');
      await loadItems(status, page);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ', 'danger');
    } finally {
      setBusyId('');
    }
  }

  async function selectProof(item: Item, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showMessage('กรุณาเลือกไฟล์รูปภาพ', 'warning');
    if (file.size > 8 * 1024 * 1024) return showMessage('ไฟล์หลักฐานต้องไม่เกิน 8 MB', 'warning');
    const reader = new FileReader();
    reader.onload = () => setProofs((current) => ({ ...current, [item.id]: { dataUrl: String(reader.result), transactionRef: current[item.id]?.transactionRef ?? '' } }));
    reader.onerror = () => showMessage('อ่านไฟล์หลักฐานไม่สำเร็จ', 'danger');
    reader.readAsDataURL(file);
  }

  async function uploadProof(item: Item) {
    const proof = proofs[item.id];
    if (!proof?.dataUrl || !proof.transactionRef.trim()) return showMessage('กรุณาแนบหลักฐานและระบุเลขอ้างอิงการโอน', 'warning');
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`, { method: 'POST', body: JSON.stringify({ slipImageData: proof.dataUrl, slipImageName: 'payment-proof', transactionRef: proof.transactionRef.trim(), note: (notes[item.id] ?? '').trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'อัปโหลดหลักฐานไม่สำเร็จ');
      setUploadedProofs((current) => ({ ...current, [item.id]: { dataUrl: proof.dataUrl, transactionRef: proof.transactionRef } }));
      setProofs((current) => { const next = { ...current }; delete next[item.id]; return next; });
      showMessage('อัปโหลดหลักฐานแล้ว รอตรวจยืนยัน', 'success');
      await loadItems(status, page);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'อัปโหลดหลักฐานไม่สำเร็จ', 'danger');
    } finally {
      setBusyId('');
    }
  }

  const queueBusy = loading || Boolean(busyId);

  return <AdminPage eyebrow="การเงิน" title="คิวตรวจรายการถอน" description="ตรวจคำขอ รับผิดชอบงาน อนุมัติการจ่าย แนบหลักฐาน และยืนยันตัดยอดตามลำดับ" actions={<AdminButton size="compact" disabled={queueBusy} onClick={() => void loadItems()}>{loading ? 'กำลังโหลด...' : 'รีเฟรชคิว'}</AdminButton>}>
    <div className="admin-wallet-history">
      <AdminMetricGrid>
        <AdminMetric tone="warning" title="รอตรวจในหน้านี้" value={`${totals.review}`} helper={`ทั้งหมดตามตัวกรอง ${total}`} />
        <AdminMetric tone="warning" title="รอโอนในหน้านี้" value={`${totals.payment}`} helper={`หน้า ${page} / ${pageCount}`} />
        <AdminMetric tone="warning" title="รอยืนยันหลักฐาน" value={`${totals.verify}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
        <AdminMetric tone="brand" title="ยอดรวมในหน้านี้" value={formatMoney(totals.amount)} helper={status === 'ALL' ? 'ทุกสถานะ' : statusLabel(status as WithdrawalStatus)} />
      </AdminMetricGrid>

      <AdminToolbar>
        <label className="admin-queue-filter"><span>สถานะคิว</span><select aria-label="กรองสถานะรายการถอน" value={status} disabled={queueBusy} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}<option value="ALL">ทั้งหมด</option></select></label>
        <div className="admin-queue-pager"><AdminButton size="compact" tone="ghost" disabled={page <= 1 || queueBusy} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span aria-live="polite">หน้า {page} / {pageCount}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || queueBusy} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div>
      </AdminToolbar>

      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
      {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : <AdminStack>{items.map((item) => {
        const uploadedProof = uploadedProofs[item.id];
        const draftProof = proofs[item.id];
        const isBusy = busyId === item.id;
        const closed = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status);
        return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'neutral'}>
          <AdminSectionRow><div className="admin-wallet-history__reference"><div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.claimedBy ? <AdminBadge tone="success">มีผู้รับงานแล้ว</AdminBadge> : <AdminBadge>ยังไม่มีผู้รับงาน</AdminBadge>}</div><h2>{formatMoney(item.amount)}</h2><strong>{item.user?.username ?? item.user?.phone ?? item.userId}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span><span>{item.accountName ?? '-'} · {item.bankName ?? '-'} · {mask(item.accountNumber)}</span></div>{uploadedProof?.dataUrl && <img src={uploadedProof.dataUrl} alt={`หลักฐานการโอนของ ${item.user?.username ?? item.userId}`} className="admin-topup-modal-slip" />}</AdminSectionRow>

          <AdminCard title="รายละเอียดการจ่าย" description="ตรวจบัญชีและเลขอ้างอิงก่อนยืนยันรายการ">
            <AdminRow><strong>เลขอ้างอิง</strong><span>{uploadedProof?.transactionRef ?? item.paymentTransactionRef ?? '-'}</span></AdminRow>
            <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{item.note ?? '-'}</span></AdminRow>
            <label className="admin-topup-note-field"><span>หมายเหตุผู้ดูแล</span><textarea aria-label={`หมายเหตุรายการถอน ${item.id}`} value={notes[item.id] ?? ''} disabled={closed || isBusy} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธรายการ" /></label>
          </AdminCard>

          {!closed ? <div className="admin-topup-operations">
            <div className="admin-topup-action-grid"><AdminButton size="compact" disabled={isBusy || Boolean(item.claimedBy)} onClick={() => void claim(item, 'claim')}>{isBusy ? 'กำลังดำเนินการ...' : 'รับงาน'}</AdminButton><AdminButton size="compact" tone="secondary" disabled={isBusy || !item.claimedBy} onClick={() => void claim(item, 'release')}>ปล่อยงาน</AdminButton></div>
            {item.status === 'PENDING_REVIEW' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'approve-for-payment')}>อนุมัติให้โอนเงิน</AdminButton>}
            {item.status === 'APPROVED_FOR_PAYMENT' && <div className="admin-topup-action-grid"><input aria-label="เลือกไฟล์หลักฐานการโอน" type="file" accept="image/*" disabled={isBusy || !item.claimedBy} onChange={(event) => void selectProof(item, event)} /><input aria-label="เลขอ้างอิงการโอน" value={draftProof?.transactionRef ?? ''} disabled={isBusy || !item.claimedBy} onChange={(event) => setProofs((current) => ({ ...current, [item.id]: { dataUrl: current[item.id]?.dataUrl ?? '', transactionRef: event.target.value } }))} placeholder="เลขอ้างอิงการโอน" /><AdminButton disabled={isBusy || !item.claimedBy || !draftProof?.dataUrl || !draftProof.transactionRef.trim()} onClick={() => void uploadProof(item)}>แนบหลักฐาน</AdminButton></div>}
            {item.status === 'PAYMENT_PROOF_UPLOADED' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy || !uploadedProof?.dataUrl} onClick={() => requestAction(item, 'verify-payment')}>ยืนยันหลักฐานและตัดยอด</AdminButton>}
            <AdminButton tone="danger" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'reject')}>ปฏิเสธและคืนยอดล็อก</AdminButton>
          </div> : <AdminNotice tone={item.status === 'COMPLETED' ? 'success' : 'warning'}>รายการนี้สิ้นสุดแล้ว: {statusLabel(item.status)}</AdminNotice>}
        </AdminCard>;
      })}{items.length === 0 && <AdminEmpty>ไม่มีรายการถอนในสถานะนี้</AdminEmpty>}</AdminStack>}
    </div>

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction ? actionTitle(pendingAction.action) : ''}
      description={pendingAction ? actionDescription(pendingAction.action) : ''}
      confirmLabel={pendingAction ? actionConfirmLabel(pendingAction.action) : 'ยืนยัน'}
      tone={pendingAction?.action === 'reject' ? 'danger' : 'success'}
      busy={Boolean(pendingAction && busyId === pendingAction.item.id)}
      onCancel={() => { if (!busyId) setPendingAction(null); }}
      onConfirm={() => void confirmAction()}
      details={pendingAction ? <><p><strong>สมาชิก:</strong> {pendingAction.item.user?.username ?? pendingAction.item.userId}</p><p><strong>บัญชี:</strong> {pendingAction.item.accountName ?? '-'} · {pendingAction.item.bankName ?? '-'} · {mask(pendingAction.item.accountNumber)}</p><p><strong>จำนวน:</strong> {formatMoney(pendingAction.item.amount)}</p><p><strong>เหตุผล:</strong> {(notes[pendingAction.item.id] ?? '').trim() || '-'}</p></> : null}
    />
  </AdminPage>;
}

function mask(value?: string | null) { if (!value) return '-'; return value.length <= 4 ? value : `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`; }
function statusLabel(status: WithdrawalStatus) { return ({ PENDING: 'รอดำเนินการ', PENDING_REVIEW: 'รอตรวจ', APPROVED_FOR_PAYMENT: 'รอโอนเงิน', PAYMENT_PROOF_UPLOADED: 'รอยืนยันหลักฐาน', COMPLETED: 'สำเร็จ', REJECTED: 'ปฏิเสธ', CANCELLED: 'ยกเลิก' } as Record<WithdrawalStatus, string>)[status] ?? status; }
function badgeTone(status: WithdrawalStatus): 'success' | 'warning' | 'danger' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (status === 'REJECTED') return 'danger'; if (['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(status)) return 'warning'; return 'neutral'; }
function actionTitle(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'อนุมัติให้โอนเงิน' : action === 'verify-payment' ? 'ยืนยันการจ่ายเงิน' : 'ปฏิเสธรายการถอน'; }
function actionDescription(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'รายการจะเข้าสู่ขั้นตอนโอนเงิน กรุณาตรวจชื่อบัญชี ธนาคาร และยอดเงินให้ถูกต้อง' : action === 'verify-payment' ? 'ระบบจะยืนยันหลักฐานและตัดยอดจริง ขั้นตอนนี้ย้อนกลับไม่ได้' : 'ระบบจะปฏิเสธคำขอและคืนยอดที่ล็อกไว้ให้สมาชิก'; }
function actionConfirmLabel(action: WithdrawalAction) { return action === 'approve-for-payment' ? 'อนุมัติ' : action === 'verify-payment' ? 'ยืนยันและตัดยอด' : 'ปฏิเสธรายการ'; }
