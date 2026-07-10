'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { allowedDepositActions, financeStatusLabel, type DepositWorkflowStatus } from '../../lib/finance-workflow';
import { AdminConfirmDialog, ConfirmDetailRow } from '../_components/admin-confirm-dialog';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminSectionRow,
  AdminStack,
  AdminToolbar,
  formatMoney,
} from '../_components/admin-ui';

type TopUpItem = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: DepositWorkflowStatus;
  method?: string | null;
  adminNote?: string | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
};

type Evidence = {
  dataUrl?: string | null;
  fileHash?: string | null;
  transactionRef?: string | null;
  detectedAmount?: string | null;
  transferredAt?: string | null;
  duplicateOfId?: string | null;
  duplicateReason?: string | null;
};

type ActionKind = 'approve-slip' | 'confirm-credit' | 'reject-staged';
type PendingAction = { id: string; action: ActionKind } | null;

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  ['PENDING_SLIP_REVIEW', 'รอตรวจสลิป'],
  ['PENDING_CREDIT', 'รอเพิ่มเครดิต'],
  ['DUPLICATE', 'สลิปซ้ำ'],
  ['COMPLETED', 'สำเร็จ'],
  ['REJECTED', 'ไม่อนุมัติ'],
  ['ALL', 'ทั้งหมด'],
] as const;

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [evidence, setEvidence] = useState<Record<string, Evidence>>({});
  const [status, setStatus] = useState('PENDING_SLIP_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadEvidence(items); }, [items]);

  const counts = useMemo(() => ({
    review: items.filter((item) => item.status === 'PENDING_SLIP_REVIEW').length,
    credit: items.filter((item) => item.status === 'PENDING_CREDIT').length,
    duplicate: items.filter((item) => item.status === 'DUPLICATE').length,
    done: items.filter((item) => item.status === 'COMPLETED').length,
  }), [items]);

  const currentItem = pendingAction ? items.find((item) => item.id === pendingAction.id) ?? null : null;
  const currentEvidence = currentItem ? evidence[currentItem.id] : null;

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการฝาก...');
    const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    const res = await adminApiFetch(`/admin/topups?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการฝากไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  async function loadEvidence(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => !evidence[item.id]);
    await Promise.all(targets.map(async (item) => {
      const res = await adminApiFetch(`/admin/topups/${item.id}/slip-evidence`);
      const data = await res.json().catch(() => null);
      if (res.ok) setEvidence((current) => ({ ...current, [item.id]: data ?? {} }));
    }));
  }

  function requestAction(item: TopUpItem, action: ActionKind) {
    const actions = allowedDepositActions(item.status);
    const required = action === 'approve-slip' ? 'APPROVE_SLIP' : action === 'confirm-credit' ? 'CONFIRM_CREDIT' : 'REJECT_DEPOSIT';
    if (!actions.includes(required)) {
      setMessage(`สถานะ ${financeStatusLabel(item.status)} ไม่อนุญาตให้ทำรายการนี้`);
      return;
    }
    if (!item.claimedBy) {
      setMessage('ต้อง claim รายการก่อนดำเนินการ');
      return;
    }
    if (action === 'reject-staged' && !(notes[item.id] ?? '').trim()) {
      setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการ');
      return;
    }
    setPendingAction({ id: item.id, action });
  }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานแล้ว' : 'ปล่อยงานแล้ว');
  }

  async function executeAction() {
    if (!pendingAction || !currentItem) return;
    const adminNote = (notes[currentItem.id] ?? '').trim();
    setBusyId(currentItem.id);
    const res = await adminApiFetch(`/admin/topups/${currentItem.id}/${pendingAction.action}`, {
      method: 'POST',
      body: JSON.stringify({ adminNote }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setPendingAction(null);
    setMessage(actionMessage(pendingAction.action));
    void loadItems(status, page);
  }

  return <AdminPage eyebrow="Deposit Operations" title="ตรวจฝากแบบแยกขั้นตอน" description="ตรวจสลิปก่อน แล้วจึงยืนยันเพิ่มเครดิต ไม่มีปุ่มอนุมัติครั้งเดียวแล้วเงินเข้าทันที" actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="รอตรวจสลิป" value={`${counts.review}`} />
      <AdminMetric title="รอเพิ่มเครดิต" value={`${counts.credit}`} />
      <AdminMetric title="สลิปซ้ำ" value={`${counts.duplicate}`} />
      <AdminMetric title="สำเร็จ" value={`${counts.done}`} />
      <AdminMetric title="ทั้งหมด" value={`${items.length}`} helper={`${total} รายการ`} />
    </AdminMetricGrid>

    <AdminToolbar>
      <label className="admin-queue-filter"><span>สถานะรายการ</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="admin-queue-pager"><AdminButton disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div>
    </AdminToolbar>

    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminStack>
      {items.map((item) => {
        const proof = evidence[item.id] ?? {};
        const actions = allowedDepositActions(item.status);
        return <AdminCard key={item.id} tone={cardTone(item.status)}>
          <AdminSectionRow>
            <div className="admin-topup-summary"><AdminBadge tone={cardTone(item.status)}>{financeStatusLabel(item.status)}</AdminBadge><h2>{formatMoney(item.amount)}</h2><p>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div>
            <div><strong>ข้อมูลสลิป</strong><p>Ref: {proof.transactionRef || '-'}</p><p>ยอดที่อ่านได้: {proof.detectedAmount ? formatMoney(proof.detectedAmount) : '-'}</p><p>เวลาโอน: {proof.transferredAt ? new Date(proof.transferredAt).toLocaleString('th-TH') : '-'}</p></div>
          </AdminSectionRow>

          <AdminCard title="หลักฐานและความเสี่ยง">
            {proof.dataUrl ? <img src={proof.dataUrl} alt="หลักฐานการฝาก" className="admin-topup-modal-slip" /> : <AdminEmpty>ไม่มีรูปหลักฐาน</AdminEmpty>}
            <AdminRow><strong>ไฟล์แฮช</strong><span>{proof.fileHash || '-'}</span></AdminRow>
            {proof.duplicateOfId && <AdminRow><strong>ซ้ำกับรายการ</strong><span>{proof.duplicateOfId}</span></AdminRow>}
            {proof.duplicateReason && <AdminRow><strong>เหตุผล</strong><span>{proof.duplicateReason}</span></AdminRow>}
          </AdminCard>

          <label className="admin-topup-note-field"><span>หมายเหตุแอดมิน</span><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} /></label>
          <div className="admin-topup-action-grid admin-topup-action-grid--review">
            {!item.claimedBy && <AdminButton disabled={busyId === item.id} onClick={() => void queueAction(item.id, 'claim')}>รับงาน</AdminButton>}
            {item.claimedBy && <AdminButton disabled={busyId === item.id} onClick={() => void queueAction(item.id, 'release')}>ปล่อยงาน</AdminButton>}
            {actions.includes('APPROVE_SLIP') && <AdminButton tone="success" disabled={busyId === item.id || !proof.dataUrl} onClick={() => requestAction(item, 'approve-slip')}>สลิปผ่าน</AdminButton>}
            {actions.includes('CONFIRM_CREDIT') && <AdminButton tone="success" disabled={busyId === item.id} onClick={() => requestAction(item, 'confirm-credit')}>ยืนยันเพิ่มเครดิต</AdminButton>}
            {actions.includes('REJECT_DEPOSIT') && <AdminButton tone="danger" disabled={busyId === item.id} onClick={() => requestAction(item, 'reject-staged')}>ไม่อนุมัติ</AdminButton>}
          </div>
        </AdminCard>;
      })}
      {items.length === 0 && <AdminEmpty>ไม่มีรายการฝากในสถานะนี้</AdminEmpty>}
    </AdminStack>

    <AdminConfirmDialog open={Boolean(pendingAction && currentItem)} tone={pendingAction?.action === 'reject-staged' ? 'danger' : 'success'} title="ยืนยันการดำเนินการ" description="ตรวจสอบข้อมูลก่อนยืนยัน" confirmLabel="ยืนยัน" loading={Boolean(busyId)} onCancel={() => setPendingAction(null)} onConfirm={() => void executeAction()} details={currentItem && <><ConfirmDetailRow label="สมาชิก" value={currentItem.user?.username ?? currentItem.userId} /><ConfirmDetailRow label="จำนวน" value={formatMoney(currentItem.amount)} /><ConfirmDetailRow label="สถานะ" value={financeStatusLabel(currentItem.status)} /></>} />
  </AdminPage>;
}

function cardTone(status: DepositWorkflowStatus): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED' || status === 'DUPLICATE') return 'danger';
  if (status === 'PENDING_SLIP_REVIEW' || status === 'PENDING_CREDIT') return 'warning';
  return 'neutral';
}

function actionMessage(action: ActionKind) {
  if (action === 'approve-slip') return 'อนุมัติสลิปแล้ว รอเพิ่มเครดิต';
  if (action === 'confirm-credit') return 'เพิ่มเครดิตสำเร็จ';
  return 'ปฏิเสธรายการแล้ว';
}
