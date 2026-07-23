'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../../admin-api';
import { AdminButton, AdminCard, AdminNotice, AdminPage, AdminStack } from '../../../../_components/admin-ui';

type HistoryEntry = {
  id: string;
  settingKey: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export default function BrandingHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [message, setMessage] = useState('กำลังโหลด Version history...');
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  async function load() {
    setMessage('กำลังโหลด Version history...');
    try {
      const res = await adminApiFetch('/admin/settings/branding/history?limit=100');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลด Version history ไม่สำเร็จ (${res.status})`);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลด Version history ไม่สำเร็จ');
    }
  }

  async function rollback(entry: HistoryEntry) {
    if (!window.confirm(`Rollback ${entry.field} ไปค่าก่อนหน้า?`)) return;
    setRollingBackId(entry.id);
    setMessage(`กำลัง Rollback ${entry.field}...`);
    try {
      const res = await adminApiFetch(`/admin/settings/branding/history/${entry.id}/rollback`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Rollback ไม่สำเร็จ (${res.status})`);
      setMessage(`Rollback ${entry.field} สำเร็จ`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rollback ไม่สำเร็จ');
    } finally {
      setRollingBackId(null);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <AdminPage
      eyebrow="Settings"
      title="Branding Version History"
      description="ดูค่าก่อนและหลังการ Publish พร้อม Rollback เฉพาะรายการที่ต้องการ"
      actions={<><a href="/settings/branding">← Branding Settings</a><a href="/settings/branding/preview">Preview</a><AdminButton type="button" tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton></>}
    >
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>
        {history.length === 0 && (
          <AdminCard title="ยังไม่มี Version history" description="เมื่อ Publish หรือ Rollback ระบบจะแสดงรายการที่นี่">
            <p style={{ margin: 0, opacity: 0.75 }}>บันทึก Draft แล้ว Publish อย่างน้อยหนึ่งครั้งเพื่อเริ่มสร้างประวัติย้อนหลัง</p>
          </AdminCard>
        )}
        {history.map((entry) => (
          <AdminCard key={entry.id} title={entry.field} description={formatDate(entry.createdAt)}>
            <div style={historyGridStyle}>
              <ValueBlock title="ค่าก่อนหน้า" value={entry.oldValue} />
              <ValueBlock title="ค่าหลังแก้" value={entry.newValue} />
            </div>
            <div style={metaStyle}>
              <span>ผู้แก้: {entry.changedBy || 'ไม่ระบุ'}</span>
              <span>IP: {entry.ipAddress || 'ไม่ระบุ'}</span>
            </div>
            <AdminButton type="button" tone="secondary" disabled={rollingBackId !== null} onClick={() => void rollback(entry)}>
              {rollingBackId === entry.id ? 'กำลัง Rollback...' : 'Rollback เป็นค่าก่อนหน้า'}
            </AdminButton>
          </AdminCard>
        ))}
      </AdminStack>
    </AdminPage>
  );
}

function ValueBlock({ title, value }: { title: string; value: unknown }) {
  return <section style={valueBlockStyle}><strong>{title}</strong><pre style={preStyle}>{formatValue(value)}</pre></section>;
}

function formatValue(value: unknown) {
  if (typeof value === 'string') return value || '(ค่าว่าง)';
  if (value === null || value === undefined) return '(ไม่มีค่า)';
  return JSON.stringify(value, null, 2) ?? '(ไม่สามารถแสดงค่าได้)';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('th-TH');
}

const historyGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 } as const;
const valueBlockStyle = { minWidth: 0, padding: 12, border: '1px solid rgba(148,163,184,.18)', borderRadius: 12, background: 'rgba(148,163,184,.05)' } as const;
const preStyle = { margin: '8px 0 0', whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, font: 'inherit', opacity: 0.9 } as const;
const metaStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 12, margin: '12px 0', fontSize: 13, opacity: 0.75 } as const;
