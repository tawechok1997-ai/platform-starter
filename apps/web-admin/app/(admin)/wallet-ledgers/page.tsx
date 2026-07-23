'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { paginateAdminItems, useAdminListContract } from '../_components/admin-list-contract';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPagination, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { formatMoney } from '../_components/human-labels';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type Ledger = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; idempotencyKey?: string | null; metadata?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null } | null; wallet?: { currency?: string | null } | null };
type LedgerCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; loadFailed: string; visible: string; latestItems: string; credit: string; creditHelp: string; debit: string; debitHelp: string; game: string; gameHelp: string; search: string; searchPlaceholder: string; direction: string; type: string; dateFrom: string; dateTo: string; exportCsv: string; all: string; guidance: string; reference: string; amount: string; details: string; before: string; after: string; idempotency: string; noItems: string; metadata: string; noMetadata: string; reason: string; workflow: string; note: string; perPage: string;
  directions: Record<'CREDIT' | 'DEBIT', string>; types: Record<string, string>; unknownType: string;
};

const ledgerCopy: Record<AdminLocale, LedgerCopy> = {
  th: {
    eyebrow: 'การเงิน', title: 'ประวัติเงิน', description: 'เงินเข้า เงินออก และยอดก่อน–หลัง', refresh: 'รีเฟรช', loading: 'กำลังโหลดประวัติเงิน...', loadFailed: 'โหลดประวัติเงินไม่สำเร็จ', visible: 'รายการที่แสดง', latestItems: 'จากรายการล่าสุด', credit: 'เงินเข้า', creditHelp: 'เพิ่มยอดวอลเล็ต', debit: 'เงินออก', debitHelp: 'ลดยอดวอลเล็ต', game: 'เกี่ยวกับเกม', gameHelp: 'โยกเงินเกมหรือคืนยอด', search: 'ค้นหา', searchPlaceholder: 'สมาชิก อ้างอิง หรือรหัสกันซ้ำ', direction: 'ทิศทางเงิน', type: 'ประเภทรายการ', dateFrom: 'ตั้งแต่วันที่', dateTo: 'ถึงวันที่', exportCsv: 'ส่งออก CSV', all: 'ทั้งหมด', guidance: 'ยอดก่อน + จำนวน = ยอดหลัง', reference: 'อ้างอิง', amount: 'จำนวน', details: 'ดูรายละเอียด', before: 'ยอดก่อน', after: 'ยอดหลัง', idempotency: 'รหัสกันซ้ำ', noItems: 'ไม่พบประวัติเงินตามตัวกรอง', metadata: 'ข้อมูลเพิ่มเติม', noMetadata: 'ไม่มีข้อมูลเพิ่มเติม', reason: 'เหตุผล', workflow: 'ขั้นตอน', note: 'หมายเหตุ', perPage: 'รายการต่อหน้า',
    directions: { CREDIT: 'เงินเข้า', DEBIT: 'เงินออก' }, types: { DEPOSIT: 'ฝาก', WITHDRAWAL: 'ถอน', TRANSFER: 'โยกเงิน', REVERSAL: 'คืนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส', COMMISSION: 'คอมมิชชัน', PROMOTION: 'โปรโมชัน' }, unknownType: 'รายการเงิน',
  },
  en: {
    eyebrow: 'Finance', title: 'Wallet ledger', description: 'Credits, debits, and balance changes', refresh: 'Refresh', loading: 'Loading ledger...', loadFailed: 'Unable to load the ledger', visible: 'Visible items', latestItems: 'from latest items', credit: 'Credits', creditHelp: 'Wallet increases', debit: 'Debits', debitHelp: 'Wallet decreases', game: 'Game-related', gameHelp: 'Game transfer or return', search: 'Search', searchPlaceholder: 'Member, reference, or idempotency key', direction: 'Money direction', type: 'Ledger type', dateFrom: 'From date', dateTo: 'To date', exportCsv: 'Export CSV', all: 'All', guidance: 'Balance before + amount = balance after', reference: 'Reference', amount: 'Amount', details: 'View details', before: 'Before', after: 'After', idempotency: 'Idempotency key', noItems: 'No ledger items match the filter', metadata: 'More information', noMetadata: 'No additional information', reason: 'Reason', workflow: 'Workflow', note: 'Note', perPage: 'Items per page',
    directions: { CREDIT: 'Credit', DEBIT: 'Debit' }, types: { DEPOSIT: 'Deposit', WITHDRAWAL: 'Withdrawal', TRANSFER: 'Transfer', REVERSAL: 'Reversal', ADJUSTMENT: 'Adjustment', BONUS: 'Bonus', COMMISSION: 'Commission', PROMOTION: 'Promotion' }, unknownType: 'Ledger item',
  },
};

export default function WalletLedgersPage() {
  const [locale] = useAdminLocale();
  const copy = ledgerCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<Ledger[]>([]);
  const [state, setState] = useState<'loading' | 'failed' | ''>('loading');
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const list = useAdminListContract({ initialPageSize: 25 });

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true);
    setState('loading');
    try {
      const res = await adminApiFetch('/admin/money-ops/ledger?take=100');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems(data.items ?? []);
      setState('');
    } catch { setItems([]); setState('failed'); } finally { setLoading(false); }
  }

  const typeOptions = useMemo(() => Array.from(new Set(items.map((item) => item.type).filter(Boolean))).sort(), [items]);
  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesDirection = direction === 'ALL' || item.direction === direction;
    const matchesType = type === 'ALL' || item.type === type;
    const created = new Date(item.createdAt).getTime();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    const matchesDate = Number.isFinite(created) && created >= fromTime && created <= toTime;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [item.user?.username, item.user?.phone, item.referenceType, item.referenceId, item.idempotencyKey, item.type].some((value) => String(value ?? '').toLowerCase().includes(needle));
    return matchesDirection && matchesType && matchesDate && matchesQuery;
  }), [items, direction, type, dateFrom, dateTo, query]);
  const page = useMemo(() => paginateAdminItems(visibleItems, list.page, list.pageSize), [visibleItems, list.page, list.pageSize]);

  const credit = visibleItems.filter((item) => item.direction === 'CREDIT').length;
  const debit = visibleItems.filter((item) => item.direction === 'DEBIT').length;
  const game = visibleItems.filter((item) => item.referenceType?.includes('GAME')).length;
  const message = state === 'loading' ? copy.loading : state === 'failed' ? copy.loadFailed : '';

  function resetPage() { list.resetPage(); }
  function exportCsv() {
    if (!visibleItems.length) return;
    const rows = [
      ['id', 'createdAt', 'username', 'phone', 'type', 'direction', 'amount', 'currency', 'balanceBefore', 'balanceAfter', 'referenceType', 'referenceId', 'idempotencyKey'],
      ...visibleItems.map((item) => [item.id, item.createdAt, item.user?.username ?? '', item.user?.phone ?? '', item.type, item.direction, item.amount, item.wallet?.currency ?? 'THB', item.balanceBefore, item.balanceAfter, item.referenceType ?? '', item.referenceId ?? '', item.idempotencyKey ?? '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wallet-ledgers-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<><AdminButton tone="secondary" onClick={exportCsv} disabled={!visibleItems.length}>{copy.exportCsv}</AdminButton><AdminButton onClick={() => void load()} disabled={loading}>{copy.refresh}</AdminButton></>}>
    {message && <AdminNotice tone={state === 'failed' ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title={copy.visible} value={formatNumber(visibleItems.length, locale)} helper={`${copy.latestItems} ${formatNumber(items.length, locale)}`} /><AdminMetric title={copy.credit} value={formatNumber(credit, locale)} helper={copy.creditHelp} tone="success" /><AdminMetric title={copy.debit} value={formatNumber(debit, locale)} helper={copy.debitHelp} tone="warning" /><AdminMetric title={copy.game} value={formatNumber(game, locale)} helper={copy.gameHelp} /></AdminMetricGrid>
    <AdminToolbar><label className="admin-ledger-field"><span>{copy.search}</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder={copy.searchPlaceholder} /></label><label className="admin-ledger-field"><span>{copy.direction}</span><select value={direction} onChange={(event) => { setDirection(event.target.value); resetPage(); }}><option value="ALL">{copy.all}</option><option value="CREDIT">{copy.directions.CREDIT}</option><option value="DEBIT">{copy.directions.DEBIT}</option></select></label><label className="admin-ledger-field"><span>{copy.type}</span><select value={type} onChange={(event) => { setType(event.target.value); resetPage(); }}><option value="ALL">{copy.all}</option>{typeOptions.map((value) => <option key={value} value={value}>{copy.types[value] ?? value}</option>)}</select></label><label className="admin-ledger-field"><span>{copy.dateFrom}</span><input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); resetPage(); }} /></label><label className="admin-ledger-field"><span>{copy.dateTo}</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); resetPage(); }} /></label><label className="admin-ledger-field"><span>{copy.perPage}</span><select value={list.pageSize} onChange={(event) => list.setPageSize(Number(event.target.value))}>{list.allowedPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div className="admin-ledger-guidance">{copy.guidance}</div></AdminToolbar>
    <AdminStack>{page.items.map((item) => {
      const currency = item.wallet?.currency ?? 'THB';
      const hasMetadata = item.metadata !== null && item.metadata !== undefined;
      return <AdminCard key={item.id}><article className="admin-ledger-card-grid"><section className="admin-ledger-identity"><div className="admin-ledger-title-row"><strong>{ledgerTitle(item, copy, locale)}</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction === 'CREDIT' ? copy.directions.CREDIT : copy.directions.DEBIT}</AdminBadge></div><p>{item.user?.username ?? item.user?.phone ?? '-'} · {new Date(item.createdAt).toLocaleString(dateLocale)}</p><p>{copy.reference}: {item.referenceType ?? '-'} · {item.referenceId ?? '-'}</p></section><section className="admin-ledger-amount"><span>{copy.amount}</span><strong>{formatMoney(item.amount, currency)}</strong><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>{copy.details}</AdminLinkButton></section><section className="admin-ledger-balance-grid"><div><span>{copy.before}</span><strong>{formatMoney(item.balanceBefore, currency)}</strong></div><div><span>{copy.after}</span><strong>{formatMoney(item.balanceAfter, currency)}</strong></div><div><span>{copy.idempotency}</span><strong>{item.idempotencyKey ?? '-'}</strong></div></section>{hasMetadata && <LedgerMetadata metadata={item.metadata} copy={copy} />}</article></AdminCard>;
    })}{!loading && page.items.length === 0 && <AdminEmpty>{copy.noItems}</AdminEmpty>}</AdminStack>
    {visibleItems.length > 0 && <AdminPagination page={page.page} totalPages={page.totalPages} onPrevious={() => list.setPage(page.page - 1)} onNext={() => list.setPage(page.page + 1)} disabled={loading} />}
  </AdminPage>;
}

function csvCell(value: unknown) { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function ledgerTitle(item: Ledger, copy: LedgerCopy, locale: AdminLocale) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? (locale === 'th' ? 'โยกเข้าเกม' : 'Transfer to game') : item.type === 'REVERSAL' ? (locale === 'th' ? 'คืนเงินกลับวอลเล็ต' : 'Return to wallet') : (locale === 'th' ? 'โยกกลับวอลเล็ต' : 'Transfer to wallet'); return copy.types[item.type] ?? copy.unknownType; }
function LedgerMetadata({ metadata, copy }: { metadata: unknown; copy: LedgerCopy }) {
  const value = metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {};
  const items = [[copy.reason, safeText(value.reason)], [copy.workflow, safeText(value.workflow)], [copy.note, safeText(value.note)]].filter((item): item is [string, string] => Boolean(item[1]));
  if (!items.length) return <details className="admin-ledger-details"><summary>{copy.metadata}</summary><p>{copy.noMetadata}</p></details>;
  return <details className="admin-ledger-details"><summary>{copy.metadata}</summary><dl>{items.map(([label, content]) => <div key={label}><dt>{label}</dt><dd>{content}</dd></div>)}</dl></details>;
}
function safeText(value: unknown) { return typeof value === 'string' ? value.slice(0, 500) : ''; }
