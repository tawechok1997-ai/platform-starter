'use client';

import { useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminButton, AdminCard, AdminNotice, AdminStack } from '../../../_components/admin-ui';

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
    <AdminCard title="Branding Workflow" description="Edit และ Publish ใช้สิทธิ์แยกกัน พร้อม Preview, Version history และ Rollback">
      <AdminStack>
        <AdminNotice>{message}</AdminNotice>
        <div style={actionsStyle}>
          <a href="/settings/branding/preview" style={linkStyle}>Preview Desktop / Tablet / Mobile</a>
          <a href="/settings/branding/history" style={linkStyle}>Version History / Rollback</a>
          <AdminButton type="button" disabled={publishing} onClick={() => void publish()}>
            {publishing ? 'กำลัง Publish...' : 'Publish Draft'}
          </AdminButton>
        </div>
      </AdminStack>
    </AdminCard>
  );
}

const actionsStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'center' } as const;
const linkStyle = { display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,.28)', textDecoration: 'none', fontWeight: 800 } as const;
