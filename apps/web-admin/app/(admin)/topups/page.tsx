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
  note?: string | null;
  adminNote?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
};

type Evidence = {
  dataUrl?: string | null;
  slipUrl?: string | null;
  fileHash?: string | null;
  transactionRef?: string | null;
  detectedAmount?: string | null;
  transferredAt?: string | null;
  duplicateOfId?: string | null;
  duplicateReason?: string | null;
  duplicateMatchScore?: string | null;
};

type ActionKind = 'approve-slip' | 'confirm-credit' | 'reject-staged';
type PendingAction = { id: string; action: ActionKind } | null;

const PAGE_SIZE = 20;
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'PENDING_SLIP_REVIEW', label: 'รอตรวจสลิป' },
  { value: 'PENDING_CREDIT', label: 'รอเพิ่มเครดิต' },
  { value: 'DUPLICATE', label: 'สลิปซ้ำ' },
  { value: 'COMPLETED', label: 'สำเร็จ' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
  { value: 'ALL', label: 'ทั้งหมด' },
];

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
  const currentNote = pendingAction ? (notes[pendingAction.id] ?? '').trim() : '';

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

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function requestAction(item: TopUpItem, action: ActionKind) {
    const allowed = allowedDepositActions(item.status);
    const actionMap: Record<ActionKind, string> = {
      'approve-slip': 'APPROVE_SLIP',
      'confirm-credit': 'CONFIRM_CREDIT',
      'reject-staged': 'REJECT_DEPOSIT',
    };
    if (!allowed.includes(actionMap[action] as never)) {
      setMessage(`สถานะ ${financeStatusLabel(item.status)} ไม่อนุญาตให้ทำรายการนี้`);
      return;
    }
    if (action === 'reject-staged' && !(notes[item.id] ?? '').trim()) {
      setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการ');
      return;
    }
    setPendingAction({ id: item.id, action });
  }

  async function executeAction() {
    if (!pendingAction || !currentItem) return;
    const { id, action } = pendingAction;
    const adminNote = (notes[id] ?? '').trim();
    setBusyId(id);
    setMessage(actionMessage(action, true));
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ adminNote }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const nextStatus = (data?.status ?? currentItem.status) as DepositWorkflowStatus;
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus, adminNote: data?.adminNote ?? adminNote } : item));
    setPendingAction(null);
    setMessage(actionMessage(action, false));
    window.setTimeout(() => void loadItems(status, page), 300);
  }

  return (
    <AdminPage
      eyebrow="Deposit Operations"
      title="ตรวจฝากแบบแยกขั้นตอน"
      description="ตรวจหลักฐานก่อน แล้วค่อยยืนยันเพิ่มเครดิต ป้องกันการกดอนุมัติครั้งเดียวแล้วเงินเข้าทันที"
      actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}
    >
      <AdminMetricGrid>
        <AdminMetric tone={counts.review ? 'warning' : 'neutral'} title="รอตรวจสลิป" value={`${counts.review}`} />
        <AdminMetric tone={counts.credit ? 'brand' : 'neutral'} title="รอเพิ่มเครดิต" value={`${counts.credit}`} />
        <AdminMetric tone={counts.duplicate ? 'danger' : 'neutral'} title="สลิปซ้ำ" value={`${counts.duplicate}`} />
        <AdminMetric tone="success" title="สำเร็จ" value={`${counts.done}`} />
        <AdminMetric title="ทั้งหมด" value={`${items.length}`} helper={`${total} รายการ`} />
      </AdminMetricGrid>

      <AdminToolbar>
        <label className="admin-queue-filter">
          <span>สถานะรายการ</span>
          <select value={status} onChange={(event) => changeStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="admin-queue-pager">
          <AdminButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
          <span className="admin-queue-page-label">หน้า {page} / {pageCount}</span>
          <AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
        </div>
      </AdminToolbar>

      {message && <AdminNotice>{message}</AdminNotice>}

      <AdminStack>
        {items.map((item) => {
          const proof = evidence[item.id] ?? {};
          const actions = allowedDepositActions(item.status);
          const canApprove = actions.includes('APPROVE_SLIP');
          const canCredit = actions.includes('CONFIRM_CREDIT');
          const canReject = actions.includes('REJECT_DEPOSIT');
          return (
            <AdminCard key={item.id} tone={cardTone(item.status)}>
              <AdminSectionRow>
                <div className="admin-topup-summary">
                  <AdminBadge tone={badgeTone(item.status)}>{financeStatusLabel(item.status)}</AdminBadge>
                  <h2>{formatMoney(item.amount)}</h2>
                  <p>สมาชิก: {memberLabel(item)}</p>
                  <p>ช่องทาง: {methodLabel(item.method)}</p>
                  <p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p>
                </div>
                <section className="admin-topup-bank-card">
                  <strong>ข้อมูลสลิป</strong>
                  <span>Ref: {proof.transactionRef || '-'}</span>
                  <span>ยอดที่อ่านได้: {proof.detectedAmount ? formatMoney(proof.detectedAmount) : '-'}</span>
                  <span>เวลาโอน: {proof.transferredAt ? new Date(proof.transferredAt).toLocaleString('th-TH') : '-'}</span>
                </section>
              </AdminSectionRow>

              <AdminCard title="หลักฐานและความเสี่ยง" description="ตรวจรูปสลิปและข้อมูล duplicate ก่อนอนุมัติ">
                <div className="admin-topup-proof-layout">
                  <div className="admin-topup-proof-panel">
                    {proof.dataUrl ? <img src={proof.dataUrl} alt={`สลิปของ ${memberLabel(item)}`} /> : <p>ไม่มีรูปหลักฐาน</p>}
                  </div>
                  <div className="admin-topup-timeline">
                    <AdminRow><strong>เลขรายการ</strong><span>{item.id}</span></AdminRow>
                    <AdminRow><strong>ไฟล์แฮช</strong><span>{proof.fileHash || '-'}</span></AdminRow>
                    {proof.duplicateOfId && <AdminRow><strong>ซ้ำกับรายการ</strong><span>{proof.duplicateOfId}</span></AdminRow>}
                    {proof.duplicateReason && <AdminRow><strong>เหตุผลที่ซ้ำ</strong><span>{proof.duplicateReason}</span></AdminRow>}
                    {item.adminNote && <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote}</span></AdminRow>}
                  </div>
                </div>
              </AdminCard>

              {(canApprove || canCredit || canReject) ? (
                <div className="admin-topup-operations">
                  <label className="admin-topup-note-field">
                    <span>หมายเหตุแอดมิน</span>
                    <textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" />
                  </label>
                  <div className="admin-topup-action-grid admin-topup-action-grid--review">
                    {canApprove && <AdminButton tone="success" disabled={busyId === item.id || !proof.dataUrl} onClick={() => requestAction(item, 'approve-slip')}>สลิปผ่าน</AdminButton>}
                    {canCredit && <AdminButton tone="success" disabled={busyId === item.id} onClick={() => requestAction(item, 'confirm-credit')}>ยืนยันเพิ่มเครดิต</AdminButton>}
                    {canReject && <AdminButton tone="danger" disabled={busyId === item.id} onClick={() => requestAction(item, 'reject-staged')}>ไม่อนุมัติ</AdminButton>}
                  </div>
                </div>
              ) : <AdminNotice>ไม่มี action สำหรับสถานะนี้</AdminNotice>}
            </AdminCard>
          );
        })}
        {items.length === 0 && <AdminEmpty>ไม่มีรายการฝากในสถานะนี้</AdminEmpty>}
      </AdminStack>

      <AdminConfirmDialog
        open={Boolean(pendingAction && currentItem)}
        tone={pendingAction?.action === 'reject-staged' ? 'danger' : 'success'}
        title={dialogTitle(pendingAction?.action)}
        description={dialogDescription(pendingAction?.action)}
        confirmLabel="ยืนยันดำเนินการ"
        loading={Boolean(busyId)}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void executeAction()}
        details={currentItem && <div className="admin-topup-modal-details">
          <ConfirmDetailRow label="สมาชิก" value={memberLabel(currentItem)} />
          <ConfirmDetailRow label="จำนวน" value={formatMoney(currentItem.amount)} />
          <ConfirmDetailRow label="สถานะปัจจุบัน" value={financeStatusLabel(currentItem.status)} />
          <ConfirmDetailRow label="หมายเหตุ" value={currentNote || '-'} />
          {currentEvidence?.dataUrl && <img src={currentEvidence.dataUrl} alt="สลิปก่อนยืนยัน" className="admin-topup-modal-slip" />}
        </div>}
      />
    </AdminPage>
  );
}

function memberLabel(item: TopUpItem) { return item.user?.username ?? item.user?.phone ?? item.userId; }
function methodLabel(method?: string | null) { const map: Record<string, string> = { bank_transfer: 'โอนธนาคาร', promptpay: 'พร้อมเพย์', wallet: 'วอเลต', other: 'อื่น ๆ' }; return method ? map[method] ?? method : '-'; }
function cardTone(status: DepositWorkflowStatus): 'success' | 'danger' | 'warning' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (status === 'REJECTED' || status === 'DUPLICATE') return 'danger'; if (status === 'PENDING_SLIP_REVIEW' || status === 'PENDING_CREDIT') return 'warning'; return 'neutral'; }
function badgeTone(status: DepositWorkflowStatus): 'success' | 'danger' | 'warning' | 'neutral' { return cardTone(status); }
function actionMessage(action: ActionKind, loading: boolean) { if (loading) return action === 'approve-slip' ? 'กำลังอนุมัติสลิป...' : action === 'confirm-credit' ? 'กำลังเพิ่มเครดิต...' : 'กำลังปฏิเสธรายการ...'; return action === 'approve-slip' ? 'อนุมัติสลิปแล้ว รอเพิ่มเครดิต' : action === 'confirm-credit' ? 'เพิ่มเครดิตสำเร็จ' : 'ปฏิเสธรายการแล้ว'; }
function dialogTitle(action?: ActionKind) { if (action === 'approve-slip') return 'ยืนยันสลิปผ่าน'; if (action === 'confirm-credit') return 'ยืนยันเพิ่มเครดิต'; return 'ยืนยันไม่อนุมัติ'; }
function dialogDescription(action?: ActionKind) { if (action === 'approve-slip') return 'ขั้นตอนนี้ยังไม่เพิ่มเงิน จะย้ายรายการไปคิวรอเพิ่มเครดิต'; if (action === 'confirm-credit') return 'ขั้นตอนนี้จะเพิ่มยอดเข้า wallet และปิดรายการ'; return 'รายการจะถูกปฏิเสธพร้อมบันทึกเหตุผล'; }
