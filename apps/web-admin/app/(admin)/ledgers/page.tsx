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
  const [loading, setLoading] = useState(false);

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
    if (nextIdentifier.trim()) params.set('identifier', nextIdentifier.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    setLoading(true);
    setMessage('กำลังโหลดประวัติการเงิน...');
    try {
      const res = await adminApiFetch(`/admin/ledgers?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลดประวัติการเงินไม่สำเร็จ (${res.status})`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? data?.items?.length ?? 0));
      setPageCount(Math.max(Number(data?.pageCount ?? 1), 1));
      setPage(nextPage);
      setMessage('');
    } catch (error) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessage(error instanceof Error ? error.message : 'โหลดประวัติการเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() { void loadItems(identifier, 1); }
  function clearFilters() { setIdentifier(''); setType(''); setDirection(''); setPage(1); void loadItems('', 1); }
  function goToPage(nextPage: number) { void loadItems(identifier, Math.min(Math.max(nextPage, 1), pageCount)); }

  return (
    <AdminPage eyebrow="การเงิน" title="ประวัติเงินเข้าออก" description="ค้นหาสมาชิกและตรวจสอบยอดก่อน–หลังของแต่ละรายการ" actions={<><AdminButton size="compact" tone="ghost" onClick={clearFilters}>ล้างตัวกรอง</AdminButton><AdminButton size="compact" onClick={applyFilters} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
      <AdminMetricGrid>
        <AdminMetric title="รายการหน้านี้" value={String(items.length)} helper={`ทั้งหมด ${total} รายการ`} />
        <AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
        <AdminMetric title="ตัวกรอง" value={typeLabel(type)} helper={directionLabel(direction)} />
      </AdminMetricGrid>
      <AdminToolbar>
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }} placeholder="ชื่อผู้ใช้ รหัสสมาชิก หรือ User ID" />
        <select value={type} onChange={(event) => setType(event.target.value)}><option value="">ทุกประเภท</option><option value="DEPOSIT">ฝากเงิน</option><option value="WITHDRAWAL">ถอนเงิน</option><option value="ADJUSTMENT">ปรับยอด</option><option value="BONUS">โบนัส</option><option value="REVERSAL">คืนรายการ</option></select>
        <select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="">เงินเข้าและออก</option><option value="CREDIT">เงินเข้า</option><option value="DEBIT">เงินออก</option></select>
        <AdminButton size="compact" onClick={applyFilters} disabled={loading}>ค้นหา</AdminButton>
        <div style={pagerStyle}><AdminButton size="compact" tone="ghost" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>ก่อนหน้า</AdminButton><span style={pageLabelStyle}>หน้า {page} / {pageCount}</span><AdminButton size="compact" tone="ghost" disabled={page >= pageCount || loading} onClick={() => goToPage(page + 1)}>ถัดไป</AdminButton></div>
      </AdminToolbar>
      {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id} compact tone={item.direction === 'CREDIT' ? 'success' : 'neutral'}>
        <AdminRow><div style={mainInfoStyle}><div style={badgeRowStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'danger'}>{directionLabel(item.direction)}</AdminBadge><AdminBadge>{typeLabel(item.type)}</AdminBadge></div><strong style={memberStyle}>{item.user?.username ?? item.userId}</strong><span style={metaStyle}>รหัสสมาชิก {item.user?.shortId ?? item.shortUserId ?? '-'}</span><span style={metaStyle}>อ้างอิง {referenceText(item)}</span><span style={metaStyle}>ผู้ดำเนินการ {item.createdByAdmin?.username ?? '-'}</span><span style={metaStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><strong style={{ ...amountStyle, color: item.direction === 'CREDIT' ? '#bbf7d0' : '#fecaca' }}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong></AdminRow>
        <div style={balanceGridStyle}><div style={balanceBoxStyle}><span>ยอดก่อนรายการ</span><strong>{formatMoney(item.balanceBefore)}</strong></div><div style={balanceBoxStyle}><span>ยอดหลังรายการ</span><strong>{formatMoney(item.balanceAfter)}</strong></div></div>
      </AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ไม่พบประวัติการเงินตามตัวกรอง</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

function typeLabel(value: string) { return ({ DEPOSIT: 'ฝากเงิน', WITHDRAWAL: 'ถอนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส', REVERSAL: 'คืนรายการ' } as Record<string, string>)[value] ?? (value || 'ทุกประเภท'); }
function directionLabel(value: string) { return ({ CREDIT: 'เงินเข้า', DEBIT: 'เงินออก' } as Record<string, string>)[value] ?? (value || 'เงินเข้าและออก'); }
function referenceText(item: LedgerItem) { const type = item.referenceType ? typeLabel(item.referenceType) : '-'; return item.referenceId ? `${type} · ${item.referenceId.slice(0, 12)}…` : type; }
const pagerStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const };
const pageLabelStyle = { color: '#94a3b8', fontSize: 13, whiteSpace: 'nowrap' as const };
const mainInfoStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const badgeRowStyle = { display: 'flex', gap: 6, flexWrap: 'wrap' as const };
const memberStyle = { fontSize: 18, lineHeight: 1.25 } as const;
const metaStyle = { color: '#94a3b8', fontSize: 13, lineHeight: 1.4, overflowWrap: 'anywhere' as const };
const amountStyle = { fontSize: 'clamp(20px, 5vw, 28px)', textAlign: 'right' as const, lineHeight: 1.1, whiteSpace: 'nowrap' as const };
const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10, borderTop: '1px solid rgba(148,163,184,.14)', paddingTop: 10 } as const;
const balanceBoxStyle = { display: 'grid', gap: 4, minWidth: 0, padding: 10, borderRadius: 12, background: 'rgba(15,23,42,.44)' } as const;
