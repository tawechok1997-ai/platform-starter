'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../../admin-api';
import { AdminButton, AdminNotice, AdminPage } from '../../../../_components/admin-ui';
import BrandingMemberPreview from '../../branding-member-preview';

type SettingsValue = string | boolean | number | null;
type SettingsRecord = Record<string, SettingsValue>;

export default function BrandingPreviewPage() {
  const [settings, setSettings] = useState<SettingsRecord>({});
  const [message, setMessage] = useState('กำลังโหลด Branding preview...');

  async function load() {
    setMessage('กำลังโหลด Branding preview...');
    try {
      const [publishedRes, draftRes] = await Promise.all([
        adminApiFetch('/admin/settings/branding'),
        adminApiFetch('/admin/settings/branding/draft'),
      ]);
      const published = await publishedRes.json().catch(() => null);
      const draft = await draftRes.json().catch(() => null);
      if (!publishedRes.ok) throw new Error(published?.message ?? `โหลด Branding ไม่สำเร็จ (${publishedRes.status})`);
      if (!draftRes.ok) throw new Error(draft?.message ?? `โหลด Branding draft ไม่สำเร็จ (${draftRes.status})`);
      setSettings({ ...(published?.settings ?? {}), ...(draft?.settings ?? {}) });
      setMessage(Object.keys(draft?.settings ?? {}).length > 0 ? 'กำลังแสดง Draft ที่ยังไม่ได้ Publish' : 'กำลังแสดงค่าที่ Publish แล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลด Branding ไม่สำเร็จ');
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <AdminPage
      eyebrow="Settings"
      title="Member Branding Preview"
      description="ตรวจภาพรวมหน้า Member แบบเต็มพื้นที่ก่อนเผยแพร่ แยก Desktop, Tablet และ Mobile"
      actions={<><a href="/settings/branding">← Branding Settings</a><a href="/settings/branding/history">Version History</a><AdminButton type="button" tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton></>}
    >
      {message && <AdminNotice>{message}</AdminNotice>}
      <BrandingMemberPreview form={settings} />
    </AdminPage>
  );
}
