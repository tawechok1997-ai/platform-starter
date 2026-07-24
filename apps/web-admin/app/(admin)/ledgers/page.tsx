'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminNotice, AdminPage, formatMoney } from '../_components/admin-ui';

const PAGE_SIZE = 20;
const LEDGER_TYPE_FILTERS = new Set(['', 'DEPOSIT', 'WITHDRAWAL', 'ADJUSTMENT', 'BONUS', 'REVERSAL']);

type LedgerDirection = 'CREDIT' | 'DEBIT';
type LedgerDirectionFilter = '' | LedgerDirection;

type LedgerItem = {
  id: string;
  userId: string;
  shortUserId?: string | null;
  type: string;
  direction: LedgerDirection;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null };
  createdByAdmin?: { id: string; username: string; email?: string | null } | null;
};

type LedgerFilters = { identifier: string; type: string; direction: LedgerDirectionFilter };
type LedgerPayload = { items: LedgerItem[]; total: number; pageCount: number };

const EMPTY_FILTERS: LedgerFilters = { identifier: '', type: '', direction: '' };

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);

  const loadItems = useCallback(async (nextFilters: LedgerFilters, nextPage: number) => {
    const normalizedFilters = normalizeFilters(nextFilters);
    const safePage = Math.max(Math.trunc(nextPage) || 1, 1);
    const params = new URLSearchParams();
    const identifier = normalizedFilters.identifier.trim();
    if (identifier) params.set('identifier', identifier);
    if (normalizedFilters.type) params.set('type', normalizedFilters.type);
    if (normalizedFilters.direction) params.set('direction', normalizedFilters.direction);
    params.set('page', String(safePage));
    params.set('take', String(PAGE_SIZE));

    const requestId = ++requestSequence.current;
    setLoading(true);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/ledgers?${params.toString()}`);
      const rawPayload = await response.json().catch(() => null);
      if (!response.ok) throw new Error('request');
      const payload = parseLedgerPayload(rawPayload);
      if (!payload) throw new Error('payload');
      if (requestId !== requestSequence.current) return;

      const resolvedPage = Math.min(safePage, payload.pageCount);
      setItems(payload.items);
      setTotal(payload.total);
      setPageCount(payload.pageCount);
      setPage(resolvedPage);
      syncQuery(normalizedFilters, resolvedPage);
    } catch {
      if (requestId !== requestSequence.current) return;
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setPage(1);
      setMessage('โหลดประวัติการเงินไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFilters = normalizeFilters({
      identifier: params.get('identifier') ?? params.get('userId') ?? '',
      type: params.get('type') ?? '',
      direction: params.get('direction') ?? '',
    });
    const initialPage = Math.max(Number(params.get('page') ?? 1) || 1, 1);
    setFilters(initialFilters);
    void loadItems(initialFilters, initialPage);
    return () => { requestSequence.current += 1; };
  }, [loadItems]);

  const pageCredit = useMemo(() => sumByDirection(items, 'CREDIT'), [items]);
  const pageDebit = useMemo(() => sumByDirection(items, 'DEBIT'), [items]);
  const integrityMismatchCount = useMemo(() => items.filter((item) => !ledgerBalanceMatches(item)).length, [items]);

  function updateFilter<K extends keyof LedgerFilters>(key: K, value: LedgerFilters[K]) {
    setFilters((current) => normalizeFilters({ ...current, [key]: value }));
  }

  function applyFilters() {
    if (loading) return;
    void loadItems(filters, 1);
  }

  function clearFilters() {
    if (loading) return;
    setFilters(EMPTY_FILTERS);
    void loadItems(EMPTY_FILTERS, 1);
  }

  function goToPage(nextPage: number) {
    if (loading) return;
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
              disabled={loading}
            />
          </div>
          <div className="admin-wallet-history__filter">
            <label htmlFor="wallet-history-type">ประเภทรายการ</label>
            <select id="wallet-history-type" value={filters.type} disabled={loading} onChange={(event) => updateFilter('type', event.target.value)}>
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
            <select id="wallet-history-direction" value={filters.direction} disabled={loading} onChange={(event) => updateFilter('direction', event.target.value as LedgerDirectionFilter)}>
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
        {integrityMismatchCount > 0 && <AdminNotice tone="warning">พบ {integrityMismatchCount.toLocaleString('th-TH')} รายการที่ยอดก่อน จำนวนเงิน และยอดหลังไม่สัมพันธ์กัน กรุณาตรวจสอบรายการอ้างอิง</AdminNotice>}

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
                    const balanced = ledgerBalanceMatches(item);
                    return (
                      <tr key={item.id} aria-label={balanced ? undefined : 'รายการยอดไม่สัมพันธ์กัน'}>
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
                        <td data-label="ยอดหลัง">{formatMoney(item.balanceAfter)}{balanced ? '' : ' ⚠'}</td>
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function parseFiniteDecimal(value: unknown, allowNegative = true): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || (!allowNegative && numeric < 0)) return null;
  return text;
}

function parseUser(value: unknown): LedgerItem['user'] | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.username !== 'string') return null;
  if (!isOptionalString(value.shortId) || !isOptionalString(value.phone) || !isOptionalString(value.email)) return null;
  const user: NonNullable<LedgerItem['user']> = { id: value.id, username: value.username };
  if (value.shortId !== undefined) user.shortId = value.shortId;
  if (value.phone !== undefined) user.phone = value.phone;
  if (value.email !== undefined) user.email = value.email;
  return user;
}

function parseAdmin(value: unknown): NonNullable<LedgerItem['createdByAdmin']> | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.username !== 'string' || !isOptionalString(value.email)) return null;
  const admin: NonNullable<LedgerItem['createdByAdmin']> = { id: value.id, username: value.username };
  if (value.email !== undefined) admin.email = value.email;
  return admin;
}

function parseLedgerItem(value: unknown): LedgerItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.userId !== 'string' || typeof value.type !== 'string' || typeof value.createdAt !== 'string') return null;
  if (value.direction !== 'CREDIT' && value.direction !== 'DEBIT') return null;
  if (Number.isNaN(new Date(value.createdAt).getTime())) return null;
  if (!isOptionalString(value.shortUserId) || !isOptionalString(value.referenceType) || !isOptionalString(value.referenceId)) return null;

  const amount = parseFiniteDecimal(value.amount, false);
  const balanceBefore = parseFiniteDecimal(value.balanceBefore);
  const balanceAfter = parseFiniteDecimal(value.balanceAfter);
  if (amount === null || balanceBefore === null || balanceAfter === null) return null;

  const item: LedgerItem = {
    id: value.id,
    userId: value.userId,
    type: value.type,
    direction: value.direction,
    amount,
    balanceBefore,
    balanceAfter,
    createdAt: value.createdAt,
  };
  if (value.shortUserId !== undefined) item.shortUserId = value.shortUserId;
  if (value.referenceType !== undefined) item.referenceType = value.referenceType;
  if (value.referenceId !== undefined) item.referenceId = value.referenceId;
  if (value.user !== undefined && value.user !== null) {
    const user = parseUser(value.user);
    if (!user) return null;
    item.user = user;
  }
  if (value.createdByAdmin === null) item.createdByAdmin = null;
  else if (value.createdByAdmin !== undefined) {
    const admin = parseAdmin(value.createdByAdmin);
    if (!admin) return null;
    item.createdByAdmin = admin;
  }
  return item;
}

function parseNonNegativeInteger(value: unknown, fallback: number) {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') return fallback;
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : fallback;
}

function parseLedgerPayload(value: unknown): LedgerPayload | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items: LedgerItem[] = [];
  for (const rawItem of value.items) {
    const item = parseLedgerItem(rawItem);
    if (!item) return null;
    items.push(item);
  }
  return {
    items,
    total: parseNonNegativeInteger(value.total, items.length),
    pageCount: Math.max(parseNonNegativeInteger(value.pageCount, 1), 1),
  };
}

function normalizeFilters(value: { identifier?: unknown; type?: unknown; direction?: unknown }): LedgerFilters {
  const identifier = typeof value.identifier === 'string' ? value.identifier.slice(0, 160) : '';
  const type = typeof value.type === 'string' && LEDGER_TYPE_FILTERS.has(value.type) ? value.type : '';
  const direction: LedgerDirectionFilter = value.direction === 'CREDIT' || value.direction === 'DEBIT' ? value.direction : '';
  return { identifier, type, direction };
}

function sumByDirection(items: LedgerItem[], direction: LedgerDirection) {
  return items.reduce((sum, item) => item.direction === direction ? sum + Number(item.amount) : sum, 0);
}

function ledgerBalanceMatches(item: LedgerItem) {
  const before = Number(item.balanceBefore);
  const amount = Number(item.amount);
  const after = Number(item.balanceAfter);
  const expected = item.direction === 'CREDIT' ? before + amount : before - amount;
  return Math.abs(after - expected) <= 0.005;
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
