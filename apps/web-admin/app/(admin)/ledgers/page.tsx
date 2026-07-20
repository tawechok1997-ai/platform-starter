'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminNotice, AdminPage, formatMoney } from '../_components/admin-ui';

const PAGE_SIZE = 20;

type LedgerItem = {
  id: string;
  userId: string;
  shortUserId?: string | null;
  type: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null };
  createdByAdmin?: { id: string; username: string; email?: string | null } | null;
};

type LedgerFilters = { identifier: string; type: string; direction: string };

const EMPTY_FILTERS: LedgerFilters = { identifier: '', type: '', direction: '' };

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFilters = {
      identifier: params.get('identifier') ?? params.get('userId') ?? '',
      type: params.get('type') ?? '',
      direction: params.get('direction') ?? '',
    };
    const initialPage = Math.max(Number(params.get('page') ?? 1) || 1, 1);
    setFilters(initialFilters);
    void loadItems(initialFilters, initialPage);
  }, []);

  const pageCredit = useMemo(() => sumByDirection(items, 'CREDIT'), [items]);
  const pageDebit = useMemo(() => sumByDirection(items, 'DEBIT'), [items]);

  async function loadItems(nextFilters: LedgerFilters, nextPage: number) {
    const safePage = Math.max(nextPage, 1);
    const params = new URLSearchParams();
    const identifier = nextFilters.identifier.trim();
    if (identifier) params.set('identifier', identifier);
    if (nextFilters.type) params.set('type', nextFilters.type);
    if (nextFilters.direction) params.set('direction', nextFilters.direction);
    params.set('page', String(safePage));
    params.set('take', String(PAGE_SIZE));

    setLoading(true);
    setMessage('');
    try {
      const res = await adminApiFetch(`/admin/ledgers?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลดประวัติการเงินไม่สำเร็จ (${res.status})`);

      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextPageCount = Math.max(Number(data?.pageCount ?? 1), 1);
      setItems(nextItems);
      setTotal(Number(data?.total ?? nextItems.length));
      setPageCount(nextPageCount);
      setPage(Math.min(safePage, nextPageCount));
      syncQuery(nextFilters, Math.min(safePage, nextPageCount));
    } catch (error) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setPage(1);
      setMessage(error instanceof Error ? error.message : 'โหลดประวัติการเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function updateFilter<K extends keyof LedgerFilters>(key: K, value: LedgerFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    void loadItems(filters, 1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    void loadItems(EMPTY_FILTERS, 1);
  }

  function goToPage(nextPage: number) {
    void loadItems(filters, Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <AdminPage
      eyebrow="การเงิน"
      title="ประวัติเงินเข้าออก"
      description="ค้นหาสมาชิก ตรวจสอบรายการ และเปรียบเทียบยอดก่อน–หลังได้จากหน้าจอเดียว"
      actions={
        <>
          <AdminButton size="compact" tone="ghost" onClick={clearFilters} disabled={loading}>ล้างตัวกรอง</AdminButton>
          <AdminButton size="compact" onClick={applyFilters} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</AdminButton>
        </>
      }
    >
      <section className="admin-wallet-history" aria-busy={loading}>
        <div className="admin-wallet-history__summary" aria-label="สรุปประวัติการเงิน">
          <SummaryCard label="รายการทั้งหมด" value={total.toLocaleString('th-TH')} />
          <SummaryCard label="รายการหน้านี้" value={items.length.toLocaleString('th-TH')} />
          <SummaryCard label="เงินเข้าหน้านี้" value={formatMoney(pageCredit)} />
          <SummaryCard label="เงินออกหน้านี้" value={formatMoney(pageDebit)} />
        </div>

        <form className="admin-wallet-history__filters" onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
          <div className="admin-wallet-history__filter">
            <label htmlFor="wallet-history-identifier">ค้นหาสมาชิก</label>
            <input
              id="wallet-history-identifier"
              value={filters.identifier}
              onChange={(event) => updateFilter('identifier', event.target.value)}
              placeholder="ชื่อผู้ใช้ รหัสสมาชิก หรือ User ID"
              autoComplete="off"
            />
          </div>
          <div className="admin-wallet-history__filter">
            <label htmlFor="wallet-history-type">ประเภทรายการ</label>
            <select id="wallet-history-type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
              <option value="">ทุกประเภท</option>
              <option value="DEPOSIT">ฝากเงิน</option>
              <option value="WITHDRAWAL">ถอนเงิน</option>
              <option value="ADJUSTMENT">ปรับยอด</option>
              <option value="BONUS">โบนัส</option>
              <option value="REVERSAL">คืนรายการ</option>
            </select>
          </div>
          <div className="admin-wallet-history__filter">
            <label htmlFor="wallet-history-direction">ทิศทางเงิน</label>
            <select id="wallet-history-direction" value={filters.direction} onChange={(event) => updateFilter('direction', event.target.value)}>
              <option value="">เงินเข้าและออก</option>
              <option value="CREDIT">เงินเข้า</option>
              <option value="DEBIT">เงินออก</option>
            </select>
          </div>
          <div className="admin-wallet-history__actions">
            <AdminButton type="submit" size="compact" disabled={loading}>ค้นหา</AdminButton>
            <AdminButton size="compact" tone="ghost" onClick={clearFilters} disabled={loading}>ล้าง</AdminButton>
          </div>
        </form>

        {message && <AdminNotice tone="danger">{message}</AdminNotice>}

        <div className="admin-wallet-history__table-shell">
          {loading ? (
            <LoadingTable />
          ) : items.length === 0 ? (
            <div className="admin-wallet-history__state" role="status">
              <div><strong>ไม่พบประวัติการเงิน</strong><span>ลองเปลี่ยนคำค้นหรือเลือกตัวกรองให้น้อยลง</span></div>
            </div>
          ) : (
            <div className="admin-wallet-history__table-scroll">
              <table className="admin-wallet-history__table">
                <thead>
                  <tr>
                    <th scope="col">วันที่และเวลา</th>
                    <th scope="col">สมาชิก</th>
                    <th scope="col">ประเภท</th>
                    <th scope="col">ทิศทาง</th>
                    <th scope="col">จำนวนเงิน</th>
                    <th scope="col">ยอดก่อน</th>
                    <th scope="col">ยอดหลัง</th>
                    <th scope="col">อ้างอิง</th>
                    <th scope="col">ผู้ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const credit = item.direction === 'CREDIT';
                    return (
                      <tr key={item.id}>
                        <td data-label="วันที่และเวลา">{formatDateTime(item.createdAt)}</td>
                        <td data-label="สมาชิก">
                          <div className="admin-wallet-history__reference">
                            <strong title={item.user?.username ?? item.userId}>{item.user?.username ?? item.userId}</strong>
                            <span title={item.user?.shortId ?? item.shortUserId ?? '-'}>{item.user?.shortId ?? item.shortUserId ?? '-'}</span>
                          </div>
                        </td>
                        <td data-label="ประเภท"><span className={`admin-wallet-history__status ${statusClass(item.type)}`}>{typeLabel(item.type)}</span></td>
                        <td data-label="ทิศทาง">{credit ? 'เงินเข้า' : 'เงินออก'}</td>
                        <td data-label="จำนวนเงิน"><span className={`admin-wallet-history__amount admin-wallet-history__amount--${credit ? 'credit' : 'debit'}`}>{credit ? '+' : '-'} {formatMoney(item.amount)}</span></td>
                        <td data-label="ยอดก่อน">{formatMoney(item.balanceBefore)}</td>
                        <td data-label="ยอดหลัง">{formatMoney(item.balanceAfter)}</td>
                        <td data-label="อ้างอิง">
                          <div className="admin-wallet-history__reference">
                            <strong title={item.referenceType ?? '-'}>{item.referenceType ? typeLabel(item.referenceType) : '-'}</strong>
                            <span title={item.referenceId ?? '-'}>{item.referenceId ?? '-'}</span>
                          </div>
                        </td>
                        <td data-label="ผู้ดำเนินการ">{item.createdByAdmin?.username ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <nav className="admin-wallet-history__pagination" aria-label="เปลี่ยนหน้าประวัติการเงิน">
            <span className="admin-wallet-history__pagination-summary">หน้า {page.toLocaleString('th-TH')} จาก {pageCount.toLocaleString('th-TH')} · {total.toLocaleString('th-TH')} รายการ</span>
            <div className="admin-wallet-history__pagination-controls">
              <AdminButton size="compact" tone="ghost" disabled={loading || page <= 1} onClick={() => goToPage(page - 1)}>ก่อนหน้า</AdminButton>
              <AdminButton size="compact" tone="ghost" disabled={loading || page >= pageCount} onClick={() => goToPage(page + 1)}>ถัดไป</AdminButton>
            </div>
          </nav>
        </div>
      </section>
    </AdminPage>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <article className="admin-wallet-history__summary-card"><span>{label}</span><strong>{value}</strong></article>;
}

function LoadingTable() {
  return (
    <div className="admin-wallet-history__table-scroll" role="status" aria-label="กำลังโหลดประวัติการเงิน">
      <table className="admin-wallet-history__table" aria-hidden="true">
        <thead><tr>{Array.from({ length: 9 }, (_, index) => <th key={index}><span className="admin-wallet-history__skeleton" /></th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 9 }, (_, cell) => <td key={cell}><span className="admin-wallet-history__skeleton" /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function sumByDirection(items: LedgerItem[], direction: string) {
  return items.reduce((sum, item) => item.direction === direction ? sum + Number(item.amount || 0) : sum, 0);
}

function typeLabel(value: string) {
  return ({ DEPOSIT: 'ฝากเงิน', WITHDRAWAL: 'ถอนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส', REVERSAL: 'คืนรายการ' } as Record<string, string>)[value] ?? (value || '-');
}

function statusClass(type: string) {
  if (type === 'REVERSAL') return 'admin-wallet-history__status--reversed';
  if (type === 'WITHDRAWAL') return 'admin-wallet-history__status--pending';
  return 'admin-wallet-history__status--success';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

function syncQuery(filters: LedgerFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.identifier.trim()) params.set('identifier', filters.identifier.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.direction) params.set('direction', filters.direction);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
}
