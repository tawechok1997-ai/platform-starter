'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminDataTable, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';

type ExportStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
type ExportJob = { id: string; title: string; path: string; status: ExportStatus; createdAt: string; completedAt?: string; error?: string; rows?: number };
const STORAGE_KEY = 'admin_export_history_v1';
const exports = [
  { title: 'Top-ups CSV', text: 'รายการเติมเงินทั้งหมด', path: '/admin/exports/topups.csv' },
  { title: 'Withdrawals CSV', text: 'รายการถอนเงินทั้งหมด', path: '/admin/exports/withdrawals.csv' },
  { title: 'Ledgers CSV', text: 'ประวัติ ledger ยอดก่อนและหลัง', path: '/admin/exports/ledgers.csv' },
];

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  useEffect(() => { try { const value = localStorage.getItem(STORAGE_KEY); if (value) setJobs(JSON.parse(value)); } catch {} }, []);
  useEffect(() => { if (jobs.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, 30))); }, [jobs]);

  const metrics = useMemo(() => ({ total: jobs.length, completed: jobs.filter((job) => job.status === 'COMPLETED').length, failed: jobs.filter((job) => job.status === 'FAILED').length, running: jobs.filter((job) => job.status === 'RUNNING').length }), [jobs]);

  async function download(item: typeof exports[number]) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    setJobs((current) => [{ id, title: item.title, path: item.path, status: 'RUNNING', createdAt }, ...current]);
    try {
      const res = await adminApiFetch(item.path);
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Export ไม่สำเร็จ');
      const text = await res.text();
      const rows = Math.max(text.trim().split('\n').length - 1, 0);
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'COMPLETED', completedAt: new Date().toISOString(), rows } : job));
    } catch (error) {
      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'FAILED', completedAt: new Date().toISOString(), error: error instanceof Error ? error.message : 'Export ไม่สำเร็จ' } : job));
    }
  }

  return <AdminPage eyebrow="Data Governance" title="Export Center" description="สร้างไฟล์ ติดตามสถานะ ดูประวัติ และดาวน์โหลดข้อมูลตามสิทธิ์ของผู้ดูแล">
    <AdminMetricGrid><AdminMetric title="ประวัติทั้งหมด" value={metrics.total.toLocaleString('th-TH')} /><AdminMetric title="สำเร็จ" value={metrics.completed.toLocaleString('th-TH')} tone="success" /><AdminMetric title="กำลังทำ" value={metrics.running.toLocaleString('th-TH')} tone={metrics.running ? 'warning' : 'neutral'} /><AdminMetric title="ล้มเหลว" value={metrics.failed.toLocaleString('th-TH')} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    <AdminGrid>{exports.map((item) => <AdminCard key={item.path} title={item.title} description={item.text}><AdminButton onClick={() => void download(item)}>สร้างและดาวน์โหลด</AdminButton></AdminCard>)}</AdminGrid>
    <AdminNotice tone="neutral">API จะตรวจสิทธิ์ของ Admin ก่อนส่งข้อมูลทุกครั้ง ประวัติบนหน้านี้เก็บเฉพาะสถานะงานในเบราว์เซอร์ ไม่เก็บเนื้อหาไฟล์หรือ token</AdminNotice>
    <AdminCard title="ประวัติการส่งออก" description="แสดง 30 งานล่าสุดบนอุปกรณ์นี้">
      <div className="admin-data-table-wrap"><table className="admin-data-table"><thead><tr><th>ไฟล์</th><th>สถานะ</th><th>จำนวนแถว</th><th>เริ่มเมื่อ</th><th>เสร็จเมื่อ</th><th>รายละเอียด</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td>{job.title}</td><td><AdminBadge tone={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>{job.status}</AdminBadge></td><td>{job.rows?.toLocaleString('th-TH') ?? '-'}</td><td>{new Date(job.createdAt).toLocaleString('th-TH')}</td><td>{job.completedAt ? new Date(job.completedAt).toLocaleString('th-TH') : '-'}</td><td>{job.error ?? job.path}</td></tr>)}{jobs.length === 0 && <tr><td colSpan={6}>ยังไม่มีประวัติการส่งออก</td></tr>}</tbody></table></div>
    </AdminCard>
  </AdminPage>;
}
