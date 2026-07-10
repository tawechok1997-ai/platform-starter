'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

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

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [moduleName, setModuleName] = useState('');
  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAuditLogs(1); }, []);
  useEffect(() => { loadAuditLogs(page); }, [page]);

  async function loadAuditLogs(nextPage = page) {
    setLoading(true);
    const params = new URLSearchParams();
    if (moduleName.trim()) params.set('module', moduleName.trim());
    if (action.trim()) params.set('action', action.trim());
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/audit-logs?${params.toString()}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด audit logs ไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  function applyFilters() {
    setPage(1);
    loadAuditLogs(1);
  }

  function clearFilters() {
    setModuleName('');
    setAction('');
    setPage(1);
    setTimeout(() => loadAuditLogs(1), 0);
  }

  return <AdminPage eyebrow="Security" title="Audit Logs" description="ตรวจสอบเหตุการณ์สำคัญของระบบแอดมิน" actions={<AdminButton disabled={loading} onClick={() => loadAuditLogs()}>Reload</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Loaded" value={String(items.length)} helper={`${total} total`} />
      <AdminMetric title="Page" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} per page`} />
      <AdminMetric title="Mode" value="Read-only" helper="audit trail" />
    </AdminMetricGrid>

    <AdminCard title="Filters" description="ค้นหาเฉพาะ module หรือ action ที่ต้องการ">
      <div style={filterStyle}>
        <input value={moduleName} onChange={(event) => setModuleName(event.target.value)} placeholder="module เช่น auth, admin-access" style={inputStyle} />
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="action เช่น login, revoke" style={inputStyle} />
        <AdminButton disabled={loading} onClick={applyFilters}>Apply</AdminButton>
        <AdminButton disabled={loading} onClick={clearFilters}>Clear</AdminButton>
        <div style={pagerStyle}><AdminButton disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</AdminButton><span>Page {page} / {pageCount}</span><AdminButton disabled={loading || page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</AdminButton></div>
      </div>
    </AdminCard>

    <AdminCard title="Events" description="รายการ audit ล่าสุด">
      <AdminStack>{items.map((item) => <section key={item.id} style={logBoxStyle}>
        <div style={logTopStyle}><div style={badgeWrapStyle}><AdminBadge tone="neutral">{item.module}</AdminBadge><AdminBadge tone="success">{item.action}</AdminBadge></div><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div>
        <strong>{item.adminUser?.username ?? 'Unknown admin'}</strong>
        <p>Target: {item.targetId || '-'}</p>
        <p>IP: {item.ipAddress || '-'}</p>
        <p style={agentStyle}>UA: {item.userAgent || '-'}</p>
        {item.newData ? <pre style={preStyle}>{JSON.stringify(item.newData, null, 2)}</pre> : null}
      </section>)}{items.length === 0 && <AdminNotice>ยังไม่มี audit log ตามเงื่อนไขนี้</AdminNotice>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const filterStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, alignItems: 'center' } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
const logBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 12, display: 'grid', gap: 6, minWidth: 0 } as const;
const logTopStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const };
const badgeWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const agentStyle = { overflowWrap: 'anywhere' as const, color: '#94a3b8' };
const preStyle = { margin: 0, padding: 10, borderRadius: 12, background: '#05070a', overflowX: 'auto' as const, fontSize: 12 };
