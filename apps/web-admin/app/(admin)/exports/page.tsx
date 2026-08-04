'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminToolbar } from '../_components/admin-ui';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';

type ExportStatus = 'COMPLETED' | 'FAILED';
type ExportJob = { id: string; title: string; path: string; status: ExportStatus; createdAt: string; completedAt: string; error?: string; rows?: number };
type ExportSource = { title: string; text: string; path: string; fileType: 'CSV' };
type PreparedExport = { source: ExportSource; path: string; text: string; rows: number };

const STORAGE_KEY = 'admin_export_history_v1';
const PAGE_SIZE = 10;
const MAX_HISTORY = 100;
const sources: ExportSource[] = [
  { title: 'Top-ups CSV', text: 'รายการเติมเงินทั้งหมด', path: '/admin/exports/topups.csv', fileType: 'CSV' },
  { title: 'Withdrawals CSV', text: 'รายการถอนเงินทั้งหมด', path: '/admin/exports/withdrawals.csv', fileType: 'CSV' },
  { title: 'Ledgers CSV', text: 'ประวัติ ledger ยอดก่อนและหลัง', path: '/admin/exports/ledgers.csv', fileType: 'CSV' },
];

function isExportJob(value: unknown): value is ExportJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Partial<ExportJob>;
  return typeof job.id === 'string' && typeof job.title === 'string' && typeof job.path === 'string' && typeof job.createdAt === 'string' && typeof job.completedAt === 'string' && (job.status === 'COMPLETED' || job.status === 'FAILED');
}

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ from: '', to: '' });
  const [preparingPath, setPreparingPath] = useState('');
  const [prepared, setPrepared] = useState<PreparedExport | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('history');
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
  }), [jobs]);
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);
  const locked = Boolean(preparingPath || prepared);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  function buildPath(source: ExportSource) {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const query = params.toString();
    return query ? `${source.path}?${query}` : source.path;
  }

  async function prepareDownload(source: ExportSource) {
    if (locked) return;
    if (rangeInvalid) { setMessage('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด'); return; }
    const path = buildPath(source);
    setPreparingPath(source.path);
    setMessage('กำลังตรวจจำนวนแถวก่อนดาวน์โหลด...');
    try {
      const response = await adminApiFetch(path);
      if (!response.ok) throw new Error('export');
      const text = await response.text();
      const lines = text.trim() ? text.trim().split('\n').length : 0;
      const rows = Math.max(lines - 1, 0);
      setPrepared({ source, path, text, rows });
      setMessage(`ไฟล์พร้อมแล้ว พบ ${rows.toLocaleString('th-TH')} แถว`);
    } catch {
      const now = new Date().toISOString();
      const failedJob: ExportJob = {
        id: crypto.randomUUID(),
        title: source.title,
        path,
        status: 'FAILED',
        createdAt: now,
        completedAt: now,
        error: 'สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่',
      };
      setJobs((current) => [failedJob, ...current].slice(0, MAX_HISTORY));
      setMessage('สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPreparingPath('');
    }
  }

  function confirmDownload() {
    if (!prepared) return;
    const { source, path, text, rows } = prepared;
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
    const now = new Date().toISOString();
    const completedJob: ExportJob = {
      id: crypto.randomUUID(),
      title: source.title,
      path,
      status: 'COMPLETED',
      createdAt: now,
      completedAt: now,
      rows,
    };
    setJobs((current) => [completedJob, ...current].slice(0, MAX_HISTORY));
    setPrepared(null);
    setMessage(`ดาวน์โหลด ${rows.toLocaleString('th-TH')} แถวแล้ว`);
  }

  function retry(job: ExportJob) {
    const source = sources.find((item) => job.path.startsWith(item.path));
    if (source) void prepareDownload(source);
  }

  function clearHistory() { setJobs([]); setPage(1); }

  const columns = useMemo<readonly AdminDataColumn<ExportJob>[]>(() => [
    { id: 'file', header: 'ไฟล์', mobileLabel: 'ไฟล์', priority: 'primary', width: '26%', cell: (job) => job.title },
    { id: 'status', header: 'สถานะ', mobileLabel: 'สถานะ', priority: 'secondary', width: '14%', cell: (job) => <AdminBadge tone={job.status === 'COMPLETED' ? 'success' : 'danger'}>{job.status}</AdminBadge> },
    { id: 'rows', header: 'จำนวนแถว', mobileLabel: 'จำนวนแถว', priority: 'secondary', align: 'end', width: '12%', cell: (job) => job.rows?.toLocaleString('th-TH') ?? '-' },
    { id: 'range', header: 'ช่วงวันที่', mobileLabel: 'ช่วงวันที่', priority: 'secondary', width: '20%', cell: (job) => rangeLabel(job.path) },
    { id: 'completedAt', header: 'เสร็จเมื่อ', mobileLabel: 'เสร็จเมื่อ', priority: 'secondary', width: '20%', cell: (job) => new Date(job.completedAt).toLocaleString('th-TH') },
    { id: 'action', header: 'การทำงาน', mobileLabel: 'การทำงาน', priority: 'secondary', align: 'end', width: '8%', cell: (job) => job.status === 'FAILED' ? <AdminButton size="compact" tone="secondary" disabled={locked} onClick={() => retry(job)}>ลองใหม่</AdminButton> : '-' },
  ], [locked]);

  const historyAction = jobs.length ? <AdminButton size="compact" tone="ghost" onClick={clearHistory}>ล้างประวัติ</AdminButton> : null;
  const dialogDetails = prepared ? <div><strong>ชนิดไฟล์:</strong> CSV<br /><strong>ช่วงวันที่:</strong> {rangeLabel(prepared.path)}<br /><strong>จำนวนแถว:</strong> {prepared.rows.toLocaleString('th-TH')}</div> : null;

  return <AdminPage eyebrow="Data Governance" title="Export Center" description="เลือกช่วงวันที่ ตรวจจำนวนแถว และยืนยันก่อนดาวน์โหลดข้อมูล">
    <AdminMetricGrid><AdminMetric title="ประวัติทั้งหมด" value={metrics.total.toLocaleString('th-TH')} /><AdminMetric title="สำเร็จ" value={metrics.completed.toLocaleString('th-TH')} tone="success" /><AdminMetric title="ล้มเหลว" value={metrics.failed.toLocaleString('th-TH')} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    {message ? <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('วันที่') ? 'danger' : 'neutral'}>{message}</AdminNotice> : null}
    <AdminCard title="ช่วงวันที่" description="ส่ง from/to ไปยัง API ด้วย contract เดียวกันทุกไฟล์"><AdminToolbar><label>ตั้งแต่วันที่ <input type="date" value={range.from} {...(range.to ? { max: range.to } : {})} disabled={locked} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} /></label><label>ถึงวันที่ <input type="date" value={range.to} {...(range.from ? { min: range.from } : {})} disabled={locked} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} /></label><AdminButton tone="secondary" disabled={locked || (!range.from && !range.to)} onClick={() => setRange({ from: '', to: '' })}>ล้างช่วงวันที่</AdminButton></AdminToolbar></AdminCard>
    <AdminGrid>{sources.map((source) => <AdminCard key={source.path} title={source.title} description={`${source.text} · ${source.fileType}`}><AdminButton disabled={locked} onClick={() => void prepareDownload(source)}>{preparingPath === source.path ? 'กำลังตรวจจำนวนแถว...' : 'ตรวจและเตรียมดาวน์โหลด'}</AdminButton></AdminCard>)}</AdminGrid>
    <AdminNotice tone="neutral">ประวัติบนหน้านี้เก็บเฉพาะ metadata ของงาน ไม่เก็บเนื้อหาไฟล์หรือ token</AdminNotice>
    <AdminCard title="ประวัติการส่งออก" description={`แสดง ${MAX_HISTORY} งานล่าสุดบนอุปกรณ์นี้`} action={historyAction}>
      {jobs.length === 0 ? <AdminEmpty>ยังไม่มีประวัติการส่งออก</AdminEmpty> : <AdminDataTable
        ariaLabel="ประวัติการส่งออก"
        columns={columns}
        rows={visibleJobs}
        rowKey={(job) => job.id}
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={jobs.length}
        onPageChange={setPage}
        labels={{
          loading: 'กำลังโหลดประวัติ',
          empty: 'ยังไม่มีประวัติการส่งออก',
          previousPage: 'หน้าก่อนหน้า',
          nextPage: 'หน้าถัดไป',
          page: (value) => `หน้า ${value.toLocaleString('th-TH')}`,
          rowsPerPage: 'รายการต่อหน้า',
          range: (from, to, total) => `${from.toLocaleString('th-TH')}–${to.toLocaleString('th-TH')} จาก ${total.toLocaleString('th-TH')}`,
        }}
      />}
    </AdminCard>
    <AdminConfirmDialog open={Boolean(prepared)} title="ยืนยันดาวน์โหลดไฟล์" description={prepared ? `${prepared.source.title} มี ${prepared.rows.toLocaleString('th-TH')} แถว` : ''} confirmLabel="ดาวน์โหลด" tone="primary" onCancel={() => setPrepared(null)} onConfirm={confirmDownload} details={dialogDetails} />
  </AdminPage>;
}

function rangeLabel(path: string) {
  const query = path.split('?')[1];
  if (!query) return 'ทั้งหมด';
  const params = new URLSearchParams(query);
  return `${params.get('from') || 'เริ่มต้น'} ถึง ${params.get('to') || 'ปัจจุบัน'}`;
}
