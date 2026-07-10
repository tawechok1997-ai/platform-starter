'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PAGE_SIZE = 20;

type WalletItem = { id: string; userId: string; shortUserId?: string | null; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string } };

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

  useEffect(() => { loadItems(undefined, 1); }, []);
  useEffect(() => { loadItems(undefined, page); }, [page]);

  async function loadItems(event?: FormEvent<HTMLFormElement>, nextPage = page) {
    event?.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setMessage('กำลังโหลด wallets...');
    const res = await fetch(`${API_URL}/admin/wallets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด wallets ไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  function searchWallets(event: FormEvent<HTMLFormElement>) {
    setPage(1);
    loadItems(event, 1);
  }

  async function adjustWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    if (!adjustUserId) { setMessage('เลือก member ก่อน'); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('จำนวนเงินต้องมากกว่า 0'); return; }
    if (!reason.trim()) { setMessage('ต้องใส่เหตุผล'); return; }
    const idempotencyKey = `wallet-adjust-${adjustUserId}-${direction}-${parsedAmount}-${Date.now()}`;
    setBusy(true); setMessage('กำลังปรับยอด...');
    const res = await fetch(`${API_URL}/admin/wallets/${adjustUserId}/adjust`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ direction, amount: parsedAmount, reason, idempotencyKey }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'ปรับยอดไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.userId === adjustUserId ? { ...item, ...data.wallet } : item)));
    setAmount(''); setReason(''); setMessage('ปรับยอดสำเร็จ และเขียน ledger แล้ว');
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') { setAdjustUserId(item.userId); setDirection(nextDirection); setMessage(`กำลังปรับยอดให้ ${item.user?.username ?? item.shortUserId}`); setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }

  return (
    <AdminPage eyebrow="Wallet Operations" title="Member Wallets" description="ค้นหา member และปรับยอด manual พร้อมบันทึก ledger">
      <AdminMetricGrid><AdminMetric title="Loaded" value={String(items.length)} helper={`${total} total`} /><AdminMetric title="Page" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} per page`} /><AdminMetric title="Search" value={search.trim() ? 'Active' : 'All'} helper="wallet list" /></AdminMetricGrid>
      <form onSubmit={searchWallets}><AdminToolbar><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username / short ID / user ID" /><AdminButton type="submit">Search</AdminButton><div style={pagerStyle}><AdminButton type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</AdminButton><span>Page {page} / {pageCount}</span><AdminButton type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</AdminButton></div></AdminToolbar></form>
      <form id="adjust-form" onSubmit={adjustWallet}><AdminToolbar><strong style={{ fontSize: 20 }}>Manual Wallet Adjustment</strong><input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="full userId" /><select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')}><option value="CREDIT">เพิ่มยอด / CREDIT</option><option value="DEBIT">ลดยอด / DEBIT</option></select><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="amount" inputMode="decimal" /><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="reason จำเป็น" /><AdminButton type="submit" disabled={busy}>{busy ? 'กำลังทำ...' : 'Confirm Adjustment'}</AdminButton></AdminToolbar></form>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.user?.username ?? item.userId}</h2><p>Short ID: <strong>{item.user?.shortId ?? item.shortUserId ?? '-'}</strong></p><p>User ID: <code>{item.userId}</code></p><p>Phone: {item.user?.phone ?? '-'}</p><p>Email: {item.user?.email ?? '-'}</p><p>Updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><h2 style={{ margin: '0 0 8px', fontSize: 'clamp(26px, 7vw, 40px)', lineHeight: 1 }}>{formatMoney(item.availableBalance)}</h2><p>Balance: {formatMoney(item.balance)}</p><p>Locked: {formatMoney(item.lockedBalance)}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, justifyContent: 'flex-end' }}><AdminLinkButton href={`/member-detail?id=${item.userId}`}>Member Detail</AdminLinkButton><AdminLinkButton href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>Ledger</AdminLinkButton><AdminButton onClick={() => navigator.clipboard?.writeText(item.userId)} tone="secondary">Copy ID</AdminButton><AdminButton onClick={() => startAdjust(item, 'CREDIT')} tone="success">+ เพิ่มยอด</AdminButton><AdminButton onClick={() => startAdjust(item, 'DEBIT')} tone="danger">- ลดยอด</AdminButton></div></div></AdminRow></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
