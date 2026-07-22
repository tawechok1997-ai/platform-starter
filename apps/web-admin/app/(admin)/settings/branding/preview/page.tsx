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
      const res = await adminApiFetch('/admin/settings/branding');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลด Branding ไม่สำเร็จ (${res.status})`);
      setSettings(data?.settings ?? {});
      setMessage('');
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
      actions={<><a href="/settings/branding">← Branding Settings</a><AdminButton type="button" tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton></>}
    >
      {message && <AdminNotice>{message}</AdminNotice>}
      <BrandingMemberPreview form={settings} />
    </AdminPage>
  );
}
