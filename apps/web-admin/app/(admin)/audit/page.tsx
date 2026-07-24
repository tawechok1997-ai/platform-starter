'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { stringifyAdminPayload } from '../_components/admin-payload-redaction';
import { AdminAuditExportButton } from './admin-audit-export-button';
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
  AdminStack,
} from '../_components/admin-ui';

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

const PAGE_SIZE = 20;
const emptyFilters: AuditFilters = { search: '', module: '', action: '', admin: '', targetId: '', from: '', to: '' };

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);

  useEffect(() => { void loadAuditLogs(page, applied); }, [page, applied]);

  const moduleCount = useMemo(() => new Set(items.map((item) => item.module)).size, [items]);
  const adminCount = useMemo(() => new Set(items.map((item) => item.adminUser?.id).filter(Boolean)).size, [items]);
  const activeFilters = useMemo(() => Object.entries(applied).filter(([, value]) => value.trim()), [applied]);

  async function loadAuditLogs(nextPage = page, filters = applied) {
    if (loading) return;
    setLoading(true);
    setMessageTone('neutral');
    setMessage('กำลังโหลด audit logs...');
    try {
      const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
      const response = await adminApiFetch(`/admin/audit-logs?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || !Array.isArray(payload.items)) throw new Error('load');
      setItems(payload.items);
      setTotal(Number(payload.total ?? 0));
      setPageCount(Math.max(Number(payload.pageCount ?? 1), 1));
      setMessage('');
    } catch {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessageTone('danger');
      setMessage('โหลด audit logs ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
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
    eyebrow="Security & Operations"
    title="Audit Logs"
    description="ตรวจสอบว่าใครทำอะไร เมื่อไร จากอุปกรณ์ใด และข้อมูลเปลี่ยนจากอะไรเป็นอะไร"
    actions={<>
      <AdminAuditExportButton filters={applied} disabled={loading} onMessage={showExportMessage} />
      <AdminButton disabled={loading} onClick={() => void loadAuditLogs(page, applied)}>รีเฟรช</AdminButton>
    </>}
  >
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="รายการหน้านี้" value={items.length.toLocaleString('th-TH')} helper={`${total.toLocaleString('th-TH')} รายการทั้งหมด`} />
      <AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
      <AdminMetric title="โมดูล" value={moduleCount.toLocaleString('th-TH')} helper="จากข้อมูลหน้านี้" />
      <AdminMetric title="ผู้ดูแล" value={adminCount.toLocaleString('th-TH')} helper="จากข้อมูลหน้านี้" />
      <AdminMetric title="โหมด" value="Read-only" helper="ไม่แก้ไขข้อมูลธุรกรรม" />
    </AdminMetricGrid>

    <AdminCard title="ค้นหาและกรอง" description="กรองตามข้อความ โมดูล action ผู้ดูแล target และช่วงเวลา">
      <div style={filterGridStyle}>
        <label style={fieldStyle}><span>ค้นหารวม</span><input disabled={loading} value={draft.search} onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))} placeholder="action, module, target, IP..." style={inputStyle} /></label>
        <label style={fieldStyle}><span>โมดูล</span><input disabled={loading} value={draft.module} onChange={(event) => setDraft((value) => ({ ...value, module: event.target.value }))} placeholder="topups, withdrawals..." style={inputStyle} /></label>
        <label style={fieldStyle}><span>Action</span><input disabled={loading} value={draft.action} onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))} placeholder="approve, reject, login..." style={inputStyle} /></label>
        <label style={fieldStyle}><span>ผู้ดูแล</span><input disabled={loading} value={draft.admin} onChange={(event) => setDraft((value) => ({ ...value, admin: event.target.value }))} placeholder="ชื่อหรืออีเมล" style={inputStyle} /></label>
        <label style={fieldStyle}><span>Target ID</span><input disabled={loading} value={draft.targetId} onChange={(event) => setDraft((value) => ({ ...value, targetId: event.target.value }))} placeholder="UUID ของรายการ" style={inputStyle} /></label>
        <label style={fieldStyle}><span>ตั้งแต่วันที่</span><input disabled={loading} type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} style={inputStyle} /></label>
        <label style={fieldStyle}><span>ถึงวันที่</span><input disabled={loading} type="date" value={draft.to} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} style={inputStyle} /></label>
      </div>
      <div style={filterActionStyle}>
        <AdminButton disabled={loading} onClick={applyFilters}>ใช้ตัวกรอง</AdminButton>
        <AdminButton disabled={loading} tone="secondary" onClick={clearFilters}>ล้างตัวกรอง</AdminButton>
      </div>
      {activeFilters.length > 0 && <div style={chipWrapStyle}>{activeFilters.map(([key, value]) => <AdminBadge key={key} tone="warning">{key}: {value}</AdminBadge>)}</div>}
    </AdminCard>

    <AdminCard title="เหตุการณ์" description="ข้อมูลสำคัญใน before/after จะถูกปิดบังก่อนแสดงผล">
      <AdminStack>
        {items.map((item) => {
          const href = targetHref(item.module, item.targetId);
          return <article key={item.id} style={logBoxStyle}>
            <header style={logTopStyle}>
              <div style={badgeWrapStyle}>
                <AdminBadge tone="neutral">{item.module || 'unknown'}</AdminBadge>
                <AdminBadge tone={actionTone(item.action)}>{item.action}</AdminBadge>
              </div>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('th-TH')}</time>
            </header>

            <div style={summaryGridStyle}>
              <div><span style={labelStyle}>ผู้ดูแล</span><strong>{item.adminUser?.username ?? item.adminUser?.email ?? 'Unknown admin'}</strong></div>
              <div><span style={labelStyle}>อีเมล</span><strong>{item.adminUser?.email ?? '-'}</strong></div>
              <div><span style={labelStyle}>Target</span><strong style={wrapStyle}>{item.targetId || '-'}</strong></div>
              <div><span style={labelStyle}>IP address</span><strong>{item.ipAddress || '-'}</strong></div>
            </div>

            <div style={agentBoxStyle}><span style={labelStyle}>User agent</span><span style={wrapStyle}>{item.userAgent || '-'}</span></div>

            <div style={detailGridStyle}>
              <AuditData title="ข้อมูลก่อนเปลี่ยน" value={item.oldData} />
              <AuditData title="ข้อมูลหลังเปลี่ยน" value={item.newData} />
            </div>

            {href && <div style={linkRowStyle}><AdminLinkButton href={href}>เปิดรายการที่เกี่ยวข้อง</AdminLinkButton></div>}
          </article>;
        })}
        {!loading && items.length === 0 && <AdminEmpty>ยังไม่มี audit log ตามเงื่อนไขนี้</AdminEmpty>}
      </AdminStack>

      <div style={pagerStyle}>
        <AdminButton disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
        <span>หน้า {page} / {pageCount}</span>
        <AdminButton disabled={loading || page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
      </div>
    </AdminCard>
  </AdminPage>;
}

function AuditData({ title, value }: { title: string; value: unknown }) {
  const hasValue = value !== undefined && value !== null;
  return <details style={detailsStyle}>
    <summary>{title}</summary>
    {hasValue ? <pre style={preStyle}>{stringifyAdminPayload(value)}</pre> : <p style={emptyDataStyle}>ไม่มีข้อมูล</p>}
  </details>;
}

function targetHref(moduleName: string, targetId?: string | null) {
  if (!targetId) return null;
  const module = moduleName.toLowerCase();
  if (module.includes('topup')) return `/topups?requestId=${encodeURIComponent(targetId)}`;
  if (module.includes('withdraw')) return `/withdrawals?requestId=${encodeURIComponent(targetId)}`;
  if (module.includes('member') || module.includes('user')) return `/members/${encodeURIComponent(targetId)}`;
  if (module.includes('wallet') || module.includes('ledger') || module.includes('money')) return `/ledgers?referenceId=${encodeURIComponent(targetId)}`;
  if (module.includes('risk')) return `/risk-alerts/${encodeURIComponent(targetId)}`;
  if (module.includes('admin-access') || module.includes('admin_access')) return '/access';
  if (module.includes('anti-bot') || module.includes('anti_bot') || module.includes('security')) return '/anti-bot';
  if (module.includes('auth')) return '/security';
  return null;
}

function actionTone(action: string) {
  const value = action.toLowerCase();
  if (value.includes('reject') || value.includes('revoke') || value.includes('fail') || value.includes('delete')) return 'danger';
  if (value.includes('approve') || value.includes('complete') || value.includes('confirm') || value.includes('create')) return 'success';
  if (value.includes('claim') || value.includes('review') || value.includes('update')) return 'warning';
  return 'neutral';
}

const filterGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 12 } as const;
const fieldStyle = { display: 'grid', gap: 6, minWidth: 0, color: '#cbd5e1', fontSize: 13 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const filterActionStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10, marginTop: 12 } as const;
const chipWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 } as const;
const logBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 14, display: 'grid', gap: 14, minWidth: 0 } as const;
const logTopStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as const;
const badgeWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' } as const;
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 12 } as const;
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 4 } as const;
const wrapStyle = { overflowWrap: 'anywhere' } as const;
const agentBoxStyle = { borderRadius: 12, background: 'rgba(15,23,42,.7)', padding: 10, minWidth: 0 } as const;
const detailGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 10 } as const;
const detailsStyle = { border: '1px solid rgba(148,163,184,.16)', borderRadius: 12, padding: 10, minWidth: 0 } as const;
const preStyle = { margin: '10px 0 0', padding: 10, borderRadius: 10, background: '#05070a', overflowX: 'auto', fontSize: 12, maxHeight: 360 } as const;
const emptyDataStyle = { margin: '10px 0 0', color: '#94a3b8' } as const;
const linkRowStyle = { display: 'flex', justifyContent: 'flex-end' } as const;
const pagerStyle = { display: 'grid', gridTemplateColumns: 'minmax(88px, 1fr) auto minmax(88px, 1fr)', gap: 8, alignItems: 'center', marginTop: 16, textAlign: 'center', overflowWrap: 'anywhere' } as const;
