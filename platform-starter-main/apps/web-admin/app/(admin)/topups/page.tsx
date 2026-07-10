'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
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
  status: string;
  method?: string | null;
  note?: string | null;
  adminNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
};

type Proof = {
  userNote: string;
  slipImageData: string;
  slipImageName: string;
  slipFileId: string;
  contentType?: string;
  receivingBank?: { bankName?: string; accountName?: string; accountNumber?: string };
  receivingBankAccountId?: string;
};

type PendingAction = { id: string; action: 'confirm' | 'decline' } | null;

const PAGE_SIZE = 20;

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [slips, setSlips] = useState<Record<string, { dataUrl: string; name: string }>>({});

  useEffect(() => {
    void loadItems(status, page);
  }, [status, page]);

  useEffect(() => {
    void loadPrivateSlips(items);
  }, [items]);

  const counts = useMemo(
    () => ({
      pending: items.filter((item) => item.status === 'PENDING').length,
      claimed: items.filter((item) => item.claimedBy).length,
      approved: items.filter((item) => item.status === 'APPROVED').length,
      rejected: items.filter((item) => item.status === 'REJECTED').length,
    }),
    [items],
  );

  const pendingItem = pendingAction ? items.find((item) => item.id === pendingAction.id) ?? null : null;
  const pendingProof = pendingItem ? parseProofNote(pendingItem.note) : null;
  const pendingSlip = pendingItem && pendingProof
    ? pendingProof.slipImageData
      ? { dataUrl: pendingProof.slipImageData, name: pendingProof.slipImageName }
      : slips[pendingItem.id]
    : null;
  const pendingNote = pendingAction ? (reviewNotes[pendingAction.id] ?? '').trim() : '';

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการฝาก...');
    const params = new URLSearchParams();
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));

    const res = await adminApiFetch(`/admin/topups?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'โหลดรายการฝากไม่สำเร็จ');
      return;
    }

    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  async function loadPrivateSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => parseProofNote(item.note).slipFileId && !slips[item.id]);
    await Promise.all(
      targets.map(async (item) => {
        const res = await adminApiFetch(`/admin/topups/${item.id}/slip`);
        const data = await res.json().catch(() => null);
        if (res.ok && data?.dataUrl) {
          setSlips((current) => ({
            ...current,
            [item.id]: { dataUrl: data.dataUrl, name: data.slipImageName ?? 'proof' },
          }));
        }
      }),
    );
  }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id);
    setMessage(action === 'claim' ? 'กำลังรับงานตรวจฝาก...' : 'กำลังปล่อยงานตรวจฝาก...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) {
      setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ');
      return;
    }
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)));
    setMessage(action === 'claim' ? 'รับงานตรวจฝากแล้ว' : 'ปล่อยงานแล้ว');
  }

  function setItemNote(id: string, value: string) {
    setReviewNotes((current) => ({ ...current, [id]: value }));
  }

  function requestReview(id: string, action: 'confirm' | 'decline') {
    const current = items.find((item) => item.id === id);
    if (!current?.claimedBy) {
      setMessage('ต้องกดรับงานก่อนตรวจรายการ');
      return;
    }
    if (action === 'decline' && !(reviewNotes[id] ?? '').trim()) {
      setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการฝาก');
      return;
    }
    setPendingAction({ id, action });
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const current = items.find((item) => item.id === id);
    const note = (reviewNotes[id] ?? '').trim();
    if (!current?.claimedBy) {
      setMessage('ต้องกดรับงานก่อนตรวจรายการ');
      return;
    }
    if (action === 'decline' && !note) {
      setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการฝาก');
      return;
    }

    const nextStatus = action === 'confirm' ? 'APPROVED' : 'REJECTED';
    setBusyId(id);
    setMessage(action === 'confirm' ? 'กำลังอนุมัติฝาก...' : 'กำลังปฏิเสธฝาก...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ adminNote: note }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) {
      setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ');
      return;
    }

    const updated = data?.item ?? data?.topup ?? data;
    setItems((currentItems) => {
      const patched = currentItems.map((item) =>
        item.id === id
          ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? note }
          : item,
      );
      return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched;
    });
    setReviewNotes((currentNotes) => {
      const next = { ...currentNotes };
      delete next[id];
      return next;
    });
    setPendingAction(null);
    setMessage(action === 'confirm' ? 'อนุมัติฝากสำเร็จ ระบบเพิ่มยอดเข้า wallet แล้ว' : 'ปฏิเสธรายการฝากแล้ว');
    window.setTimeout(() => void loadItems(status, page), 400);
  }

  return (
    <AdminPage
      eyebrow="Deposit Queue"
      title="ตรวจฝาก"
      description="รับงาน ตรวจสลิป เทียบบัญชีรับเงิน แล้วอนุมัติหรือปฏิเสธรายการฝาก"
      actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}
    >
      <AdminMetricGrid>
        <AdminMetric tone={counts.pending > 0 ? 'warning' : 'success'} title="รอตรวจในหน้านี้" value={`${counts.pending}`} />
        <AdminMetric tone={counts.claimed > 0 ? 'brand' : 'neutral'} title="กำลังตรวจ" value={`${counts.claimed}`} />
        <AdminMetric tone="success" title="อนุมัติในหน้านี้" value={`${counts.approved}`} />
        <AdminMetric tone="danger" title="ไม่อนุมัติในหน้านี้" value={`${counts.rejected}`} />
        <AdminMetric title="ทั้งหมด" value={`${items.length}`} helper={`${total} รายการ`} />
      </AdminMetricGrid>

      <AdminToolbar>
        <label className="admin-queue-filter">
          <span>สถานะรายการ</span>
          <select value={status} onChange={(event) => changeStatus(event.target.value)}>
            <option value="PENDING">รอตรวจ</option>
            <option value="APPROVED">อนุมัติแล้ว</option>
            <option value="REJECTED">ไม่อนุมัติ</option>
            <option value="ALL">ทั้งหมด</option>
          </select>
        </label>
        <div className="admin-queue-pager" aria-label="เปลี่ยนหน้ารายการฝาก">
          <AdminButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
          <span className="admin-queue-page-label">หน้า {page} / {pageCount}</span>
          <AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
        </div>
      </AdminToolbar>

      {message && <AdminNotice>{message}</AdminNotice>}

      <AdminStack>
        {items.map((item) => {
          const proof = parseProofNote(item.note);
          const proofImage = proof.slipImageData
            ? { dataUrl: proof.slipImageData, name: proof.slipImageName }
            : slips[item.id];
          const pending = item.status === 'PENDING';
          const itemNote = reviewNotes[item.id] ?? '';

          return (
            <AdminCard
              key={item.id}
              tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : item.claimedBy ? 'warning' : 'neutral'}
            >
              <AdminSectionRow>
                <div className="admin-topup-summary">
                  <div className="admin-topup-badges">
                    <AdminBadge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {statusLabel(item.status)}
                    </AdminBadge>
                    {item.claimedBy && <AdminBadge tone="warning">มีคนรับงานแล้ว</AdminBadge>}
                  </div>
                  <h2>{formatMoney(item.amount)}</h2>
                  <p>สมาชิก: {memberLabel(item)}</p>
                  <p>ช่องทาง: {methodLabel(item.method)}</p>
                  <p>สร้างเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</p>
                </div>

                <section className="admin-topup-bank-card" aria-label="บัญชีรับเงิน">
                  <strong>บัญชีรับเงิน</strong>
                  <span>{proof.receivingBank?.accountName ?? '-'}</span>
                  <span>{proof.receivingBank?.bankName ?? '-'}</span>
                  <span className="admin-topup-account-number">{proof.receivingBank?.accountNumber ?? '-'}</span>
                </section>
              </AdminSectionRow>

              <AdminCard title="หลักฐานและไทม์ไลน์" description="ตรวจสลิป บัญชี และลำดับเหตุการณ์ก่อนทำรายการเงิน" tone="neutral">
                <div className="admin-topup-proof-grid">
                  <div className="admin-topup-proof-panel">
                    {proofImage?.dataUrl ? (
                      <img src={proofImage.dataUrl} alt={`สลิปฝากเงินของ ${memberLabel(item)}`} />
                    ) : (
                      <p>{proof.slipFileId ? 'กำลังโหลดหลักฐาน...' : 'ไม่มีหลักฐาน'}</p>
                    )}
                  </div>
                  <div className="admin-topup-timeline">
                    <AdminRow><strong>แจ้งฝาก</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>
                    {item.claimedAt && <AdminRow><strong>รับงาน</strong><span>{new Date(item.claimedAt).toLocaleString('th-TH')}</span></AdminRow>}
                    {item.reviewedAt && <AdminRow><strong>ตรวจเสร็จ</strong><span>{new Date(item.reviewedAt).toLocaleString('th-TH')}</span></AdminRow>}
                    <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{proof.userNote || '-'}</span></AdminRow>
                    {item.adminNote && <AdminRow><strong>หมายเหตุแอดมิน</strong><span>{item.adminNote}</span></AdminRow>}
                  </div>
                </div>
              </AdminCard>

              {pending ? (
                <div className="admin-topup-operations">
                  <div className="admin-topup-action-grid">
                    <AdminButton disabled={busyId === item.id} onClick={() => void queueAction(item.id, 'claim')}>รับงาน</AdminButton>
                    <AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => void queueAction(item.id, 'release')}>ปล่อยงาน</AdminButton>
                  </div>

                  <label className="admin-topup-note-field">
                    <span>หมายเหตุแอดมิน</span>
                    <textarea
                      value={itemNote}
                      onChange={(event) => setItemNote(item.id, event.target.value)}
                      placeholder="จำเป็นเมื่อไม่อนุมัติ"
                    />
                  </label>

                  <div className="admin-topup-action-grid admin-topup-action-grid--review">
                    <AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'confirm')} tone="success">อนุมัติฝาก</AdminButton>
                    <AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'decline')} tone="danger">ไม่อนุมัติ</AdminButton>
                  </div>
                </div>
              ) : (
                <AdminNotice>รายการนี้ตรวจสอบแล้ว: {statusLabel(item.status)}</AdminNotice>
              )}
            </AdminCard>
          );
        })}
        {items.length === 0 && <AdminEmpty>ไม่มีรายการฝาก</AdminEmpty>}
      </AdminStack>

      <AdminConfirmDialog
        open={Boolean(pendingAction && pendingItem)}
        tone={pendingAction?.action === 'confirm' ? 'success' : 'danger'}
        title={pendingAction?.action === 'confirm' ? 'ยืนยันอนุมัติฝาก' : 'ยืนยันปฏิเสธฝาก'}
        description={pendingAction?.action === 'confirm' ? 'รายการนี้จะเพิ่มยอดเข้า wallet สมาชิกหลังยืนยัน' : 'รายการนี้จะถูกปฏิเสธและไม่เพิ่มยอดเข้า wallet'}
        confirmLabel={pendingAction?.action === 'confirm' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'}
        loading={Boolean(busyId)}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && void reviewItem(pendingAction.id, pendingAction.action)}
        details={pendingItem && (
          <div className="admin-topup-modal-details">
            <ConfirmDetailRow label="สมาชิก" value={memberLabel(pendingItem)} />
            <ConfirmDetailRow label="จำนวน" value={formatMoney(pendingItem.amount)} />
            <ConfirmDetailRow label="ช่องทาง" value={methodLabel(pendingItem.method)} />
            <ConfirmDetailRow label="บัญชีรับเงิน" value={`${pendingProof?.receivingBank?.bankName ?? '-'} / ${pendingProof?.receivingBank?.accountNumber ?? '-'}`} />
            <ConfirmDetailRow label="หมายเหตุ" value={pendingNote || '-'} />
            {pendingSlip?.dataUrl ? (
              <img src={pendingSlip.dataUrl} alt="ตัวอย่างสลิปฝากเงินก่อนยืนยัน" className="admin-topup-modal-slip" />
            ) : (
              <AdminNotice>ยังไม่มี slip preview ให้ตรวจในหน้าต่างยืนยัน</AdminNotice>
            )}
            {pendingAction?.action === 'decline' && <ConfirmDetailRow label="จำเป็น" value="ไม่อนุมัติต้องมีเหตุผล" />}
          </div>
        )}
      />
    </AdminPage>
  );
}

function parseProofNote(value?: string | null): Proof {
  if (!value) return { userNote: '', slipImageData: '', slipImageName: '', slipFileId: '' };
  try {
    const data = JSON.parse(value);
    return {
      userNote: typeof data.userNote === 'string' ? data.userNote : '',
      slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '',
      slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '',
      slipFileId: typeof data.slipFileId === 'string' ? data.slipFileId : '',
      contentType: data.contentType,
      receivingBank: data.receivingBank,
      receivingBankAccountId: data.receivingBankAccountId,
    };
  } catch {
    return { userNote: value, slipImageData: '', slipImageName: '', slipFileId: '' };
  }
}

function memberLabel(item: TopUpItem) {
  return item.user?.username ?? item.user?.phone ?? item.userId;
}

function methodLabel(method?: string | null) {
  const map: Record<string, string> = {
    bank_transfer: 'โอนธนาคาร',
    promptpay: 'พร้อมเพย์',
    wallet: 'วอเลต',
    other: 'อื่น ๆ',
  };
  return method ? map[method] ?? method : '-';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'รอตรวจ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ไม่อนุมัติ',
  };
  return map[status] ?? status;
}
