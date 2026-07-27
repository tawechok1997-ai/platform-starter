'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../../admin-api';
import { AdminButton, AdminConfirmDialog, AdminLinkButton, AdminNotice, AdminPage } from '../../../_components/admin-ui';
import styles from '../branding-professional.module.css';

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
  const [pendingRollback, setPendingRollback] = useState<HistoryEntry | null>(null);

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
    setRollingBackId(entry.id);
    setMessage(`กำลัง Rollback ${entry.field}...`);
    try {
      const res = await adminApiFetch(`/admin/settings/branding/history/${entry.id}/rollback`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Rollback ไม่สำเร็จ (${res.status})`);
      setMessage(`Rollback ${entry.field} สำเร็จ`);
      setPendingRollback(null);
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
      eyebrow="การตั้งค่าระบบ"
      title="ประวัติ Branding"
      description="ตรวจค่าก่อนและหลังการเผยแพร่ พร้อม Rollback เฉพาะรายการโดยไม่ย้อนค่าทั้งระบบ"
      actions={
        <>
          <AdminLinkButton href="/settings/branding" tone="ghost">← Branding</AdminLinkButton>
          <AdminLinkButton href="/settings/branding/preview" tone="secondary">Preview</AdminLinkButton>
          <AdminButton type="button" tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton>
        </>
      }
    >
      <div className={styles.historyPage}>
        {message && <AdminNotice>{message}</AdminNotice>}

        {history.length === 0 ? (
          <section className={styles.empty}>
            <div>
              <strong>ยังไม่มี Version history</strong>
              <p>บันทึก Draft และ Publish อย่างน้อยหนึ่งครั้ง ระบบจึงจะเริ่มเก็บประวัติสำหรับตรวจสอบและ Rollback</p>
            </div>
          </section>
        ) : (
          <div className={styles.historyList}>
            {history.map((entry) => (
              <article className={styles.historyCard} key={entry.id}>
                <header className={styles.historyHead}>
                  <div>
                    <h2>{entry.field}</h2>
                    <p>{formatDate(entry.createdAt)}</p>
                  </div>
                  <AdminButton type="button" tone="secondary" disabled={rollingBackId !== null} onClick={() => setPendingRollback(entry)}>
                    {rollingBackId === entry.id ? 'กำลัง Rollback...' : 'Rollback ค่านี้'}
                  </AdminButton>
                </header>

                <div className={styles.historyGrid}>
                  <ValueBlock title="ค่าก่อนหน้า" value={entry.oldValue} />
                  <ValueBlock title="ค่าหลังแก้" value={entry.newValue} />
                </div>

                <div className={styles.meta}>
                  <span>ผู้แก้: {entry.changedBy || 'ไม่ระบุ'}</span>
                  <span>IP: {entry.ipAddress || 'ไม่ระบุ'}</span>
                  <span>Key: {entry.settingKey}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingRollback)}
        title={`ยืนยัน Rollback ${pendingRollback?.field ?? ''}`}
        description="ระบบจะนำค่าก่อนหน้าของรายการนี้กลับมาใช้ และสร้างประวัติรายการใหม่สำหรับ Audit"
        confirmLabel="ยืนยัน Rollback"
        tone="danger"
        busy={rollingBackId !== null}
        onCancel={() => { if (!rollingBackId) setPendingRollback(null); }}
        onConfirm={() => { if (pendingRollback) void rollback(pendingRollback); }}
        details={pendingRollback ? <div className={styles.confirmDetails}><strong>ค่าที่จะคืนกลับ</strong><pre>{formatValue(pendingRollback.oldValue)}</pre><strong>ค่าปัจจุบัน</strong><pre>{formatValue(pendingRollback.newValue)}</pre></div> : null}
      />
    </AdminPage>
  );
}

function ValueBlock({ title, value }: { title: string; value: unknown }) {
  return <section className={styles.valueBlock}><strong>{title}</strong><pre>{formatValue(value)}</pre></section>;
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
