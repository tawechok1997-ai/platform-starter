'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminNotice,
  AdminPage,
  AdminSkeleton,
} from '../_components/admin-ui';
import {
  AdminSaveStateBadge,
  AdminUnsavedChangesNotice,
} from '../_components/admin-unsaved-changes';
import { useAdminPermissions } from '../../../src/features/cms/use-admin-permissions';
import { useAdminSettingsForm } from './use-admin-settings-form';
import styles from './settings-professional.module.css';
import system from './settings-system-v2.module.css';

export type SettingsFieldType = 'text' | 'textarea' | 'checkbox' | 'color' | 'date' | 'number' | 'select' | 'url' | 'email';
export type SettingsFieldOption = { value: string; label: string };
export type SettingsFieldConfig = {
  key: string;
  label: string;
  type?: SettingsFieldType;
  placeholder?: string;
  helper?: string;
  section?: string;
  asset?: boolean;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: SettingsFieldOption[];
};

type SettingsValue = string | boolean | number | null;
type SettingsRecord = Record<string, SettingsValue>;
type PreviewType = 'branding' | 'theme' | 'maintenance' | 'legal' | 'icons' | 'seo' | 'contact' | 'features' | 'scripts' | 'default';
type RiskLevel = 'normal' | 'sensitive' | 'critical';
type Props = {
  group: string;
  title: string;
  description: string;
  fields: SettingsFieldConfig[];
  preview?: PreviewType;
  defaults?: SettingsRecord;
  risk?: RiskLevel;
  permissionBase?: string;
  historyHref?: string;
};
type RgbColor = readonly [red: number, green: number, blue: number];
type UploadedAsset = {
  url?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
};

type FieldGroup = {
  id: string;
  label: string;
  fields: SettingsFieldConfig[];
};

const EMPTY_DEFAULTS: SettingsRecord = {};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default function SettingsSectionPage({
  group,
  title,
  description,
  fields,
  preview = 'default',
  defaults,
  risk = 'normal',
  permissionBase,
  historyHref,
}: Props) {
  const resolvedDefaults = defaults ?? EMPTY_DEFAULTS;
  const permission = useAdminPermissions();
  const resolvedPermissionBase = permissionBase ?? `settings.${group}`;
  const canView = permission.can(`${resolvedPermissionBase}.view`);
  const canUpdate = permission.can(`${resolvedPermissionBase}.update`);
  const canUploadAssets = canUpdate && permission.can('settings.features.update');
  const canLoad = permission.ready && canView;
  const {
    form,
    initialForm,
    message,
    error,
    loading,
    saving,
    isDirty,
    saveState,
    lastSavedAt,
    setForm,
    setMessage,
    setError,
    load,
    save,
    reset,
    update,
  } = useAdminSettingsForm<SettingsRecord>({
    endpoint: `/admin/settings/${group}`,
    defaults: resolvedDefaults,
    loadingMessage: 'กำลังโหลดการตั้งค่า...',
    enabled: canLoad,
    canSave: canUpdate,
  });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  const fieldGroups = useMemo(() => groupFields(fields), [fields]);
  const validationErrors = useMemo(() => validateFields(fields, form), [fields, form]);
  const changedKeys = useMemo(() => fields
    .filter((field) => !sameValue(form[field.key], initialForm[field.key]))
    .map((field) => field.label), [fields, form, initialForm]);
  const configuredCount = fields.filter((field) => hasConfiguredValue(form[field.key])).length;
  const busy = saving || uploadingKey !== null;
  const auditHref = historyHref ?? `/audit?query=${encodeURIComponent(`settings.${group}`)}`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpdate) {
      setMessage('บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไขหรือบันทึก');
      return;
    }
    if (Object.keys(validationErrors).length > 0) {
      setError('ยังบันทึกไม่ได้ กรุณาแก้ช่องที่มีคำเตือน');
      focusFirstInvalidField(validationErrors);
      return;
    }
    if (risk !== 'normal') {
      setConfirmSave(true);
      return;
    }
    void save();
  }

  async function confirmAndSave() {
    setConfirmSave(false);
    await save();
  }

  async function uploadAsset(field: SettingsFieldConfig, file: File) {
    if (!canUploadAssets) {
      setMessage('บัญชีนี้แก้ URL ได้ แต่ไม่มีสิทธิ์อัปโหลดไฟล์ใหม่ (ต้องใช้ settings.features.update)');
      return;
    }
    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setUploadingKey(field.key);
    setError('');
    setMessage(`กำลังอัปโหลด ${field.label}...`);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'POST',
        body: JSON.stringify({
          name: `${field.label} (${file.name})`,
          tag: assetTag(group),
          type: 'image',
          dataUrl,
        }),
      });
      const data = await res.json().catch(() => null) as UploadedAsset | null;
      if (!res.ok || !data?.url) {
        const detail = data && typeof (data as { message?: unknown }).message === 'string'
          ? String((data as { message: string }).message)
          : `อัปโหลด ${field.label} ไม่สำเร็จ (${res.status})`;
        setError(detail);
        setMessage('');
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `อัปโหลด ${field.label} ไม่สำเร็จ`);
      setMessage('');
    } finally {
      setUploadingKey(null);
    }
  }

  function disableAsset(field: SettingsFieldConfig) {
    if (!canUpdate) return;
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

  function restoreAsset(field: SettingsFieldConfig) {
    if (!canUpdate) return;
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

  if (!permission.ready) {
    return <AdminPage eyebrow="การตั้งค่าระบบ" title={title} description={description}><AdminSkeleton lines={8} /></AdminPage>;
  }

  if (!canView) {
    return (
      <AdminPage eyebrow="การตั้งค่าระบบ" title={title} description={description} actions={<a href="/settings">← กลับหน้าการตั้งค่า</a>}>
        <AdminNotice tone="danger">บัญชีนี้ไม่มีสิทธิ์เปิดหน้าการตั้งค่านี้ ระบบปฏิเสธทั้งการอ่านและการแก้ไขแบบ fail-closed</AdminNotice>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="การตั้งค่าระบบ"
      title={title}
      description={description}
      actions={(
        <div className={system.topActions}>
          <AdminSaveStateBadge state={saveState} />
          <a href={auditHref}>ประวัติการเปลี่ยนแปลง</a>
          <a href="/settings">กลับหน้าการตั้งค่า</a>
        </div>
      )}
    >
      <div className={styles.page}>
        <nav className={system.breadcrumb} aria-label="Breadcrumb">
          <a href="/settings">การตั้งค่า</a><span>/</span><strong>{title}</strong>
        </nav>

        <section className={styles.contextBar} aria-label="สถานะการตั้งค่า">
          <div className={styles.contextCopy}>
            <strong>{humanizeGroup(group)}</strong>
            <span>แก้ไข ตรวจตัวอย่าง และบันทึกจากพื้นที่เดียว โดยค่าจะมีผลหลังบันทึกสำเร็จ</span>
          </div>
          <div className={styles.contextMeta}>
            <span className={styles.pill}>{configuredCount}/{fields.length} ค่า</span>
            <span className={styles.pill} data-tone={isDirty ? 'warning' : 'success'}>{isDirty ? `${changedKeys.length} รายการยังไม่บันทึก` : 'ข้อมูลล่าสุด'}</span>
            {!canUpdate && <span className={styles.pill} data-tone="warning">อ่านอย่างเดียว</span>}
            {uploadingKey && <span className={styles.pill} data-tone="warning">กำลังอัปโหลด</span>}
          </div>
        </section>

        {lastSavedAt && <p className={system.metaLine}>บันทึกล่าสุดในรอบนี้ {formatLocalTime(lastSavedAt)}</p>}
        {message && <AdminNotice tone={message.includes('คิวอนุมัติ') ? 'warning' : 'neutral'}>{message}</AdminNotice>}
        {error && <AdminNotice tone="danger">{error}</AdminNotice>}
        {!canUpdate && <AdminNotice tone="warning">โหมดอ่านอย่างเดียว ช่องกรอก การอัปโหลด และปุ่มบันทึกถูกปิดตามสิทธิ์ Backend ยังตรวจ permission ซ้ำทุกคำขอ</AdminNotice>}
        {canUpdate && fields.some((field) => field.asset) && !canUploadAssets && <AdminNotice tone="warning">บัญชีนี้แก้ URL รูปได้ แต่ปุ่มอัปโหลดไฟล์ถูกซ่อน เพราะ Asset Library ต้องใช้สิทธิ์ settings.features.update</AdminNotice>}
        <AdminUnsavedChangesNotice isDirty={isDirty}>มีการแก้ไขที่ยังไม่ได้บันทึก ออกจากหน้านี้อาจทำให้ข้อมูลหาย</AdminUnsavedChangesNotice>

        {loading ? <AdminSkeleton lines={10} /> : error && !hasLoadedSettings(initialForm, resolvedDefaults) ? (
          <section className={system.emptyState}>
            <strong>โหลดข้อมูลไม่สำเร็จ</strong>
            <p>ยังไม่แสดงฟอร์มเพื่อป้องกันการบันทึกทับค่าจริงด้วยข้อมูลว่าง</p>
            <AdminButton type="button" onClick={() => void load()}>ลองโหลดใหม่</AdminButton>
          </section>
        ) : fields.length === 0 ? (
          <section className={system.emptyState}><strong>ยังไม่มีฟิลด์สำหรับกลุ่มนี้</strong><p>ตรวจ contract ระหว่าง Admin และ Backend ก่อนเพิ่มข้อมูล</p></section>
        ) : (
          <>
            <nav className={system.sectionNav} aria-label="หัวข้อในหน้านี้">
              {fieldGroups.map((fieldGroup) => <a key={fieldGroup.id} href={`#${fieldGroup.id}`}>{fieldGroup.label}<span>{fieldGroup.fields.length}</span></a>)}
            </nav>

            <div className={styles.layout}>
              <section className={styles.editor}>
                <header className={styles.editorHeader}>
                  <div>
                    <h2>ค่าการทำงาน</h2>
                    <p>แบ่งตามหัวข้อ พร้อม validation และสิทธิ์ระดับ action ก่อนส่งข้อมูลไป Backend</p>
                  </div>
                  <span className={styles.pill}>{fields.length} ช่อง</span>
                </header>

                <form className={styles.form} onSubmit={onSubmit} noValidate>
                  {fieldGroups.map((fieldGroup) => (
                    <section className={system.fieldSection} id={fieldGroup.id} key={fieldGroup.id}>
                      <header className={system.sectionHeader}>
                        <div><h3>{fieldGroup.label}</h3><p>{sectionDescription(group, fieldGroup.label)}</p></div>
                        <span>{fieldGroup.fields.length} ช่อง</span>
                      </header>
                      <div className={styles.fieldGrid}>
                        {fieldGroup.fields.map((field) => (
                          <FieldInput
                            key={field.key}
                            field={field}
                            value={form[field.key]}
                            uploading={uploadingKey === field.key}
                            disabled={!canUpdate || busy}
                            canUpload={canUploadAssets}
                            error={validationErrors[field.key]}
                            onChange={(value) => update(field.key, value)}
                            onUpload={(file) => void uploadAsset(field, file)}
                            onDisable={() => disableAsset(field)}
                            onRestore={() => restoreAsset(field)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                  <footer className={styles.actionBar}>
                    <div className={styles.actionCopy}>
                      <strong>{isDirty ? `มี ${changedKeys.length} รายการที่ยังไม่บันทึก` : 'ค่าปัจจุบันตรงกับระบบ'}</strong>
                      <span>{busy ? 'กำลังดำเนินการ กรุณารอสักครู่' : riskCopy(risk)}</span>
                    </div>
                    {canUpdate && <div className={styles.actionButtons}>
                      <AdminButton type="button" tone="secondary" disabled={!isDirty || busy} onClick={reset}>ยกเลิกการแก้ไข</AdminButton>
                      <AdminButton type="submit" disabled={busy || !isDirty || Object.keys(validationErrors).length > 0}>{saving ? 'กำลังบันทึก...' : risk === 'normal' ? 'บันทึกการตั้งค่า' : 'ตรวจสอบและบันทึก'}</AdminButton>
                    </div>}
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
          </>
        )}
      </div>

      <AdminConfirmDialog
        open={confirmSave}
        title={risk === 'critical' ? 'ยืนยันการเปลี่ยนแปลงความเสี่ยงสูง' : 'ยืนยันการเปลี่ยนแปลงสำคัญ'}
        description={`กำลังบันทึก ${changedKeys.length} รายการใน ${title}`}
        confirmLabel={risk === 'critical' ? 'ยืนยันและบันทึก' : 'บันทึกการเปลี่ยนแปลง'}
        tone={risk === 'critical' ? 'danger' : 'primary'}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => void confirmAndSave()}
        details={(
          <div className={system.riskSummary}>
            <p>{riskCopy(risk)}</p>
            <ul>{changedKeys.slice(0, 12).map((label) => <li key={label}>{label}</li>)}</ul>
            {changedKeys.length > 12 && <p>และอีก {changedKeys.length - 12} รายการ</p>}
          </div>
        )}
      />
    </AdminPage>
  );
}

function FieldInput({ field, value, uploading, disabled, canUpload, error, onChange, onUpload, onDisable, onRestore }: {
  field: SettingsFieldConfig;
  value: SettingsValue | undefined;
  uploading: boolean;
  disabled: boolean;
  canUpload: boolean;
  error: string | undefined;
  onChange: (value: string | boolean | number) => void;
  onUpload: (file: File) => void;
  onDisable: () => void;
  onRestore: () => void;
}) {
  const type = field.type ?? 'text';
  const helper = field.helper || field.placeholder || humanizeKey(field.key);
  if (type === 'checkbox') {
    return (
      <label className={styles.switchField} data-error={error ? 'true' : 'false'}>
        <span className={styles.switchCopy}>
          <strong>{field.label}{field.required ? ' *' : ''}</strong>
          <span>{helper || 'เปิดหรือปิดการทำงานของตัวเลือกนี้'}</span>
          {error && <em className={system.validationError}>{error}</em>}
        </span>
        <input className={styles.switchInput} type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }

  if (field.asset) {
    const displayValue = String(value ?? '').trim();
    return (
      <div className={styles.assetField} data-error={error ? 'true' : 'false'}>
        <div className={styles.assetEditor}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}{field.required ? ' *' : ''}<small>URL หรือไฟล์อัปโหลด</small></span>
            <input id={`setting-${field.key}`} type="url" value={displayValue} disabled={disabled} placeholder={field.placeholder} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
          </label>
          {!disabled && <div className={styles.assetActions}>
            {canUpload && <label className={styles.uploadButton}>
              {uploading ? 'กำลังอัปโหลด...' : displayValue ? 'เปลี่ยนไฟล์' : 'อัปโหลดไฟล์'}
              <input className={styles.hiddenInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => handleFileChange(event, onUpload)} />
            </label>}
            <AdminButton type="button" tone="secondary" disabled={uploading || !displayValue} onClick={onDisable}>ปิดใช้งาน</AdminButton>
            <AdminButton type="button" tone="secondary" disabled={uploading} onClick={onRestore}>คืนค่าเดิม</AdminButton>
          </div>}
          <p className={styles.help}>{helper || 'JPEG, PNG, WebP หรือ GIF ไม่เกิน 8 MB การเปลี่ยนแปลงมีผลหลังบันทึก'}</p>
          {error && <p className={system.validationError}>{error}</p>}
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
    <label className={styles.field} data-span={full ? 'full' : 'normal'} data-error={error ? 'true' : 'false'} htmlFor={`setting-${field.key}`}>
      <span className={styles.fieldLabel}>{field.label}{field.required ? ' *' : ''}<small>{humanizeKey(field.key)}</small></span>
      {type === 'textarea' ? (
        <textarea id={`setting-${field.key}`} value={String(value ?? '')} disabled={disabled} maxLength={field.maxLength} placeholder={field.placeholder} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      ) : type === 'select' ? (
        <select id={`setting-${field.key}`} value={String(value ?? '')} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)}>
          <option value="">เลือกค่า</option>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          id={`setting-${field.key}`}
          type={type}
          value={String(value ?? '')}
          disabled={disabled}
          min={field.min}
          max={field.max}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
        />
      )}
      {helper && <p className={styles.help}>{helper}</p>}
      {error && <p className={system.validationError}>{error}</p>}
    </label>
  );
}

function Preview({ type, form, title }: { type: PreviewType; form: SettingsRecord; title: string }) {
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
          <small>กระเป๋าเงิน</small><h3>฿12,450.00</h3>
          <div><button type="button" style={{ background: primary, color: readableTextColor(primary), border: 0, borderRadius: 8, padding: '7px 12px' }}>ฝากเงิน</button></div>
        </section>
      </div>
    );
  }

  if (type === 'icons') {
    return (
      <div className={styles.iconGrid}>
        {Object.entries(form).filter(([key]) => !key.includes('__asset_')).map(([key, value]) => {
          const displayValue = String(value ?? '').trim();
          return <div className={styles.iconItem} key={key}>{isPreviewImage(displayValue) ? <Image unoptimized src={displayValue} alt="" width={46} height={46} /> : <strong>{displayValue || '–'}</strong>}<small>{humanizeIconKey(key)}</small></div>;
        })}
      </div>
    );
  }

  if (type === 'theme') {
    const primary = '#f5c542';
    const columns = clampNumber(form.game_grid_columns, 2, 8, 4);
    return (
      <div className={system.themePreview}>
        <header><strong>Member Lobby</strong>{form.show_balance_header !== false && <span>฿12,450</span>}</header>
        {form.hero_banner_enabled !== false && <div className={system.themeHero}>Hero banner</div>}
        <div className={system.themeGrid} style={{ gridTemplateColumns: `repeat(${Math.min(columns, 5)}, minmax(0, 1fr))` }}>
          {Array.from({ length: Math.min(columns * 2, 10) }, (_, index) => <span key={index} style={{ borderColor: index === 0 ? primary : undefined }}>เกม {index + 1}</span>)}
        </div>
        <footer>{form.bottom_navigation_enabled ? 'Bottom navigation เปิด' : 'Bottom navigation ปิด'} · Animation {String(form.animation_level || 'subtle')}</footer>
      </div>
    );
  }

  if (type === 'seo') {
    const image = String(form.og_image ?? '').trim();
    return (
      <div className={system.seoPreview}>
        <section><small>ตัวอย่างผลการค้นหา</small><h3>{String(form.default_title || 'ชื่อเว็บไซต์')}</h3><a>{String(form.canonical_url || 'https://example.com')}</a><p>{String(form.default_description || 'คำอธิบายเว็บไซต์จะแสดงตรงนี้').slice(0, 180)}</p></section>
        <section className={system.socialCard}>{isPreviewImage(image) ? <Image unoptimized src={image} alt="OG preview" width={420} height={220} /> : <div>OG IMAGE</div>}<strong>{String(form.og_title || form.default_title || 'ชื่อเวลาแชร์')}</strong><p>{String(form.og_description || form.default_description || 'คำอธิบายเวลาแชร์').slice(0, 140)}</p></section>
      </div>
    );
  }

  if (type === 'contact') {
    return <div className={system.contactPreview}><strong>{String(form.company_name || 'ศูนย์บริการสมาชิก')}</strong><p>{String(form.support_hours || 'ให้บริการตลอด 24 ชั่วโมง')}</p>{[['LINE', form.line_oa], ['Telegram', form.telegram], ['Email', form.email], ['Phone', form.phone]].map(([label, value]) => <section key={String(label)}><small>{String(label)}</small><span>{String(value || 'ยังไม่กำหนด')}</span></section>)}</div>;
  }

  if (type === 'features') {
    const flags = Object.entries(form).filter(([, value]) => typeof value === 'boolean');
    const enabled = flags.filter(([, value]) => value).length;
    return <div className={system.featurePreview}><header><strong>Feature rollout</strong><span>{enabled}/{flags.length} เปิด</span></header>{flags.map(([key, value]) => <div key={key} data-enabled={value ? 'true' : 'false'}><span>{humanizeKey(key)}</span><b>{value ? 'เปิด' : 'ปิด'}</b></div>)}</div>;
  }

  if (type === 'scripts') {
    return <div className={system.scriptPreview}><strong>Tracking & custom code</strong><p>Preview นี้ไม่ execute script และแสดงเฉพาะสถานะเพื่อความปลอดภัย</p>{Object.entries(form).filter(([key]) => !key.includes('__asset_')).map(([key, value]) => <section key={key}><small>{humanizeKey(key)}</small><span>{String(value || '').trim() ? key.includes('script') ? `${String(value).length} ตัวอักษร` : 'ตั้งค่าแล้ว' : 'ยังไม่ตั้งค่า'}</span></section>)}</div>;
  }

  if (type === 'maintenance') {
    return <div className={styles.previewFrame}><h3>{form.enabled ? 'ระบบอยู่ในโหมดปิดปรับปรุง' : 'ระบบเปิดใช้งานตามปกติ'}</h3><p>{String(form.message ?? 'ระบบกำลังปรับปรุง')}</p><section className={styles.previewSection}><small>บริการ</small><p>ฝาก: {form.deposit_enabled ? 'ปิด' : 'เปิด'} · ถอน: {form.withdraw_enabled ? 'ปิด' : 'เปิด'}</p></section></div>;
  }

  if (type === 'legal') {
    return <div className={styles.previewFrame}><h3>{title}</h3><p>เวอร์ชัน {String(form.version || 'ยังไม่ระบุ')} · มีผล {String(form.effective_date || 'ยังไม่ระบุ')}</p>{['terms', 'privacy', 'cookie'].map((key) => <section className={styles.previewSection} key={key}><small>{humanizeKey(key)}</small><p>{String(form[key] || 'ยังไม่มีเนื้อหา').slice(0, 320)}</p></section>)}</div>;
  }

  return <div className={styles.previewFrame}><h3>{title}</h3>{Object.entries(form).filter(([key]) => !key.includes('__asset_')).slice(0, 12).map(([key, value]) => <section className={styles.previewSection} key={key}><small>{humanizeKey(key)}</small><p>{typeof value === 'boolean' ? (value ? 'เปิดใช้งาน' : 'ปิดใช้งาน') : String(value || 'ยังไม่กำหนด')}</p></section>)}</div>;
}

function validateFields(fields: SettingsFieldConfig[], form: SettingsRecord) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = form[field.key];
    const text = typeof value === 'string' ? value.trim() : '';
    if (field.required && !hasConfiguredValue(value)) errors[field.key] = 'จำเป็นต้องระบุค่า';
    if (!text) continue;
    if ((field.type === 'url' || field.asset) && !isSafeSettingUrl(text)) errors[field.key] = 'ใช้ URL แบบ https:// หรือ path ภายในที่ขึ้นต้นด้วย / เท่านั้น';
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors[field.key] = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (field.maxLength && text.length > field.maxLength) errors[field.key] = `ยาวเกิน ${field.maxLength.toLocaleString('th-TH')} ตัวอักษร`;
    if (field.type === 'number') {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) errors[field.key] = 'ต้องเป็นตัวเลข';
      else if (field.min !== undefined && numeric < field.min) errors[field.key] = `ต้องไม่น้อยกว่า ${field.min}`;
      else if (field.max !== undefined && numeric > field.max) errors[field.key] = `ต้องไม่เกิน ${field.max}`;
    }
    if (field.type === 'select' && field.options?.length && !field.options.some((option) => option.value === text)) errors[field.key] = 'กรุณาเลือกค่าจากรายการ';
  }
  return errors;
}

function groupFields(fields: SettingsFieldConfig[]): FieldGroup[] {
  const groups = new Map<string, SettingsFieldConfig[]>();
  for (const field of fields) {
    const label = field.section?.trim() || 'การตั้งค่าหลัก';
    groups.set(label, [...(groups.get(label) ?? []), field]);
  }
  return [...groups.entries()].map(([label, groupedFields], index) => ({ id: `settings-section-${index + 1}-${slug(label)}`, label, fields: groupedFields }));
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

function assetMetaKey(fieldKey: string, suffix: string) { return `${fieldKey}__asset_${suffix}`; }
function assetTag(group: string) { return group === 'icons' ? 'icon' : group === 'seo' ? 'seo' : 'branding'; }
function firstNonEmptyString(...values: unknown[]) { for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim(); return ''; }
function hasConfiguredValue(value: SettingsValue | undefined) { return typeof value === 'boolean' ? true : typeof value === 'number' ? Number.isFinite(value) : typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined; }
function sameValue(left: SettingsValue | undefined, right: SettingsValue | undefined) { return JSON.stringify(left ?? null) === JSON.stringify(right ?? null); }
function hasLoadedSettings(initial: SettingsRecord, defaults: SettingsRecord) { return Object.keys(initial).some((key) => !sameValue(initial[key], defaults[key])); }
function isPreviewImage(value: string) { return value.startsWith('/') || /^https:\/\//i.test(value) || /^data:image\//i.test(value); }
function isSafeSettingUrl(value: string) { return value.startsWith('/') || /^https:\/\//i.test(value); }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '') || 'main'; }
function clampNumber(value: unknown, min: number, max: number, fallback: number) { const numeric = Number(value); return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.trunc(numeric))) : fallback; }
function formatLocalTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
function focusFirstInvalidField(errors: Record<string, string>) { const key = Object.keys(errors)[0]; if (!key) return; window.requestAnimationFrame(() => document.getElementById(`setting-${key}`)?.focus()); }
function humanizeGroup(group: string) { return ({ website: 'General / Website', contact: 'General / Contact', seo: 'General / SEO', legal: 'General / Legal', branding: 'Brand & Experience / Branding', icons: 'Brand & Experience / Icons', theme: 'Brand & Experience / Theme', maintenance: 'Operations / Maintenance', features: 'Operations / Features', scripts: 'Advanced / Scripts' } as Record<string, string>)[group] ?? group; }
function humanizeKey(key: string) { return key.replace(/__asset_.+$/, '').replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
function humanizeIconKey(key: string) { return humanizeKey(key).replace('Game Category ', 'หมวดเกม: '); }
function sectionDescription(group: string, label: string) { return `ค่ากลุ่ม ${label} ของ ${humanizeGroup(group)} จะถูกตรวจสอบก่อนบันทึกและส่งไปยัง endpoint เดียวของหน้านี้`; }
function riskCopy(risk: RiskLevel) { return risk === 'critical' ? 'ค่าหน้านี้อาจ execute code หรือเปลี่ยนพฤติกรรมระบบ ต้องยืนยันก่อนบันทึกและควรตรวจ Audit หลังเปลี่ยน' : risk === 'sensitive' ? 'ค่าหน้านี้มีผลต่อการเปิดปิดบริการหรือเอกสารสำคัญ ระบบจะขอยืนยันก่อนบันทึก' : 'ตรวจ Preview และ validation ก่อนบันทึก โดยเฉพาะค่าที่มีผลต่อสมาชิก'; }

function buildContrastWarnings(colors: { primary: string; bg: string; card: string; text: string }) {
  const warnings: string[] = [];
  if (contrastRatio(colors.text, colors.bg) < 4.5) warnings.push('สีข้อความกับพื้นหลังมี contrast ต่ำ');
  if (contrastRatio(colors.text, colors.card) < 4.5) warnings.push('สีข้อความกับการ์ดมี contrast ต่ำ');
  if (contrastRatio(readableTextColor(colors.primary), colors.primary) < 4.5) warnings.push('สีปุ่มหลักอ่านยาก');
  return warnings;
}
function readableTextColor(background: string) { const rgb = parseHexColor(background); if (!rgb) return '#111111'; return relativeLuminance(rgb) > 0.45 ? '#111111' : '#ffffff'; }
function contrastRatio(left: string, right: string) { const leftRgb = parseHexColor(left); const rightRgb = parseHexColor(right); if (!leftRgb || !rightRgb) return 21; const lighter = Math.max(relativeLuminance(leftRgb), relativeLuminance(rightRgb)); const darker = Math.min(relativeLuminance(leftRgb), relativeLuminance(rightRgb)); return (lighter + 0.05) / (darker + 0.05); }
function parseHexColor(value: string): RgbColor | null { const normalized = value.trim().replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(normalized)) return null; return [Number.parseInt(normalized.slice(0, 2), 16), Number.parseInt(normalized.slice(2, 4), 16), Number.parseInt(normalized.slice(4, 6), 16)]; }
function relativeLuminance([red, green, blue]: RgbColor) { const channels = [red, green, blue].map((channel) => { const value = channel / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }); return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!; }
