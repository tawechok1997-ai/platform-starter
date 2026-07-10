'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSectionRow, AdminStack, formatMoney } from '../_components/admin-ui';

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

const PAGE_SIZE = 30;
const filters: ActivityType[] = ['ALL', 'AUDIT', 'LEDGER', 'TOPUP', 'WITHDRAWAL'];
const emptyFilters: TimelineFilters = { search: '', actor: '', memberId: '', refType: '', refId: '', from: '', to: '' };

export default function ActivityPage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<ActivityType>('ALL');
  const [advanced, setAdvanced] = useState<TimelineFilters>(emptyFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadTimeline(1, type, advanced); }, []);

  const activeFilterChips = useMemo(() => Object.entries(advanced).filter(([, value]) => value.trim()).map(([key, value]) => `${key}: ${value.trim()}`), [advanced]);

  async function loadTimeline(nextPage = page, nextType = type, nextFilters = advanced) {
    setLoading(true);
    setMessage('กำลังโหลด activity timeline...');
    const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE), type: nextType });
    Object.entries(nextFilters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
    const res = await adminApiFetch(`/admin/activity/timeline?${params.toString()}`);
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(json?.message ?? 'โหลด activity ไม่สำเร็จ'); return; }
    setData(json);
    setPage(json.page ?? nextPage);
    setMessage('');
  }

  function changeType(nextType: ActivityType) {
    setType(nextType);
    setPage(1);
    loadTimeline(1, nextType, advanced);
  }

  function applyAdvanced() {
    setPage(1);
    loadTimeline(1, type, advanced);
  }

  function resetAdvanced() {
    setAdvanced(emptyFilters);
    setPage(1);
    loadTimeline(1, type, emptyFilters);
  }

  function go(nextPage: number) {
    setPage(nextPage);
    loadTimeline(nextPage, type, advanced);
  }

  return <AdminPage eyebrow="Operations" title="Activity Timeline" description="รวมเหตุการณ์จาก audit logs, wallet ledgers, topups และ withdrawals" actions={<AdminButton disabled={loading} onClick={() => loadTimeline(page, type, advanced)}>Refresh</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}

    {data && <AdminMetricGrid>
      <AdminMetric title="Loaded" value={data.items.length.toLocaleString('th-TH')} helper={`${data.total.toLocaleString('th-TH')} matched`} />
      <AdminMetric title="Page" value={`${data.page}/${data.pageCount}`} helper={`${data.take} per page`} />
      <AdminMetric title="Audit" value={data.summary.audit.toLocaleString('th-TH')} helper="admin events" />
      <AdminMetric title="Ledger" value={data.summary.ledger.toLocaleString('th-TH')} helper="money movements" />
      <AdminMetric title="Requests" value={(data.summary.topup + data.summary.withdrawal).toLocaleString('th-TH')} helper={`${data.summary.topup} topups · ${data.summary.withdrawal} withdrawals`} />
    </AdminMetricGrid>}

    <AdminCard title="Type Filters" description="เลือกชนิด event ที่อยากดู">
      <div style={typeFilterStyle}>{filters.map((item) => <AdminButton key={item} disabled={loading} tone={type === item ? 'primary' : 'secondary'} onClick={() => changeType(item)}>{item}</AdminButton>)}</div>
    </AdminCard>

    <AdminCard title="Advanced Filters" description="ค้นหาด้วย keyword, actor, member, ref และช่วงเวลา" action={<AdminButton tone="secondary" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? 'Hide filters' : 'Show filters'}</AdminButton>}>
      {activeFilterChips.length > 0 && <div style={chipWrapStyle}>{activeFilterChips.map((chip) => <AdminBadge key={chip} tone="warning">{chip}</AdminBadge>)}</div>}
      {showAdvanced && <>
        <div style={filterGridStyle}>
          <input style={inputStyle} value={advanced.search} onChange={(event) => setAdvanced((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search title, status, ref..." />
          <input style={inputStyle} value={advanced.actor} onChange={(event) => setAdvanced((prev) => ({ ...prev, actor: event.target.value }))} placeholder="Actor username/email" />
          <input style={inputStyle} value={advanced.memberId} onChange={(event) => setAdvanced((prev) => ({ ...prev, memberId: event.target.value }))} placeholder="Member ID" />
          <input style={inputStyle} value={advanced.refType} onChange={(event) => setAdvanced((prev) => ({ ...prev, refType: event.target.value }))} placeholder="Ref type เช่น topup" />
          <input style={inputStyle} value={advanced.refId} onChange={(event) => setAdvanced((prev) => ({ ...prev, refId: event.target.value }))} placeholder="Ref ID" />
          <input style={inputStyle} type="date" value={advanced.from} onChange={(event) => setAdvanced((prev) => ({ ...prev, from: event.target.value }))} />
          <input style={inputStyle} type="date" value={advanced.to} onChange={(event) => setAdvanced((prev) => ({ ...prev, to: event.target.value }))} />
        </div>
        <div style={filterActionStyle}><AdminButton disabled={loading} onClick={applyAdvanced}>Apply</AdminButton><AdminButton disabled={loading} tone="secondary" onClick={resetAdvanced}>Reset</AdminButton></div>
      </>}
      {!showAdvanced && activeFilterChips.length === 0 && <AdminEmpty>ยังไม่ได้ใช้ advanced filters</AdminEmpty>}
    </AdminCard>

    <AdminCard title="Timeline" description={data ? `Generated ${new Date(data.generatedAt).toLocaleString('th-TH')}` : 'recent activity'}>
      <AdminStack>
        {data?.items.map((item) => <AdminSectionRow key={`${item.type}-${item.id}`}>
          <div style={leftStyle}>
            <div style={badgeRowStyle}><AdminBadge tone={typeTone(item.type)}>{item.type}</AdminBadge>{item.status && <AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge>}</div>
            <strong>{item.title}</strong>
            <p style={mutedInlineStyle}>{item.description ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>
            {item.actor && <p style={mutedInlineStyle}>Actor: {item.actor}</p>}
            {item.refType && <p style={mutedInlineStyle}>Ref: {item.refType} {item.refId ?? ''}</p>}
          </div>
          <div style={rightStyle}>
            {item.amount && <strong>{formatMoney(item.amount)}</strong>}
            <div style={actionRowStyle}>
              {item.memberId && <AdminLinkButton href={`/members/${item.memberId}`}>Member</AdminLinkButton>}
              {item.type === 'TOPUP' && <AdminLinkButton href="/topups">Top-ups</AdminLinkButton>}
              {item.type === 'WITHDRAWAL' && <AdminLinkButton href="/withdrawals">Withdrawals</AdminLinkButton>}
              {item.type === 'LEDGER' && <AdminLinkButton href="/ledgers">Ledgers</AdminLinkButton>}
              {item.type === 'AUDIT' && <AdminLinkButton href="/audit">Audit</AdminLinkButton>}
            </div>
          </div>
        </AdminSectionRow>)}
        {data && data.items.length === 0 && <AdminEmpty>ยังไม่มี activity ใน filter นี้</AdminEmpty>}
        {!data && !loading && <AdminEmpty>ยังไม่มีข้อมูล</AdminEmpty>}
      </AdminStack>
      {data && <div style={pagerStyle}>
        <AdminButton disabled={loading || page <= 1} onClick={() => go(page - 1)}>Previous</AdminButton>
        <AdminButton disabled={loading || page >= data.pageCount} onClick={() => go(page + 1)}>Next</AdminButton>
      </div>}
    </AdminCard>
  </AdminPage>;
}

function typeTone(type: ActivityItem['type']) {
  if (type === 'AUDIT') return 'neutral';
  if (type === 'LEDGER') return 'success';
  if (type === 'TOPUP') return 'warning';
  return 'danger';
}

function statusTone(status: string) {
  const upper = status.toUpperCase();
  if (['APPROVED', 'COMPLETED', 'CREDIT', 'OK'].includes(upper)) return 'success';
  if (['PENDING', 'REVIEWING', 'DEBIT'].includes(upper)) return 'warning';
  if (['REJECTED', 'CANCELLED', 'MISMATCH', 'FAILED'].includes(upper)) return 'danger';
  return 'neutral';
}

const typeFilterStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 8 };
const chipWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const leftStyle = { display: 'grid', gap: 6, minWidth: 0 };
const rightStyle = { display: 'grid', gap: 8, textAlign: 'left' as const, alignContent: 'start', minWidth: 0 };
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(110px, 100%), 1fr))', gap: 8, minWidth: 0 };
const pagerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 10, marginTop: 16 };
const filterGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10 };
const filterActionStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 10 };
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const mutedInlineStyle = { margin: 0, color: '#94a3b8', overflowWrap: 'anywhere' as const };
