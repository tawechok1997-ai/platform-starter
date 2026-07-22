'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSectionRow, AdminSkeleton, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type DepositStatus = 'PENDING' | 'PENDING_SLIP_REVIEW' | 'PENDING_CREDIT' | 'COMPLETED' | 'DUPLICATE' | 'REJECTED' | 'CANCELLED' | 'APPROVED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type DepositAction = 'approve-slip' | 'confirm-credit' | 'reject';
type TopUpItem = { id: string; userId: string; amount: string; currency: string; status: DepositStatus; note?: string | null; adminNote?: string | null; claimedBy?: string | null; claimedAt?: string | null; createdAt: string; reviewedAt?: string | null; user?: { username?: string; phone?: string | null; email?: string | null } };
type PendingAction = { item: TopUpItem; action: DepositAction };

const PAGE_SIZE = 20;
const FILTERS: DepositStatus[] = ['PENDING', 'PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED', 'DUPLICATE', 'REJECTED', 'CANCELLED', 'APPROVED'];

type TopUpCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; waitingSlip: string; waitingCredit: string; completed: string; rejected: string; filteredTotal: string; page: string; perPage: string; currentPageOnly: string;
  queueStatus: string; queueStatusAria: string; all: string; previous: string; next: string; claimed: string; unclaimed: string; member: string; createdAt: string; slipAlt: string; review: string; reviewDescription: string; memberNote: string; adminNote: string; claimedAt: string; claim: string; release: string; notePlaceholder: string; approveSlip: string; confirmCredit: string; reject: string; closed: string; noItems: string;
  dialogMember: string; dialogAmount: string; dialogReason: string; dialogs: Record<DepositAction, { title: string; description: string; confirm: string }>;
  statuses: Record<DepositStatus, string>; messages: { loading: string; loadFailed: string; actionFailed: string; claimed: string; released: string; reasonRequired: string; slipApproved: string; creditConfirmed: string; rejected: string };
};

const topUpCopy: Record<AdminLocale, TopUpCopy> = {
  th: {
    eyebrow: 'การเงิน', title: 'คิวรายการฝาก', description: 'ตรวจสลิปและยืนยันเครดิต', refresh: 'รีเฟรชคิว', loading: 'กำลังโหลด...', waitingSlip: 'รอตรวจสลิป', waitingCredit: 'รอยืนยันเครดิต', completed: 'สำเร็จ', rejected: 'ปฏิเสธหรือซ้ำ', filteredTotal: 'ทั้งหมดตามตัวกรอง', page: 'หน้า', perPage: 'รายการต่อหน้า', currentPageOnly: 'เฉพาะหน้านี้',
    queueStatus: 'สถานะคิว', queueStatusAria: 'กรองสถานะรายการฝาก', all: 'ทั้งหมด', previous: 'ก่อนหน้า', next: 'ถัดไป', claimed: 'มีผู้รับงานแล้ว', unclaimed: 'ยังไม่มีผู้รับงาน', member: 'สมาชิก', createdAt: 'สร้างเมื่อ', slipAlt: 'สลิปฝากของ', review: 'การตรวจสอบ', reviewDescription: 'รับงานก่อนเปลี่ยนสถานะหรือเพิ่มเครดิต', memberNote: 'หมายเหตุสมาชิก', adminNote: 'หมายเหตุแอดมิน', claimedAt: 'รับงานเมื่อ', claim: 'รับงาน', release: 'ปล่อยงาน', notePlaceholder: 'จำเป็นเมื่อปฏิเสธ', approveSlip: 'สลิปถูกต้อง → รอยืนยันเครดิต', confirmCredit: 'ยืนยันเพิ่มเครดิต', reject: 'ปฏิเสธรายการ', closed: 'รายการนี้เปลี่ยนสถานะต่อไม่ได้', noItems: 'ไม่มีรายการในสถานะนี้',
    dialogMember: 'สมาชิก', dialogAmount: 'ยอดเงิน', dialogReason: 'เหตุผล', dialogs: { 'approve-slip': { title: 'ยืนยันผลตรวจสลิป', description: 'รายการจะเข้าสู่ขั้นยืนยันเครดิต', confirm: 'อนุมัติสลิป' }, 'confirm-credit': { title: 'ยืนยันเพิ่มเครดิต', description: 'ระบบจะเพิ่มเงินเข้ากระเป๋าสมาชิก ย้อนกลับไม่ได้', confirm: 'เพิ่มเครดิต' }, reject: { title: 'ยืนยันปฏิเสธรายการ', description: 'ระบบจะบันทึกเหตุผลในบันทึกการตรวจสอบ', confirm: 'ปฏิเสธรายการ' } },
    statuses: { PENDING: 'รอส่งสลิป', PENDING_SLIP_REVIEW: 'รอตรวจสลิป', PENDING_CREDIT: 'รอยืนยันเครดิต', COMPLETED: 'สำเร็จ', DUPLICATE: 'สลิปซ้ำ', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิก', APPROVED: 'อนุมัติแล้ว' }, messages: { loading: 'กำลังโหลดรายการฝาก...', loadFailed: 'โหลดรายการฝากไม่สำเร็จ', actionFailed: 'ทำรายการไม่สำเร็จ', claimed: 'รับงานตรวจฝากแล้ว', released: 'ปล่อยงานแล้ว', reasonRequired: 'ระบุเหตุผลก่อนปฏิเสธรายการฝาก', slipApproved: 'ตรวจสลิปผ่านแล้ว รอยืนยันเครดิต', creditConfirmed: 'เพิ่มเครดิตสำเร็จ', rejected: 'ปฏิเสธรายการฝากแล้ว' },
  },
  en: {
    eyebrow: 'Finance', title: 'Deposit queue', description: 'Review slips and confirm credits', refresh: 'Refresh queue', loading: 'Loading...', waitingSlip: 'Awaiting slip review', waitingCredit: 'Awaiting credit', completed: 'Completed', rejected: 'Rejected or duplicate', filteredTotal: 'Filtered total', page: 'Page', perPage: 'items per page', currentPageOnly: 'Current page only',
    queueStatus: 'Queue status', queueStatusAria: 'Filter deposit status', all: 'All', previous: 'Previous', next: 'Next', claimed: 'Claimed', unclaimed: 'Unclaimed', member: 'Member', createdAt: 'Created', slipAlt: 'Deposit slip for', review: 'Review', reviewDescription: 'Claim before changing status or crediting', memberNote: 'Member note', adminNote: 'Admin note', claimedAt: 'Claimed at', claim: 'Claim', release: 'Release', notePlaceholder: 'Required when rejecting', approveSlip: 'Slip valid → Awaiting credit', confirmCredit: 'Confirm credit', reject: 'Reject', closed: 'This item cannot change status', noItems: 'No items in this status',
    dialogMember: 'Member', dialogAmount: 'Amount', dialogReason: 'Reason', dialogs: { 'approve-slip': { title: 'Confirm slip review', description: 'This item will move to credit confirmation', confirm: 'Approve slip' }, 'confirm-credit': { title: 'Confirm credit', description: 'This adds money to the member wallet and cannot be undone', confirm: 'Credit wallet' }, reject: { title: 'Confirm rejection', description: 'The reason will be written to the audit log', confirm: 'Reject item' } },
    statuses: { PENDING: 'Awaiting slip', PENDING_SLIP_REVIEW: 'Awaiting slip review', PENDING_CREDIT: 'Awaiting credit', COMPLETED: 'Completed', DUPLICATE: 'Duplicate slip', REJECTED: 'Rejected', CANCELLED: 'Cancelled', APPROVED: 'Approved' }, messages: { loading: 'Loading deposits...', loadFailed: 'Unable to load deposits', actionFailed: 'Unable to complete the action', claimed: 'Deposit review claimed', released: 'Work released', reasonRequired: 'Enter a reason before rejecting the deposit', slipApproved: 'Slip approved. Awaiting credit confirmation.', creditConfirmed: 'Credit confirmed', rejected: 'Deposit rejected' },
  },
};

type TopUpMessage = keyof TopUpCopy['messages'];

export default function AdminTopUpsPage() {
  const [locale] = useAdminLocale();
  const copy = topUpCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState<string>('PENDING_SLIP_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<TopUpMessage | ''>('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [slips, setSlips] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadSlips(items); }, [items]);

  const counts = useMemo(() => ({ waitingSlip: items.filter((item) => item.status === 'PENDING_SLIP_REVIEW').length, waitingCredit: items.filter((item) => item.status === 'PENDING_CREDIT').length, done: items.filter((item) => item.status === 'COMPLETED').length, rejected: items.filter((item) => ['REJECTED', 'DUPLICATE'].includes(item.status)).length }), [items]);
  const queueBusy = loading || Boolean(busyId);
  const showMessage = (nextMessage: TopUpMessage | '', tone: NoticeTone = 'neutral') => { setMessage(nextMessage); setMessageTone(tone); };

  async function loadItems(nextStatus = status, nextPage = page) {
    setLoading(true);
    showMessage('loading');
    try {
      const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (nextStatus !== 'ALL') query.set('status', nextStatus);
      const res = await adminApiFetch(`/admin/topups?${query}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      showMessage('');
    } catch {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      showMessage('loadFailed', 'danger');
    } finally { setLoading(false); }
  }

  async function loadSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED'].includes(item.status) && !slips[item.id]);
    await Promise.all(targets.map(async (item) => {
      try {
        const res = await adminApiFetch(`/admin/topups/${item.id}/slip`);
        const data = await res.json().catch(() => null);
        if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: data.dataUrl }));
      } catch { /* Slip preview is non-blocking. */ }
    }));
  }

  async function claim(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    try {
      const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
      showMessage(action === 'claim' ? 'claimed' : 'released', 'success');
    } catch { showMessage('actionFailed', 'danger'); } finally { setBusyId(''); }
  }

  function requestAction(item: TopUpItem, action: DepositAction) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) return showMessage('reasonRequired', 'warning');
    setPendingAction({ item, action });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    const { item, action } = pendingAction;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/topups/${item.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminNote }) });
      if (!res.ok) throw new Error();
      setPendingAction(null);
      showMessage(action === 'approve-slip' ? 'slipApproved' : action === 'confirm-credit' ? 'creditConfirmed' : 'rejected', 'success');
      await loadItems(status, page);
    } catch { showMessage('actionFailed', 'danger'); } finally { setBusyId(''); }
  }

  const dialog = pendingAction ? copy.dialogs[pendingAction.action] : null;
  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton size="compact" disabled={queueBusy} onClick={() => void loadItems()}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric tone={counts.waitingSlip ? 'warning' : 'success'} title={copy.waitingSlip} value={formatNumber(counts.waitingSlip, locale)} helper={`${copy.filteredTotal} ${formatNumber(total, locale)}`} />
      <AdminMetric tone={counts.waitingCredit ? 'warning' : 'success'} title={copy.waitingCredit} value={formatNumber(counts.waitingCredit, locale)} helper={`${copy.page} ${formatNumber(page, locale)} / ${formatNumber(pageCount, locale)}`} />
      <AdminMetric tone="success" title={copy.completed} value={formatNumber(counts.done, locale)} helper={copy.currentPageOnly} />
      <AdminMetric tone={counts.rejected ? 'danger' : 'neutral'} title={copy.rejected} value={formatNumber(counts.rejected, locale)} helper={`${PAGE_SIZE} ${copy.perPage}`} />
    </AdminMetricGrid>
    <AdminToolbar>
      <label className="admin-queue-filter"><span>{copy.queueStatus}</span><select aria-label={copy.queueStatusAria} value={status} disabled={queueBusy} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value, copy)}</option>)}<option value="ALL">{copy.all}</option></select></label>
      <div className="admin-queue-pager"><AdminButton size="compact" tone="ghost" disabled={page <= 1 || queueBusy} onClick={() => setPage((value) => value - 1)}>{copy.previous}</AdminButton><span aria-live="polite">{copy.page} {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || queueBusy} onClick={() => setPage((value) => value + 1)}>{copy.next}</AdminButton></div>
    </AdminToolbar>
    {message && <AdminNotice tone={messageTone}>{copy.messages[message]}</AdminNotice>}
    {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : <AdminStack>{items.map((item) => {
      const actionable = ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(item.status);
      const isBusy = busyId === item.id;
      return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : ['REJECTED', 'DUPLICATE'].includes(item.status) ? 'danger' : 'neutral'}>
        <AdminSectionRow><div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status, copy)}</AdminBadge>{item.claimedBy ? <AdminBadge tone="success">{copy.claimed}</AdminBadge> : <AdminBadge>{copy.unclaimed}</AdminBadge>}<h2>{formatMoney(item.amount)}</h2><p>{copy.member}: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>{copy.createdAt}: {new Date(item.createdAt).toLocaleString(dateLocale)}</p></div>{slips[item.id] && <img src={slips[item.id]} alt={`${copy.slipAlt} ${item.user?.username ?? item.userId}`} className="admin-topup-modal-slip" />}</AdminSectionRow>
        <AdminCard title={copy.review} description={copy.reviewDescription}>
          <AdminRow><strong>{copy.memberNote}</strong><span>{memberNote(item.note)}</span></AdminRow>
          <AdminRow><strong>{copy.adminNote}</strong><span>{item.adminNote || notes[item.id] || '-'}</span></AdminRow>
          {item.claimedAt && <AdminRow><strong>{copy.claimedAt}</strong><span>{new Date(item.claimedAt).toLocaleString(dateLocale)}</span></AdminRow>}
        </AdminCard>
        {actionable ? <div className="admin-topup-operations"><div className="admin-topup-action-grid"><AdminButton disabled={isBusy} onClick={() => void claim(item.id, 'claim')}>{copy.claim}</AdminButton><AdminButton tone="secondary" disabled={isBusy || !item.claimedBy} onClick={() => void claim(item.id, 'release')}>{copy.release}</AdminButton></div><label className="admin-topup-note-field"><span>{copy.adminNote}</span><textarea disabled={isBusy} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={copy.notePlaceholder} /></label>{item.status === 'PENDING_SLIP_REVIEW' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'approve-slip')}>{copy.approveSlip}</AdminButton>}{item.status === 'PENDING_CREDIT' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'confirm-credit')}>{copy.confirmCredit}</AdminButton>}<AdminButton tone="danger" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'reject')}>{copy.reject}</AdminButton></div> : <AdminNotice tone="warning">{copy.closed}</AdminNotice>}
      </AdminCard>;
    })}{items.length === 0 && <AdminEmpty>{copy.noItems}</AdminEmpty>}</AdminStack>}
    <AdminConfirmDialog open={Boolean(pendingAction)} title={dialog?.title ?? ''} description={dialog?.description ?? ''} confirmLabel={dialog?.confirm ?? ''} tone={pendingAction?.action === 'reject' ? 'danger' : 'success'} busy={Boolean(pendingAction && busyId === pendingAction.item.id)} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmPendingAction()} details={pendingAction ? <><p><strong>{copy.dialogMember}:</strong> {pendingAction.item.user?.username ?? pendingAction.item.userId}</p><p><strong>{copy.dialogAmount}:</strong> {formatMoney(pendingAction.item.amount)}</p><p><strong>{copy.dialogReason}:</strong> {(notes[pendingAction.item.id] ?? '').trim() || '-'}</p></> : null} />
  </AdminPage>;
}

function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function memberNote(value?: string | null) { if (!value) return '-'; try { const parsed = JSON.parse(value); return parsed.userNote || '-'; } catch { return value; } }
function statusLabel(status: DepositStatus, copy: TopUpCopy) { return copy.statuses[status]; }
function badgeTone(status: DepositStatus): 'success' | 'danger' | 'warning' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (['REJECTED', 'DUPLICATE'].includes(status)) return 'danger'; if (['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(status)) return 'warning'; return 'neutral'; }
