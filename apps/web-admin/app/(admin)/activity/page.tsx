'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminPayloadViewer,
  formatMoney,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import styles from './activity-workspace.module.css';

type ActivityType = 'ALL' | 'AUDIT' | 'LEDGER' | 'TOPUP' | 'WITHDRAWAL';
type ActivityItem = {
  id: string;
  type: Exclude<ActivityType, 'ALL'>;
  title: string;
  description?: string | null;
  actor?: string | null;
  memberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  amount?: string | null;
  status?: string | null;
  createdAt: string;
};
type TimelineResponse = {
  items: ActivityItem[];
  page: number;
  take: number;
  total: number;
  pageCount: number;
  summary: { audit: number; ledger: number; topup: number; withdrawal: number };
  generatedAt: string;
};
type TimelineFilters = {
  search: string;
  actor: string;
  memberId: string;
  refType: string;
  refId: string;
  from: string;
  to: string;
};

type ActivityCopy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  loading: string;
  loadFailed: string;
  overviewTab: string;
  timelineTab: string;
  loaded: string;
  matched: string;
  page: string;
  perPage: string;
  audit: string;
  ledger: string;
  requests: string;
  typeFilters: string;
  typeDescription: string;
  all: string;
  topups: string;
  withdrawals: string;
  advancedFilters: string;
  advancedDescription: string;
  showFilters: string;
  hideFilters: string;
  search: string;
  actor: string;
  memberId: string;
  refType: string;
  refId: string;
  from: string;
  to: string;
  apply: string;
  reset: string;
  noAdvanced: string;
  timeline: string;
  generated: string;
  status: string;
  event: string;
  reference: string;
  amount: string;
  time: string;
  details: string;
  noResults: string;
  noResultsHelp: string;
  previousPage: string;
  nextPage: string;
  rowsPerPage: string;
  eventDetail: string;
  close: string;
  descriptionLabel: string;
  rawDetail: string;
  openMember: string;
  openRelated: string;
};

const COPY: Record<AdminLocale, ActivityCopy> = {
  th: {
    eyebrow: 'ศูนย์บัญชาการ', title: 'ไทม์ไลน์กิจกรรม', description: 'เหตุการณ์จาก Audit, Ledger, ฝากเงิน และถอนเงิน แบบแบ่งหน้า',
    refresh: 'รีเฟรช', loading: 'กำลังโหลดกิจกรรม...', loadFailed: 'โหลดกิจกรรมไม่สำเร็จ กรุณาลองใหม่',
    overviewTab: 'ภาพรวมกิจกรรม', timelineTab: 'ไทม์ไลน์ละเอียด', loaded: 'รายการในหน้านี้', matched: 'รายการทั้งหมด', page: 'หน้า', perPage: 'ต่อหน้า',
    audit: 'Audit', ledger: 'Ledger', requests: 'รายการฝากและถอน', typeFilters: 'ประเภทเหตุการณ์', typeDescription: 'เลือกเฉพาะเหตุการณ์ที่ต้องตรวจ', all: 'ทั้งหมด', topups: 'ฝากเงิน', withdrawals: 'ถอนเงิน',
    advancedFilters: 'ตัวกรองเพิ่มเติม', advancedDescription: 'ค้นหาด้วยคำสำคัญ ผู้ดำเนินการ สมาชิก Reference และช่วงเวลา', showFilters: 'เปิดตัวกรอง', hideFilters: 'ซ่อนตัวกรอง',
    search: 'ค้นหา', actor: 'ผู้ดำเนินการ', memberId: 'รหัสสมาชิก', refType: 'ประเภท Reference', refId: 'รหัส Reference', from: 'ตั้งแต่', to: 'ถึง', apply: 'ใช้ตัวกรอง', reset: 'ล้างตัวกรอง', noAdvanced: 'ยังไม่ได้ใช้ตัวกรองเพิ่มเติม',
    timeline: 'รายการกิจกรรม', generated: 'สร้างข้อมูลเมื่อ', status: 'สถานะ', event: 'เหตุการณ์', reference: 'Reference', amount: 'จำนวนเงิน', time: 'เวลา', details: 'รายละเอียด',
    noResults: 'ไม่พบกิจกรรม', noResultsHelp: 'ลองเปลี่ยนประเภทหรือล้างตัวกรองเพิ่มเติม', previousPage: 'หน้าก่อนหน้า', nextPage: 'หน้าถัดไป', rowsPerPage: 'รายการต่อหน้า',
    eventDetail: 'รายละเอียดกิจกรรม', close: 'ปิด', descriptionLabel: 'คำอธิบาย', rawDetail: 'ข้อมูลรายการ', openMember: 'เปิดสมาชิก', openRelated: 'เปิดหน้าที่เกี่ยวข้อง',
  },
  en: {
    eyebrow: 'Command center', title: 'Activity timeline', description: 'Paginated audit, ledger, top-up, and withdrawal events',
    refresh: 'Refresh', loading: 'Loading activity...', loadFailed: 'Unable to load activity. Please try again.',
    overviewTab: 'Activity overview', timelineTab: 'Detailed timeline', loaded: 'Rows on this page', matched: 'Total matches', page: 'Page', perPage: 'per page',
    audit: 'Audit', ledger: 'Ledger', requests: 'Top-ups & withdrawals', typeFilters: 'Event types', typeDescription: 'Show only the events you need to review.', all: 'All', topups: 'Top-ups', withdrawals: 'Withdrawals',
    advancedFilters: 'Advanced filters', advancedDescription: 'Filter by keyword, actor, member, reference, and date range.', showFilters: 'Show filters', hideFilters: 'Hide filters',
    search: 'Search', actor: 'Actor', memberId: 'Member ID', refType: 'Reference type', refId: 'Reference ID', from: 'From', to: 'To', apply: 'Apply filters', reset: 'Reset filters', noAdvanced: 'No advanced filters are active.',
    timeline: 'Activity events', generated: 'Generated', status: 'Status', event: 'Event', reference: 'Reference', amount: 'Amount', time: 'Time', details: 'Details',
    noResults: 'No activity found', noResultsHelp: 'Try another event type or clear the advanced filters.', previousPage: 'Previous page', nextPage: 'Next page', rowsPerPage: 'Rows per page',
    eventDetail: 'Activity detail', close: 'Close', descriptionLabel: 'Description', rawDetail: 'Record data', openMember: 'Open member', openRelated: 'Open related page',
  },
};

const TYPE_OPTIONS: readonly ActivityType[] = ['ALL', 'AUDIT', 'LEDGER', 'TOPUP', 'WITHDRAWAL'];
const EMPTY_FILTERS: TimelineFilters = { search: '', actor: '', memberId: '', refType: '', refId: '', from: '', to: '' };

export default function ActivityPage() {
  const [locale] = useAdminLocale();
  const copy = COPY[locale];
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState<ActivityType>('ALL');
  const [advanced, setAdvanced] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { void loadTimeline(1, 'ALL', EMPTY_FILTERS, 20); }, []);

  const activeFilterChips = useMemo(() => Object.entries(advanced)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${filterLabel(key as keyof TimelineFilters, copy)}: ${value.trim()}`), [advanced, copy]);

  async function loadTimeline(nextPage = page, nextType = type, nextFilters = advanced, nextPageSize = pageSize) {
    setLoading(true);
    setMessage('');
    const params = new URLSearchParams({ page: String(nextPage), take: String(nextPageSize), type: nextType });
    Object.entries(nextFilters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
    try {
      const response = await adminApiFetch(`/admin/activity/timeline?${params.toString()}`);
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isTimelineResponse(payload)) {
        setMessage(copy.loadFailed);
        return;
      }
      setData(payload);
      setPage(payload.page);
    } catch {
      setMessage(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  function changeType(nextType: ActivityType) {
    setType(nextType);
    setPage(1);
    void loadTimeline(1, nextType, advanced, pageSize);
  }

  function applyAdvanced() {
    setPage(1);
    void loadTimeline(1, type, advanced, pageSize);
  }

  function resetAdvanced() {
    setAdvanced(EMPTY_FILTERS);
    setPage(1);
    void loadTimeline(1, type, EMPTY_FILTERS, pageSize);
  }

  function go(nextPage: number) {
    setPage(nextPage);
    void loadTimeline(nextPage, type, advanced, pageSize);
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
    void loadTimeline(1, type, advanced, nextPageSize);
  }

  const columns = useMemo<readonly AdminDataColumn<ActivityItem>[]>(() => [
    {
      id: 'status', header: copy.status, mobileLabel: copy.status, priority: 'secondary', width: '15%',
      cell: (item) => <span className={styles.badges}><AdminBadge tone={typeTone(item.type)}>{typeLabel(item.type, copy)}</AdminBadge>{item.status && <AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge>}</span>,
    },
    {
      id: 'event', header: copy.event, mobileLabel: copy.event, priority: 'primary', width: '30%',
      cell: (item) => <span className={styles.event}><strong>{item.title}</strong><small>{item.description || '-'}</small></span>,
    },
    {
      id: 'actor', header: copy.actor, mobileLabel: copy.actor, priority: 'secondary', width: '15%',
      cell: (item) => <span className={styles.actor}><strong>{item.actor || '-'}</strong><small>{item.memberId || '-'}</small></span>,
    },
    {
      id: 'reference', header: copy.reference, mobileLabel: copy.reference, priority: 'tertiary', width: '15%',
      cell: (item) => <span className={styles.reference}><strong>{item.refType || '-'}</strong><small>{item.refId || '-'}</small></span>,
    },
    {
      id: 'amount', header: copy.amount, mobileLabel: copy.amount, priority: 'secondary', align: 'end', width: '12%',
      cell: (item) => <span className={styles.amount}>{item.amount ? formatMoney(item.amount) : '-'}</span>,
    },
    {
      id: 'time', header: copy.time, mobileLabel: copy.time, priority: 'secondary', width: '14%',
      cell: (item) => formatDate(item.createdAt, numberLocale),
    },
    {
      id: 'details', header: '', mobileLabel: copy.details, priority: 'secondary', align: 'end', width: '1%',
      cell: (item) => <AdminButton size="compact" tone="secondary" onClick={() => setSelected(item)}>{copy.details}</AdminButton>,
    },
  ], [copy, numberLocale]);

  const summary = data?.summary ?? { audit: 0, ledger: 0, topup: 0, withdrawal: 0 };
  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton disabled={loading} onClick={() => void loadTimeline()}>{loading ? copy.loading : copy.refresh}</AdminButton>}>
    <AdminWorkspaceTabs
      ariaLabel={copy.eyebrow}
      activeId="timeline"
      tabs={[
        { id: 'overview', label: copy.overviewTab, href: '/activity-center' },
        { id: 'timeline', label: copy.timelineTab, href: '/activity' },
      ]}
    />

    <div className={styles.workspace}>
      {message && <AdminNotice tone="danger">{message}</AdminNotice>}
      <AdminMetricGrid>
        <AdminMetric title={copy.loaded} value={(data?.items.length ?? 0).toLocaleString(numberLocale)} helper={`${(data?.total ?? 0).toLocaleString(numberLocale)} ${copy.matched}`} />
        <AdminMetric title={copy.page} value={`${(data?.page ?? page).toLocaleString(numberLocale)}/${Math.max(1, data?.pageCount ?? 1).toLocaleString(numberLocale)}`} helper={`${pageSize.toLocaleString(numberLocale)} ${copy.perPage}`} />
        <AdminMetric title={copy.audit} value={summary.audit.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.ledger} value={summary.ledger.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.requests} value={(summary.topup + summary.withdrawal).toLocaleString(numberLocale)} helper={`${summary.topup.toLocaleString(numberLocale)} ${copy.topups} · ${summary.withdrawal.toLocaleString(numberLocale)} ${copy.withdrawals}`} />
      </AdminMetricGrid>

      <AdminCard title={copy.typeFilters} description={copy.typeDescription}>
        <div className={styles.typeTabs}>{TYPE_OPTIONS.map((option) => <AdminButton key={option} size="compact" disabled={loading} tone={type === option ? 'primary' : 'secondary'} onClick={() => changeType(option)}>{option === 'ALL' ? copy.all : typeLabel(option, copy)}</AdminButton>)}</div>
      </AdminCard>

      <AdminCard title={copy.advancedFilters} description={copy.advancedDescription} action={<AdminButton size="compact" tone="secondary" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? copy.hideFilters : copy.showFilters}</AdminButton>}>
        <div className={styles.filters}>
          {activeFilterChips.length > 0 && <div className={styles.chips}>{activeFilterChips.map((chip) => <AdminBadge key={chip} tone="warning">{chip}</AdminBadge>)}</div>}
          {showAdvanced && <>
            <div className={styles.advancedGrid}>
              <FilterField label={copy.search} value={advanced.search} onChange={(value) => setAdvanced((previous) => ({ ...previous, search: value }))} />
              <FilterField label={copy.actor} value={advanced.actor} onChange={(value) => setAdvanced((previous) => ({ ...previous, actor: value }))} />
              <FilterField label={copy.memberId} value={advanced.memberId} onChange={(value) => setAdvanced((previous) => ({ ...previous, memberId: value }))} />
              <FilterField label={copy.refType} value={advanced.refType} onChange={(value) => setAdvanced((previous) => ({ ...previous, refType: value }))} />
              <FilterField label={copy.refId} value={advanced.refId} onChange={(value) => setAdvanced((previous) => ({ ...previous, refId: value }))} />
              <FilterField label={copy.from} type="date" value={advanced.from} onChange={(value) => setAdvanced((previous) => ({ ...previous, from: value }))} />
              <FilterField label={copy.to} type="date" value={advanced.to} onChange={(value) => setAdvanced((previous) => ({ ...previous, to: value }))} />
            </div>
            <div className={styles.actions}><AdminButton disabled={loading} onClick={applyAdvanced}>{copy.apply}</AdminButton><AdminButton disabled={loading} tone="secondary" onClick={resetAdvanced}>{copy.reset}</AdminButton></div>
          </>}
          {!showAdvanced && activeFilterChips.length === 0 && <AdminEmpty>{copy.noAdvanced}</AdminEmpty>}
        </div>
      </AdminCard>

      <AdminCard title={copy.timeline} description={data ? `${copy.generated} ${formatDate(data.generatedAt, numberLocale)}` : copy.description}>
        <AdminDataTable
          ariaLabel={copy.timeline}
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(item) => `${item.type}-${item.id}`}
          loading={loading}
          emptyTitle={copy.noResults}
          emptyDescription={copy.noResultsHelp}
          page={page}
          pageSize={pageSize}
          totalItems={data?.total ?? 0}
          pageSizeOptions={[20, 50, 100]}
          onPageChange={go}
          onPageSizeChange={changePageSize}
          labels={{
            loading: copy.loading,
            empty: copy.noResults,
            previousPage: copy.previousPage,
            nextPage: copy.nextPage,
            page: (value) => `${copy.page} ${value.toLocaleString(numberLocale)}`,
            rowsPerPage: copy.rowsPerPage,
            range: (from, to, total) => locale === 'th'
              ? `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} จาก ${total.toLocaleString(numberLocale)}`
              : `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} of ${total.toLocaleString(numberLocale)}`,
          }}
        />
      </AdminCard>
    </div>

    <AdminDrawer
      open={Boolean(selected)}
      title={selected?.title ?? copy.eventDetail}
      description={selected ? `${typeLabel(selected.type, copy)} · ${formatDate(selected.createdAt, numberLocale)}` : undefined}
      closeLabel={copy.close}
      size="medium"
      onClose={() => setSelected(null)}
      footer={selected && <div className={styles.referenceLinks}>{selected.memberId && <AdminLinkButton href={`/members/${selected.memberId}`}>{copy.openMember}</AdminLinkButton>}<AdminLinkButton href={relatedHref(selected)}>{copy.openRelated}</AdminLinkButton></div>}
    >
      {selected && <div className={styles.drawerGrid}>
        <dl>
          <div><dt>{copy.status}</dt><dd><span className={styles.badges}><AdminBadge tone={typeTone(selected.type)}>{typeLabel(selected.type, copy)}</AdminBadge>{selected.status && <AdminBadge tone={statusTone(selected.status)}>{selected.status}</AdminBadge>}</span></dd></div>
          <div><dt>{copy.actor}</dt><dd>{selected.actor || '-'}</dd></div>
          <div><dt>{copy.memberId}</dt><dd>{selected.memberId || '-'}</dd></div>
          <div><dt>{copy.reference}</dt><dd>{selected.refType ? `${selected.refType} ${selected.refId || ''}` : '-'}</dd></div>
          <div><dt>{copy.amount}</dt><dd>{selected.amount ? formatMoney(selected.amount) : '-'}</dd></div>
          <div><dt>{copy.time}</dt><dd>{formatDate(selected.createdAt, numberLocale)}</dd></div>
        </dl>
        <AdminCard title={copy.descriptionLabel} compact><p>{selected.description || '-'}</p></AdminCard>
        <AdminCard title={copy.rawDetail} compact><AdminPayloadViewer payload={selected} /></AdminCard>
      </div>}
    </AdminDrawer>
  </AdminPage>;
}

function FilterField({ label, value, type = 'text', onChange }: { label: string; value: string; type?: 'text' | 'date'; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function filterLabel(key: keyof TimelineFilters, copy: ActivityCopy) {
  if (key === 'search') return copy.search;
  if (key === 'actor') return copy.actor;
  if (key === 'memberId') return copy.memberId;
  if (key === 'refType') return copy.refType;
  if (key === 'refId') return copy.refId;
  if (key === 'from') return copy.from;
  return copy.to;
}

function typeLabel(type: Exclude<ActivityType, 'ALL'>, copy: ActivityCopy) {
  if (type === 'AUDIT') return copy.audit;
  if (type === 'LEDGER') return copy.ledger;
  if (type === 'TOPUP') return copy.topups;
  return copy.withdrawals;
}

function typeTone(type: ActivityItem['type']): 'neutral' | 'success' | 'warning' | 'danger' {
  if (type === 'AUDIT') return 'neutral';
  if (type === 'LEDGER') return 'success';
  if (type === 'TOPUP') return 'warning';
  return 'danger';
}

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  const upper = status.toUpperCase();
  if (['APPROVED', 'COMPLETED', 'CREDIT', 'OK'].includes(upper)) return 'success';
  if (['PENDING', 'REVIEWING', 'DEBIT'].includes(upper)) return 'warning';
  if (['REJECTED', 'CANCELLED', 'MISMATCH', 'FAILED'].includes(upper)) return 'danger';
  return 'neutral';
}

function relatedHref(item: ActivityItem) {
  if (item.type === 'TOPUP') return item.refId ? `/topups?requestId=${encodeURIComponent(item.refId)}` : '/topups';
  if (item.type === 'WITHDRAWAL') return item.refId ? `/withdrawals?requestId=${encodeURIComponent(item.refId)}` : '/withdrawals';
  if (item.type === 'LEDGER') return '/wallet-ledgers';
  return '/audit';
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(locale);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isActivityItem(value: unknown): value is ActivityItem {
  return isRecord(value)
    && typeof value.id === 'string'
    && ['AUDIT', 'LEDGER', 'TOPUP', 'WITHDRAWAL'].includes(String(value.type))
    && typeof value.title === 'string'
    && typeof value.createdAt === 'string';
}

function isTimelineResponse(value: unknown): value is TimelineResponse {
  return isRecord(value)
    && Array.isArray(value.items)
    && value.items.every(isActivityItem)
    && Number.isFinite(Number(value.page))
    && Number.isFinite(Number(value.take))
    && Number.isFinite(Number(value.total))
    && Number.isFinite(Number(value.pageCount))
    && isRecord(value.summary)
    && Number.isFinite(Number(value.summary.audit))
    && Number.isFinite(Number(value.summary.ledger))
    && Number.isFinite(Number(value.summary.topup))
    && Number.isFinite(Number(value.summary.withdrawal))
    && typeof value.generatedAt === 'string';
}
