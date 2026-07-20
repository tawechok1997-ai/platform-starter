'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton, formatMoney } from '../_components/admin-ui';

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
  const [loading, setLoading] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);

  useEffect(() => { void loadItems(page); }, [page]);

  const pageAvailable = useMemo(() => items.reduce((sum, item) => sum + Number(item.availableBalance || 0), 0), [items]);
  const pageLocked = useMemo(() => items.reduce((sum, item) => sum + Number(item.lockedBalance || 0), 0), [items]);

  async function loadItems(nextPage = page) {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setLoading(true);
    setMessage('');
    try {
      const res = await adminApiFetch(`/admin/wallets?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลดกระเป๋าเงินไม่สำเร็จ (${res.status})`);
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems);
      setTotal(Number(data?.total ?? nextItems.length));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
    } catch (error) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessage(error instanceof Error ? error.message : 'โหลดกระเป๋าเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function searchWallets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (page !== 1) setPage(1); else void loadItems(1);
  }

  function requestAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!adjustUserId.trim()) return setMessage('กรุณาเลือกสมาชิก');
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setMessage('จำนวนเงินต้องมากกว่า 0');
    if (!reason.trim()) return setMessage('กรุณาระบุเหตุผล');
    const wallet = items.find((item) => item.userId === adjustUserId);
    setPendingAdjustment({ userId: adjustUserId, username: wallet?.user?.username ?? wallet?.shortUserId ?? adjustUserId, direction, amount: parsedAmount, reason: reason.trim() });
  }

  async function confirmAdjustment() {
    if (!pendingAdjustment || busy) return;
    const { userId, direction: nextDirection, amount: parsedAmount, reason: adjustmentReason } = pendingAdjustment;
    setBusy(true);
    setMessage('กำลังปรับยอด...');
    try {
      const res = await adminApiFetch(`/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ direction: nextDirection, amount: parsedAmount, reason: adjustmentReason, idempotencyKey: `wallet-adjust-${userId}-${nextDirection}-${parsedAmount}-${Date.now()}` }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `ปรับยอดไม่สำเร็จ (${res.status})`);
      setItems((current) => current.map((item) => item.userId === userId ? { ...item, ...data.wallet } : item));
      setAmount(''); setReason(''); setPendingAdjustment(null); setMessage('ปรับยอดและบันทึกประวัติแล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ปรับยอดไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') {
    setAdjustUserId(item.userId); setDirection(nextDirection); setMessage(`เลือก ${item.user?.username ?? item.shortUserId ?? item.userId} แล้ว`);
    setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  return <AdminPage eyebrow="การเงิน" title="กระเป๋าเงินสมาชิก" description="ค้นหาสมาชิก ตรวจยอด และปรับยอดพร้อมหลักฐานการดำเนินการทุกครั้ง" actions={<AdminButton size="compact" onClick={() => void loadItems(page)} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <section className="admin-wallet-detail" aria-busy={loading}>
      <AdminMetricGrid>
        <AdminMetric title="กระเป๋าทั้งหมด" value={total.toLocaleString('th-TH')} helper="จำนวนกระเป๋าที่ตรงกับตัวกรอง" />
        <AdminMetric title="รายการหน้านี้" value={items.length.toLocaleString('th-TH')} helper={`หน้า ${page} จาก ${pageCount}`} />
        <AdminMetric title="ยอดใช้ได้หน้านี้" value={formatMoney(pageAvailable)} tone="success" helper="รวมเฉพาะข้อมูลที่แสดงอยู่" />
        <AdminMetric title="ยอดล็อกหน้านี้" value={formatMoney(pageLocked)} tone={pageLocked > 0 ? 'warning' : 'neutral'} helper="ยอดที่ยังไม่พร้อมใช้งาน" />
      </AdminMetricGrid>

      <form onSubmit={searchWallets} className="admin-wallet-detail__toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อผู้ใช้ รหัสสมาชิก หรือ User ID" aria-label="ค้นหาสมาชิก" />
        <AdminButton type="submit" size="compact" disabled={loading}>ค้นหา</AdminButton>
        <AdminButton size="compact" tone="ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
        <span>หน้า {page} / {pageCount}</span>
        <AdminButton size="compact" tone="ghost" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
      </form>

      <form id="adjust-form" onSubmit={requestAdjustment} className="admin-wallet-detail__toolbar">
        <strong>ปรับยอดกระเป๋าเงิน</strong>
        <input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="User ID ของสมาชิก" aria-label="User ID สมาชิก" />
        <select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')} aria-label="ทิศทางการปรับยอด"><option value="CREDIT">เพิ่มยอด</option><option value="DEBIT">ลดยอด</option></select>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="จำนวนเงิน" inputMode="decimal" aria-label="จำนวนเงิน" />
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="เหตุผลที่ปรับยอด" aria-label="เหตุผลที่ปรับยอด" />
        <AdminButton type="submit" size="compact" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'ตรวจสอบก่อนยืนยัน'}</AdminButton>
      </form>

      {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
      {loading ? <AdminSkeleton lines={5} /> : items.length === 0 ? <div className="admin-wallet-detail__state"><AdminEmpty>ยังไม่พบกระเป๋าเงิน</AdminEmpty></div> : <div className="admin-wallet-detail__table-shell"><table className="admin-wallet-detail__table"><thead><tr><th>สมาชิก</th><th>สถานะ</th><th>ยอดใช้ได้</th><th>ยอดรวม</th><th>ยอดล็อก</th><th>อัปเดตล่าสุด</th><th>การทำงาน</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.user?.username ?? item.userId}</strong><br /><small>{item.user?.shortId ?? item.shortUserId ?? item.userId}</small></td><td><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status === 'ACTIVE' ? 'ใช้งานได้' : item.status}</AdminBadge></td><td className="admin-wallet-detail__amount">{formatMoney(item.availableBalance)}</td><td className="admin-wallet-detail__amount">{formatMoney(item.balance)}</td><td className="admin-wallet-detail__amount">{formatMoney(item.lockedBalance)}</td><td>{new Date(item.updatedAt).toLocaleString('th-TH')}</td><td><div className="admin-wallet-detail__toolbar"><AdminLinkButton size="compact" href={`/member-detail?id=${item.userId}`}>สมาชิก</AdminLinkButton><AdminLinkButton size="compact" href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>ประวัติ</AdminLinkButton><AdminButton size="compact" tone="success" onClick={() => startAdjust(item, 'CREDIT')}>เพิ่ม</AdminButton><AdminButton size="compact" tone="danger" onClick={() => startAdjust(item, 'DEBIT')}>ลด</AdminButton></div></td></tr>)}</tbody></table></div>}
    </section>
    <AdminConfirmDialog open={Boolean(pendingAdjustment)} title={pendingAdjustment?.direction === 'DEBIT' ? 'ยืนยันการลดยอด' : 'ยืนยันการเพิ่มยอด'} description="ตรวจสอบสมาชิก จำนวนเงิน และเหตุผลให้ถูกต้อง การปรับยอดจะถูกบันทึกใน ledger" confirmLabel={pendingAdjustment?.direction === 'DEBIT' ? 'ยืนยันลดยอด' : 'ยืนยันเพิ่มยอด'} tone={pendingAdjustment?.direction === 'DEBIT' ? 'danger' : 'success'} busy={busy} onCancel={() => setPendingAdjustment(null)} onConfirm={() => void confirmAdjustment()} details={pendingAdjustment ? <><p><strong>สมาชิก:</strong> {pendingAdjustment.username}</p><p><strong>จำนวน:</strong> {formatMoney(pendingAdjustment.amount)}</p><p><strong>เหตุผล:</strong> {pendingAdjustment.reason}</p></> : null} />
  </AdminPage>;
}
