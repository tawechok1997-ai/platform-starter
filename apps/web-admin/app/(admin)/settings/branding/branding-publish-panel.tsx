'use client';

import { useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminButton, AdminConfirmDialog, AdminLinkButton, AdminNotice } from '../../_components/admin-ui';
import styles from './branding-professional.module.css';

export default function BrandingPublishPanel() {
  const [message, setMessage] = useState('แก้ไขและบันทึก Draft ก่อนตรวจ Preview แล้วจึง Publish');
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function publish() {
    setPublishing(true);
    setMessage('กำลัง Publish Branding...');
    try {
      const res = await adminApiFetch('/admin/settings/branding/publish', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Publish ไม่สำเร็จ (${res.status})`);
      setMessage(data?.requiresDualApproval
        ? 'Publish สำเร็จ แต่มีรายการความเสี่ยงสูงที่ควรตรวจ Dual Approval'
        : 'Publish Branding สำเร็จและพร้อมใช้งาน');
      setConfirmOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish ไม่สำเร็จ');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <section className={styles.workflow} aria-label="Branding workflow">
        <div className={styles.workflowCopy}>
          <strong>Draft → Preview → Publish</strong>
          <p>การแก้ไขและการเผยแพร่ใช้สิทธิ์แยกกัน พร้อม Version history และ Rollback สำหรับตรวจสอบย้อนหลัง</p>
        </div>
        <div className={styles.workflowActions}>
          <AdminLinkButton href="/settings/branding/preview" tone="secondary">Preview ทุกขนาด</AdminLinkButton>
          <AdminLinkButton href="/settings/branding/history" tone="ghost">Version history</AdminLinkButton>
          <AdminButton type="button" disabled={publishing} onClick={() => setConfirmOpen(true)}>
            {publishing ? 'กำลัง Publish...' : 'Publish Draft'}
          </AdminButton>
        </div>
        <div className={styles.notice}><AdminNotice>{message}</AdminNotice></div>
      </section>

      <AdminConfirmDialog
        open={confirmOpen}
        title="ยืนยันเผยแพร่ Branding"
        description="Draft ปัจจุบันจะถูกนำไปใช้กับหน้า Member ทันทีหลัง Publish สำเร็จ"
        confirmLabel="Publish Draft"
        tone="primary"
        busy={publishing}
        onCancel={() => { if (!publishing) setConfirmOpen(false); }}
        onConfirm={() => void publish()}
        details={<div className={styles.confirmDetails}><strong>ตรวจสอบก่อนเผยแพร่</strong><pre>1. เปิด Preview ทุกขนาด
2. ตรวจโลโก้ สี และ Contrast
3. ตรวจว่ารูปที่อัปโหลดแสดงผลจริง
4. ตรวจ Version history หลัง Publish</pre></div>}
      />
    </>
  );
}
