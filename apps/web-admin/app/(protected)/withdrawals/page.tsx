'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { allowedWithdrawalActions, financeStatusLabel, type WithdrawalWorkflowStatus } from '../../lib/finance-workflow';
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

type WithdrawalItem = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: WithdrawalWorkflowStatus;
  method?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  note?: string | null;
  adminNote?: string | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  reviewedAt?: string | null;
  paymentTransactionRef?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
};

type ProofState = { dataUrl: string; transactionRef?: string | null };
const PAGE_SIZE = 20;
const FILTERS: WithdrawalWorkflowStatus[] = ['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED', 'COMPLETED', 'REJECTED'];

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [proofs, setProofs] = useState<Record<string, ProofState>>({});
  const [proofDrafts, setProofDrafts] = useState<Record<string, string>>({});

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadProofs(items); }, [items]);

  const counts = useMemo(() => ({
    waiting: items.filter((item) => ['PENDING', 'PENDING_REVIEW'].includes(item.status)).length,
    paying: items.filter((item) => item.status === 'APPROVED_FOR_PAYMENT').length,
    proof: items.filter((item) => item.status === 'PAYMENT_PROOF_UPLOADED').length,
    done: items.filter((item) => item.status === 'COMPLETED').length,
  }), [items]);

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการถอน...');
    const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    const res = await adminApiFetch(`/admin/withdrawals?${params}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการถอนไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  async function loadProofs(nextItems: WithdrawalItem[]) {
    const targets = nextItems.filter((item) => ['PAYMENT_PROOF_UPLOADED', 'COMPLETED'].includes(item.status) && !proofs[item.id]);
    await Promise.all(targets.map(async (item) => {
      const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.dataUrl) setProofs((current) => ({ ...current, [item.id]: data }));
    }));
  }

  async function claim(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    const res = await adminApiFetch(`/admin/withdrawals/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานแล้ว' : 'ปล่อยงานแล้ว');
  }

  async function runAction(item: WithdrawalItem, action: 'approve' | 'verify' | 'reject') {
    const note = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !note) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการถอน'); return; }
    const endpoint = action === 'approve' ? 'approve-for-payment' : action === 'verify' ? 'verify-payment' : 'reject-staged';
    const promptText = action === 'approve' ? 'อนุมัติรายการนี้เพื่อเตรียมโอนเงิน?' : action === 'verify' ? 'ยืนยันว่าหลักฐานถูกต้องและตัดยอดจริง?' : 'ปฏิเสธรายการและคืนยอดล็อกให้สมาชิก?';
    if (!window.confirm(promptText)) return;
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/withdrawals/${item.id}/${endpoint}`, { method: 'POST', body: JSON.stringify({ note }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data } : entry));
    setMessage(action === 'approve' ? 'อนุมัติให้เตรียมจ่ายแล้ว' : action === 'verify' ? 'ตรวจหลักฐานและปิดรายการแล้ว' : 'ปฏิเสธรายการและคืนยอดล็อกแล้ว');
    window.setTimeout(() => void loadItems(status, page), 300);
  }

  async function selectProof(item: WithdrawalItem, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ'); return; }
    try {
      const dataUrl = await resizeImage(file, 1000, 0.78);
      setProofDrafts((current) => ({ ...current, [item.id]: dataUrl }));
      setMessage('เตรียมหลักฐานแล้ว กรุณาใส่เลขอ้างอิงและกดอัปโหลด');
    } catch { setMessage('อ่านไฟล์หลักฐานไม่สำเร็จ'); }
  }

  async function uploadProof(item: WithdrawalItem) {
    const slipImageData = proofDrafts[item.id];
    const transactionRef = (refs[item.id] ?? '').trim();
    if (!slipImageData) { setMessage('กรุณาแนบหลักฐานการโอน'); return; }
    if (!transactionRef) { setMessage('กรุณาใส่เลขอ้างอิงการโอน'); return; }
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/withdrawals/${item.id}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify({ slipImageData, slipImageName: 'payment-proof.jpg', transactionRef, note: (notes[item.id] ?? '').trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปโหลดหลักฐานไม่สำเร็จ'); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data, paymentTransactionRef: transactionRef } : entry));
    setProofs((current) => ({ ...current, [item.id]: { dataUrl: slipImageData, transactionRef } }));
    setMessage('อัปโหลดหลักฐานแล้ว รอตรวจยืนยันขั้นสุดท้าย');
  }

  return (
    <AdminPage eyebrow="Withdrawal Operations" title="ตรวจถอน" description="อนุมัติ เตรียมจ่าย แนบหลักฐาน และตรวจยืนยันก่อนตัดยอดจริง" actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}>
      <AdminMetricGrid>
        <AdminMetric tone={counts.waiting ? 'warning' : 'success'} title="รอตรวจ" value={`${counts.waiting}`} />
        <AdminMetric tone="brand" title="รอจ่าย" value={`${counts.paying}`} />
        <AdminMetric tone="warning" title="รอตรวจหลักฐาน" value={`${counts.proof}`} />
        <AdminMetric tone="success" title="สำเร็จ" value={`${counts.done}`} />
        <AdminMetric title="ทั้งหมด" value={`${items.length}`} helper={`${total} รายการ`} />
      </AdminMetricGrid>

      <AdminToolbar>
        <label className="admin-queue-filter"><span>สถานะ</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {FILTERS.map((value) => <option key={value} value={value}>{financeStatusLabel(value)}</option>)}
          <option value="ALL">ทั้งหมด</option>
        </select></label>
        <div className="admin-queue-pager"><AdminButton disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div>
      </AdminToolbar>

      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>
        {items.map((item) => {
          const actions = allowedWithdrawalActions(item.status);
          const proof = proofs[item.id];
          return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'neutral'}>
            <AdminSectionRow>
              <div><AdminBadge tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{financeStatusLabel(item.status)}</AdminBadge><h2>{formatMoney(item.amount)}</h2><p>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div>
              <section className="admin-withdraw-bank-card"><strong>บัญชีปลายทาง</strong><span>{item.accountName || '-'}</span><span>{item.bankName || '-'}</span><span className="admin-withdraw-account-number">{maskAccount(item.accountNumber)}</span></section>
            </AdminSectionRow>

            <AdminCard title="การตรวจสอบ" description="แต่ละสถานะจะแสดงเฉพาะงานที่ทำได้">
              <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{item.note || '-'}</span></AdminRow>
              <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote || notes[item.id] || '-'}</span></AdminRow>
              <AdminRow><strong>เลขอ้างอิงจ่าย</strong><span>{proof?.transactionRef ?? item.paymentTransactionRef ?? '-'}</span></AdminRow>
              {proof?.dataUrl && <img src={proof.dataUrl} alt="หลักฐานการโอน" className="admin-topup-modal-slip" />}
            </AdminCard>

            {actions.length > 0 ? <div className="admin-topup-operations">
              {actions.includes('CLAIM') && <div className="admin-topup-action-grid"><AdminButton disabled={busyId === item.id} onClick={() => void claim(item.id, 'claim')}>รับงาน</AdminButton><AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => void claim(item.id, 'release')}>ปล่อยงาน</AdminButton></div>}
              <label className="admin-topup-note-field"><span>หมายเหตุแอดมิน</span><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" /></label>
              {actions.includes('APPROVE_FOR_PAYMENT') && <AdminButton tone="success" disabled={busyId === item.id} onClick={() => void runAction(item, 'approve')}>อนุมัติเตรียมจ่าย</AdminButton>}
              {actions.includes('UPLOAD_PAYMENT_PROOF') && <div className="admin-topup-action-grid"><input type="file" accept="image/*" onChange={(event) => void selectProof(item, event)} /><input value={refs[item.id] ?? ''} onChange={(event) => setRefs((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="เลขอ้างอิงการโอน" /><AdminButton disabled={busyId === item.id || !proofDrafts[item.id]} onClick={() => void uploadProof(item)}>อัปโหลดหลักฐาน</AdminButton></div>}
              {actions.includes('VERIFY_PAYMENT') && <AdminButton tone="success" disabled={busyId === item.id || !proof?.dataUrl} onClick={() => void runAction(item, 'verify')}>ตรวจหลักฐานและปิดรายการ</AdminButton>}
              {actions.includes('REJECT_WITHDRAWAL') && <AdminButton tone="danger" disabled={busyId === item.id} onClick={() => void runAction(item, 'reject')}>ปฏิเสธและคืนยอดล็อก</AdminButton>}
            </div> : <AdminNotice>รายการนี้สิ้นสุดแล้ว ไม่มีการกระทำเพิ่มเติม</AdminNotice>}
          </AdminCard>;
        })}
        {items.length === 0 && <AdminEmpty>ไม่มีรายการถอน</AdminEmpty>}
      </AdminStack>
    </AdminPage>
  );
}

function maskAccount(value?: string | null) { if (!value) return '-'; return value.length <= 4 ? value : `${'*'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`; }
function resizeImage(file: File, maxSize: number, quality: number) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, maxSize / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); const context = canvas.getContext('2d'); if (!context) return reject(new Error('canvas')); context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; image.onerror = reject; image.src = String(reader.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
