'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
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

type DepositStatus = 'PENDING' | 'PENDING_SLIP_REVIEW' | 'PENDING_CREDIT' | 'COMPLETED' | 'DUPLICATE' | 'REJECTED' | 'CANCELLED' | 'APPROVED';
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

const PAGE_SIZE = 20;
const FILTERS: DepositStatus[] = ['PENDING', 'PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED', 'DUPLICATE', 'REJECTED', 'CANCELLED', 'APPROVED'];

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState<string>('PENDING_SLIP_REVIEW');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [slips, setSlips] = useState<Record<string, string>>({});

  useEffect(() => { void loadItems(status, page); }, [status, page]);
  useEffect(() => { void loadSlips(items); }, [items]);

  const counts = useMemo(() => ({
    waitingSlip: items.filter((item) => item.status === 'PENDING_SLIP_REVIEW').length,
    waitingCredit: items.filter((item) => item.status === 'PENDING_CREDIT').length,
    done: items.filter((item) => item.status === 'COMPLETED').length,
    rejected: items.filter((item) => ['REJECTED', 'DUPLICATE'].includes(item.status)).length,
  }), [items]);

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการฝาก...');
    const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
    if (nextStatus !== 'ALL') query.set('status', nextStatus);
    const res = await adminApiFetch(`/admin/topups?${query}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) return setMessage(data?.message ?? 'โหลดรายการฝากไม่สำเร็จ');
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  async function loadSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'COMPLETED'].includes(item.status) && !slips[item.id]);
    await Promise.all(targets.map(async (item) => {
      const res = await adminApiFetch(`/admin/topups/${item.id}/slip`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: data.dataUrl }));
    }));
  }

  async function claim(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) return setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ');
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานตรวจฝากแล้ว' : 'ปล่อยงานแล้ว');
  }

  async function runAction(item: TopUpItem, action: 'approve-slip' | 'confirm-credit' | 'reject') {
    const adminNote = (notes[item.id] ?? '').trim();
    if (action === 'reject' && !adminNote) return setMessage('กรุณาระบุเหตุผลก่อนปฏิเสธรายการฝาก');
    const prompt = action === 'approve-slip'
      ? 'ยืนยันว่าตรวจสลิปผ่าน และส่งต่อให้ยืนยันเครดิต?'
      : action === 'confirm-credit'
        ? 'ยืนยันเพิ่มเครดิตเข้าบัญชีสมาชิก? การกระทำนี้ย้อนกลับไม่ได้'
        : 'ยืนยันปฏิเสธรายการฝาก?';
    if (!window.confirm(prompt)) return;
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/topups/${item.id}/${action}`, { method: 'POST', body: JSON.stringify({ adminNote }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) return setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ');
    setMessage(action === 'approve-slip' ? 'ตรวจสลิปผ่านแล้ว รอยืนยันเครดิต' : action === 'confirm-credit' ? 'เพิ่มเครดิตสำเร็จ' : 'ปฏิเสธรายการฝากแล้ว');
    void loadItems(status, page);
  }

  return (
    <AdminPage eyebrow="Deposit Operations" title="ตรวจฝาก" description="ตรวจสลิปก่อน แล้วจึงยืนยันเครดิตเป็นคนละขั้นตอน" actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}>
      <AdminMetricGrid>
        <AdminMetric tone={counts.waitingSlip ? 'warning' : 'success'} title="รอตรวจสลิป" value={`${counts.waitingSlip}`} />
        <AdminMetric tone={counts.waitingCredit ? 'warning' : 'success'} title="รอยืนยันเครดิต" value={`${counts.waitingCredit}`} />
        <AdminMetric tone="success" title="สำเร็จ" value={`${counts.done}`} />
        <AdminMetric tone={counts.rejected ? 'danger' : 'neutral'} title="ปฏิเสธ/สลิปซ้ำ" value={`${counts.rejected}`} />
        <AdminMetric title="ทั้งหมด" value={`${total}`} />
      </AdminMetricGrid>
      <AdminToolbar>
        <label className="admin-queue-filter"><span>สถานะ</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {FILTERS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
          <option value="ALL">ทั้งหมด</option>
        </select></label>
        <div className="admin-queue-pager"><AdminButton disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป</AdminButton></div>
      </AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>
        {items.map((item) => {
          const actionable = ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(item.status);
          return <AdminCard key={item.id} tone={item.status === 'COMPLETED' ? 'success' : ['REJECTED', 'DUPLICATE'].includes(item.status) ? 'danger' : 'neutral'}>
            <AdminSectionRow>
              <div><AdminBadge tone={badgeTone(item.status)}>{statusLabel(item.status)}</AdminBadge><h2>{formatMoney(item.amount)}</h2><p>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p><p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div>
              {slips[item.id] && <img src={slips[item.id]} alt="สลิปฝาก" className="admin-topup-modal-slip" />}
            </AdminSectionRow>
            <AdminCard title="การตรวจสอบ" description="ต้องรับงานก่อนเปลี่ยนสถานะหรือเพิ่มเครดิต">
              <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{memberNote(item.note)}</span></AdminRow>
              <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote || notes[item.id] || '-'}</span></AdminRow>
              {item.claimedAt && <AdminRow><strong>รับงานเมื่อ</strong><span>{new Date(item.claimedAt).toLocaleString('th-TH')}</span></AdminRow>}
            </AdminCard>
            {actionable ? <div className="admin-topup-operations">
              <div className="admin-topup-action-grid"><AdminButton disabled={busyId === item.id} onClick={() => void claim(item.id, 'claim')}>รับงาน</AdminButton><AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => void claim(item.id, 'release')}>ปล่อยงาน</AdminButton></div>
              <label className="admin-topup-note-field"><span>หมายเหตุแอดมิน</span><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" /></label>
              {item.status === 'PENDING_SLIP_REVIEW' && <AdminButton tone="success" disabled={busyId === item.id || !item.claimedBy} onClick={() => void runAction(item, 'approve-slip')}>สลิปถูกต้อง → รอยืนยันเครดิต</AdminButton>}
              {item.status === 'PENDING_CREDIT' && <AdminButton tone="success" disabled={busyId === item.id || !item.claimedBy} onClick={() => void runAction(item, 'confirm-credit')}>ยืนยันเพิ่มเครดิต</AdminButton>}
              <AdminButton tone="danger" disabled={busyId === item.id || !item.claimedBy} onClick={() => void runAction(item, 'reject')}>ปฏิเสธรายการ</AdminButton>
            </div> : <AdminNotice>รายการนี้ไม่สามารถเปลี่ยนสถานะต่อได้</AdminNotice>}
          </AdminCard>;
        })}
        {items.length === 0 && <AdminEmpty>ไม่มีรายการในสถานะนี้</AdminEmpty>}
      </AdminStack>
    </AdminPage>
  );
}

function memberNote(value?: string | null) { if (!value) return '-'; try { const parsed = JSON.parse(value); return parsed.userNote || '-'; } catch { return value; } }
function statusLabel(status: DepositStatus) { return ({ PENDING: 'รอส่งสลิป', PENDING_SLIP_REVIEW: 'รอตรวจสลิป', PENDING_CREDIT: 'รอยืนยันเครดิต', COMPLETED: 'สำเร็จ', DUPLICATE: 'สลิปซ้ำ', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิก', APPROVED: 'รายการเก่า: อนุมัติแล้ว' } as Record<DepositStatus, string>)[status]; }
function badgeTone(status: DepositStatus): 'success' | 'danger' | 'warning' | 'neutral' { if (status === 'COMPLETED') return 'success'; if (['REJECTED', 'DUPLICATE'].includes(status)) return 'danger'; if (['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(status)) return 'warning'; return 'neutral'; }
