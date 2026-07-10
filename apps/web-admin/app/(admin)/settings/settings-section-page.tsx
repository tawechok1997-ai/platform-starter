'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'color';
type FieldConfig = { key: string; label: string; type?: FieldType; placeholder?: string };
type Props = { group: string; title: string; description: string; fields: FieldConfig[]; preview?: 'branding' | 'theme' | 'maintenance' | 'default' };

export default function SettingsSectionPage({ group, title, description, fields, preview = 'default' }: Props) {
  const [form, setForm] = useState<Record<string, string | boolean | number | null>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ใหม่ก่อนแก้ settings'); return; }
    fetch(`${API_URL}/admin/settings/${group}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => { const data = await res.json().catch(() => null); if (!res.ok) throw new Error(data?.message ?? 'โหลด settings ไม่สำเร็จ'); return data; })
      .then((data) => setForm(data.settings ?? {}))
      .catch((error) => setMessage(error.message));
  }, [group]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('กำลังบันทึก...');
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ใหม่ก่อนบันทึก settings'); return; }
    const res = await fetch(`${API_URL}/admin/settings/${group}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกไม่สำเร็จ'); return; }
    setMessage(data.requiresDualApproval ? 'บันทึกแล้ว แต่รายการเสี่ยงควรเข้าคิว Dual Approval' : 'บันทึกสำเร็จ');
  }

  function update(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }

  return (
    <AdminPage eyebrow="Settings" title={title} description={description} actions={<a href="/settings">← Settings</a>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Configuration" description="แก้ค่าหลักของหมวดนี้ แล้วกด Save Changes"><form onSubmit={onSubmit}><AdminToolbar>{fields.map((field) => <FieldInput key={field.key} field={field} value={form[field.key]} onChange={(value) => update(field.key, value)} />)}<AdminButton type="submit">Save Changes</AdminButton></AdminToolbar></form></AdminCard>
        <AdminCard title="Preview" description="ตัวอย่างค่าที่กำลังตั้งอยู่"><Preview type={preview} form={form} title={title} /></AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldConfig; value: string | boolean | number | null | undefined; onChange: (value: string | boolean) => void }) {
  const type = field.type ?? 'text';
  if (type === 'checkbox') return <label style={checkboxStyle}><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> {field.label}</label>;
  if (type === 'textarea') return <label style={labelStyle}>{field.label}<textarea value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
  return <label style={labelStyle}>{field.label}<input type={type} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Preview({ type, form, title }: { type: string; form: Record<string, string | boolean | number | null>; title: string }) {
  if (type === 'branding') {
    const primary = String(form.primary_color ?? '#f5c542'); const bg = String(form.background_color ?? '#080808'); const card = String(form.card_color ?? '#181818'); const text = String(form.text_color ?? '#ffffff');
    return <div style={{ background: bg, color: text, borderRadius: 16, padding: 16, overflowWrap: 'anywhere' }}><strong>{form.logo_url ? 'Logo loaded' : 'Logo'}</strong><div style={{ background: card, borderRadius: 14, padding: 14, marginTop: 12 }}><p>Balance Card</p><button style={{ background: primary, border: 0, borderRadius: 10, padding: '8px 14px' }}>ฝากเงิน</button>{' '}<button style={{ borderRadius: 10, padding: '8px 14px' }}>ถอนเงิน</button></div></div>;
  }
  if (type === 'maintenance') return <div style={previewBoxStyle}><p>Maintenance: {form.enabled ? 'ON' : 'OFF'}</p><p>Message: {form.message ?? 'ระบบกำลังปรับปรุง'}</p><p>Deposit: {form.deposit_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p><p>Withdraw: {form.withdraw_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p></div>;
  return <div style={previewBoxStyle}><strong>{title}</strong><AdminStack>{Object.entries(form).slice(0, 8).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}</AdminStack></div>;
}

const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, fontWeight: 800 } as const;
const previewBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16, background: 'rgba(148,163,184,.06)', overflowWrap: 'anywhere' as const } as const;
