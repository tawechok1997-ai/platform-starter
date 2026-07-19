'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const PAGE_SIZE = 20;

type WalletItem = { id: string; userId: string; shortUserId?: string | null; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string } };
type PendingAdjustment = { userId: string; username: string; direction: 'CREDIT' | 'DEBIT'; amount: number; reason: string };

export default function AdminWalletsPage() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [adjustUserId, setAdjustUserId] = useState('');
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);

  useEffect(() => { void loadItems(undefined, page); }, [page]);

  async function loadItems(event?: FormEvent<HTMLFormElement>, nextPage = page) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setMessage('กำลังโหลดกระเป๋าเงิน...');

    try {
      const res = await adminApiFetch(`/admin/wallets?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? `โหลดกระเป๋าเงินไม่สำเร็จ (${res.status})`);
        return;
      }
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลดกระเป๋าเงินไม่สำเร็จ');
    }
  }

  function searchWallets(event: FormEvent<HTMLFormElement>) {
    if (page !== 1) {
      setPage(1);
      event.preventDefault();
      return;
    }
    void loadItems(event, 1);
  }

  function requestAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!adjustUserId.trim()) { setMessage('กรุณาเลือกสมาชิก'); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('จำนวนเงินต้องมากกว่า 0'); return; }
    if (!reason.trim()) { setMessage('กรุณาระบุเหตุผล'); return; }
    const wallet = items.find((item) => item.userId === adjustUserId);
    setPendingAdjustment({ userId: adjustUserId, username: wallet?.user?.username ?? wallet?.shortUserId ?? adjustUserId, direction, amount: parsedAmount, reason: reason.trim() });
  }

  async function confirmAdjustment() {
    if (!pendingAdjustment || busy) return;
    const { userId, direction: nextDirection, amount: parsedAmount, reason: adjustmentReason } = pendingAdjustment;
    const idempotencyKey = `wallet-adjust-${userId}-${nextDirection}-${parsedAmount}-${Date.now()}`;
    setBusy(true);
    setMessage('กำลังปรับยอด...');

    try {
      const res = await adminApiFetch(`/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ direction: nextDirection, amount: parsedAmount, reason: adjustmentReason, idempotencyKey }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? `ปรับยอดไม่สำเร็จ (${res.status})`);
        return;
      }
      setItems((current) => current.map((item) => (item.userId === userId ? { ...item, ...data.wallet } : item)));
      setAmount('');
      setReason('');
      setPendingAdjustment(null);
      setMessage('ปรับยอดและบันทึกประวัติแล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ปรับยอดไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') {
    setAdjustUserId(item.userId);
    setDirection(nextDirection);
    setMessage(`เลือก ${item.user?.username ?? item.shortUserId ?? item.userId} แล้ว`);
    setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  return (
    <AdminPage eyebrow="การเงิน" title="กระเป๋าเงินสมาชิก" description="ค้นหาสมาชิก ตรวจยอด และปรับยอดพร้อมบันทึกเหตุผลทุกครั้ง">
      <AdminMetricGrid>
        <AdminMetric title="รายการที่แสดง" value={String(items.length)} helper={`${total} รายการทั้งหมด`} />
        <AdminMetric title="หน้าปัจจุบัน" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
        <AdminMetric title="ตัวกรอง" value={search.trim() ? 'กำลังใช้' : 'ทั้งหมด'} helper="รายชื่อกระเป๋าเงิน" />
      </AdminMetricGrid>
      <form onSubmit={searchWallets}>
        <AdminToolbar>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อผู้ใช้ รหัสสมาชิก หรือ User ID" />
          <AdminButton type="submit">ค้นหา</AdminButton>
          <div style={pagerStyle}><AdminButton type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div>
        </AdminToolbar>
      </form>
      <form id="adjust-form" onSubmit={requestAdjustment}>
        <AdminToolbar>
          <strong style={{ fontSize: 18 }}>ปรับยอดกระเป๋าเงิน</strong>
          <input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="User ID ของสมาชิก" />
          <select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')}><option value="CREDIT">เพิ่มยอด</option><option value="DEBIT">ลดยอด</option></select>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="จำนวนเงิน" inputMode="decimal" />
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="เหตุผลที่ปรับยอด" />
          <AdminButton type="submit" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'ตรวจสอบก่อนยืนยัน'}</AdminButton>
        </AdminToolbar>
      </form>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status === 'ACTIVE' ? 'ใช้งานได้' : item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.user?.username ?? item.userId}</h2><p>รหัสสมาชิก: <strong>{item.user?.shortId ?? item.shortUserId ?? '-'}</strong></p><p>User ID: <code>{item.userId}</code></p><p>โทรศัพท์: {item.user?.phone ?? '-'}</p><p>อีเมล: {item.user?.email ?? '-'}</p><p>อัปเดตล่าสุด: {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><h2 style={{ margin: '0 0 8px', fontSize: 'clamp(26px, 7vw, 40px)', lineHeight: 1 }}>{formatMoney(item.availableBalance)}</h2><p>ยอดรวม: {formatMoney(item.balance)}</p><p>ยอดล็อก: {formatMoney(item.lockedBalance)}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, justifyContent: 'flex-end' }}><AdminLinkButton href={`/member-detail?id=${item.userId}`}>ดูสมาชิก</AdminLinkButton><AdminLinkButton href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>ดูประวัติเงิน</AdminLinkButton><AdminButton onClick={() => navigator.clipboard?.writeText(item.userId)} tone="secondary">คัดลอก ID</AdminButton><AdminButton onClick={() => startAdjust(item, 'CREDIT')} tone="success">เพิ่มยอด</AdminButton><AdminButton onClick={() => startAdjust(item, 'DEBIT')} tone="danger">ลดยอด</AdminButton></div></div></AdminRow></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่พบกระเป๋าเงิน</AdminEmpty>}</AdminStack>
      <AdminConfirmDialog
        open={Boolean(pendingAdjustment)}
        title={pendingAdjustment?.direction === 'DEBIT' ? 'ยืนยันการลดยอด' : 'ยืนยันการเพิ่มยอด'}
        description="ตรวจสอบสมาชิก จำนวนเงิน และเหตุผลให้ถูกต้องก่อนบันทึก การปรับยอดจะถูกเก็บในประวัติการเงิน"
        confirmLabel={pendingAdjustment?.direction === 'DEBIT' ? 'ยืนยันลดยอด' : 'ยืนยันเพิ่มยอด'}
        tone={pendingAdjustment?.direction === 'DEBIT' ? 'danger' : 'success'}
        busy={busy}
        onCancel={() => setPendingAdjustment(null)}
        onConfirm={() => void confirmAdjustment()}
        details={pendingAdjustment ? <><p><strong>สมาชิก:</strong> {pendingAdjustment.username}</p><p><strong>จำนวน:</strong> {formatMoney(String(pendingAdjustment.amount))}</p><p><strong>เหตุผล:</strong> {pendingAdjustment.reason}</p></> : null}
      />
    </AdminPage>
  );
}

const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };