'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPagination, AdminToolbar } from '../_components/admin-ui';

type ExportStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
type ExportJob = { id: string; title: string; path: string; status: ExportStatus; createdAt: string; completedAt?: string; error?: string; rows?: number };
type ExportSource = { title: string; text: string; path: string; fileType: 'CSV' };
type PreparedExport = { source: ExportSource; path: string; text: string; rows: number } | null;
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
  const [range, setRange] = useState({ from: '', to: '' });
  const [preparingPath, setPreparingPath] = useState('');
  const [prepared, setPrepared] = useState<PreparedExport>(null);
  const [message, setMessage] = useState('');

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
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  function exportPath(source: ExportSource) {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    return `${source.path}${params.size ? `?${params.toString()}` : ''}`;
  }

  async function prepareDownload(source: ExportSource) {
    if (preparingPath || prepared) return;
    if (rangeInvalid) { setMessage('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด'); return; }
    const path = exportPath(source);
    setPreparingPath(source.path);
    setMessage('กำลังตรวจจำนวนแถวก่อนดาวน์โหลด...');
    try {
      const response = await adminApiFetch(path);
      if (!response.ok) throw new Error('export');
      const text = await response.text();
      const rows = Math.max(text.trim().split('\n').length - 1, 0);
      setPrepared({ source, path, text, rows });
      setMessage(`ไฟล์พร้อมแล้ว พบ ${rows.toLocaleString('th-TH')} แถว`);
    } catch {
      const now = new Date().toISOString();
      setJobs((current) => [{ id: crypto.randomUUID(), title: source.title, path, status: 'FAILED', createdAt: now, completedAt: now, error: 'สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่' }, ...current].slice(0, MAX_HISTORY));
      setMessage('สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPreparingPath('');
    }
  }

  function confirmDownload() {
    if (!prepared) return;
    const { source, path, text, rows } = prepared;
    const createdAt = new Date().toISOString();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${source.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setJobs((current) => [{ id: crypto.randomUUID(), title: source.title, path, status: 'COMPLETED', createdAt, completedAt: new Date().toISOString(), rows }, ...current].slice(0, MAX_HISTORY));
    setPrepared(null);
    setMessage(`ดาวน์โหลด ${rows.toLocaleString('th-TH')} แถวแล้ว`);
  }

  function retry(job: ExportJob) {
    const source = exports.find((item) => job.path.startsWith(item.path));
    if (source) void prepareDownload(source);
  }

  function clearHistory() {
    setJobs((current) => current.filter((job) => job.status === 'RUNNING'));
    setPage(1);
  }

  return <AdminPage eyebrow="Data Governance" title="Export Center" description="สร้างไฟล์ ตรวจจำนวนแถว ติดตามสถานะ และดาวน์โหลดข้อมูลตามสิทธิ์ของผู้ดูแล">
    <AdminMetricGrid><AdminMetric title="ประวัติทั้งหมด" value={metrics.total.toLocaleString('th-TH')} /><AdminMetric title="สำเร็จ" value={metrics.completed.toLocaleString('th-TH')} tone="success" /><AdminMetric title="กำลังทำ" value={metrics.running.toLocaleString('th-TH')} tone={metrics.running ? 'warning' : 'neutral'} /><AdminMetric title="ล้มเหลว" value={metrics.failed.toLocaleString('th-TH')} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('วันที่') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminCard title="ชนิดไฟล์และช่วงวันที่" description="ทุกแหล่งรองรับ CSV และส่งช่วงวันที่ให้ API ด้วย contract เดียวกัน">
      <AdminToolbar>
        <label>ชนิดไฟล์ <select value="CSV" disabled aria-label="ชนิดไฟล์"><option value="CSV">CSV</option></select></label>
        <label>ตั้งแต่วันที่ <input type="date" value={range.from} max={range.to || undefined} disabled={Boolean(preparingPath || prepared)} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /></label>
        <label>ถึงวันที่ <input type="date" value={range.to} min={range.from || undefined} disabled={Boolean(preparingPath || prepared)} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></label>
        <AdminButton tone="secondary" disabled={Boolean(preparingPath || prepared) || (!range.from && !range.to)} onClick={() => setRange({ from: '', to: '' })}>ล้างช่วงวันที่</AdminButton>
      </AdminToolbar>
    </AdminCard>
    <AdminGrid>{exports.map((item) => { const running = preparingPath === item.path; return <AdminCard key={item.path} title={item.title} description={`${item.text} · ${item.fileType}`}><AdminButton disabled={Boolean(preparingPath || prepared)} onClick={() => void prepareDownload(item)}>{running ? 'กำลังตรวจจำนวนแถว...' : 'ตรวจและเตรียมดาวน์โหลด'}</AdminButton></AdminCard>; })}</AdminGrid>
    <AdminNotice tone="neutral">API จะตรวจสิทธิ์ของ Admin ก่อนส่งข้อมูลทุกครั้ง ประวัติบนหน้านี้เก็บเฉพาะสถานะงานในเบราว์เซอร์ ไม่เก็บเนื้อหาไฟล์หรือ token</AdminNotice>
    <AdminCard title="ประวัติการส่งออก" description={`แสดง ${MAX_HISTORY} งานล่าสุดบนอุปกรณ์นี้`} action={jobs.some((job) => job.status !== 'RUNNING') ? <AdminButton size="compact" tone="ghost" onClick={clearHistory}>ล้างประวัติ</AdminButton> : undefined}>
      {jobs.length === 0 ? <AdminEmpty>ยังไม่มีประวัติการส่งออก</AdminEmpty> : <>
        <div className="admin-data-table-wrap"><table className="admin-data-table"><thead><tr><th>ไฟล์</th><th>ชนิด</th><th>สถานะ</th><th>จำนวนแถว</th><th>ช่วงวันที่</th><th>เริ่มเมื่อ</th><th>เสร็จเมื่อ</th><th>การทำงาน</th></tr></thead><tbody>{visibleJobs.map((job) => <tr key={job.id}><td>{job.title}</td><td>CSV</td><td><AdminBadge tone={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>{job.status}</AdminBadge></td><td>{job.rows?.toLocaleString('th-TH') ?? '-'}</td><td>{rangeLabel(job.path)}</td><td>{new Date(job.createdAt).toLocaleString('th-TH')}</td><td>{job.completedAt ? new Date(job.completedAt).toLocaleString('th-TH') : '-'}</td><td>{job.status === 'FAILED' ? <AdminButton size="compact" tone="secondary" disabled={Boolean(preparingPath || prepared)} onClick={() => retry(job)}>ลองใหม่</AdminButton> : '-'}</td></tr>)}</tbody></table></div>
        {jobs.length > PAGE_SIZE && <AdminToolbar><AdminPagination page={page} totalPages={totalPages} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} /></AdminToolbar>}
      </>}
    </AdminCard>
    <AdminConfirmDialog open={Boolean(prepared)} title="ยืนยันดาวน์โหลดไฟล์" description={prepared ? `${prepared.source.title} มี ${prepared.rows.toLocaleString('th-TH')} แถว` : ''} confirmLabel="ดาวน์โหลด" tone="primary" onCancel={() => setPrepared(null)} onConfirm={confirmDownload} details={prepared ? <div><strong>ชนิดไฟล์:</strong> {prepared.source.fileType}<br /><strong>ช่วงวันที่:</strong> {rangeLabel(prepared.path)}<br /><strong>จำนวนแถว:</strong> {prepared.rows.toLocaleString('th-TH')}</div> : undefined} />
  </AdminPage>;
}

function rangeLabel(path: string) {
  const query = path.split('?')[1];
  if (!query) return 'ทั้งหมด';
  const params = new URLSearchParams(query);
  return `${params.get('from') || 'เริ่มต้น'} ถึง ${params.get('to') || 'ปัจจุบัน'}`;
}
