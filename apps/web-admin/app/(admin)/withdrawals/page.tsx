'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminSkeleton, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type WithdrawalStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED_FOR_PAYMENT' | 'PAYMENT_PROOF_UPLOADED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type WithdrawalAction = 'approve-for-payment' | 'verify-payment' | 'reject';
type Item = { id: string; userId: string; amount: string; status: WithdrawalStatus; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; claimedBy?: string | null; createdAt: string; paymentTransactionRef?: string | null; user?: { username?: string; phone?: string | null } };
type ProofDraft = { dataUrl: string; transactionRef: string };
type PendingAction = { item: Item; action: WithdrawalAction };

const FILTERS: WithdrawalStatus[] = ['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'PENDING'];
const PAGE_SIZE = 20;

type WithdrawalsCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; review: string; payment: string; verify: string; totalAmount: string; filteredTotal: string; page: string; perPage: string; allStatuses: string; queueStatus: string; queueStatusAria: string; previous: string; next: string;
  claimed: string; unclaimed: string; paymentDetails: string; paymentDetailsDescription: string; reference: string; memberNote: string; adminNote: string; notePlaceholder: string; claim: string; release: string; processing: string; approvePayment: string; proofFileAria: string; referenceAria: string; referencePlaceholder: string; uploadProof: string; confirmPayment: string; reject: string; closed: string; noItems: string; proofAlt: string;
  dialogMember: string; dialogAccount: string; dialogAmount: string; dialogReason: string; dialogs: Record<WithdrawalAction, { title: string; description: string; confirm: string }>;
  statuses: Record<WithdrawalStatus, string>; messages: { loading: string; loadFailed: string; actionFailed: string; claimed: string; released: string; reasonRequired: string; paymentApproved: string; paymentConfirmed: string; rejected: string; imageRequired: string; imageTooLarge: string; fileReadFailed: string; proofRequired: string; proofUploaded: string; proofUploadFailed: string };
};

const withdrawalsCopy: Record<AdminLocale, WithdrawalsCopy> = {
  th: {
    eyebrow: 'การเงิน', title: 'คิวรายการถอน', description: 'ตรวจคำขอ จ่ายเงิน และยืนยันหลักฐาน', refresh: 'รีเฟรชคิว', loading: 'กำลังโหลด...', review: 'รอตรวจ', payment: 'รอโอนเงิน', verify: 'รอยืนยันหลักฐาน', totalAmount: 'ยอดรวมหน้านี้', filteredTotal: 'ทั้งหมดตามตัวกรอง', page: 'หน้า', perPage: 'รายการต่อหน้า', allStatuses: 'ทุกสถานะ', queueStatus: 'สถานะคิว', queueStatusAria: 'กรองสถานะรายการถอน', previous: 'ก่อนหน้า', next: 'ถัดไป',
    claimed: 'มีผู้รับงานแล้ว', unclaimed: 'ยังไม่มีผู้รับงาน', paymentDetails: 'รายละเอียดการจ่าย', paymentDetailsDescription: 'ตรวจบัญชีและเลขอ้างอิงก่อนยืนยัน', reference: 'เลขอ้างอิง', memberNote: 'หมายเหตุสมาชิก', adminNote: 'หมายเหตุผู้ดูแล', notePlaceholder: 'จำเป็นเมื่อปฏิเสธรายการ', claim: 'รับงาน', release: 'ปล่อยงาน', processing: 'กำลังดำเนินการ...', approvePayment: 'อนุมัติให้โอนเงิน', proofFileAria: 'เลือกไฟล์หลักฐานการโอน', referenceAria: 'เลขอ้างอิงการโอน', referencePlaceholder: 'เลขอ้างอิงการโอน', uploadProof: 'แนบหลักฐาน', confirmPayment: 'ยืนยันหลักฐานและตัดยอด', reject: 'ปฏิเสธและคืนยอดล็อก', closed: 'รายการนี้สิ้นสุดแล้ว', noItems: 'ไม่มีรายการถอนในสถานะนี้', proofAlt: 'หลักฐานการโอนของ',
    dialogMember: 'สมาชิก', dialogAccount: 'บัญชี', dialogAmount: 'จำนวน', dialogReason: 'เหตุผล', dialogs: { 'approve-for-payment': { title: 'อนุมัติให้โอนเงิน', description: 'ตรวจชื่อบัญชี ธนาคาร และยอดเงินให้ถูกต้อง', confirm: 'อนุมัติ' }, 'verify-payment': { title: 'ยืนยันการจ่ายเงิน', description: 'ระบบจะยืนยันหลักฐานและตัดยอดจริง ย้อนกลับไม่ได้', confirm: 'ยืนยันและตัดยอด' }, reject: { title: 'ปฏิเสธรายการถอน', description: 'ระบบจะคืนยอดที่ล็อกไว้ให้สมาชิก', confirm: 'ปฏิเสธรายการ' } },
    statuses: { PENDING: 'รอดำเนินการ', PENDING_REVIEW: 'รอตรวจ', APPROVED_FOR_PAYMENT: 'รอโอนเงิน', PAYMENT_PROOF_UPLOADED: 'รอยืนยันหลักฐาน', COMPLETED: 'สำเร็จ', REJECTED: 'ปฏิเสธ', CANCELLED: 'ยกเลิก' }, messages: { loading: 'กำลังโหลดรายการถอน...', loadFailed: 'โหลดรายการถอนไม่สำเร็จ', actionFailed: 'ทำรายการไม่สำเร็จ', claimed: 'รับงานตรวจถอนแล้ว', released: 'ปล่อยงานแล้ว', reasonRequired: 'ระบุเหตุผลก่อนปฏิเสธ', paymentApproved: 'อนุมัติให้เตรียมจ่ายแล้ว', paymentConfirmed: 'ตรวจหลักฐานและตัดยอดสำเร็จ', rejected: 'ปฏิเสธและคืนยอดล็อกแล้ว', imageRequired: 'เลือกไฟล์รูปภาพ', imageTooLarge: 'ไฟล์หลักฐานต้องไม่เกิน 8 MB', fileReadFailed: 'อ่านไฟล์หลักฐานไม่สำเร็จ', proofRequired: 'แนบหลักฐานและระบุเลขอ้างอิงการโอน', proofUploaded: 'อัปโหลดหลักฐานแล้ว รอตรวจยืนยัน', proofUploadFailed: 'อัปโหลดหลักฐานไม่สำเร็จ' },
  },
  en: {
    eyebrow: 'Finance', title: 'Withdrawal queue', description: 'Review requests, pay, and verify evidence', refresh: 'Refresh queue', loading: 'Loading...', review: 'Awaiting review', payment: 'Awaiting payment', verify: 'Awaiting proof verification', totalAmount: 'Current-page total', filteredTotal: 'Filtered total', page: 'Page', perPage: 'items per page', allStatuses: 'All statuses', queueStatus: 'Queue status', queueStatusAria: 'Filter withdrawal status', previous: 'Previous', next: 'Next',
    claimed: 'Claimed', unclaimed: 'Unclaimed', paymentDetails: 'Payment details', paymentDetailsDescription: 'Verify the account and reference before confirming', reference: 'Reference', memberNote: 'Member note', adminNote: 'Admin note', notePlaceholder: 'Required when rejecting', claim: 'Claim', release: 'Release', processing: 'Processing...', approvePayment: 'Approve payment', proofFileAria: 'Select payment proof image', referenceAria: 'Payment reference', referencePlaceholder: 'Payment reference', uploadProof: 'Upload proof', confirmPayment: 'Verify proof and settle', reject: 'Reject and release hold', closed: 'This item is closed', noItems: 'No withdrawals in this status', proofAlt: 'Payment proof for',
    dialogMember: 'Member', dialogAccount: 'Account', dialogAmount: 'Amount', dialogReason: 'Reason', dialogs: { 'approve-for-payment': { title: 'Approve payment', description: 'Verify the account name, bank, and amount', confirm: 'Approve' }, 'verify-payment': { title: 'Confirm payment', description: 'This verifies the proof and settles the real balance. It cannot be undone.', confirm: 'Verify and settle' }, reject: { title: 'Reject withdrawal', description: 'The held balance will be returned to the member', confirm: 'Reject withdrawal' } },
    statuses: { PENDING: 'Pending', PENDING_REVIEW: 'Awaiting review', APPROVED_FOR_PAYMENT: 'Awaiting payment', PAYMENT_PROOF_UPLOADED: 'Awaiting proof verification', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }, messages: { loading: 'Loading withdrawals...', loadFailed: 'Unable to load withdrawals', actionFailed: 'Unable to complete the action', claimed: 'Withdrawal review claimed', released: 'Work released', reasonRequired: 'Enter a reason before rejecting', paymentApproved: 'Payment approved', paymentConfirmed: 'Proof verified and balance settled', rejected: 'Withdrawal rejected and hold released', imageRequired: 'Select an image file', imageTooLarge: 'Proof image must be 8 MB or smaller', fileReadFailed: 'Unable to read the proof file', proofRequired: 'Attach proof and enter a payment reference', proofUploaded: 'Proof uploaded. Awaiting verification.', proofUploadFailed: 'Unable to upload the proof' },
  },
};

type WithdrawalMessage = keyof WithdrawalsCopy['messages'];

export default function AdminWithdrawalsPage() {
  const [locale] = useAdminLocale();
  const copy = withdrawalsCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string>('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<WithdrawalMessage | ''>('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proofs, setProofs] = useState<Record<string, ProofDraft>>({});
  const [uploadedProofs, setUploadedProofs] = useState<Record<string, { dataUrl: string; transactionRef?: string | null }>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadProofs(items); }, [items]);

  const totals = useMemo(() => ({ review: items.filter((item) => item.status === 'PENDING_REVIEW').length, payment: items.filter((item) => item.status === 'APPROVED_FOR_PAYMENT').length, verify: items.filter((item) => item.status === 'PAYMENT_PROOF_UPLOADED').length, amount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0) }), [items]);
  const queueBusy = loading || Boolean(busyId);
  const showMessage = (nextMessage: WithdrawalMessage | '', tone: NoticeTone = 'neutral') => { setMessage(nextMessage); setMessageTone(tone); };

  async function loadItems(nextStatus = status, nextPage = page) {
    setLoading(true);
    showMessage('loading');
    try {
      const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (nextStatus !== 'ALL') query.set('status', nextStatus);
      const res = await adminApiFetch(`/admin/withdrawals?${query}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      showMessage('');
    } catch {
      setItems([]);
      setPageCount(1);
      setTotal(0);
      showMessage('loadFailed', 'danger');
    } finally { setLoading(false); }
  }

  async function loadProofs(nextItems: Item[]) {
    const targets = nextItems.filter((item) => ['PAYMENT_PROOF_UPLOADED', 'COMPLETED'].includes(item.status) && !uploadedProofs[item.id]);
    await Promise.all(targets.map(async (item) => {
      try {
        const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`);
        const data = await res.json().catch(() => null);
        if (res.ok && data?.dataUrl) setUploadedProofs((current) => ({ ...current, [item.id]: data }));
      } catch { /* Preview is non-blocking. */ }
    }));
  }

  async function claim(item: Item, action: 'claim' | 'release') {
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data } : entry));
      showMessage(action === 'claim' ? 'claimed' : 'released', 'success');
    } catch { showMessage('actionFailed', 'danger'); } finally { setBusyId(''); }
  }

  function requestAction(item: Item, action: WithdrawalAction) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) return showMessage('reasonRequired', 'warning');
    setPendingAction({ item, action });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { item, action } = pendingAction;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${action}`, { method: 'POST', body: JSON.stringify(action === 'reject' ? { adminNote } : { note: adminNote }) });
      if (!res.ok) throw new Error();
      setPendingAction(null);
      showMessage(action === 'approve-for-payment' ? 'paymentApproved' : action === 'verify-payment' ? 'paymentConfirmed' : 'rejected', 'success');
      await loadItems(status, page);
    } catch { showMessage('actionFailed', 'danger'); } finally { setBusyId(''); }
  }

  async function selectProof(item: Item, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showMessage('imageRequired', 'warning');
    if (file.size > 8 * 1024 * 1024) return showMessage('imageTooLarge', 'warning');
    const reader = new FileReader();
    reader.onload = () => setProofs((current) => ({ ...current, [item.id]: { dataUrl: String(reader.result), transactionRef: current[item.id]?.transactionRef ?? '' } }));
    reader.onerror = () => showMessage('fileReadFailed', 'danger');
    reader.readAsDataURL(file);
  }

  async function uploadProof(item: Item) {
    const proof = proofs[item.id];
    if (!proof?.dataUrl || !proof.transactionRef.trim()) return showMessage('proofRequired', 'warning');
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`, { method: 'POST', body: JSON.stringify({ slipImageData: proof.dataUrl, slipImageName: 'payment-proof', transactionRef: proof.transactionRef.trim(), note: (notes[item.id] ?? '').trim() }) });
      if (!res.ok) throw new Error();
      setUploadedProofs((current) => ({ ...current, [item.id]: { dataUrl: proof.dataUrl, transactionRef: proof.transactionRef } }));
      setProofs((current) => { const next = { ...current }; delete next[item.id]; return next; });
      showMessage('proofUploaded', 'success');
      await loadItems(status, page);
    } catch { showMessage('proofUploadFailed', 'danger'); } finally { setBusyId(''); }
  }

  const dialog = pendingAction ? copy.dialogs[pendingAction.action] : null;
  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton size="compact" disabled={queueBusy} onClick={() => void loadItems()}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    <div className="admin-wallet-history"><AdminMetricGrid>
      <AdminMetric tone="warning" title={copy.review} value={formatNumber(totals.review, locale)} helper={`${copy.filteredTotal} ${formatNumber(total, locale)}`} />
      <AdminMetric tone="warning" title={copy.payment} value={formatNumber(totals.payment, locale)} helper={`${copy.page} ${formatNumber(page, locale)} / ${formatNumber(pageCount, locale)}`} />
      <AdminMetric tone="warning" title={copy.verify} value={formatNumber(totals.verify, locale)} helper={`${PAGE_SIZE} ${copy.perPage}`} />
      <AdminMetric tone="brand" title={copy.totalAmount} value={formatMoney(totals.amount)} helper={status === 'ALL' ? copy.allStatuses : statusLabel(status as WithdrawalStatus, copy)} />
    </AdminMetricGrid>
      <AdminToolbar><label className="admin-queue-filter"><span>{copy.queueStatus}</span><select aria-label={copy.queueStatusAria} value={status} disabled={queueBusy} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value, copy)}</option>)}<option value="ALL">{copy.allStatuses}</option></select></label><div className="admin-queue-pager"><AdminButton size="compact" tone="ghost" disabled={page <= 1 || queueBusy} onClick={() => setPage((value) => value - 1)}>{copy.previous}</AdminButton><span aria-live="polite">{copy.page} {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || queueBusy} onClick={() => setPage((value) => value + 1)}>{copy.next}</AdminButton></div></AdminToolbar>
      {message && <AdminNotice tone={messageTone}>{copy.messages[message]}</AdminNotice>}
      {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : <AdminStack>{items.map((item) => {
        const uploadedProof = uploadedProofs[item.id];
        const draftProof = proofs[item.id];
        const isBusy = busyId === item.id;
        const closed = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status);
        return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'neutral'}>
          <AdminSectionRow><div className="admin-wallet-history__reference"><div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status, copy)}</AdminBadge>{item.claimedBy ? <AdminBadge tone="success">{copy.claimed}</AdminBadge> : <AdminBadge>{copy.unclaimed}</AdminBadge>}</div><h2>{formatMoney(item.amount)}</h2><strong>{item.user?.username ?? item.user?.phone ?? item.userId}</strong><span>{new Date(item.createdAt).toLocaleString(dateLocale)}</span><span>{item.accountName ?? '-'} · {item.bankName ?? '-'} · {mask(item.accountNumber)}</span></div>{uploadedProof?.dataUrl && <img src={uploadedProof.dataUrl} alt={`${copy.proofAlt} ${item.user?.username ?? item.userId}`} className="admin-topup-modal-slip" />}</AdminSectionRow>
          <AdminCard title={copy.paymentDetails} description={copy.paymentDetailsDescription}><AdminRow><strong>{copy.reference}</strong><span>{uploadedProof?.transactionRef ?? item.paymentTransactionRef ?? '-'}</span></AdminRow><AdminRow><strong>{copy.memberNote}</strong><span>{item.note ?? '-'}</span></AdminRow><label className="admin-topup-note-field"><span>{copy.adminNote}</span><textarea aria-label={`${copy.adminNote} ${item.id}`} value={notes[item.id] ?? ''} disabled={closed || isBusy} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={copy.notePlaceholder} /></label></AdminCard>
          {!closed ? <div className="admin-topup-operations"><div className="admin-topup-action-grid"><AdminButton size="compact" disabled={isBusy || Boolean(item.claimedBy)} onClick={() => void claim(item, 'claim')}>{isBusy ? copy.processing : copy.claim}</AdminButton><AdminButton size="compact" tone="secondary" disabled={isBusy || !item.claimedBy} onClick={() => void claim(item, 'release')}>{copy.release}</AdminButton></div>{item.status === 'PENDING_REVIEW' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'approve-for-payment')}>{copy.approvePayment}</AdminButton>}{item.status === 'APPROVED_FOR_PAYMENT' && <div className="admin-topup-action-grid"><input aria-label={copy.proofFileAria} type="file" accept="image/*" disabled={isBusy || !item.claimedBy} onChange={(event) => void selectProof(item, event)} /><input aria-label={copy.referenceAria} value={draftProof?.transactionRef ?? ''} disabled={isBusy || !item.claimedBy} onChange={(event) => setProofs((current) => ({ ...current, [item.id]: { dataUrl: current[item.id]?.dataUrl ?? '', transactionRef: event.target.value } }))} placeholder={copy.referencePlaceholder} /><AdminButton disabled={isBusy || !item.claimedBy || !draftProof?.dataUrl || !draftProof.transactionRef.trim()} onClick={() => void uploadProof(item)}>{copy.uploadProof}</AdminButton></div>}{item.status === 'PAYMENT_PROOF_UPLOADED' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy || !uploadedProof?.dataUrl} onClick={() => requestAction(item, 'verify-payment')}>{copy.confirmPayment}</AdminButton>}<AdminButton tone="danger" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'reject')}>{copy.reject}</AdminButton></div> : <AdminNotice tone={item.status === 'COMPLETED' ? 'success' : 'warning'}>{copy.closed}: {statusLabel(item.status, copy)}</AdminNotice>}
        </AdminCard>;
      })}{items.length === 0 && <AdminEmpty>{copy.noItems}</AdminEmpty>}</AdminStack>}
    </div>
    <AdminConfirmDialog open={Boolean(pendingAction)} title={dialog?.title ?? ''} description={dialog?.description ?? ''} confirmLabel={dialog?.confirm ?? ''} tone={pendingAction?.action === 'reject' ? 'danger' : 'success'} busy={Boolean(pendingAction && busyId === pendingAction.item.id)} onCancel={() => { if (!busyId) setPendingAction(null); }} onConfirm={() => void confirmAction()} details={pendingAction ? <><p><strong>{copy.dialogMember}:</strong> {pendingAction.item.user?.username ?? pendingAction.item.userId}</p><p><strong>{copy.dialogAccount}:</strong> {pendingAction.item.accountName ?? '-'} · {pendingAction.item.bankName ?? '-'} · {mask(pendingAction.item.accountNumber)}</p><p><strong>{copy.dialogAmount}:</strong> {formatMoney(pendingAction.item.amount)}</p><p><strong>{copy.dialogReason}:</strong> {(notes[pendingAction.item.id] ?? '').trim() || '-'}</p></> : null} />
  </AdminPage>;
}

function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function mask(value?: string | null) { if (!value) return '-'; return value.length <= 4 ? value : `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`; }
function statusLabel(status: WithdrawalStatus, copy: WithdrawalsCopy) { return copy.statuses[status] ?? status; }
function badgeTone(status: WithdrawalStatus): 'success' | 'warning' | 'danger' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (status === 'REJECTED') return 'danger'; if (['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(status)) return 'warning'; return 'neutral'; }
