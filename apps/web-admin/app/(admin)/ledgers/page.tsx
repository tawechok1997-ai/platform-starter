'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const PAGE_SIZE = 20;

type LedgerItem = { id: string; userId: string; shortUserId?: string | null; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null }; createdByAdmin?: { id: string; username: string; email?: string | null } | null };

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextIdentifier = params.get('identifier') ?? params.get('userId') ?? '';
    setIdentifier(nextIdentifier);
    void loadItems(nextIdentifier, 1);
  }, []);

  async function loadItems(nextIdentifier = identifier, nextPage = page) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (direction) params.set('direction', direction);
    if (nextIdentifier) params.set('identifier', nextIdentifier);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setMessage('กำลังโหลด ledger...');

    try {
      const res = await adminApiFetch(`/admin/ledgers?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลด ledger ไม่สำเร็จ (${res.status})`);

      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      setPage(nextPage);
      setMessage('');
    } catch (error) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessage(error instanceof Error ? error.message : 'โหลด ledger ไม่สำเร็จ');
    }
  }

  function applyFilters() {
    void loadItems(identifier, 1);
  }

  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeDirection(value: string) {
    setDirection(value);
    setPage(1);
  }

  function goToPage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), pageCount);
    void loadItems(identifier, safePage);
  }

  return (
    <AdminPage eyebrow="Wallet Operations" title="Wallet Ledgers" description="ค้นหาด้วย username, Short ID หรือ userId และกรองประเภทรายการได้" actions={<AdminButton onClick={applyFilters}>Apply</AdminButton>}>
      <AdminMetricGrid><AdminMetric title="Loaded" value={String(items.length)} helper={`${total} total`} /><AdminMetric title="Page" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} per page`} /><AdminMetric title="Filter" value={type || 'ALL'} helper={direction || 'ALL'} /></AdminMetricGrid>
      <AdminToolbar><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="username / short ID / user ID" /><select value={type} onChange={(event) => changeType(event.target.value)}><option value="">ทุกประเภท</option><option value="DEPOSIT">DEPOSIT</option><option value="WITHDRAWAL">WITHDRAWAL</option><option value="ADJUSTMENT">ADJUSTMENT</option><option value="BONUS">BONUS</option><option value="REVERSAL">REVERSAL</option></select><select value={direction} onChange={(event) => changeDirection(event.target.value)}><option value="">ทุกทิศทาง</option><option value="CREDIT">CREDIT</option><option value="DEBIT">DEBIT</option></select><div style={pagerStyle}><AdminButton disabled={page <= 1} onClick={() => goToPage(page - 1)}>Prev</AdminButton><span>Page {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>Next</AdminButton></div></AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'danger'}>{item.type}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.direction}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Short ID: {item.user?.shortId ?? item.shortUserId ?? '-'}</p><p>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p><p>Admin: {item.createdByAdmin?.username ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong style={{ fontSize: 'clamp(22px, 6vw, 32px)', textAlign: 'right', color: item.direction === 'CREDIT' ? '#bbf7d0' : '#fecaca' }}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong></AdminRow><div style={balanceGridStyle}><div><span>Before</span><strong>{formatMoney(item.balanceBefore)}</strong></div><div><span>After</span><strong>{formatMoney(item.balanceAfter)}</strong></div></div></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14, borderTop: '1px solid rgba(148,163,184,.18)', paddingTop: 12 } as const;
const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
