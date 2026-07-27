'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminNotice, AdminPage } from '../_components/admin-ui';
import { useAdminSettingsForm } from './use-admin-settings-form';
import styles from './settings-professional.module.css';

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
          tag: group === 'icons' ? 'icon' : 'branding',
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
      setMessage(`อัปโหลด ${field.label} แล้ว ตรวจตัวอย่างและกดบันทึกเพื่อใช้งาน`);
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
    setMessage(`ปิดใช้งาน ${field.label} แล้ว กดบันทึกเพื่อยืนยัน`);
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
    setMessage(`คืนค่า ${field.label} แล้ว กดบันทึกเพื่อยืนยัน`);
  }

  const busy = saving || uploadingKey !== null;
  const configuredCount = fields.filter((field) => hasConfiguredValue(form[field.key])).length;

  return (
    <AdminPage
      eyebrow="การตั้งค่าระบบ"
      title={title}
      description={description}
      actions={<a href="/settings">← กลับหน้าการตั้งค่า</a>}
    >
      <div className={styles.page}>
        <section className={styles.contextBar} aria-label="สถานะการตั้งค่า">
          <div className={styles.contextCopy}>
            <strong>{humanizeGroup(group)}</strong>
            <span>แก้ไข ตรวจตัวอย่าง และบันทึกจากพื้นที่เดียว โดยค่าจะมีผลหลังบันทึกสำเร็จ</span>
          </div>
          <div className={styles.contextMeta}>
            <span className={styles.pill}>{configuredCount}/{fields.length} ค่า</span>
            <span className={styles.pill} data-tone={isDirty ? 'warning' : 'success'}>{isDirty ? 'ยังไม่บันทึก' : 'ข้อมูลล่าสุด'}</span>
            {uploadingKey && <span className={styles.pill} data-tone="warning">กำลังอัปโหลด</span>}
          </div>
        </section>

        {message && <AdminNotice>{message}</AdminNotice>}

        <div className={styles.layout}>
          <section className={styles.editor}>
            <header className={styles.editorHeader}>
              <div>
                <h2>ค่าการทำงาน</h2>
                <p>ข้อมูลถูกจัดเป็นฟอร์มมาตรฐานเดียวกัน รองรับข้อความ สวิตช์ สี วันที่ และไฟล์ภาพ</p>
              </div>
              <span className={styles.pill}>{fields.length} ช่อง</span>
            </header>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.fieldGrid}>
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
              </div>

              <footer className={styles.actionBar}>
                <div className={styles.actionCopy}>
                  <strong>{isDirty ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'ค่าปัจจุบันตรงกับระบบ'}</strong>
                  <span>{busy ? 'กำลังดำเนินการ กรุณารอสักครู่' : 'ตรวจ Preview ก่อนบันทึก โดยเฉพาะค่าที่มีผลต่อสมาชิก'}</span>
                </div>
                <div className={styles.actionButtons}>
                  <AdminButton type="button" tone="secondary" disabled={!isDirty || busy} onClick={reset}>ยกเลิกการแก้ไข</AdminButton>
                  <AdminButton type="submit" disabled={busy}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</AdminButton>
                </div>
              </footer>
            </form>
          </section>

          <aside className={styles.previewPanel}>
            <header className={styles.previewHeader}>
              <div>
                <h2>ตัวอย่างก่อนเผยแพร่</h2>
                <p>แสดงผลจากค่าที่กำลังแก้ไข ยังไม่กระทบผู้ใช้จนกว่าจะบันทึก</p>
              </div>
            </header>
            <div className={styles.previewBody}>
              <Preview type={preview} form={form} title={title} />
            </div>
          </aside>
        </div>
      </div>
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
  if (type === 'checkbox') {
    return (
      <label className={styles.switchField}>
        <span className={styles.switchCopy}>
          <strong>{field.label}</strong>
          <span>{field.placeholder || 'เปิดหรือปิดการทำงานของตัวเลือกนี้'}</span>
        </span>
        <input className={styles.switchInput} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }

  if (field.asset) {
    const displayValue = String(value ?? '').trim();
    return (
      <div className={styles.assetField}>
        <div className={styles.assetEditor}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}<small>URL หรือไฟล์อัปโหลด</small></span>
            <input type="text" value={displayValue} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
          </label>
          <div className={styles.assetActions}>
            <label className={styles.uploadButton}>
              {uploading ? 'กำลังอัปโหลด...' : displayValue ? 'เปลี่ยนไฟล์' : 'อัปโหลดไฟล์'}
              <input className={styles.hiddenInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => handleFileChange(event, onUpload)} />
            </label>
            <AdminButton type="button" tone="secondary" disabled={uploading || !displayValue} onClick={onDisable}>ปิดใช้งาน</AdminButton>
            <AdminButton type="button" tone="secondary" disabled={uploading} onClick={onRestore}>คืนค่าเดิม</AdminButton>
          </div>
          <p className={styles.help}>JPEG, PNG, WebP หรือ GIF ไม่เกิน 8 MB การเปลี่ยนแปลงมีผลหลังบันทึก</p>
        </div>
        <div className={styles.assetPreview}>
          {isPreviewImage(displayValue)
            ? <Image unoptimized src={displayValue} alt={`ตัวอย่าง ${field.label}`} width={220} height={112} />
            : <span>ยังไม่มีรูปสำหรับตัวเลือกนี้</span>}
        </div>
      </div>
    );
  }

  const full = type === 'textarea' || field.key.includes('description') || field.key.includes('message') || field.key.includes('script') || field.key.includes('terms') || field.key.includes('privacy') || field.key.includes('cookie');
  return (
    <label className={styles.field} data-span={full ? 'full' : 'normal'}>
      <span className={styles.fieldLabel}>{field.label}<small>{humanizeKey(field.key)}</small></span>
      {type === 'textarea'
        ? <textarea value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
        : <input type={type} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />}
      {field.placeholder && <p className={styles.help}>{field.placeholder}</p>}
    </label>
  );
}

function Preview({ type, form, title }: { type: string; form: SettingsRecord; title: string }) {
  if (type === 'branding') {
    const primary = String(form.primary_color ?? '#f5c542');
    const bg = String(form.background_color ?? '#080808');
    const card = String(form.card_color ?? '#181818');
    const text = String(form.text_color ?? '#ffffff');
    const logo = String(form.logo_url ?? '').trim();
    const contrastWarnings = buildContrastWarnings({ primary, bg, card, text });
    return (
      <div className={styles.previewFrame} style={{ background: bg, color: text }}>
        {isPreviewImage(logo) ? <Image unoptimized src={logo} alt="ตัวอย่างโลโก้" width={220} height={88} /> : <strong>โลโก้เว็บไซต์</strong>}
        {contrastWarnings.length > 0 && <div className={styles.warning}>{contrastWarnings.join(' • ')}</div>}
        <section className={styles.previewSection} style={{ background: card, padding: 12, borderRadius: 10 }}>
          <small>กระเป๋าเงิน</small>
          <h3>฿12,450.00</h3>
          <div><button style={{ background: primary, color: readableTextColor(primary), border: 0, borderRadius: 8, padding: '7px 12px' }}>ฝากเงิน</button></div>
        </section>
      </div>
    );
  }

  if (type === 'icons') {
    return (
      <div className={styles.iconGrid}>
        {Object.entries(form).filter(([key]) => !key.includes('__asset_')).map(([key, value]) => {
          const displayValue = String(value ?? '').trim();
          return (
            <div className={styles.iconItem} key={key}>
              {isPreviewImage(displayValue) ? <Image unoptimized src={displayValue} alt="" width={46} height={46} /> : <strong>{displayValue || '–'}</strong>}
              <small>{humanizeIconKey(key)}</small>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'maintenance') {
    return (
      <div className={styles.previewFrame}>
        <h3>{form.enabled ? 'ระบบอยู่ในโหมดปิดปรับปรุง' : 'ระบบเปิดใช้งานตามปกติ'}</h3>
        <p>{String(form.message ?? 'ระบบกำลังปรับปรุง')}</p>
        <section className={styles.previewSection}><small>บริการ</small><p>ฝาก: {form.deposit_enabled ? 'ปิด' : 'เปิด'} · ถอน: {form.withdraw_enabled ? 'ปิด' : 'เปิด'}</p></section>
      </div>
    );
  }

  if (type === 'legal') {
    return (
      <div className={styles.previewFrame}>
        <h3>{title}</h3>
        <p>เวอร์ชัน {String(form.version || 'ยังไม่ระบุ')} · มีผล {String(form.effective_date || 'ยังไม่ระบุ')}</p>
        {['terms', 'privacy', 'cookie'].map((key) => <section className={styles.previewSection} key={key}><small>{key}</small><p>{String(form[key] || 'ยังไม่มีเนื้อหา').slice(0, 320)}</p></section>)}
      </div>
    );
  }

  return (
    <div className={styles.previewFrame}>
      <h3>{title}</h3>
      {Object.entries(form).filter(([key]) => !key.includes('__asset_')).slice(0, 10).map(([key, value]) => (
        <section className={styles.previewSection} key={key}>
          <small>{humanizeKey(key)}</small>
          <p>{typeof value === 'boolean' ? (value ? 'เปิดใช้งาน' : 'ปิดใช้งาน') : String(value || 'ยังไม่กำหนด')}</p>
        </section>
      ))}
    </div>
  );
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
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function hasConfiguredValue(value: SettingsValue | undefined) {
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim().length > 0;
}

function humanizeGroup(group: string) {
  const labels: Record<string, string> = {
    branding: 'แบรนด์และภาพลักษณ์',
    icons: 'ไอคอนและเมนู',
    theme: 'ธีมและการแสดงผล',
    seo: 'การค้นหาและการแชร์',
    contact: 'ช่องทางติดต่อ',
    maintenance: 'โหมดปิดปรับปรุง',
    scripts: 'สคริปต์ติดตามผล',
    features: 'การเปิดปิดฟีเจอร์',
    legal: 'เอกสารทางกฎหมาย',
  };
  return labels[group] ?? humanizeKey(group);
}

function humanizeKey(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

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
  if (contrastRatio(colors.text, colors.bg) < 4.5) warnings.push('ข้อความกับพื้นหลังมี Contrast ต่ำกว่า WCAG AA');
  if (contrastRatio(colors.text, colors.card) < 4.5) warnings.push('ข้อความกับการ์ดมี Contrast ต่ำกว่า WCAG AA');
  if (contrastRatio(readableTextColor(colors.primary), colors.primary) < 4.5) warnings.push('สีปุ่มมี Contrast ต่ำกว่า WCAG AA');
  return warnings;
}

function readableTextColor(background: string) {
  return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background) ? '#000000' : '#ffffff';
}

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
