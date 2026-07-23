'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { useAdminSettingsForm } from './use-admin-settings-form';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'color' | 'date';
type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  asset?: boolean;
  defaultValue?: string;
};
type SettingsValue = string | boolean | number | null;
type SettingsRecord = Record<string, SettingsValue>;
type Props = {
  group: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  preview?: 'branding' | 'theme' | 'maintenance' | 'legal' | 'icons' | 'default';
  defaults?: SettingsRecord;
};
type RgbColor = readonly [red: number, green: number, blue: number];
type UploadedAsset = {
  url?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
};

const EMPTY_DEFAULTS: SettingsRecord = {};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default function SettingsSectionPage({ group, title, description, fields, preview = 'default', defaults }: Props) {
  const resolvedDefaults = defaults ?? EMPTY_DEFAULTS;
  const {
    form,
    message,
    saving,
    isDirty,
    setForm,
    setMessage,
    save,
    reset,
    update,
  } = useAdminSettingsForm<SettingsRecord>({
    endpoint: `/admin/settings/${group}`,
    defaults: resolvedDefaults,
    loadingMessage: 'กำลังโหลดการตั้งค่า...',
  });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  async function uploadAsset(field: FieldConfig, file: File) {
    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setUploadingKey(field.key);
    setMessage(`กำลังอัปโหลด ${field.label}...`);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'POST',
        body: JSON.stringify({
          name: `${field.label} (${file.name})`,
          tag: 'branding',
          type: 'image',
          dataUrl,
        }),
      });
      const data = await res.json().catch(() => null) as UploadedAsset | null;
      if (!res.ok || !data?.url) {
        setMessage((data as { message?: string } | null)?.message ?? `อัปโหลด ${field.label} ไม่สำเร็จ (${res.status})`);
        return;
      }

      setForm((current) => ({
        ...current,
        [field.key]: data.url ?? '',
        [assetMetaKey(field.key, 'url')]: data.url ?? '',
        [assetMetaKey(field.key, 'storage_key')]: data.storageKey ?? '',
        [assetMetaKey(field.key, 'mime_type')]: data.mimeType ?? file.type,
        [assetMetaKey(field.key, 'size_bytes')]: data.sizeBytes ?? file.size,
        [assetMetaKey(field.key, 'sha256')]: data.sha256 ?? '',
        [assetMetaKey(field.key, 'disabled_url')]: '',
      }));
      setMessage(`อัปโหลด ${field.label} แล้ว กด Save Changes เพื่อบันทึกการใช้งาน`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `อัปโหลด ${field.label} ไม่สำเร็จ`);
    } finally {
      setUploadingKey(null);
    }
  }

  function disableAsset(field: FieldConfig) {
    setForm((current) => {
      const currentUrl = String(current[field.key] ?? '').trim();
      return {
        ...current,
        [field.key]: '',
        [assetMetaKey(field.key, 'disabled_url')]: currentUrl || String(current[assetMetaKey(field.key, 'disabled_url')] ?? ''),
      };
    });
    setMessage(`ปิดใช้งาน ${field.label} แล้ว กด Save Changes เพื่อบันทึก`);
  }

  function restoreAsset(field: FieldConfig) {
    setForm((current) => {
      const restoredUrl = firstNonEmptyString(
        current[assetMetaKey(field.key, 'disabled_url')],
        current[assetMetaKey(field.key, 'url')],
        field.defaultValue,
        resolvedDefaults[field.key],
      );
      return { ...current, [field.key]: restoredUrl };
    });
    setMessage(`คืนค่า ${field.label} แล้ว กด Save Changes เพื่อบันทึก`);
  }

  const busy = saving || uploadingKey !== null;

  return (
    <AdminPage eyebrow="Settings" title={title} description={description} actions={<a href="/settings">← Settings</a>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {isDirty && <AdminNotice>มีการแก้ไขที่ยังไม่ได้บันทึก — กด Save Changes เพื่อบันทึก หรือ Reset เพื่อย้อนกลับค่าล่าสุดจากระบบ</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Configuration" description="แก้ค่าหลักของหมวดนี้ แล้วกด Save Changes">
          <form onSubmit={onSubmit}>
            <AdminToolbar>
              {fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  uploading={uploadingKey === field.key}
                  onChange={(value) => update(field.key, value)}
                  onUpload={(file) => void uploadAsset(field, file)}
                  onDisable={() => disableAsset(field)}
                  onRestore={() => restoreAsset(field)}
                />
              ))}
              <AdminButton type="submit" disabled={busy}>{saving ? 'กำลังบันทึก...' : 'Save Changes'}</AdminButton>
              <AdminButton type="button" tone="secondary" disabled={!isDirty || busy} onClick={reset}>Reset</AdminButton>
            </AdminToolbar>
          </form>
        </AdminCard>
        <AdminCard title="Preview" description="ตัวอย่างค่าที่กำลังตั้งอยู่"><Preview type={preview} form={form} title={title} /></AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

function FieldInput({ field, value, uploading, onChange, onUpload, onDisable, onRestore }: {
  field: FieldConfig;
  value: SettingsValue | undefined;
  uploading: boolean;
  onChange: (value: string | boolean) => void;
  onUpload: (file: File) => void;
  onDisable: () => void;
  onRestore: () => void;
}) {
  const type = field.type ?? 'text';
  if (type === 'checkbox') return <label style={checkboxStyle}><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> {field.label}</label>;
  if (type === 'textarea') return <label style={labelStyle}>{field.label}<textarea value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
  if (field.asset) {
    const displayValue = String(value ?? '').trim();
    return (
      <div style={assetFieldStyle}>
        <label style={labelStyle}>{field.label}<input type="text" value={displayValue} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>
        {isPreviewImage(displayValue) && <Image unoptimized src={displayValue} alt="" width={180} height={72} style={assetPreviewStyle} />}
        <div style={assetActionsStyle}>
          <label style={uploadLabelStyle}>
            {uploading ? 'กำลังอัปโหลด...' : displayValue ? 'Replace' : 'Upload'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => handleFileChange(event, onUpload)} style={hiddenInputStyle} />
          </label>
          <AdminButton type="button" tone="secondary" disabled={uploading || !displayValue} onClick={onDisable}>Disable</AdminButton>
          <AdminButton type="button" tone="secondary" disabled={uploading} onClick={onRestore}>Restore</AdminButton>
        </div>
        <small style={assetHelpStyle}>JPEG, PNG, WebP หรือ GIF ไม่เกิน 8 MB · การเปลี่ยนแปลงจะมีผลหลัง Save Changes</small>
      </div>
    );
  }
  return <label style={labelStyle}>{field.label}<input type={type} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Preview({ type, form, title }: { type: string; form: SettingsRecord; title: string }) {
  if (type === 'branding') {
    const primary = String(form.primary_color ?? '#f5c542');
    const bg = String(form.background_color ?? '#080808');
    const card = String(form.card_color ?? '#181818');
    const text = String(form.text_color ?? '#ffffff');
    const logo = String(form.logo_url ?? '').trim();
    const contrastWarnings = buildContrastWarnings({ primary, bg, card, text });
    return <div style={{ background: bg, color: text, borderRadius: 16, padding: 16, overflowWrap: 'anywhere' }}>{isPreviewImage(logo) ? <Image unoptimized src={logo} alt="Brand logo preview" width={220} height={88} style={brandingLogoStyle} /> : <strong>Logo</strong>}{contrastWarnings.length > 0 && <div style={contrastWarningStyle}>{contrastWarnings.join(' • ')}</div>}<div style={{ background: card, borderRadius: 14, padding: 14, marginTop: 12 }}><p>Balance Card</p><button style={{ background: primary, color: readableTextColor(primary), border: 0, borderRadius: 10, padding: '8px 14px' }}>ฝากเงิน</button>{' '}<button style={{ borderRadius: 10, padding: '8px 14px' }}>ถอนเงิน</button></div></div>;
  }
  if (type === 'icons') {
    return <div style={iconPreviewGridStyle}>{Object.entries(form).map(([key, value]) => {
      const displayValue = String(value ?? '').trim();
      return <div key={key} style={iconPreviewItemStyle}><span style={iconPreviewImageStyle}>{isPreviewImage(displayValue) ? <Image unoptimized src={displayValue} alt="" width={52} height={52} style={iconImageStyle} /> : <strong>{displayValue || '–'}</strong>}</span><small style={iconPreviewLabelStyle}>{humanizeIconKey(key)}</small></div>;
    })}</div>;
  }
  if (type === 'maintenance') return <div style={previewBoxStyle}><p>Maintenance: {form.enabled ? 'ON' : 'OFF'}</p><p>Message: {form.message ?? 'ระบบกำลังปรับปรุง'}</p><p>Deposit: {form.deposit_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p><p>Withdraw: {form.withdraw_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p></div>;
  if (type === 'legal') return <div style={previewBoxStyle}><strong>{title}</strong><p>Version: {form.version || 'ยังไม่ระบุ'}</p><p>Effective date: {form.effective_date || 'ยังไม่ระบุ'}</p><AdminStack>{['terms', 'privacy', 'cookie'].map((key) => <section key={key} style={legalPreviewSectionStyle}><strong>{key}</strong><p>{String(form[key] || 'ยังไม่มีเนื้อหา').slice(0, 420)}</p></section>)}</AdminStack></div>;
  return <div style={previewBoxStyle}><strong>{title}</strong><AdminStack>{Object.entries(form).slice(0, 8).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}</AdminStack></div>;
}

function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return 'รองรับเฉพาะ JPEG, PNG, WebP และ GIF';
  if (file.size <= 0) return 'ไฟล์ว่าง ไม่สามารถอัปโหลดได้';
  if (file.size > MAX_IMAGE_BYTES) return 'ไฟล์ใหญ่เกิน 8 MB';
  return '';
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onerror = () => reject(reader.error ?? new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function handleFileChange(event: ChangeEvent<HTMLInputElement>, onUpload: (file: File) => void) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (file) onUpload(file);
}

function assetMetaKey(fieldKey: string, suffix: string) {
  return `${fieldKey}__asset_${suffix}`;
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, fontWeight: 800 } as const;
const previewBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16, background: 'rgba(148,163,184,.06)', overflowWrap: 'anywhere' as const } as const;
const legalPreviewSectionStyle = { borderTop: '1px solid rgba(148,163,184,.16)', paddingTop: 12 } as const;
const contrastWarningStyle = { marginTop: 10, padding: 10, border: '1px solid rgba(248,113,113,.45)', borderRadius: 12, background: 'rgba(127,29,29,.42)', color: '#fee2e2', fontWeight: 800 } as const;
const iconPreviewGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))', gap: 12 } as const;
const iconPreviewItemStyle = { display: 'grid', justifyItems: 'center', gap: 8, minWidth: 0, padding: 12, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, background: 'rgba(148,163,184,.06)' } as const;
const iconPreviewImageStyle = { display: 'grid', placeItems: 'center', width: 52, height: 52 } as const;
const iconImageStyle = { display: 'block', width: '100%', height: '100%', objectFit: 'contain' as const } as const;
const iconPreviewLabelStyle = { maxWidth: '100%', overflowWrap: 'anywhere' as const, textAlign: 'center' as const, opacity: 0.82 } as const;
const assetFieldStyle = { display: 'grid', gap: 10, padding: 12, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, background: 'rgba(148,163,184,.04)' } as const;
const assetActionsStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center' } as const;
const uploadLabelStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '0 14px', borderRadius: 10, background: 'rgba(245,197,66,.16)', border: '1px solid rgba(245,197,66,.4)', fontWeight: 800, cursor: 'pointer' } as const;
const hiddenInputStyle = { display: 'none' } as const;
const assetHelpStyle = { opacity: 0.72, lineHeight: 1.5 } as const;
const assetPreviewStyle = { display: 'block', width: '100%', maxWidth: 240, height: 88, objectFit: 'contain' as const, borderRadius: 10, background: 'rgba(148,163,184,.08)' } as const;
const brandingLogoStyle = { display: 'block', width: 'auto', maxWidth: '100%', height: 88, objectFit: 'contain' as const } as const;

function isPreviewImage(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function humanizeIconKey(key: string) {
  return key.replace(/^game_category_/, '').replace(/_icon$/, '').replaceAll('_', ' ');
}

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
