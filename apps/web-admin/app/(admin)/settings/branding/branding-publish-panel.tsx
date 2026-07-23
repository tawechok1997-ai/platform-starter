'use client';

import { useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminActionStrip, AdminButton, AdminLinkButton, AdminNotice, AdminStack } from '../../_components/admin-ui';

export default function BrandingPublishPanel() {
  const [message, setMessage] = useState('แก้ไขและกด Save Changes เพื่อบันทึกเป็น Draft จากนั้นตรวจ Preview ก่อน Publish');
  const [publishing, setPublishing] = useState(false);

  async function publish() {
    if (!window.confirm('Publish Branding draft ให้สมาชิกใช้งานทันที?')) return;
    setPublishing(true);
    setMessage('กำลัง Publish Branding...');
    try {
      const res = await adminApiFetch('/admin/settings/branding/publish', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Publish ไม่สำเร็จ (${res.status})`);
      setMessage(data?.requiresDualApproval ? 'Publish สำเร็จ แต่มีรายการความเสี่ยงสูงที่ควรตรวจ Dual Approval' : 'Publish Branding สำเร็จ');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish ไม่สำเร็จ');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AdminActionStrip>
      <AdminStack>
        <div>
          <strong>Branding Workflow</strong>
          <p style={descriptionStyle}>Edit และ Publish ใช้สิทธิ์แยกกัน พร้อม Preview, Version history และ Rollback</p>
        </div>
        <AdminNotice>{message}</AdminNotice>
        <div style={actionsStyle}>
          <AdminLinkButton href="/settings/branding/preview" tone="secondary">Preview Desktop / Tablet / Mobile</AdminLinkButton>
          <AdminLinkButton href="/settings/branding/history" tone="ghost">Version History / Rollback</AdminLinkButton>
          <AdminButton type="button" disabled={publishing} onClick={() => void publish()}>
            {publishing ? 'กำลัง Publish...' : 'Publish Draft'}
          </AdminButton>
        </div>
      </AdminStack>
    </AdminActionStrip>
  );
}

const descriptionStyle = { margin: '4px 0 0', opacity: 0.76, lineHeight: 1.5 } as const;
const actionsStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center' } as const;
