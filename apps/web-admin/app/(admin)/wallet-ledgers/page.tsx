'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { buildAdminListQuery, normalizeAdminListPayload, type AdminListPayload, useAdminListContract } from '../_components/admin-list-contract';
import { AdminBadge, AdminButton, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminToolbar } from '../_components/admin-ui';
import { formatMoney } from '../_components/human-labels';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';

type Ledger = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; idempotencyKey?: string | null; metadata?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null } | null; wallet?: { currency?: string | null } | null };
type LedgerCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; loadFailed: string; visible: string; latestItems: string; credit: string; creditHelp: string; debit: string; debitHelp: string; game: string; gameHelp: string; search: string; searchPlaceholder: string; direction: string; type: string; dateFrom: string; dateTo: string; exportCsv: string; all: string; reference: string; amount: string; details: string; before: string; after: string; noItems: string; noItemsHelp: string; perPage: string; member: string; createdAt: string; previousPage: string; nextPage: string; page: string;
  directions: Record<'CREDIT' | 'DEBIT', string>; types: Record<string, string>; unknownType: string;
};

const ledgerCopy: Record<AdminLocale, LedgerCopy> = {
  th: {
    eyebrow: 'การเงิน', title: 'ประวัติเงิน', description: 'เงินเข้า เงินออก และยอดก่อน–หลัง', refresh: 'รีเฟรช', loading: 'กำลังโหลดประวัติเงิน...', loadFailed: 'โหลดประวัติเงินไม่สำเร็จ', visible: 'รายการทั้งหมด', latestItems: 'รายการตามตัวกรอง', credit: 'เงินเข้าในหน้านี้', creditHelp: 'เพิ่มยอดวอลเล็ต', debit: 'เงินออกในหน้านี้', debitHelp: 'ลดยอดวอลเล็ต', game: 'เกี่ยวกับเกมในหน้านี้', gameHelp: 'โยกเงินเกมหรือคืนยอด', search: 'ค้นหา', searchPlaceholder: 'สมาชิก อ้างอิง หรือรหัสกันซ้ำ', direction: 'ทิศทางเงิน', type: 'ประเภทรายการ', dateFrom: 'ตั้งแต่วันที่', dateTo: 'ถึงวันที่', exportCsv: 'ส่งออกหน้านี้', all: 'ทั้งหมด', reference: 'อ้างอิง', amount: 'จำนวน', details: 'ดูรายละเอียด', before: 'ยอดก่อน', after: 'ยอดหลัง', noItems: 'ไม่พบประวัติเงิน', noItemsHelp: 'ลองเปลี่ยนคำค้นหา ช่วงวันที่ หรือตัวกรอง', perPage: 'รายการต่อหน้า', member: 'สมาชิก', createdAt: 'วันและเวลา', previousPage: 'หน้าก่อนหน้า', nextPage: 'หน้าถัดไป', page: 'หน้า',
    directions: { CREDIT: 'เงินเข้า', DEBIT: 'เงินออก' }, types: { DEPOSIT: 'ฝาก', WITHDRAWAL: 'ถอน', TRANSFER: 'โยกเงิน', REVERSAL: 'คืนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส', COMMISSION: 'คอมมิชชัน', PROMOTION: 'โปรโมชัน' }, unknownType: 'รายการเงิน',
  },
  en: {
    eyebrow: 'Finance', title: 'Wallet ledger', description: 'Credits, debits, and balance changes', refresh: 'Refresh', loading: 'Loading ledger...', loadFailed: 'Unable to load the ledger', visible: 'Total items', latestItems: 'matching filters', credit: 'Credits on page', creditHelp: 'Wallet increases', debit: 'Debits on page', debitHelp: 'Wallet decreases', game: 'Game-related on page', gameHelp: 'Game transfer or return', search: 'Search', searchPlaceholder: 'Member, reference, or idempotency key', direction: 'Money direction', type: 'Ledger type', dateFrom: 'From date', dateTo: 'To date', exportCsv: 'Export this page', all: 'All', reference: 'Reference', amount: 'Amount', details: 'View details', before: 'Before', after: 'After', noItems: 'No ledger entries found', noItemsHelp: 'Try another search, date range, or filter', perPage: 'Rows per page', member: 'Member', createdAt: 'Date and time', previousPage: 'Previous page', nextPage: 'Next page', page: 'Page',
    directions: { CREDIT: 'Credit', DEBIT: 'Debit' }, types: { DEPOSIT: 'Deposit', WITHDRAWAL: 'Withdrawal', TRANSFER: 'Transfer', REVERSAL: 'Reversal', ADJUSTMENT: 'Adjustment', BONUS: 'Bonus', COMMISSION: 'Commission', PROMOTION: 'Promotion' }, unknownType: 'Ledger item',
  },
};

export default function WalletLedgersPage() {
  const [locale] = useAdminLocale();
  const copy = ledgerCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [payload, setPayload] = useState<AdminListPayload<Ledger>>({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [state, setState] = useState<'loading' | 'failed' | ''>('loading');
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const list = useAdminListContract({ initialPageSize: 25 });

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [list.page, list.pageSize, direction, type, dateFrom, dateTo, query]);

  async function load() {
    setLoading(true);
    setState('loading');
    try {
      const suffix = buildAdminListQuery({
        page: list.page,
        take: list.pageSize,
        direction: direction === 'ALL' ? undefined : direction,
        type: type === 'ALL' ? undefined : type,
        dateFrom,
        dateTo,
        search: query.trim(),
      });
      const res = await adminApiFetch(`/admin/money-ops/ledger${suffix}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      const next = normalizeAdminListPayload<Ledger>(data, list.page, list.pageSize);
      setPayload(next);
      if (next.page !== list.page) list.setPage(next.page);
      setState('');
    } catch {
      setPayload({ items: [], total: 0, page: list.page, pageSize: list.pageSize, totalPages: 1 });
      setState('failed');
    } finally {
      setLoading(false);
    }
  }

  const typeOptions = useMemo(() => Object.keys(copy.types).sort(), [copy.types]);
  const credit = payload.items.filter((item) => item.direction === 'CREDIT').length;
  const debit = payload.items.filter((item) => item.direction === 'DEBIT').length;
  const game = payload.items.filter((item) => item.referenceType?.includes('GAME')).length;
  const message = state === 'loading' ? copy.loading : state === 'failed' ? copy.loadFailed : '';

  const columns = useMemo<readonly AdminDataColumn<Ledger>[]>(() => [
    {
      id: 'member',
      header: copy.member,
      mobileLabel: copy.member,
      priority: 'primary',
      cell: (item) => <span>{item.user?.username ?? item.user?.phone ?? '-'}</span>,
    },
    {
      id: 'type',
      header: copy.type,
      mobileLabel: copy.type,
      priority: 'primary',
      cell: (item) => <span className="admin-ledger-table-type"><strong>{ledgerTitle(item, copy, locale)}</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction === 'CREDIT' ? copy.directions.CREDIT : copy.directions.DEBIT}</AdminBadge></span>,
    },
    {
      id: 'amount',
      header: copy.amount,
      mobileLabel: copy.amount,
      align: 'end',
      priority: 'primary',
      cell: (item) => <strong>{formatMoney(item.amount, item.wallet?.currency ?? 'THB')}</strong>,
    },
    {
      id: 'before',
      header: copy.before,
      mobileLabel: copy.before,
      align: 'end',
      priority: 'tertiary',
      cell: (item) => formatMoney(item.balanceBefore, item.wallet?.currency ?? 'THB'),
    },
    {
      id: 'after',
      header: copy.after,
      mobileLabel: copy.after,
      align: 'end',
      priority: 'secondary',
      cell: (item) => formatMoney(item.balanceAfter, item.wallet?.currency ?? 'THB'),
    },
    {
      id: 'reference',
      header: copy.reference,
      mobileLabel: copy.reference,
      priority: 'tertiary',
      cell: (item) => <span className="admin-ledger-reference">{item.referenceType ?? '-'}<small>{item.referenceId ?? '-'}</small></span>,
    },
    {
      id: 'createdAt',
      header: copy.createdAt,
      mobileLabel: copy.createdAt,
      priority: 'secondary',
      cell: (item) => new Date(item.createdAt).toLocaleString(dateLocale),
    },
    {
      id: 'actions',
      header: '',
      mobileLabel: copy.details,
      align: 'end',
      priority: 'secondary',
      width: '1%',
      cell: (item) => <AdminLinkButton href={`/wallet-ledgers/${item.id}`}>{copy.details}</AdminLinkButton>,
    },
  ], [copy, dateLocale, locale]);

  function resetPage() { list.resetPage(); }
  function exportCsv() {
    if (!payload.items.length) return;
    const rows = [
      ['id', 'createdAt', 'username', 'phone', 'type', 'direction', 'amount', 'currency', 'balanceBefore', 'balanceAfter', 'referenceType', 'referenceId', 'idempotencyKey'],
      ...payload.items.map((item) => [item.id, item.createdAt, item.user?.username ?? '', item.user?.phone ?? '', item.type, item.direction, item.amount, item.wallet?.currency ?? 'THB', item.balanceBefore, item.balanceAfter, item.referenceType ?? '', item.referenceId ?? '', item.idempotencyKey ?? '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wallet-ledgers-page-${payload.page}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<><AdminButton tone="secondary" onClick={exportCsv} disabled={!payload.items.length}>{copy.exportCsv}</AdminButton><AdminButton onClick={() => void load()} disabled={loading}>{copy.refresh}</AdminButton></>}>
    {message && <AdminNotice tone={state === 'failed' ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title={copy.visible} value={formatNumber(payload.total, locale)} helper={copy.latestItems} /><AdminMetric title={copy.credit} value={formatNumber(credit, locale)} helper={copy.creditHelp} tone="success" /><AdminMetric title={copy.debit} value={formatNumber(debit, locale)} helper={copy.debitHelp} tone="warning" /><AdminMetric title={copy.game} value={formatNumber(game, locale)} helper={copy.gameHelp} /></AdminMetricGrid>
    <AdminToolbar><label className="admin-ledger-field"><span>{copy.search}</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder={copy.searchPlaceholder} /></label><label className="admin-ledger-field"><span>{copy.direction}</span><select value={direction} onChange={(event) => { setDirection(event.target.value); resetPage(); }}><option value="ALL">{copy.all}</option><option value="CREDIT">{copy.directions.CREDIT}</option><option value="DEBIT">{copy.directions.DEBIT}</option></select></label><label className="admin-ledger-field"><span>{copy.type}</span><select value={type} onChange={(event) => { setType(event.target.value); resetPage(); }}><option value="ALL">{copy.all}</option>{typeOptions.map((value) => <option key={value} value={value}>{copy.types[value] ?? value}</option>)}</select></label><label className="admin-ledger-field"><span>{copy.dateFrom}</span><input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); resetPage(); }} /></label><label className="admin-ledger-field"><span>{copy.dateTo}</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); resetPage(); }} /></label></AdminToolbar>
    <AdminDataTable
      ariaLabel={copy.title}
      columns={columns}
      rows={payload.items}
      rowKey={(item) => item.id}
      loading={loading}
      emptyTitle={copy.noItems}
      emptyDescription={copy.noItemsHelp}
      page={payload.page}
      pageSize={list.pageSize}
      totalItems={payload.total}
      pageSizeOptions={list.allowedPageSizes}
      onPageChange={list.setPage}
      onPageSizeChange={list.setPageSize}
      labels={{
        loading: copy.loading,
        empty: copy.noItems,
        previousPage: copy.previousPage,
        nextPage: copy.nextPage,
        page: (page) => `${copy.page} ${page.toLocaleString(dateLocale)}`,
        rowsPerPage: copy.perPage,
        range: (from, to, total) => locale === 'th' ? `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} จาก ${total.toLocaleString(dateLocale)}` : `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} of ${total.toLocaleString(dateLocale)}`,
      }}
    />
  </AdminPage>;
}

function csvCell(value: unknown) { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function ledgerTitle(item: Ledger, copy: LedgerCopy, locale: AdminLocale) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? (locale === 'th' ? 'โยกเข้าเกม' : 'Transfer to game') : item.type === 'REVERSAL' ? (locale === 'th' ? 'คืนเงินกลับวอลเล็ต' : 'Return to wallet') : (locale === 'th' ? 'โยกกลับวอลเล็ต' : 'Transfer to wallet'); return copy.types[item.type] ?? copy.unknownType; }
