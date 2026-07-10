'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];
const PAGE_SIZE = 20;

export default function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadItems(undefined, 1); }, []);
  useEffect(() => { loadItems(undefined, page); }, [page]);

  async function loadItems(event?: FormEvent<HTMLFormElement>, nextPage = page) {
    event?.preventDefault();
    setLoading(true);
    setMessage('กำลังโหลดสมาชิก...');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/members?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดสมาชิกไม่สำเร็จ'); setLoading(false); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
    setLoading(false);
  }

  function searchMembers(event: FormEvent<HTMLFormElement>) {
    setPage(1);
    loadItems(event, 1);
  }

  function resetFilters() {
    setSearch('');
    setStatus('ALL');
    setPage(1);
    setTimeout(() => loadItems(undefined, 1), 0);
  }

  async function updateStatus(id: string, nextStatus: string) {
    setBusyId(id);
    setMessage('กำลังอัปเดตสถานะ...');
    const res = await adminApiFetch(`/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: 'quick action from members page' }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: data.user.status } : item));
    setMessage('อัปเดตสถานะแล้ว');
  }

  const totals = useMemo(() => {
    const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
    const restrictedCount = items.filter((item) => item.status !== 'ACTIVE').length;
    const available = items.reduce((sum, item) => sum + Number(item.availableBalance ?? 0), 0);
    return { activeCount, restrictedCount, available };
  }, [items]);

  return <AdminPage eyebrow="Operations" title="Members" description="ค้นหา ตรวจสถานะ และจัดการสมาชิกจากหน้าเดียว" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}>
    <form onSubmit={searchMembers}>
      <AdminToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="username / phone / email / shortId" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <AdminButton type="submit">Search</AdminButton>
        <AdminButton type="button" tone="secondary" onClick={resetFilters}>Reset</AdminButton>
        <div style={pagerStyle}><AdminButton type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</AdminButton><span>Page {page} / {pageCount}</span><AdminButton type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</AdminButton></div>
      </AdminToolbar>
    </form>

    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Loaded" value={`${items.length}`} helper={`${total} total`} />
      <AdminMetric title="Page" value={`${page}/${pageCount}`} helper={status === 'ALL' ? 'ทุกสถานะ' : status} />
      <AdminMetric title="Active" value={`${totals.activeCount}`} helper="สมาชิกใช้งานได้ในหน้านี้" />
      <AdminMetric title="Available" value={formatMoney(String(totals.available))} helper="รวมเฉพาะรายการที่โหลด" />
    </AdminMetricGrid>

    {loading && items.length === 0 ? <AdminEmpty>กำลังโหลดสมาชิก...</AdminEmpty> : <AdminStack>{items.map((item) => <AdminCard key={item.id} title={item.username} description={`${item.displayName || 'No display name'} · ${item.shortId}`}>
      <AdminRow>
        <div style={memberInfoStyle}>
          <div style={badgeRowStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminBadge>{item.shortId}</AdminBadge></div>
          <p>{item.phone || '-'} · {item.email || '-'}</p>
          <p>Joined {new Date(item.createdAt).toLocaleDateString('th-TH')} · Last login {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : '-'}</p>
        </div>
        <div style={moneyStyle}>
          <div><span style={mutedStyle}>Available</span><strong style={moneyValueStyle}>{formatMoney(item.availableBalance)}</strong></div>
          <div style={smallMoneyGridStyle}><span>Balance {formatMoney(item.balance)}</span><span>Locked {formatMoney(item.lockedBalance)}</span></div>
          <a href={`/members/${item.id}`} style={linkStyle}>View profile</a>
          <div style={buttonRowStyle}>
            <AdminButton disabled={busyId === item.id || item.status === 'ACTIVE'} tone="success" onClick={() => updateStatus(item.id, 'ACTIVE')}>Active</AdminButton>
            <AdminButton disabled={busyId === item.id || item.status === 'SUSPENDED'} tone="danger" onClick={() => updateStatus(item.id, 'SUSPENDED')}>Suspend</AdminButton>
            <AdminButton disabled={busyId === item.id || item.status === 'LOCKED'} tone="danger" onClick={() => updateStatus(item.id, 'LOCKED')}>Lock</AdminButton>
          </div>
        </div>
      </AdminRow>
    </AdminCard>)}{items.length === 0 && <AdminEmpty>ไม่พบสมาชิก</AdminEmpty>}</AdminStack>}
  </AdminPage>;
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger';
  return 'neutral';
}

const linkStyle = { color: '#f5c542', fontWeight: 900, textDecoration: 'none' } as const;
const memberInfoStyle = { display: 'grid', gap: 7, minWidth: 240 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const moneyStyle = { textAlign: 'right' as const, display: 'grid', gap: 10, minWidth: 240 };
const mutedStyle = { opacity: 0.66 } as const;
const moneyValueStyle = { display: 'block', fontSize: 22 } as const;
const smallMoneyGridStyle = { display: 'grid', gap: 4, color: '#94a3b8', fontSize: 13 };
const buttonRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
