'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { stringifyAdminPayload } from '../_components/admin-payload-redaction';
import { AdminAuditExportButton } from './admin-audit-export-button';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';

type AuditLog = {
  id: string;
  action: string;
  module: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
  adminUser?: { id: string; username: string; email: string } | null;
};

type AuditFilters = {
  search: string;
  module: string;
  action: string;
  admin: string;
  targetId: string;
  from: string;
  to: string;
};

type NoticeTone = 'neutral' | 'success' | 'danger';

type AuditCopy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  loading: string;
  loadFailed: string;
  invalidDateRange: string;
  pageItems: string;
  totalItems: string;
  modules: string;
  admins: string;
  readOnly: string;
  readOnlyHelp: string;
  filters: string;
  filtersDescription: string;
  search: string;
  searchPlaceholder: string;
  module: string;
  modulePlaceholder: string;
  action: string;
  actionPlaceholder: string;
  admin: string;
  adminPlaceholder: string;
  target: string;
  targetPlaceholder: string;
  from: string;
  to: string;
  applyFilters: string;
  clearFilters: string;
  events: string;
  actor: string;
  email: string;
  ip: string;
  time: string;
  details: string;
  userAgent: string;
  before: string;
  after: string;
  noData: string;
  noEvents: string;
  noEventsHelp: string;
  related: string;
  previousPage: string;
  nextPage: string;
  page: string;
  rowsPerPage: string;
};

const PAGE_SIZE = 20;
const emptyFilters: AuditFilters = { search: '', module: '', action: '', admin: '', targetId: '', from: '', to: '' };

const auditCopy: Record<AdminLocale, AuditCopy> = {
  th: {
    eyebrow: 'ความปลอดภัยและการปฏิบัติการ',
    title: 'บันทึกการใช้งาน',
    description: 'ตรวจสอบผู้ดำเนินการ เหตุการณ์ และข้อมูลที่เปลี่ยนแปลง',
    refresh: 'รีเฟรช',
    loading: 'กำลังโหลดบันทึกการใช้งาน...',
    loadFailed: 'โหลดบันทึกการใช้งานไม่สำเร็จ กรุณาลองใหม่',
    invalidDateRange: 'ช่วงวันที่ไม่ถูกต้อง วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด',
    pageItems: 'รายการหน้านี้',
    totalItems: 'รายการทั้งหมด',
    modules: 'โมดูล',
    admins: 'ผู้ดูแล',
    readOnly: 'อ่านอย่างเดียว',
    readOnlyHelp: 'ไม่แก้ไขข้อมูลธุรกรรม',
    filters: 'ค้นหาและกรอง',
    filtersDescription: 'ใช้ตัวกรองหลักก่อน แล้วเปิดรายละเอียดเฉพาะรายการที่ต้องตรวจ',
    search: 'ค้นหารวม',
    searchPlaceholder: 'เหตุการณ์ โมดูล เป้าหมาย หรือ IP',
    module: 'โมดูล',
    modulePlaceholder: 'เช่น รายการฝากหรือรายการถอน',
    action: 'เหตุการณ์',
    actionPlaceholder: 'เช่น อนุมัติ ปฏิเสธ หรือเข้าสู่ระบบ',
    admin: 'ผู้ดูแล',
    adminPlaceholder: 'ชื่อหรืออีเมล',
    target: 'รหัสเป้าหมาย',
    targetPlaceholder: 'รหัสรายการหรือสมาชิก',
    from: 'ตั้งแต่วันที่',
    to: 'ถึงวันที่',
    applyFilters: 'ใช้ตัวกรอง',
    clearFilters: 'ล้างตัวกรอง',
    events: 'เหตุการณ์',
    actor: 'ผู้ดำเนินการ',
    email: 'อีเมล',
    ip: 'ที่อยู่ IP',
    time: 'วันและเวลา',
    details: 'รายละเอียด',
    userAgent: 'อุปกรณ์และเบราว์เซอร์',
    before: 'ข้อมูลก่อนเปลี่ยน',
    after: 'ข้อมูลหลังเปลี่ยน',
    noData: 'ไม่มีข้อมูล',
    noEvents: 'ไม่พบบันทึกการใช้งาน',
    noEventsHelp: 'ลองเปลี่ยนคำค้นหา ช่วงวันที่ หรือตัวกรอง',
    related: 'เปิดรายการที่เกี่ยวข้อง',
    previousPage: 'หน้าก่อนหน้า',
    nextPage: 'หน้าถัดไป',
    page: 'หน้า',
    rowsPerPage: 'รายการต่อหน้า',
  },
  en: {
    eyebrow: 'Security & operations',
    title: 'Audit logs',
    description: 'Review actors, events, and recorded data changes',
    refresh: 'Refresh',
    loading: 'Loading audit logs...',
    loadFailed: 'Unable to load audit logs. Please try again.',
    invalidDateRange: 'The start date cannot be after the end date.',
    pageItems: 'Items on page',
    totalItems: 'total items',
    modules: 'Modules',
    admins: 'Administrators',
    readOnly: 'Read-only',
    readOnlyHelp: 'Transaction data is not modified',
    filters: 'Search and filters',
    filtersDescription: 'Use the main filters, then open details only for records that need review.',
    search: 'Search',
    searchPlaceholder: 'Event, module, target, or IP',
    module: 'Module',
    modulePlaceholder: 'For example topups or withdrawals',
    action: 'Action',
    actionPlaceholder: 'For example approve, reject, or login',
    admin: 'Administrator',
    adminPlaceholder: 'Name or email',
    target: 'Target ID',
    targetPlaceholder: 'Record ID',
    from: 'From date',
    to: 'To date',
    applyFilters: 'Apply filters',
    clearFilters: 'Clear filters',
    events: 'Events',
    actor: 'Actor',
    email: 'Email',
    ip: 'IP address',
    time: 'Date and time',
    details: 'Details',
    userAgent: 'Device and browser',
    before: 'Before change',
    after: 'After change',
    noData: 'No data',
    noEvents: 'No audit logs found',
    noEventsHelp: 'Try another search, date range, or filter.',
    related: 'Open related record',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    page: 'Page',
    rowsPerPage: 'Rows per page',
  },
};

export default function AdminAuditPage() {
  const [locale] = useAdminLocale();
  const copy = auditCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => { void loadAuditLogs(page, applied); }, [page, applied]);

  const moduleCount = useMemo(() => new Set(items.map((item) => item.module)).size, [items]);
  const adminCount = useMemo(() => new Set(items.map((item) => item.adminUser?.id).filter(Boolean)).size, [items]);
  const activeFilters = useMemo(() => Object.entries(applied).filter(([, value]) => value.trim()), [applied]);

  const columns = useMemo<readonly AdminDataColumn<AuditLog>[]>(() => [
    {
      id: 'time',
      header: copy.time,
      mobileLabel: copy.time,
      priority: 'secondary',
      width: '13%',
      cell: (item) => <time dateTime={item.createdAt}>{formatDateTime(item.createdAt, dateLocale)}</time>,
    },
    {
      id: 'actor',
      header: copy.actor,
      mobileLabel: copy.actor,
      priority: 'primary',
      width: '18%',
      cell: (item) => <span className="admin-audit-table-actor"><strong>{item.adminUser?.username ?? item.adminUser?.email ?? '-'}</strong><small>{item.adminUser?.email ?? '-'}</small></span>,
    },
    {
      id: 'event',
      header: copy.action,
      mobileLabel: copy.action,
      priority: 'primary',
      width: '20%',
      cell: (item) => <span className="admin-audit-table-event"><AdminBadge tone={actionTone(item.action)}>{item.action}</AdminBadge><small>{item.module || 'unknown'}</small></span>,
    },
    {
      id: 'target',
      header: copy.target,
      mobileLabel: copy.target,
      priority: 'secondary',
      width: '16%',
      cell: (item) => <span className="admin-audit-table-target">{item.targetId || '-'}</span>,
    },
    {
      id: 'ip',
      header: copy.ip,
      mobileLabel: copy.ip,
      priority: 'tertiary',
      width: '12%',
      cell: (item) => item.ipAddress || '-',
    },
    {
      id: 'details',
      header: copy.details,
      mobileLabel: copy.details,
      priority: 'secondary',
      cell: (item) => <AuditDetails item={item} copy={copy} />,
    },
  ], [copy, dateLocale]);

  async function loadAuditLogs(nextPage = page, filters = applied) {
    const requestId = ++requestSequence.current;
    const safePage = Math.max(1, Math.floor(nextPage));
    setLoading(true);
    setMessageTone('neutral');
    setMessage(copy.loading);
    try {
      const params = new URLSearchParams({ page: String(safePage), take: String(PAGE_SIZE) });
      Object.entries(filters).forEach(([key, value]) => { const trimmed = value.trim(); if (trimmed) params.set(key, trimmed); });
      const response = await adminApiFetch(`/admin/audit-logs?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAuditResponse(payload)) throw new Error('load');
      if (requestId !== requestSequence.current) return;

      const nextPageCount = positiveInteger(payload.pageCount, 1);
      if (safePage > nextPageCount) {
        setPage(nextPageCount);
        return;
      }

      setItems(payload.items);
      setTotal(nonNegativeInteger(payload.total, payload.items.length));
      setPageCount(nextPageCount);
      setMessage('');
    } catch {
      if (requestId !== requestSequence.current) return;
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessageTone('danger');
      setMessage(copy.loadFailed);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }

  function applyFilters() {
    if (draft.from && draft.to && draft.from > draft.to) {
      setMessageTone('danger');
      setMessage(copy.invalidDateRange);
      return;
    }
    setMessage('');
    setPage(1);
    setApplied({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setPage(1);
    setApplied({ ...emptyFilters });
  }

  function showExportMessage(nextMessage: string, error = false) {
    setMessageTone(error ? 'danger' : 'success');
    setMessage(nextMessage);
  }

  return <AdminPage
    eyebrow={copy.eyebrow}
    title={copy.title}
    description={copy.description}
    actions={<>
      <AdminAuditExportButton filters={applied} disabled={loading} onMessage={showExportMessage} />
      <AdminButton disabled={loading} onClick={() => void loadAuditLogs(page, applied)}>{copy.refresh}</AdminButton>
    </>}
  >
    <div className="admin-audit-page">
      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title={copy.pageItems} value={items.length.toLocaleString(dateLocale)} helper={`${total.toLocaleString(dateLocale)} ${copy.totalItems}`} />
        <AdminMetric title={copy.modules} value={moduleCount.toLocaleString(dateLocale)} helper={copy.pageItems} />
        <AdminMetric title={copy.admins} value={adminCount.toLocaleString(dateLocale)} helper={copy.pageItems} />
        <AdminMetric title={copy.readOnly} value={`${page}/${pageCount}`} helper={copy.readOnlyHelp} />
      </AdminMetricGrid>

      <AdminCard title={copy.filters} description={copy.filtersDescription}>
        <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
          <div className="admin-audit-filter-grid">
            <label className="admin-audit-field"><span>{copy.search}</span><input disabled={loading} value={draft.search} onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))} placeholder={copy.searchPlaceholder} /></label>
            <label className="admin-audit-field"><span>{copy.module}</span><input disabled={loading} value={draft.module} onChange={(event) => setDraft((value) => ({ ...value, module: event.target.value }))} placeholder={copy.modulePlaceholder} /></label>
            <label className="admin-audit-field"><span>{copy.action}</span><input disabled={loading} value={draft.action} onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))} placeholder={copy.actionPlaceholder} /></label>
            <label className="admin-audit-field"><span>{copy.admin}</span><input disabled={loading} value={draft.admin} onChange={(event) => setDraft((value) => ({ ...value, admin: event.target.value }))} placeholder={copy.adminPlaceholder} /></label>
            <label className="admin-audit-field"><span>{copy.target}</span><input disabled={loading} value={draft.targetId} onChange={(event) => setDraft((value) => ({ ...value, targetId: event.target.value }))} placeholder={copy.targetPlaceholder} /></label>
            <label className="admin-audit-field"><span>{copy.from}</span><input disabled={loading} type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} /></label>
            <label className="admin-audit-field"><span>{copy.to}</span><input disabled={loading} type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} /></label>
          </div>
          <div className="admin-audit-filter-actions">
            <AdminButton type="submit" disabled={loading}>{copy.applyFilters}</AdminButton>
            <AdminButton type="button" disabled={loading} tone="secondary" onClick={clearFilters}>{copy.clearFilters}</AdminButton>
          </div>
        </form>
        {activeFilters.length > 0 && <div className="admin-audit-filter-chips">{activeFilters.map(([key, value]) => <AdminBadge key={key} tone="warning">{key}: {value}</AdminBadge>)}</div>}
      </AdminCard>

      <AdminDataTable
        ariaLabel={copy.events}
        columns={columns}
        rows={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle={copy.noEvents}
        emptyDescription={copy.noEventsHelp}
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={total}
        onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), pageCount))}
        labels={{
          loading: copy.loading,
          empty: copy.noEvents,
          previousPage: copy.previousPage,
          nextPage: copy.nextPage,
          page: (pageNumber) => `${copy.page} ${pageNumber.toLocaleString(dateLocale)}`,
          rowsPerPage: copy.rowsPerPage,
          range: (from, to, count) => locale === 'th' ? `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} จาก ${count.toLocaleString(dateLocale)}` : `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} of ${count.toLocaleString(dateLocale)}`,
        }}
      />
    </div>
  </AdminPage>;
}

function AuditDetails({ item, copy }: { item: AuditLog; copy: AuditCopy }) {
  const href = targetHref(item.module, item.targetId);
  return <details className="admin-audit-payload admin-audit-table-details">
    <summary>{copy.details}</summary>
    <dl className="admin-audit-table-meta">
      <div><dt>{copy.userAgent}</dt><dd>{item.userAgent || '-'}</dd></div>
      <div><dt>{copy.email}</dt><dd>{item.adminUser?.email ?? '-'}</dd></div>
    </dl>
    <AuditData title={copy.before} value={item.oldData} emptyLabel={copy.noData} />
    <AuditData title={copy.after} value={item.newData} emptyLabel={copy.noData} />
    {href && <AdminLinkButton href={href}>{copy.related}</AdminLinkButton>}
  </details>;
}

function AuditData({ title, value, emptyLabel }: { title: string; value: unknown; emptyLabel: string }) {
  const hasValue = value !== undefined && value !== null;
  return <details className="admin-audit-payload">
    <summary>{title}</summary>
    {hasValue ? <pre>{stringifyAdminPayload(value)}</pre> : <p>{emptyLabel}</p>}
  </details>;
}

function targetHref(moduleName: string, targetId?: string | null) {
  if (!targetId) return null;
  const module = moduleName.toLowerCase();
  const id = encodeURIComponent(targetId);
  if (module.includes('admin-access') || module.includes('admin_access') || module.includes('delegat') || module.includes('role') || module.includes('permission')) return '/access';
  if (module.includes('admin-account') || module.includes('admin_user') || module.includes('admin-user')) return `/admin-accounts?adminId=${id}`;
  if (module.includes('anti-bot') || module.includes('anti_bot') || module.includes('captcha')) return '/anti-bot';
  if (module.includes('auth') || module === 'security') return '/security';
  if (module.includes('topup') || module.includes('deposit')) return `/topups?requestId=${id}`;
  if (module.includes('withdraw')) return `/withdrawals?requestId=${id}`;
  if (module.includes('game-session') || module.includes('game_session')) return `/game-sessions?sessionId=${id}`;
  if (module.includes('game-transfer') || module.includes('game_transfer')) return `/game-transfers?transferId=${id}`;
  if (module.includes('webhook')) return `/webhook-logs?referenceId=${id}`;
  if (module.includes('reconciliation')) return `/reconciliation-center?referenceId=${id}`;
  if (module.includes('provider')) return `/game-providers?providerId=${id}`;
  if (module.includes('promotion-claim') || module.includes('promotion_claim')) return `/promotion-claims?claimId=${id}`;
  if (module.includes('promotion')) return `/promotion-center?promotionId=${id}`;
  if (module.includes('bonus')) return `/bonus-ledgers?referenceId=${id}`;
  if (module.includes('commission')) return `/commission-ledgers?referenceId=${id}`;
  if (module.includes('affiliate')) return `/affiliate-center?affiliateId=${id}`;
  if (module.includes('support')) return `/support-center?ticketId=${id}`;
  if (module.includes('kyc')) return `/kyc-center?caseId=${id}`;
  if (module.includes('content') || module.includes('cms')) return '/content-center';
  if (module.includes('setting')) return '/settings';
  if (module.includes('risk')) return `/risk-alerts/${id}`;
  if (module.includes('member') || module.includes('user')) return `/members/${id}`;
  if (module.includes('wallet') || module.includes('ledger') || module.includes('money')) return `/ledgers?referenceId=${id}`;
  return null;
}

function actionTone(action: string) {
  const value = action.toLowerCase();
  if (value.includes('reject') || value.includes('revoke') || value.includes('fail') || value.includes('delete')) return 'danger';
  if (value.includes('approve') || value.includes('complete') || value.includes('confirm') || value.includes('create')) return 'success';
  if (value.includes('claim') || value.includes('review') || value.includes('update')) return 'warning';
  return 'neutral';
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isNullableString(value: unknown): value is string | null | undefined { return value === undefined || value === null || typeof value === 'string'; }
function isAdminUser(value: unknown): value is NonNullable<AuditLog['adminUser']> { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.email === 'string'; }
function isAuditLog(value: unknown): value is AuditLog { return isRecord(value) && typeof value.id === 'string' && typeof value.action === 'string' && typeof value.module === 'string' && typeof value.createdAt === 'string' && isNullableString(value.targetId) && isNullableString(value.ipAddress) && isNullableString(value.userAgent) && (value.adminUser === undefined || value.adminUser === null || isAdminUser(value.adminUser)); }
function isAuditResponse(value: unknown): value is { items: AuditLog[]; total?: unknown; pageCount?: unknown } { return isRecord(value) && Array.isArray(value.items) && value.items.every(isAuditLog); }
function nonNegativeInteger(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback; }
function positiveInteger(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback; }
function formatDateTime(value: string, locale: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(locale); }
