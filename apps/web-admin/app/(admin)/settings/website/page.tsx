'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminToolbar } from '../../_components/admin-ui';

type WebsiteSettings = { site_name: string; site_description: string; site_url: string; admin_url: string; default_language: string; timezone: string; currency: string; date_format: string; maintenance_mode: boolean; registration_enabled: boolean; login_enabled: boolean };
const defaults: WebsiteSettings = { site_name: '', site_description: '', site_url: '', admin_url: '', default_language: 'th', timezone: 'Asia/Bangkok', currency: 'THB', date_format: 'DD/MM/YYYY', maintenance_mode: false, registration_enabled: true, login_enabled: true };

export default function WebsiteSettingsPage() {
  const [form, setForm] = useState<WebsiteSettings>(defaults);
  const [message, setMessage] = useState('กำลังโหลด...');

  useEffect(() => {
    let cancelled = false;

    adminApiFetch('/admin/settings/website')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? `โหลด settings ไม่สำเร็จ (${res.status})`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setForm({ ...defaults, ...(data.settings ?? {}) });
        setMessage('');
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'โหลด settings ไม่สำเร็จ');
      });

    return () => { cancelled = true; };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังบันทึก...');

    const res = await adminApiFetch('/admin/settings/website', {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
      return;
    }
    setMessage(data.requiresDualApproval ? 'บันทึกแล้ว แต่รายการเสี่ยงควรเข้าคิว Dual Approval' : 'บันทึกสำเร็จ');
  }

  function update<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) { setForm((current) => ({ ...current, [key]: value })); }

  return (
    <AdminPage eyebrow="Settings" title="Website Settings" description="ตั้งค่าข้อมูลเว็บไซต์หลัก ภาษา โดเมน และสถานะการใช้งาน" actions={<a href="/settings">← Settings</a>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Website Configuration" description="ข้อมูลหลักที่ใช้ร่วมกันทั้ง member และ admin">
          <form onSubmit={onSubmit}><AdminToolbar><label style={labelStyle}>Site Name<input value={form.site_name} onChange={(e) => update('site_name', e.target.value)} /></label><label style={labelStyle}>Site Description<textarea value={form.site_description} onChange={(e) => update('site_description', e.target.value)} /></label><label style={labelStyle}>Domain<input value={form.site_url} onChange={(e) => update('site_url', e.target.value)} /></label><label style={labelStyle}>Admin Domain<input value={form.admin_url} onChange={(e) => update('admin_url', e.target.value)} /></label><label style={labelStyle}>Default Language<select value={form.default_language} onChange={(e) => update('default_language', e.target.value)}><option value="th">Thai</option><option value="en">English</option></select></label><label style={labelStyle}>Timezone<input value={form.timezone} onChange={(e) => update('timezone', e.target.value)} /></label><label style={labelStyle}>Currency<input value={form.currency} onChange={(e) => update('currency', e.target.value)} /></label><label style={labelStyle}>Date Format<input value={form.date_format} onChange={(e) => update('date_format', e.target.value)} /></label><label style={checkboxStyle}><input type="checkbox" checked={form.maintenance_mode} onChange={(e) => update('maintenance_mode', e.target.checked)} /> Maintenance Mode</label><label style={checkboxStyle}><input type="checkbox" checked={form.registration_enabled} onChange={(e) => update('registration_enabled', e.target.checked)} /> Registration Enabled</label><label style={checkboxStyle}><input type="checkbox" checked={form.login_enabled} onChange={(e) => update('login_enabled', e.target.checked)} /> Login Enabled</label><AdminButton type="submit">Save Changes</AdminButton></AdminToolbar></form>
        </AdminCard>
        <AdminCard title="Preview" description="ตัวอย่างข้อมูลที่กำลังตั้งอยู่"><div style={previewBoxStyle}><strong>{form.site_name || 'Website Name'}</strong><p>{form.site_description || 'Website description preview'}</p><p>URL: {form.site_url || '-'}</p><p>Language: {form.default_language}</p><p>Timezone: {form.timezone}</p><p>Currency: {form.currency}</p><p>Register: {form.registration_enabled ? 'เปิด' : 'ปิด'}</p><p>Login: {form.login_enabled ? 'เปิด' : 'ปิด'}</p><p>Maintenance: {form.maintenance_mode ? 'ON' : 'OFF'}</p></div></AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, fontWeight: 800 } as const;
const previewBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16, background: 'rgba(148,163,184,.06)', overflowWrap: 'anywhere' as const } as const;