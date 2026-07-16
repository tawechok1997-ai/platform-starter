'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar } from '../_components/admin-ui';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'color' | 'date';
type FieldConfig = { key: string; label: string; type?: FieldType; placeholder?: string };
type Props = { group: string; title: string; description: string; fields: FieldConfig[]; preview?: 'branding' | 'theme' | 'maintenance' | 'legal' | 'default' };
type RgbColor = readonly [red: number, green: number, blue: number];

export default function SettingsSectionPage({ group, title, description, fields, preview = 'default' }: Props) {
  const [form, setForm] = useState<Record<string, string | boolean | number | null>>({});
  const [initialForm, setInitialForm] = useState<Record<string, string | boolean | number | null>>({});
  const [message, setMessage] = useState('');
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setMessage('กำลังโหลดการตั้งค่า...');
      try {
        const res = await adminApiFetch(`/admin/settings/${group}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? `โหลด settings ไม่สำเร็จ (${res.status})`);
        if (!cancelled) {
          const settings = data?.settings ?? {};
          setForm(settings);
          setInitialForm(settings);
          setMessage('');
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'โหลด settings ไม่สำเร็จ');
      }
    }

    void loadSettings();
    return () => { cancelled = true; };
  }, [group]);
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังบันทึก...');

    try {
      const res = await adminApiFetch(`/admin/settings/${group}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
        return;
      }
      setInitialForm(form);
      setMessage(data?.requiresDualApproval ? 'บันทึกแล้ว แต่รายการเสี่ยงควรเข้าคิว Dual Approval' : 'บันทึกสำเร็จ');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    }
  }

  function update(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }

  return (
    <AdminPage eyebrow="Settings" title={title} description={description} actions={<a href="/settings">← Settings</a>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {isDirty && <AdminNotice>มีการแก้ไขที่ยังไม่ได้บันทึก — กด Save Changes เพื่อบันทึก หรือ Reset เพื่อย้อนกลับค่าล่าสุดจากระบบ</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Configuration" description="แก้ค่าหลักของหมวดนี้ แล้วกด Save Changes"><form onSubmit={onSubmit}><AdminToolbar>{fields.map((field) => <FieldInput key={field.key} field={field} value={form[field.key]} onChange={(value) => update(field.key, value)} />)}<AdminButton type="submit">Save Changes</AdminButton><AdminButton type="button" tone="secondary" disabled={!isDirty} onClick={() => { setForm(initialForm); setMessage('คืนค่าล่าสุดจากระบบแล้ว'); }}>Reset</AdminButton></AdminToolbar></form></AdminCard>
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
    const contrastWarnings = buildContrastWarnings({ primary, bg, card, text });
    return <div style={{ background: bg, color: text, borderRadius: 16, padding: 16, overflowWrap: 'anywhere' }}><strong>{form.logo_url ? 'Logo loaded' : 'Logo'}</strong>{contrastWarnings.length > 0 && <div style={contrastWarningStyle}>{contrastWarnings.join(' • ')}</div>}<div style={{ background: card, borderRadius: 14, padding: 14, marginTop: 12 }}><p>Balance Card</p><button style={{ background: primary, color: readableTextColor(primary), border: 0, borderRadius: 10, padding: '8px 14px' }}>ฝากเงิน</button>{' '}<button style={{ borderRadius: 10, padding: '8px 14px' }}>ถอนเงิน</button></div></div>;
  }
  if (type === 'maintenance') return <div style={previewBoxStyle}><p>Maintenance: {form.enabled ? 'ON' : 'OFF'}</p><p>Message: {form.message ?? 'ระบบกำลังปรับปรุง'}</p><p>Deposit: {form.deposit_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p><p>Withdraw: {form.withdraw_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p></div>;
  if (type === 'legal') return <div style={previewBoxStyle}><strong>{title}</strong><p>Version: {form.version || 'ยังไม่ระบุ'}</p><p>Effective date: {form.effective_date || 'ยังไม่ระบุ'}</p><AdminStack>{['terms', 'privacy', 'cookie'].map((key) => <section key={key} style={legalPreviewSectionStyle}><strong>{key}</strong><p>{String(form[key] || 'ยังไม่มีเนื้อหา').slice(0, 420)}</p></section>)}</AdminStack></div>;
  return <div style={previewBoxStyle}><strong>{title}</strong><AdminStack>{Object.entries(form).slice(0, 8).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}</AdminStack></div>;
}

const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, fontWeight: 800 } as const;
const previewBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16, background: 'rgba(148,163,184,.06)', overflowWrap: 'anywhere' as const } as const;
const legalPreviewSectionStyle = { borderTop: '1px solid rgba(148,163,184,.16)', paddingTop: 12 } as const;
const contrastWarningStyle = { marginTop: 10, padding: 10, border: '1px solid rgba(248,113,113,.45)', borderRadius: 12, background: 'rgba(127,29,29,.42)', color: '#fee2e2', fontWeight: 800 } as const;

function buildContrastWarnings(colors: { primary: string; bg: string; card: string; text: string }) {
  const warnings: string[] = [];
  if (contrastRatio(colors.text, colors.bg) < 4.5) warnings.push('Text/Background contrast ต่ำกว่า WCAG AA 4.5:1');
  if (contrastRatio(colors.text, colors.card) < 4.5) warnings.push('Text/Card contrast ต่ำกว่า WCAG AA 4.5:1');
  if (contrastRatio(readableTextColor(colors.primary), colors.primary) < 4.5) warnings.push('Button color contrast ต่ำกว่า WCAG AA 4.5:1');
  return warnings;
}

function readableTextColor(background: string) { return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background) ? '#000000' : '#ffffff'; }
function contrastRatio(foreground: string, background: string) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
function relativeLuminance(hex: string) {
  const rgb = parseHexColor(hex);
  if (!rgb) return 1;
  const linearize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const [red, green, blue] = rgb;
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}
function parseHexColor(value: string): RgbColor | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  const hex = match?.[1];
  if (!hex) return null;
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)];
}
