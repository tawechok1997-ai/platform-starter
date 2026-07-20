'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminSectionRow,
  AdminSkeleton,
  AdminStack,
  AdminToolbar,
  formatMoney,
} from '../_components/admin-ui';

type DepositStatus = 'PENDING' | 'PENDING_SLIP_REVIEW' | 'PENDING_CREDIT' | 'COMPLETED' | 'DUPLICATE' | 'REJECTED' | 'CANCELLED' | 'APPROVED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type DepositAction = 'approve-slip' | 'confirm-credit' | 'reject';
type TopUpItem = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: DepositStatus;
  note?: string | null;
  adminNote?: string | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user?: { username?: string; phone?: string | null; email?: string | null };
};

type PendingAction = { item: TopUpItem; action: DepositAction };

const PAGE_SIZE = 20;
const FILTERS: DepositStatus[] = ['PENDING', 'PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED', 'DUPLICATE', 'REJECTED', 'CANCELLED', 'APPROVED'];

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState<string>('PENDING_SLIP_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [slips, setSlips] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadSlips(items); }, [items]);

  const counts = useMemo(() => ({
    waitingSlip: items.filter((item) => item.status === 'PENDING_SLIP_REVIEW').length,
    waitingCredit: items.filter((item) => item.status === 'PENDING_CREDIT').length,
    done: items.filter((item) => item.status === 'COMPLETED').length,
    rejected: items.filter((item) => ['REJECTED', 'DUPLICATE'].includes(item.status)).length,
  }), [items]);

  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  async function loadItems(nextStatus = status, nextPage = page) {
    setLoading(true);
    showMessage('กำลังโหลดรายการฝาก...', 'neutral');
    try {
      const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (nextStatus !== 'ALL') query.set('status', nextStatus);
      const res = await adminApiFetch(`/admin/topups?${query}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'โหลดรายการฝากไม่สำเร็จ');
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      showMessage('');
    } catch (error) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      showMessage(error instanceof Error ? error.message : 'โหลดรายการฝากไม่สำเร็จ', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function loadSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED'].includes(item.status) && !slips[item.id]);
    await Promise.all(targets.map(async (item) => {
      try {
        const res = await adminApiFetch(`/admin/topups/${item.id}/slip`);
        const data = await res.json().catch(() => null);
        if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: data.dataUrl }));
      } catch {
        // Slip preview is non-blocking; the queue remains usable from server state.
      }
    }));
  }

  async function claim(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    try {
      const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'ทำรายการไม่สำเร็จ');
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
      showMessage(action === 'claim' ? 'รับงานตรวจฝากแล้ว' : 'ปล่อยงานแล้ว', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ', 'danger');
    } finally {
      setBusyId('');
    }
  }

  function requestAction(item: TopUpItem, action: DepositAction) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) return showMessage('กรุณาระบุเหตุผลก่อนปฏิเสธรายการฝาก', 'warning');
    setPendingAction({ item, action });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    const { item, action } = pendingAction;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    try {
      const res = await adminApiFetch(`/admin/topups/${item.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? 'ทำรายการไม่สำเร็จ');
      setPendingAction(null);
      showMessage(action === 'approve-slip' ? 'ตรวจสลิปผ่านแล้ว รอยืนยันเครดิต' : action === 'confirm-credit' ? 'เพิ่มเครดิตสำเร็จ' : 'ปฏิเสธรายการฝากแล้ว', 'success');
      await loadItems(status, page);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ', 'danger');
    } finally {
      setBusyId('');
    }
  }

  const queueBusy = loading || Boolean(busyId);

  return (
    <AdminPage eyebrow="การเงิน" title="คิวตรวจรายการฝาก" description="ตรวจสลิป รับผิดชอบงาน และยืนยันเครดิตตามลำดับที่ตรวจสอบได้" actions={<AdminButton size="compact" disabled={queueBusy} onClick={() => void loadItems()}>{loading ? 'กำลังโหลด...' : 'รีเฟรชคิว'}</AdminButton>}>
      <AdminMetricGrid>
        <AdminMetric tone={counts.waitingSlip ? 'warning' : 'success'} title="รอตรวจสลิป" value={`${counts.waitingSlip}`} helper={`ทั้งหมดตามตัวกรอง ${total}`} />
        <AdminMetric tone={counts.waitingCredit ? 'warning' : 'success'} title="รอยืนยันเครดิต" value={`${counts.waitingCredit}`} helper={`หน้า ${page} / ${pageCount}`} />
        <AdminMetric tone="success" title="สำเร็จ" value={`${counts.done}`} helper="เฉพาะรายการในหน้านี้" />
        <AdminMetric tone={counts.rejected ? 'danger' : 'neutral'} title="ปฏิเสธ/สลิปซ้ำ" value={`${counts.rejected}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
      </AdminMetricGrid>

      <AdminToolbar>
        <label className="admin-queue-filter"><span>สถานะคิว</span><select aria-label="กรองสถานะรายการฝาก" value={status} disabled={queueBusy} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
          <option value="ALL">ทั้งหมด</option>
        </select></label>
        <div className="admin-queue-pager"><AdminButton size="compact" tone="ghost" disabled={page <= 1 || queueBusy} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span aria-live="polite">หน้า {page} / {pageCount}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || queueBusy} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div>
      </AdminToolbar>

      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
      {loading ? <AdminCard><AdminSkeleton lines={5} /></AdminCard> : <AdminStack>
        {items.map((item) => {
          const actionable = ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(item.status);
          const isBusy = busyId === item.id;
          return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : ['REJECTED', 'DUPLICATE'].includes(item.status) ? 'danger' : 'neutral'}>
            <AdminSectionRow>
              <div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.claimedBy ? <AdminBadge tone="success">มีผู้รับงานแล้ว</AdminBadge> : <AdminBadge>ยังไม่มีผู้รับงาน</AdminBadge>}<h2>{formatMoney(item.amount)}</h2><p>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div>
              {slips[item.id] && <img src={slips[item.id]} alt={`สลิปฝากของ ${item.user?.username ?? item.userId}`} className="admin-topup-modal-slip" />}
            </AdminSectionRow>
            <AdminCard title="การตรวจสอบ" description="ต้องรับงานก่อนเปลี่ยนสถานะหรือเพิ่มเครดิต">
              <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{memberNote(item.note)}</span></AdminRow>
              <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote || notes[item.id] || '-'}</span></AdminRow>
              {item.claimedAt && <AdminRow><strong>รับงานเมื่อ</strong><span>{new Date(item.claimedAt).toLocaleString('th-TH')}</span></AdminRow>}
            </AdminCard>
            {actionable ? <div className="admin-topup-operations">
              <div className="admin-topup-action-grid"><AdminButton disabled={isBusy} onClick={() => void claim(item.id, 'claim')}>รับงาน</AdminButton><AdminButton tone="secondary" disabled={isBusy || !item.claimedBy} onClick={() => void claim(item.id, 'release')}>ปล่อยงาน</AdminButton></div>
              <label className="admin-topup-note-field"><span>หมายเหตุแอดมิน</span><textarea disabled={isBusy} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" /></label>
              {item.status === 'PENDING_SLIP_REVIEW' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'approve-slip')}>สลิปถูกต้อง → รอยืนยันเครดิต</AdminButton>}
              {item.status === 'PENDING_CREDIT' && <AdminButton tone="success" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'confirm-credit')}>ยืนยันเพิ่มเครดิต</AdminButton>}
              <AdminButton tone="danger" disabled={isBusy || !item.claimedBy} onClick={() => requestAction(item, 'reject')}>ปฏิเสธรายการ</AdminButton>
            </div> : <AdminNotice tone="warning">รายการนี้ไม่สามารถเปลี่ยนสถานะต่อได้</AdminNotice>}
          </AdminCard>;
        })}
        {items.length === 0 && <AdminEmpty>ไม่มีรายการในสถานะนี้</AdminEmpty>}
      </AdminStack>}

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction ? actionTitle(pendingAction.action) : ''}
        description={pendingAction ? actionDescription(pendingAction.action) : ''}
        confirmLabel={pendingAction ? actionConfirmLabel(pendingAction.action) : 'ยืนยัน'}
        tone={pendingAction?.action === 'reject' ? 'danger' : 'success'}
        busy={Boolean(pendingAction && busyId === pendingAction.item.id)}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        details={pendingAction ? <><p><strong>สมาชิก:</strong> {pendingAction.item.user?.username ?? pendingAction.item.userId}</p><p><strong>ยอดเงิน:</strong> {formatMoney(pendingAction.item.amount)}</p><p><strong>เหตุผล:</strong> {(notes[pendingAction.item.id] ?? '').trim() || '-'}</p></> : null}
      />
    </AdminPage>
  );
}

function memberNote(value?: string | null) { if (!value) return '-'; try { const parsed = JSON.parse(value); return parsed.userNote || '-'; } catch { return value; } }
function statusLabel(status: DepositStatus) { return ({ PENDING: 'รอส่งสลิป', PENDING_SLIP_REVIEW: 'รอตรวจสลิป', PENDING_CREDIT: 'รอยืนยันเครดิต', COMPLETED: 'สำเร็จ', DUPLICATE: 'สลิปซ้ำ', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิก', APPROVED: 'รายการเก่า: อนุมัติแล้ว' } as Record<DepositStatus, string>)[status]; }
function badgeTone(status: DepositStatus): 'success' | 'danger' | 'warning' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (['REJECTED', 'DUPLICATE'].includes(status)) return 'danger'; if (['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(status)) return 'warning'; return 'neutral'; }
function actionTitle(action: DepositAction) { return action === 'approve-slip' ? 'ยืนยันผลตรวจสลิป' : action === 'confirm-credit' ? 'ยืนยันเพิ่มเครดิต' : 'ยืนยันปฏิเสธรายการ'; }
function actionDescription(action: DepositAction) { return action === 'approve-slip' ? 'รายการจะถูกส่งต่อไปยังขั้นยืนยันเครดิต' : action === 'confirm-credit' ? 'ระบบจะเพิ่มยอดเข้ากระเป๋าสมาชิก การกระทำนี้ย้อนกลับไม่ได้' : 'รายการจะถูกปฏิเสธพร้อมบันทึกเหตุผลลง Audit log'; }
function actionConfirmLabel(action: DepositAction) { return action === 'approve-slip' ? 'อนุมัติสลิป' : action === 'confirm-credit' ? 'เพิ่มเครดิต' : 'ปฏิเสธรายการ'; }
