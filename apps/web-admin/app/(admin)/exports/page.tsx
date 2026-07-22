'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPagination, AdminToolbar } from '../_components/admin-ui';

type ExportStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
type ExportJob = { id: string; title: string; path: string; status: ExportStatus; createdAt: string; completedAt?: string; error?: string; rows?: number };
type ExportSource = { title: string; text: string; path: string; fileType: 'CSV' };
const STORAGE_KEY = 'admin_export_history_v1';
const PAGE_SIZE = 10;
const MAX_HISTORY = 100;
const exports: ExportSource[] = [
  { title: 'Top-ups CSV', text: 'รายการเติมเงินทั้งหมด', path: '/admin/exports/topups.csv', fileType: 'CSV' },
  { title: 'Withdrawals CSV', text: 'รายการถอนเงินทั้งหมด', path: '/admin/exports/withdrawals.csv', fileType: 'CSV' },
  { title: 'Ledgers CSV', text: 'ประวัติ ledger ยอดก่อนและหลัง', path: '/admin/exports/ledgers.csv', fileType: 'CSV' },
];

function isExportJob(value: unknown): value is ExportJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Partial<ExportJob>;
  return typeof job.id === 'string'
    && typeof job.title === 'string'
    && typeof job.path === 'string'
    && typeof job.createdAt === 'string'
    && (job.status === 'RUNNING' || job.status === 'COMPLETED' || job.status === 'FAILED');
}

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return;
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error('Invalid export history');
      setJobs(parsed.filter(isExportJob).slice(0, MAX_HISTORY));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    if (jobs.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_HISTORY)));
  }, [jobs]);

  const metrics = useMemo(() => ({
    total: jobs.length,
    completed: jobs.filter((job) => job.status === 'COMPLETED').length,
    failed: jobs.filter((job) => job.status === 'FAILED').length,
    running: jobs.filter((job) => job.status === 'RUNNING').length,
  }), [jobs]);
  const runningPaths = useMemo(() => new Set(jobs.filter((job) => job.status === 'RUNNING').map((job) => job.path)), [jobs]);
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  async function download(item: ExportSource) {
    if (runningPaths.has(item.path)) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    setJobs((current) => [{ id, title: item.title, path: item.path, status: 'RUNNING', createdAt }, ...current].slice(0, MAX_HISTORY));
    try {
      const res = await adminApiFetch(item.path);
      if (!res.ok) throw new Error('Export failed');
      const text = await res.text();
      const rows = Math.max(text.trim().split('\n').length - 1, 0);
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'COMPLETED', completedAt: new Date().toISOString(), rows } : job));
    } catch {
      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'FAILED', completedAt: new Date().toISOString(), error: 'สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่' } : job));
    }
  }

  function retry(job: ExportJob) {
    const source = exports.find((item) => item.path === job.path);
    if (source) void download(source);
  }

  function clearHistory() {
    setJobs((current) => current.filter((job) => job.status === 'RUNNING'));
    setPage(1);
  }

  return <AdminPage eyebrow="Data Governance" title="Export Center" description="สร้างไฟล์ ติดตามสถานะ ดูประวัติ และดาวน์โหลดข้อมูลตามสิทธิ์ของผู้ดูแล">
    <AdminMetricGrid><AdminMetric title="ประวัติทั้งหมด" value={metrics.total.toLocaleString('th-TH')} /><AdminMetric title="สำเร็จ" value={metrics.completed.toLocaleString('th-TH')} tone="success" /><AdminMetric title="กำลังทำ" value={metrics.running.toLocaleString('th-TH')} tone={metrics.running ? 'warning' : 'neutral'} /><AdminMetric title="ล้มเหลว" value={metrics.failed.toLocaleString('th-TH')} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    <AdminGrid>{exports.map((item) => { const running = runningPaths.has(item.path); return <AdminCard key={item.path} title={item.title} description={`${item.text} · ${item.fileType}`}><AdminButton disabled={running} onClick={() => void download(item)}>{running ? 'กำลังสร้างไฟล์...' : 'สร้างและดาวน์โหลด'}</AdminButton></AdminCard>; })}</AdminGrid>
    <AdminNotice tone="neutral">API จะตรวจสิทธิ์ของ Admin ก่อนส่งข้อมูลทุกครั้ง ประวัติบนหน้านี้เก็บเฉพาะสถานะงานในเบราว์เซอร์ ไม่เก็บเนื้อหาไฟล์หรือ token</AdminNotice>
    <AdminCard title="ประวัติการส่งออก" description={`แสดง ${MAX_HISTORY} งานล่าสุดบนอุปกรณ์นี้`} action={jobs.some((job) => job.status !== 'RUNNING') ? <AdminButton size="compact" tone="ghost" onClick={clearHistory}>ล้างประวัติ</AdminButton> : undefined}>
      {jobs.length === 0 ? <AdminEmpty>ยังไม่มีประวัติการส่งออก</AdminEmpty> : <>
        <div className="admin-data-table-wrap"><table className="admin-data-table"><thead><tr><th>ไฟล์</th><th>ชนิด</th><th>สถานะ</th><th>จำนวนแถว</th><th>เริ่มเมื่อ</th><th>เสร็จเมื่อ</th><th>การทำงาน</th></tr></thead><tbody>{visibleJobs.map((job) => <tr key={job.id}><td>{job.title}</td><td>CSV</td><td><AdminBadge tone={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>{job.status}</AdminBadge></td><td>{job.rows?.toLocaleString('th-TH') ?? '-'}</td><td>{new Date(job.createdAt).toLocaleString('th-TH')}</td><td>{job.completedAt ? new Date(job.completedAt).toLocaleString('th-TH') : '-'}</td><td>{job.status === 'FAILED' ? <AdminButton size="compact" tone="secondary" disabled={runningPaths.has(job.path)} onClick={() => retry(job)}>{runningPaths.has(job.path) ? 'กำลังลองใหม่...' : 'ลองใหม่'}</AdminButton> : '-'}</td></tr>)}</tbody></table></div>
        {jobs.length > PAGE_SIZE && <AdminToolbar><AdminPagination page={page} totalPages={totalPages} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} /></AdminToolbar>}
      </>}
    </AdminCard>
  </AdminPage>;
}
