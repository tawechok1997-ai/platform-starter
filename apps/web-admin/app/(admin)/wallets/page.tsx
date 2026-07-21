'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton, formatMoney } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

const PAGE_SIZE = 20;

type WalletItem = { id: string; userId: string; shortUserId?: string | null; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string } };
type PendingAdjustment = { userId: string; username: string; direction: 'CREDIT' | 'DEBIT'; amount: number; reason: string };
type WalletsCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; totalWallets: string; filteredWallets: string; itemsOnPage: string; page: string; availableOnPage: string; lockedOnPage: string; visibleOnly: string; unavailableBalance: string;
  searchPlaceholder: string; searchAria: string; search: string; previous: string; next: string; adjustment: string; memberIdPlaceholder: string; memberIdAria: string; directionAria: string; credit: string; debit: string; amountPlaceholder: string; amountAria: string; reasonPlaceholder: string; reasonAria: string; reviewAdjustment: string; saving: string;
  member: string; status: string; available: string; total: string; locked: string; updated: string; actions: string; details: string; history: string; add: string; subtract: string; noWallets: string; confirmCreditTitle: string; confirmDebitTitle: string; confirmDescription: string; confirmCredit: string; confirmDebit: string; dialogMember: string; dialogAmount: string; dialogReason: string; unknownStatus: string;
  statuses: Record<string, string>; messages: { loadFailed: string; memberRequired: string; amountInvalid: string; reasonRequired: string; adjusting: string; adjustFailed: string; adjusted: string; selected: string };
};

const walletsCopy: Record<AdminLocale, WalletsCopy> = {
  th: {
    eyebrow: 'การเงิน', title: 'กระเป๋าเงินสมาชิก', description: 'ค้นหา ตรวจยอด และปรับยอด', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', totalWallets: 'กระเป๋าทั้งหมด', filteredWallets: 'กระเป๋าตามตัวกรอง', itemsOnPage: 'รายการหน้านี้', page: 'หน้า', availableOnPage: 'ยอดใช้ได้หน้านี้', lockedOnPage: 'ยอดล็อกหน้านี้', visibleOnly: 'รวมเฉพาะข้อมูลที่แสดง', unavailableBalance: 'ยอดที่ยังไม่พร้อมใช้งาน',
    searchPlaceholder: 'ชื่อผู้ใช้ รหัสสมาชิก หรือรหัสผู้ใช้', searchAria: 'ค้นหาสมาชิก', search: 'ค้นหา', previous: 'ก่อนหน้า', next: 'ถัดไป', adjustment: 'ปรับยอดกระเป๋าเงิน', memberIdPlaceholder: 'รหัสผู้ใช้ของสมาชิก', memberIdAria: 'รหัสผู้ใช้สมาชิก', directionAria: 'ทิศทางการปรับยอด', credit: 'เพิ่มยอด', debit: 'ลดยอด', amountPlaceholder: 'จำนวนเงิน', amountAria: 'จำนวนเงิน', reasonPlaceholder: 'เหตุผลที่ปรับยอด', reasonAria: 'เหตุผลที่ปรับยอด', reviewAdjustment: 'ตรวจสอบก่อนยืนยัน', saving: 'กำลังบันทึก...',
    member: 'สมาชิก', status: 'สถานะ', available: 'ยอดใช้ได้', total: 'ยอดรวม', locked: 'ยอดล็อก', updated: 'อัปเดตล่าสุด', actions: 'การทำงาน', details: 'สมาชิก', history: 'ประวัติ', add: 'เพิ่ม', subtract: 'ลด', noWallets: 'ยังไม่พบกระเป๋าเงิน', confirmCreditTitle: 'ยืนยันการเพิ่มยอด', confirmDebitTitle: 'ยืนยันการลดยอด', confirmDescription: 'ตรวจสอบสมาชิก จำนวนเงิน และเหตุผลให้ถูกต้อง รายการจะถูกบันทึกในประวัติเงิน', confirmCredit: 'ยืนยันเพิ่มยอด', confirmDebit: 'ยืนยันลดยอด', dialogMember: 'สมาชิก', dialogAmount: 'จำนวน', dialogReason: 'เหตุผล', unknownStatus: 'ไม่ทราบสถานะ',
    statuses: { ACTIVE: 'ใช้งานได้', INACTIVE: 'ไม่ใช้งาน', SUSPENDED: 'ระงับ', LOCKED: 'ล็อก' }, messages: { loadFailed: 'โหลดกระเป๋าเงินไม่สำเร็จ', memberRequired: 'เลือกสมาชิกก่อนปรับยอด', amountInvalid: 'จำนวนเงินต้องมากกว่า 0', reasonRequired: 'ระบุเหตุผลก่อนปรับยอด', adjusting: 'กำลังปรับยอด...', adjustFailed: 'ปรับยอดไม่สำเร็จ', adjusted: 'ปรับยอดและบันทึกประวัติแล้ว', selected: 'เลือก {member} แล้ว' },
  },
  en: {
    eyebrow: 'Finance', title: 'Member wallets', description: 'Search, review, and adjust balances', refresh: 'Refresh', loading: 'Loading...', totalWallets: 'Total wallets', filteredWallets: 'Wallets matching the filter', itemsOnPage: 'Items on page', page: 'Page', availableOnPage: 'Available on page', lockedOnPage: 'Locked on page', visibleOnly: 'Visible data only', unavailableBalance: 'Balance not yet available',
    searchPlaceholder: 'Username, member ID, or user ID', searchAria: 'Search members', search: 'Search', previous: 'Previous', next: 'Next', adjustment: 'Wallet adjustment', memberIdPlaceholder: 'Member user ID', memberIdAria: 'Member user ID', directionAria: 'Adjustment direction', credit: 'Add funds', debit: 'Subtract funds', amountPlaceholder: 'Amount', amountAria: 'Amount', reasonPlaceholder: 'Adjustment reason', reasonAria: 'Adjustment reason', reviewAdjustment: 'Review before confirming', saving: 'Saving...',
    member: 'Member', status: 'Status', available: 'Available', total: 'Total', locked: 'Locked', updated: 'Last updated', actions: 'Actions', details: 'Member', history: 'History', add: 'Add', subtract: 'Subtract', noWallets: 'No wallets found', confirmCreditTitle: 'Confirm credit', confirmDebitTitle: 'Confirm debit', confirmDescription: 'Verify the member, amount, and reason. This action will be recorded in the ledger.', confirmCredit: 'Confirm credit', confirmDebit: 'Confirm debit', dialogMember: 'Member', dialogAmount: 'Amount', dialogReason: 'Reason', unknownStatus: 'Unknown status',
    statuses: { ACTIVE: 'Active', INACTIVE: 'Inactive', SUSPENDED: 'Suspended', LOCKED: 'Locked' }, messages: { loadFailed: 'Unable to load wallets', memberRequired: 'Select a member before adjusting', amountInvalid: 'Amount must be greater than 0', reasonRequired: 'Enter an adjustment reason', adjusting: 'Adjusting balance...', adjustFailed: 'Unable to adjust the balance', adjusted: 'Balance adjusted and recorded', selected: '{member} selected' },
  },
};

type WalletMessage = keyof WalletsCopy['messages'];

export default function AdminWalletsPage() {
  const [locale] = useAdminLocale();
  const copy = walletsCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<WalletItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<{ key: WalletMessage; value?: string } | null>(null);
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'warning' | 'danger'>('neutral');
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
  const showMessage = (key: WalletMessage, tone: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral', value?: string) => { setMessage(value === undefined ? { key } : { key, value }); setMessageTone(tone); };
  const messageText = message ? copy.messages[message.key].replace('{member}', message.value ?? '') : '';

  async function loadItems(nextPage = page) {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminApiFetch(`/admin/wallets?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems);
      setTotal(Number(data?.total ?? nextItems.length));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
    } catch {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      showMessage('loadFailed', 'danger');
    } finally { setLoading(false); }
  }

  function searchWallets(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (page !== 1) setPage(1); else void loadItems(1); }
  function requestAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!adjustUserId.trim()) return showMessage('memberRequired', 'warning');
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return showMessage('amountInvalid', 'warning');
    if (!reason.trim()) return showMessage('reasonRequired', 'warning');
    const wallet = items.find((item) => item.userId === adjustUserId);
    setPendingAdjustment({ userId: adjustUserId, username: wallet?.user?.username ?? wallet?.shortUserId ?? adjustUserId, direction, amount: parsedAmount, reason: reason.trim() });
  }
  async function confirmAdjustment() {
    if (!pendingAdjustment || busy) return;
    const { userId, direction: nextDirection, amount: parsedAmount, reason: adjustmentReason } = pendingAdjustment;
    setBusy(true);
    showMessage('adjusting');
    try {
      const res = await adminApiFetch(`/admin/wallets/${userId}/adjust`, { method: 'POST', body: JSON.stringify({ direction: nextDirection, amount: parsedAmount, reason: adjustmentReason, idempotencyKey: `wallet-adjust-${userId}-${nextDirection}-${parsedAmount}-${Date.now()}` }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems((current) => current.map((item) => item.userId === userId ? { ...item, ...data.wallet } : item));
      setAmount(''); setReason(''); setPendingAdjustment(null); showMessage('adjusted', 'success');
    } catch { showMessage('adjustFailed', 'danger'); } finally { setBusy(false); }
  }
  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') {
    const username = item.user?.username ?? item.shortUserId ?? item.userId;
    setAdjustUserId(item.userId); setDirection(nextDirection); showMessage('selected', 'neutral', username);
    setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton size="compact" onClick={() => void loadItems(page)} disabled={loading}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    <section className="admin-wallet-detail" aria-busy={loading}><AdminMetricGrid>
      <AdminMetric title={copy.totalWallets} value={formatNumber(total, locale)} helper={copy.filteredWallets} />
      <AdminMetric title={copy.itemsOnPage} value={formatNumber(items.length, locale)} helper={`${copy.page} ${formatNumber(page, locale)} / ${formatNumber(pageCount, locale)}`} />
      <AdminMetric title={copy.availableOnPage} value={formatMoney(pageAvailable)} tone="success" helper={copy.visibleOnly} />
      <AdminMetric title={copy.lockedOnPage} value={formatMoney(pageLocked)} tone={pageLocked > 0 ? 'warning' : 'neutral'} helper={copy.unavailableBalance} />
    </AdminMetricGrid>
      <form onSubmit={searchWallets} className="admin-wallet-detail__toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.searchPlaceholder} aria-label={copy.searchAria} /><AdminButton type="submit" size="compact" disabled={loading}>{copy.search}</AdminButton><AdminButton size="compact" tone="ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(value - 1, 1))}>{copy.previous}</AdminButton><span>{copy.page} {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>{copy.next}</AdminButton></form>
      <form id="adjust-form" onSubmit={requestAdjustment} className="admin-wallet-detail__toolbar"><strong>{copy.adjustment}</strong><input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder={copy.memberIdPlaceholder} aria-label={copy.memberIdAria} /><select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')} aria-label={copy.directionAria}><option value="CREDIT">{copy.credit}</option><option value="DEBIT">{copy.debit}</option></select><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={copy.amountPlaceholder} inputMode="decimal" aria-label={copy.amountAria} /><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={copy.reasonPlaceholder} aria-label={copy.reasonAria} /><AdminButton type="submit" size="compact" disabled={busy}>{busy ? copy.saving : copy.reviewAdjustment}</AdminButton></form>
      {message && <AdminNotice tone={messageTone}>{messageText}</AdminNotice>}
      {loading ? <AdminSkeleton lines={5} /> : items.length === 0 ? <div className="admin-wallet-detail__state"><AdminEmpty>{copy.noWallets}</AdminEmpty></div> : <div className="admin-wallet-detail__table-shell"><table className="admin-wallet-detail__table"><thead><tr><th>{copy.member}</th><th>{copy.status}</th><th>{copy.available}</th><th>{copy.total}</th><th>{copy.locked}</th><th>{copy.updated}</th><th>{copy.actions}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.user?.username ?? item.userId}</strong><br /><small>{item.user?.shortId ?? item.shortUserId ?? item.userId}</small></td><td><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{statusLabel(item.status, copy)}</AdminBadge></td><td className="admin-wallet-detail__amount">{formatMoney(item.availableBalance)}</td><td className="admin-wallet-detail__amount">{formatMoney(item.balance)}</td><td className="admin-wallet-detail__amount">{formatMoney(item.lockedBalance)}</td><td>{new Date(item.updatedAt).toLocaleString(dateLocale)}</td><td><div className="admin-wallet-detail__toolbar"><AdminLinkButton size="compact" href={`/member-detail?id=${item.userId}`}>{copy.details}</AdminLinkButton><AdminLinkButton size="compact" href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>{copy.history}</AdminLinkButton><AdminButton size="compact" tone="success" onClick={() => startAdjust(item, 'CREDIT')}>{copy.add}</AdminButton><AdminButton size="compact" tone="danger" onClick={() => startAdjust(item, 'DEBIT')}>{copy.subtract}</AdminButton></div></td></tr>)}</tbody></table></div>}
    </section>
    <AdminConfirmDialog open={Boolean(pendingAdjustment)} title={pendingAdjustment?.direction === 'DEBIT' ? copy.confirmDebitTitle : copy.confirmCreditTitle} description={copy.confirmDescription} confirmLabel={pendingAdjustment?.direction === 'DEBIT' ? copy.confirmDebit : copy.confirmCredit} tone={pendingAdjustment?.direction === 'DEBIT' ? 'danger' : 'success'} busy={busy} onCancel={() => setPendingAdjustment(null)} onConfirm={() => void confirmAdjustment()} details={pendingAdjustment ? <><p><strong>{copy.dialogMember}:</strong> {pendingAdjustment.username}</p><p><strong>{copy.dialogAmount}:</strong> {formatMoney(pendingAdjustment.amount)}</p><p><strong>{copy.dialogReason}:</strong> {pendingAdjustment.reason}</p></> : null} />
  </AdminPage>;
}

function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function statusLabel(status: string, copy: WalletsCopy) { return copy.statuses[status] ?? copy.unknownStatus; }
