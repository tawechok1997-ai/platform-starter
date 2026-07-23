'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminBadge, AdminButton, AdminDataValue, AdminEmpty, AdminNotice, AdminPage, AdminSkeleton, formatMoney } from '../_components/admin-ui';

type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; user?: { username?: string; shortId?: string | null } };
type Filters = { identifier: string; from: string; to: string };
const PAGE_SIZE = 50;

export default function WalletStatementPage() {
  const [filters, setFilters] = useState<Filters>({ identifier: '', from: '', to: '' });
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<LedgerItem | null>(null);

  useEffect(() => { void loadStatement(1); }, []);

  const totals = useMemo(() => items.reduce((result, item) => {
    const amount = Number(item.amount || 0);
    if (item.direction === 'CREDIT') result.credit += amount;
    if (item.direction === 'DEBIT') result.debit += amount;
    return result;
  }, { credit: 0, debit: 0 }), [items]);

  async function loadStatement(nextPage = page) {
    setLoading(true); setMessage('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (filters.identifier.trim()) params.set('identifier', filters.identifier.trim());
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      const response = await adminApiFetch(`/admin/ledgers?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'โหลด Statement ไม่สำเร็จ');
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems); setTotal(Number(data?.total ?? nextItems.length)); setPageCount(Math.max(Number(data?.pageCount ?? 1), 1)); setPage(nextPage);
    } catch (error) {
      setItems([]); setTotal(0); setPageCount(1); setMessage(error instanceof Error ? error.message : 'โหลด Statement ไม่สำเร็จ');
    } finally { setLoading(false); }
  }

  function clearFilters() { setFilters({ identifier: '', from: '', to: '' }); window.setTimeout(() => void loadStatement(1), 0); }

  function exportCsv() {
    const rows = [['วันที่','สมาชิก','ประเภท','ทิศทาง','จำนวน','ยอดก่อน','ยอดหลัง','อ้างอิง'], ...items.map((item) => [new Date(item.createdAt).toLocaleString('th-TH'), item.user?.username ?? '-', item.type, item.direction, item.amount, item.balanceBefore, item.balanceAfter, [item.referenceType, item.referenceId].filter(Boolean).join(':') || '-'])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `wallet-statement-${new Date().toISOString().slice(0,10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const groupedItems = useMemo(() => items.reduce<Array<{ date: string; items: LedgerItem[] }>>((groups, item) => { const date = new Date(item.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }); const current = groups[groups.length - 1]; if (current?.date === date) current.items.push(item); else groups.push({ date, items: [item] }); return groups; }, []), [items]);

  return <AdminPage eyebrow="การเงิน" title="Wallet Statement" description="ตรวจรายการเดินบัญชี พร้อมยอดก่อนและหลัง และส่งออกได้ทันที" actions={<><AdminButton size="compact" tone="secondary" disabled={loading || items.length === 0} onClick={exportCsv}>ส่งออก CSV</AdminButton><AdminButton size="compact" tone="secondary" disabled={loading || items.length === 0} onClick={() => window.print()}>พิมพ์ / PDF</AdminButton><AdminButton size="compact" disabled={loading} onClick={() => void loadStatement(page)}>รีเฟรช</AdminButton></>}>
    <section className="admin-wallet-statement" aria-busy={loading}>
      <div className="admin-wallet-statement__stats"><Metric label="รายการทั้งหมด" value={total.toLocaleString('th-TH')} /><Metric label="เงินเข้าหน้านี้" value={formatMoney(totals.credit)} /><Metric label="เงินออกหน้านี้" value={formatMoney(totals.debit)} /><Metric label="หน้าปัจจุบัน" value={`${page}/${pageCount}`} /></div>
      <form className="admin-wallet-statement__toolbar" onSubmit={(event) => { event.preventDefault(); void loadStatement(1); }}>
        <label><span>สมาชิก</span><input value={filters.identifier} onChange={(event) => setFilters((current) => ({ ...current, identifier: event.target.value }))} placeholder="ชื่อผู้ใช้ รหัสสมาชิก หรือ User ID" /></label>
        <label><span>ตั้งแต่วันที่</span><input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label><span>ถึงวันที่</span><input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <AdminButton type="submit" size="compact" disabled={loading}>ค้นหา</AdminButton><AdminButton size="compact" tone="secondary" disabled={loading} onClick={clearFilters}>ล้าง</AdminButton>
      </form>
      {message && <AdminNotice tone="danger">{message}</AdminNotice>}
      {loading && items.length === 0 ? <AdminSkeleton lines={6} /> : <div className="admin-wallet-statement__table-shell"><table className="admin-wallet-statement__table"><thead><tr><th>วันที่</th><th>สมาชิก</th><th>รายการ</th><th>จำนวน</th><th>ยอดก่อน</th><th>ยอดหลัง</th><th>อ้างอิง</th><th><span className="sr-only">รายละเอียด</span></th></tr></thead><tbody>{groupedItems.map((group) => <Fragment key={group.date}><tr className="admin-wallet-statement__day"><td colSpan={8}>{group.date} · {group.items.length} รายการ</td></tr>{group.items.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td><td><strong>{item.user?.username ?? '-'}</strong><br /><small>{item.user?.shortId ?? '-'}</small></td><td><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'danger'}>{item.direction === 'CREDIT' ? 'เงินเข้า' : 'เงินออก'}</AdminBadge><br /><small>{item.type}</small></td><td className="admin-wallet-statement__amount">{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</td><td>{formatMoney(item.balanceBefore)}</td><td>{formatMoney(item.balanceAfter)}</td><td><AdminDataValue label={item.referenceType ?? 'Reference'} mono>{item.referenceId ?? '-'}</AdminDataValue></td><td><AdminButton size="compact" tone="secondary" onClick={() => setSelected(item)}>ดู</AdminButton></td></tr>)}</Fragment>)}</tbody></table>{!loading && items.length === 0 && <div className="admin-wallet-statement__state"><AdminEmpty>ไม่พบรายการตามเงื่อนไข</AdminEmpty></div>}</div>}
      <div className="admin-wallet-statement__toolbar"><AdminButton size="compact" tone="secondary" disabled={loading || page <= 1} onClick={() => void loadStatement(page - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} จาก {pageCount}</span><AdminButton size="compact" tone="secondary" disabled={loading || page >= pageCount} onClick={() => void loadStatement(page + 1)}>ถัดไป</AdminButton></div>
      <AdminDrawer open={Boolean(selected)} title="รายละเอียดรายการ" description={selected ? `${selected.type} · ${selected.direction}` : undefined} closeLabel="ปิด" size="compact" onClose={() => setSelected(null)}>
        {selected && <dl style={detailListStyle}><Detail label="เวลา" value={new Date(selected.createdAt).toLocaleString('th-TH')} /><Detail label="สมาชิก" value={selected.user?.username ?? selected.user?.shortId ?? '-'} /><Detail label="ประเภท" value={`${selected.type} · ${selected.direction}`} /><Detail label="จำนวน" value={formatMoney(selected.amount)} /><Detail label="ยอดก่อน" value={formatMoney(selected.balanceBefore)} /><Detail label="ยอดหลัง (Running balance)" value={formatMoney(selected.balanceAfter)} /><Detail label="อ้างอิง" value={[selected.referenceType, selected.referenceId].filter(Boolean).join(' · ') || '-'} /></dl>}
      </AdminDrawer>
    </section>
  </AdminPage>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="admin-wallet-statement__stat"><span>{label}</span><strong>{value}</strong></article>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
const detailListStyle = { display: 'grid', gap: 12, margin: 0 } as const;
