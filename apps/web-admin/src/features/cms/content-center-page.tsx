'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import {
  AdminSaveStateBadge,
  AdminUnsavedChangesNotice,
  useAdminUnsavedChanges,
} from '../../../app/(admin)/_components/admin-unsaved-changes';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
} from '../../../app/(admin)/_components/admin-ui';
import {
  cmsLifecyclePatch,
  defaultContent,
  isCmsPublished,
  normalizeContent,
  parseCmsContentJson,
  stringifyCmsContent,
  type CmsAnnouncement,
  type CmsAsset,
  type CmsBanner,
  type CmsContent,
  type CmsFaq,
  type CmsLifecycle,
} from './content-center-contract';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);

export default function ContentCenterPage() {
  const [content, setContent] = useState<CmsContent>(defaultContent);
  const [savedContent, setSavedContent] = useState<CmsContent>(defaultContent);
  const [message, setMessage] = useState('กำลังโหลด CMS...');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadTag, setUploadTag] = useState('banner');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  const [rawJson, setRawJson] = useState(() => stringifyCmsContent(defaultContent));
  const [rawJsonError, setRawJsonError] = useState('');
  const [rawDirty, setRawDirty] = useState(false);
  const busy = loading || saving || uploading;
  const { isDirty, saveState } = useAdminUnsavedChanges({
    value: { content, pendingRawJson: rawDirty ? rawJson : '' },
    savedValue: { content: savedContent, pendingRawJson: '' },
    saving: saving || uploading,
  });

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!rawDirty) setRawJson(stringifyCmsContent(content));
  }, [content, rawDirty]);

  const stats = useMemo(() => {
    const lifecycleItems = [
      ...content.banners,
      content.popup,
      ...content.announcements,
      ...content.faqs,
    ];
    return {
      published: lifecycleItems.filter((item) => item.lifecycle === 'published').length,
      draft: lifecycleItems.filter((item) => item.lifecycle === 'draft').length,
      archived: lifecycleItems.filter((item) => item.lifecycle === 'archived').length,
      assets: content.assets.filter((item) => item.enabled).length,
      uploaded: content.assets.filter((item) => item.storageKey).length,
      brokenImages: countBrokenImages(content),
    };
  }, [content]);
  const warnings = useMemo(() => buildWarnings(content), [content]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด CMS...');
    try {
      const res = await adminApiFetch('/admin/settings/features');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'โหลด CMS ไม่สำเร็จ');
        return;
      }
      const nextContent = normalizeContent(data?.settings?.cms_content);
      setContent(nextContent);
      setSavedContent(nextContent);
      setRawJson(stringifyCmsContent(nextContent));
      setRawDirty(false);
      setRawJsonError('');
      setMessage('');
    } catch {
      setMessage('โหลด CMS ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function requestReload() {
    if (isDirty || rawDirty) {
      setConfirmReload(true);
      return;
    }
    void load();
  }

  function discardAndReload() {
    setConfirmReload(false);
    void load();
  }

  async function save(nextContent = content) {
    const nextWarnings = buildWarnings(nextContent);
    if (nextWarnings.length > 0) {
      setMessage(`ยังบันทึกไม่ได้: ${nextWarnings.join(' • ')}`);
      return false;
    }

    setSaving(true);
    setMessage('กำลังบันทึก CMS...');
    try {
      const res = await adminApiFetch('/admin/settings/features', {
        method: 'PUT',
        body: JSON.stringify({ cms_content: nextContent }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'บันทึก CMS ไม่สำเร็จ');
        return false;
      }
      setSavedContent(nextContent);
      setRawJson(stringifyCmsContent(nextContent));
      setRawDirty(false);
      setRawJsonError('');
      setMessage('บันทึก CMS แล้ว');
      return true;
    } catch {
      setMessage('บันทึก CMS ไม่สำเร็จ');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function applyRawJson() {
    const result = parseCmsContentJson(rawJson);
    if (!result.ok) {
      setRawJsonError(result.message);
      return;
    }
    setContent(result.content);
    setRawJson(stringifyCmsContent(result.content));
    setRawDirty(false);
    setRawJsonError('');
    setMessage('นำ JSON มาใช้แล้ว กรุณาตรวจ preview และกดบันทึก');
  }

  function resetRawJson() {
    setRawJson(stringifyCmsContent(content));
    setRawDirty(false);
    setRawJsonError('');
  }

  async function uploadAsset() {
    if (!uploadFile) {
      setMessage('เลือกไฟล์ก่อนอัปโหลด');
      return;
    }
    const validation = validateFile(uploadFile);
    if (validation) {
      setMessage(validation);
      return;
    }

    setUploading(true);
    setMessage('กำลังอัปโหลด asset...');
    try {
      const dataUrl = await fileToDataUrl(uploadFile);
      const res = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'POST',
        body: JSON.stringify({
          name: uploadName.trim() || uploadFile.name,
          tag: uploadTag.trim(),
          type: uploadFile.type.startsWith('video/') ? 'video' : 'image',
          dataUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'อัปโหลด asset ไม่สำเร็จ');
        return;
      }

      const asset = normalizeContent({ assets: [data] }).assets[0];
      if (!asset) {
        setMessage('ข้อมูล asset ที่อัปโหลดไม่ถูกต้อง');
        return;
      }
      const nextContent = { ...content, assets: [...content.assets, asset] };
      setContent(nextContent);
      setUploadFile(null);
      setUploadName('');
      const saved = await save(nextContent);
      setMessage(saved ? 'อัปโหลดและบันทึก asset แล้ว' : 'อัปโหลดแล้ว แต่บันทึก CMS ไม่สำเร็จ กรุณาลองบันทึกอีกครั้ง');
    } catch {
      setMessage('อัปโหลด asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(asset: CmsAsset) {
    const usage = assetUsage(content, asset.id);
    if (usage.length) {
      setMessage(`ลบไม่ได้ เพราะ asset ยังถูกใช้ใน ${usage.join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      if (asset.storageKey) {
        const res = await adminApiFetch('/admin/settings/cms-assets', {
          method: 'DELETE',
          body: JSON.stringify({ storageKey: asset.storageKey }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setMessage(data?.message ?? 'ลบไฟล์จาก storage ไม่สำเร็จ');
          return;
        }
      }

      const nextContent = { ...content, assets: content.assets.filter((item) => item.id !== asset.id) };
      setContent(nextContent);
      const saved = await save(nextContent);
      setMessage(saved ? 'ลบ asset แล้ว' : 'ลบไฟล์แล้ว แต่บันทึก CMS ไม่สำเร็จ กรุณารีเฟรชและตรวจสอบ');
    } catch {
      setMessage('ลบ asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  function resetPopupVersion() {
    patchPopup({ version: `v${Date.now()}` }, setContent);
    setMessage('เปลี่ยน popup version แล้ว สมาชิกจะเห็น popup ใหม่หลังบันทึก');
  }

  return (
    <AdminPage
      eyebrow="Content"
      title="CMS / Asset Library"
      description="จัดการวงจรชีวิต Banner, Popup, Announcement, FAQ และ Asset พร้อม preview ก่อนเผยแพร่"
      actions={<>
        <AdminSaveStateBadge state={saveState} />
        <AdminButton onClick={requestReload} tone="secondary" disabled={busy}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </AdminButton>
        <AdminButton onClick={() => void save()} disabled={busy || !isDirty || warnings.length > 0}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </AdminButton>
      </>}
    >
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminUnsavedChangesNotice isDirty={isDirty || rawDirty}>มีการแก้ไข CMS ที่ยังไม่ได้บันทึก</AdminUnsavedChangesNotice>
      {warnings.length > 0 && <AdminNotice tone="danger">{warnings.join(' • ')}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric tone="success" title="เผยแพร่" value={String(stats.published)} />
        <AdminMetric tone="warning" title="ฉบับร่าง" value={String(stats.draft)} />
        <AdminMetric title="เก็บถาวร" value={String(stats.archived)} />
        <AdminMetric tone="success" title="Assets" value={String(stats.assets)} helper={`${stats.uploaded} ไฟล์อัปโหลด`} />
        <AdminMetric tone={stats.brokenImages > 0 ? 'danger' : 'neutral'} title="Asset ผิดรูปแบบ" value={String(stats.brokenImages)} />
      </AdminMetricGrid>

      <AdminGrid>
        <AdminCard title="อัปโหลด Asset" description="JPEG, PNG, WebP, GIF ไม่เกิน 8 MB · MP4, WebM ไม่เกิน 25 MB" tone="success">
          <AdminStack>
            <label style={fieldStyle}>
              <span>ไฟล์</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                style={inputStyle}
              />
            </label>
            <Field label="ชื่อ Asset" value={uploadName} onChange={setUploadName} />
            <Field label="Tag" value={uploadTag} onChange={setUploadTag} />
            {uploadFile && <AdminRow><strong>{uploadFile.name}</strong><span>{uploadFile.type} · {formatBytes(uploadFile.size)}</span></AdminRow>}
            <AdminButton onClick={() => void uploadAsset()} disabled={busy || !uploadFile}>
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและเพิ่มเข้า Library'}
            </AdminButton>
          </AdminStack>
        </AdminCard>
        <AdminCard title="Preview มือถือ" description="แสดงเฉพาะเนื้อหาที่ Published และเปิดใช้งาน">
          <MobilePreview content={content} />
        </AdminCard>
        <AdminCard title="Preview PC" description="ตรวจเนื้อหาก่อนเผยแพร่">
          <DesktopPreview content={content} />
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Asset Library" description="ไฟล์อัปโหลดและ URL ภายนอกที่เลือกใช้ซ้ำ" tone="warning">
        <AdminStack>
          {content.assets.map((asset, index) => (
            <AssetEditorCard
              key={asset.id}
              asset={asset}
              onToggle={() => patchAsset(index, { enabled: !asset.enabled }, setContent)}
              onRemove={() => void removeAsset(asset)}
            >
              <Field label="ชื่อ" value={asset.name} onChange={(value) => patchAsset(index, { name: value }, setContent)} />
              <label style={fieldStyle}>
                <span>ประเภท</span>
                <select
                  value={asset.type}
                  disabled={Boolean(asset.storageKey)}
                  onChange={(event) => patchAsset(index, { type: event.target.value as CmsAsset['type'] }, setContent)}
                  style={inputStyle}
                >
                  <option value="image">image</option>
                  <option value="video">video</option>
                  <option value="link">link</option>
                </select>
              </label>
              <Field label="URL" value={asset.url} onChange={(value) => patchAsset(index, { url: value }, setContent)} warning={asset.url && !isAssetUrl(asset.url) ? 'URL ไม่ถูกต้อง' : undefined} />
              <Field label="Tag" value={asset.tag ?? ''} onChange={(value) => patchAsset(index, { tag: value }, setContent)} />
              {asset.storageKey && <AdminRow><strong>Storage</strong><span>{asset.storageKey} · {formatBytes(asset.sizeBytes ?? 0)}</span></AdminRow>}
              {asset.sha256 && <small style={mutedStyle}>SHA-256: {asset.sha256}</small>}
              {asset.type === 'image' && isAssetUrl(asset.url) && asset.url && <img src={resolveAssetUrl(asset.url)} alt="" style={assetPreviewStyle} />}
              {asset.type === 'video' && isAssetUrl(asset.url) && asset.url && <video src={resolveAssetUrl(asset.url)} controls preload="metadata" style={assetPreviewStyle} />}
            </AssetEditorCard>
          ))}
          <AdminButton
            tone="secondary"
            disabled={busy}
            onClick={() => setContent((current) => ({
              ...current,
              assets: [...current.assets, {
                id: `asset_${Date.now()}`,
                name: 'Asset ใหม่',
                url: '',
                type: 'image',
                tag: '',
                enabled: true,
                source: 'url',
              }],
            }))}
          >
            เพิ่ม Asset URL
          </AdminButton>
        </AdminStack>
      </AdminCard>

      <AdminGrid>
        <AdminCard title="Banner หน้าแรก" tone="success">
          <AdminStack>
            {content.banners.map((item, index) => (
              <LifecycleEditorCard
                key={index}
                title={`Banner ${index + 1}`}
                lifecycle={item.lifecycle}
                enabled={item.enabled}
                onLifecycle={(lifecycle) => patchBanner(index, cmsLifecyclePatch(lifecycle), setContent)}
                onToggle={() => patchBanner(index, { enabled: !item.enabled }, setContent)}
                onRemove={() => setContent((current) => ({ ...current, banners: current.banners.filter((_, itemIndex) => itemIndex !== index) }))}
                onMoveUp={index > 0 ? () => moveItem('banners', index, -1, setContent) : undefined}
                onMoveDown={index < content.banners.length - 1 ? () => moveItem('banners', index, 1, setContent) : undefined}
              >
                <Field label="หัวข้อ" value={item.title} onChange={(value) => patchBanner(index, { title: value }, setContent)} />
                <Field label="ข้อความรอง" value={item.subtitle} onChange={(value) => patchBanner(index, { subtitle: value }, setContent)} />
                <AssetSelect value={item.assetId ?? ''} assets={content.assets} onChange={(assetId) => patchBanner(index, { assetId, imageUrl: assetUrl(content.assets, assetId) || item.imageUrl }, setContent)} />
                <Field label="ลิงก์รูป" value={item.imageUrl} onChange={(value) => patchBanner(index, { imageUrl: value, assetId: '' }, setContent)} warning={item.imageUrl && !isAssetUrl(item.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined} />
                <Field label="ลิงก์ปุ่ม" value={item.href} onChange={(value) => patchBanner(index, { href: value }, setContent)} warning={!isSafeHref(item.href) ? 'ลิงก์ควรขึ้นต้น / หรือ http/https' : undefined} />
              </LifecycleEditorCard>
            ))}
            <AdminButton
              tone="secondary"
              onClick={() => setContent((current) => ({
                ...current,
                banners: [...current.banners, {
                  title: 'Banner ใหม่',
                  subtitle: '',
                  imageUrl: '',
                  href: '/games',
                  enabled: false,
                  lifecycle: 'draft',
                }],
              }))}
            >
              เพิ่ม Banner
            </AdminButton>
          </AdminStack>
        </AdminCard>

        <AdminCard title="Popup" tone={isCmsPublished(content.popup) ? 'warning' : 'neutral'}>
          <LifecycleEditorCard
            title="Popup หลัก"
            lifecycle={content.popup.lifecycle}
            enabled={content.popup.enabled}
            onLifecycle={(lifecycle) => patchPopup(cmsLifecyclePatch(lifecycle), setContent)}
            onToggle={() => patchPopup({ enabled: !content.popup.enabled }, setContent)}
          >
            <Field label="หัวข้อ" value={content.popup.title} onChange={(value) => patchPopup({ title: value }, setContent)} />
            <Field label="ข้อความ" value={content.popup.message} onChange={(value) => patchPopup({ message: value }, setContent)} textarea />
            <AssetSelect value={content.popup.assetId ?? ''} assets={content.assets} onChange={(assetId) => patchPopup({ assetId, imageUrl: assetUrl(content.assets, assetId) || content.popup.imageUrl || '' }, setContent)} />
            <Field label="รูป Popup" value={content.popup.imageUrl ?? ''} onChange={(value) => patchPopup({ imageUrl: value, assetId: '' }, setContent)} warning={content.popup.imageUrl && !isAssetUrl(content.popup.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined} />
            <Field label="ปุ่ม" value={content.popup.ctaLabel} onChange={(value) => patchPopup({ ctaLabel: value }, setContent)} />
            <Field label="ลิงก์" value={content.popup.href} onChange={(value) => patchPopup({ href: value }, setContent)} warning={!isSafeHref(content.popup.href) ? 'ลิงก์ควรขึ้นต้น / หรือ http/https' : undefined} />
            <AdminRow><strong>Version</strong><span>{content.popup.version ?? 'v1'}</span></AdminRow>
            <AdminButton tone="secondary" onClick={resetPopupVersion}>ให้สมาชิกเห็น popup ใหม่อีกครั้ง</AdminButton>
          </LifecycleEditorCard>
        </AdminCard>
      </AdminGrid>

      <AdminGrid>
        <AdminCard title="Announcement" tone="warning">
          <AdminStack>
            {content.announcements.map((item, index) => (
              <LifecycleEditorCard
                key={index}
                title={`ประกาศ ${index + 1}`}
                lifecycle={item.lifecycle}
                enabled={item.enabled}
                onLifecycle={(lifecycle) => patchAnnouncement(index, cmsLifecyclePatch(lifecycle), setContent)}
                onToggle={() => patchAnnouncement(index, { enabled: !item.enabled }, setContent)}
                onRemove={() => setContent((current) => ({ ...current, announcements: current.announcements.filter((_, itemIndex) => itemIndex !== index) }))}
                onMoveUp={index > 0 ? () => moveItem('announcements', index, -1, setContent) : undefined}
                onMoveDown={index < content.announcements.length - 1 ? () => moveItem('announcements', index, 1, setContent) : undefined}
              >
                <Field label="หัวข้อ" value={item.title} onChange={(value) => patchAnnouncement(index, { title: value }, setContent)} />
                <Field label="ข้อความ" value={item.message} onChange={(value) => patchAnnouncement(index, { message: value }, setContent)} textarea />
              </LifecycleEditorCard>
            ))}
            <AdminButton
              tone="secondary"
              onClick={() => setContent((current) => ({
                ...current,
                announcements: [...current.announcements, {
                  title: 'ประกาศใหม่',
                  message: '',
                  enabled: false,
                  lifecycle: 'draft',
                }],
              }))}
            >
              เพิ่มประกาศ
            </AdminButton>
          </AdminStack>
        </AdminCard>

        <AdminCard title="FAQ">
          <AdminStack>
            {content.faqs.map((item, index) => (
              <LifecycleEditorCard
                key={index}
                title={`FAQ ${index + 1}`}
                lifecycle={item.lifecycle}
                enabled={item.enabled}
                onLifecycle={(lifecycle) => patchFaq(index, cmsLifecyclePatch(lifecycle), setContent)}
                onToggle={() => patchFaq(index, { enabled: !item.enabled }, setContent)}
                onRemove={() => setContent((current) => ({ ...current, faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index) }))}
                onMoveUp={index > 0 ? () => moveItem('faqs', index, -1, setContent) : undefined}
                onMoveDown={index < content.faqs.length - 1 ? () => moveItem('faqs', index, 1, setContent) : undefined}
              >
                <Field label="คำถาม" value={item.question} onChange={(value) => patchFaq(index, { question: value }, setContent)} />
                <Field label="คำตอบ" value={item.answer} onChange={(value) => patchFaq(index, { answer: value }, setContent)} textarea />
              </LifecycleEditorCard>
            ))}
            <AdminButton
              tone="secondary"
              onClick={() => setContent((current) => ({
                ...current,
                faqs: [...current.faqs, {
                  question: 'คำถามใหม่',
                  answer: '',
                  enabled: false,
                  lifecycle: 'draft',
                }],
              }))}
            >
              เพิ่ม FAQ
            </AdminButton>
          </AdminStack>
        </AdminCard>
      </AdminGrid>

      <details style={advancedStyle}>
        <summary>Advanced: แก้ไข Raw JSON</summary>
        <p style={mutedStyle}>JSON จะผ่าน normalization ก่อนนำมาใช้ และยังต้องกดบันทึกอีกครั้ง</p>
        <textarea
          aria-label="CMS Raw JSON"
          value={rawJson}
          onChange={(event) => {
            setRawJson(event.target.value);
            setRawDirty(true);
            setRawJsonError('');
          }}
          spellCheck={false}
          style={rawJsonStyle}
        />
        {rawJsonError && <AdminNotice tone="danger">{rawJsonError}</AdminNotice>}
        <div style={rowActionsStyle}>
          <AdminButton onClick={applyRawJson} disabled={busy || !rawDirty}>นำ JSON มาใช้</AdminButton>
          <AdminButton tone="secondary" onClick={resetRawJson} disabled={busy}>โหลด JSON จากฟอร์มปัจจุบัน</AdminButton>
        </div>
      </details>

      <AdminConfirmDialog
        open={confirmReload}
        title="ทิ้งการแก้ไข CMS ที่ยังไม่บันทึก"
        description="ระบบจะโหลดข้อมูล CMS ล่าสุดและยกเลิกการแก้ไขทั้งในฟอร์มและ Raw JSON"
        confirmLabel="ทิ้งการแก้ไข"
        tone="danger"
        onCancel={() => setConfirmReload(false)}
        onConfirm={discardAndReload}
      />
    </AdminPage>
  );
}

function AssetEditorCard({ asset, onToggle, onRemove, children }: {
  asset: CmsAsset;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <section style={editorStyle}>
      <AdminRow>
        <strong>{asset.name}</strong>
        <div style={rowActionsStyle}>
          <AdminBadge tone={asset.enabled ? 'success' : 'neutral'}>{asset.enabled ? 'เปิด' : 'ปิด'}</AdminBadge>
          <AdminButton tone="secondary" onClick={onToggle}>{asset.enabled ? 'ปิด' : 'เปิด'}</AdminButton>
          <AdminButton tone="danger" onClick={onRemove}>ลบ</AdminButton>
        </div>
      </AdminRow>
      <div style={fieldGridStyle}>{children}</div>
    </section>
  );
}

function LifecycleEditorCard({ title, lifecycle, enabled, onLifecycle, onToggle, onRemove, onMoveUp, onMoveDown, children }: {
  title: string;
  lifecycle: CmsLifecycle;
  enabled: boolean;
  onLifecycle: (lifecycle: CmsLifecycle) => void;
  onToggle: () => void;
  onRemove?: (() => void) | undefined;
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <section style={editorStyle}>
      <AdminRow>
        <strong>{title}</strong>
        <div style={rowActionsStyle}>
          <AdminBadge tone={lifecycleTone(lifecycle)}>{lifecycleLabel(lifecycle)}</AdminBadge>
          <select value={lifecycle} onChange={(event) => onLifecycle(event.target.value as CmsLifecycle)} style={compactSelectStyle}>
            <option value="draft">ฉบับร่าง</option>
            <option value="published">เผยแพร่</option>
            <option value="archived">เก็บถาวร</option>
          </select>
          {onMoveUp && <AdminButton tone="secondary" onClick={onMoveUp}>ขึ้น</AdminButton>}
          {onMoveDown && <AdminButton tone="secondary" onClick={onMoveDown}>ลง</AdminButton>}
          <AdminButton tone="secondary" onClick={onToggle} disabled={lifecycle !== 'published'}>
            {enabled ? 'ซ่อนจาก Member' : 'แสดงบน Member'}
          </AdminButton>
          {onRemove && <AdminButton tone="danger" onClick={onRemove}>ลบ</AdminButton>}
        </div>
      </AdminRow>
      <div style={fieldGridStyle}>{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, textarea = false, warning }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean | undefined;
  warning?: string | undefined;
}) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      {textarea
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} style={textareaStyle} />
        : <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}
      {warning && <small style={warningStyle}>{warning}</small>}
    </label>
  );
}

function AssetSelect({ value, assets, onChange }: { value: string; assets: CmsAsset[]; onChange: (assetId: string) => void }) {
  const imageAssets = assets.filter((asset) => asset.enabled && asset.type === 'image' && isAssetUrl(asset.url));
  return (
    <label style={fieldStyle}>
      <span>เลือกจาก Asset Library</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        <option value="">ไม่เลือก asset</option>
        {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} {asset.tag ? `· ${asset.tag}` : ''}</option>)}
      </select>
    </label>
  );
}

function MobilePreview({ content }: { content: CmsContent }) {
  const banner = content.banners.find(isCmsPublished);
  const announcements = content.announcements.filter(isCmsPublished).slice(0, 2);
  const faqs = content.faqs.filter(isCmsPublished).slice(0, 2);
  const bannerImage = banner ? assetUrl(content.assets, banner.assetId) || banner.imageUrl : '';
  const popupImage = assetUrl(content.assets, content.popup.assetId) || content.popup.imageUrl || '';
  return (
    <div style={phoneStyle}>
      <div style={phoneTopStyle}>Member preview</div>
      {banner && <section style={phoneBannerStyle}>{bannerImage && isAssetUrl(bannerImage) && <img src={resolveAssetUrl(bannerImage)} alt="" style={phoneImageStyle} />}<strong>{banner.title || 'Banner'}</strong><span>{banner.subtitle || 'ข้อความรอง'}</span><em>{banner.href || '/games'}</em></section>}
      {announcements.map((item, index) => <div key={index} style={phoneCardStyle}><strong>{item.title || 'ประกาศ'}</strong><span>{item.message || 'ข้อความประกาศ'}</span></div>)}
      {faqs.map((item, index) => <div key={index} style={phoneCardStyle}><strong>{item.question || 'คำถาม'}</strong><span>{item.answer || 'คำตอบ'}</span></div>)}
      {isCmsPublished(content.popup) && <div style={phonePopupStyle}>{popupImage && isAssetUrl(popupImage) && <img src={resolveAssetUrl(popupImage)} alt="" style={phoneImageStyle} />}<strong>{content.popup.title}</strong><span>{content.popup.message}</span><em>{content.popup.ctaLabel}</em></div>}
    </div>
  );
}

function DesktopPreview({ content }: { content: CmsContent }) {
  const banner = content.banners.find(isCmsPublished);
  const announcements = content.announcements.filter(isCmsPublished).slice(0, 3);
  const bannerImage = banner ? assetUrl(content.assets, banner.assetId) || banner.imageUrl : '';
  return (
    <div style={desktopStyle}>
      <header style={desktopHeaderStyle}><strong>Member site</strong><span>หน้าแรก · เกม · โปรโมชั่น · ติดต่อเรา</span></header>
      {banner
        ? <section style={desktopHeroStyle}>{bannerImage && isAssetUrl(bannerImage) && <img src={resolveAssetUrl(bannerImage)} alt="" style={desktopImageStyle} />}<div><strong>{banner.title || 'Banner'}</strong><p>{banner.subtitle || 'ข้อความรอง'}</p><em>{banner.href || '/games'}</em></div></section>
        : <div style={phoneCardStyle}>ยังไม่มี Banner ที่เผยแพร่</div>}
      <section style={desktopAnnouncementStyle}>{announcements.map((item, index) => <div key={index}><strong>{item.title || 'ประกาศ'}</strong><span>{item.message || 'ข้อความประกาศ'}</span></div>)}</section>
    </div>
  );
}

function patchAsset(index: number, patch: Partial<CmsAsset>, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => ({ ...current, assets: current.assets.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
}

function patchBanner(index: number, patch: Partial<CmsBanner>, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
}

function patchPopup(patch: Partial<CmsContent['popup']>, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => ({ ...current, popup: { ...current.popup, ...patch } }));
}

function patchAnnouncement(index: number, patch: Partial<CmsAnnouncement>, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => ({ ...current, announcements: current.announcements.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
}

function patchFaq(index: number, patch: Partial<CmsFaq>, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => ({ ...current, faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
}

function moveItem(key: 'banners' | 'announcements' | 'faqs', index: number, direction: -1 | 1, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => {
    const list = [...current[key]] as Array<CmsBanner | CmsAnnouncement | CmsFaq>;
    const target = index + direction;
    if (target < 0 || target >= list.length) return current;
    const source = list[index];
    const destination = list[target];
    if (!source || !destination) return current;
    list[index] = destination;
    list[target] = source;
    return { ...current, [key]: list } as CmsContent;
  });
}

function assetUrl(assets: CmsAsset[], assetId?: string) {
  if (!assetId) return '';
  return assets.find((asset) => asset.id === assetId && asset.enabled)?.url ?? '';
}

function assetUsage(content: CmsContent, assetId: string) {
  const usage: string[] = [];
  content.banners.forEach((banner, index) => { if (banner.assetId === assetId) usage.push(`Banner ${index + 1}`); });
  if (content.popup.assetId === assetId) usage.push('Popup');
  return usage;
}

function resolveAssetUrl(value: string) {
  if (value.startsWith('/public/cms-assets/')) return `${API_URL.replace(/\/$/, '')}${value}`;
  return value;
}

function isAssetUrl(value: string) {
  if (!value) return true;
  if (/^\/public\/cms-assets\/[0-9a-f-]+\.(?:jpg|png|webp|gif|mp4|webm)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeHref(value: string) {
  if (value?.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function countBrokenImages(content: CmsContent) {
  const bannerBroken = content.banners.filter((item) => item.imageUrl && !isAssetUrl(item.imageUrl)).length;
  const assetBroken = content.assets.filter((item) => item.url && !isAssetUrl(item.url)).length;
  const popupBroken = content.popup.imageUrl && !isAssetUrl(content.popup.imageUrl) ? 1 : 0;
  return bannerBroken + assetBroken + popupBroken;
}

function buildWarnings(content: CmsContent) {
  const warnings: string[] = [];
  if (countBrokenImages(content) > 0) warnings.push('มี asset หรือรูปที่ไม่ถูกต้อง');
  if (content.banners.some((item) => isCmsPublished(item) && !item.title.trim())) warnings.push('มี Banner ที่เผยแพร่แต่ไม่มีหัวข้อ');
  if (isCmsPublished(content.popup) && !content.popup.message.trim()) warnings.push('Popup ที่เผยแพร่ต้องมีข้อความ');
  if (content.announcements.some((item) => isCmsPublished(item) && (!item.title.trim() || !item.message.trim()))) warnings.push('ประกาศที่เผยแพร่ต้องมีหัวข้อและข้อความ');
  if (content.faqs.some((item) => isCmsPublished(item) && (!item.question.trim() || !item.answer.trim()))) warnings.push('FAQ ที่เผยแพร่ต้องมีคำถามและคำตอบ');
  return warnings;
}

function lifecycleLabel(value: CmsLifecycle) {
  return value === 'published' ? 'เผยแพร่' : value === 'archived' ? 'เก็บถาวร' : 'ฉบับร่าง';
}

function lifecycleTone(value: CmsLifecycle): 'success' | 'neutral' | 'warning' {
  return value === 'published' ? 'success' : value === 'archived' ? 'neutral' : 'warning';
}

function validateFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) return 'รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP4 และ WebM';
  const max = file.type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size === 0) return 'ไฟล์ว่าง';
  if (file.size > max) return `ไฟล์ใหญ่เกิน ${Math.floor(max / 1024 / 1024)} MB`;
  return '';
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const mutedStyle = { color: '#94a3b8', overflowWrap: 'anywhere' as const };
const editorStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10 } as const;
const rowActionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const fieldGridStyle = { display: 'grid', gap: 10 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, maxWidth: '100%' } as const;
const compactSelectStyle = { ...inputStyle, minHeight: 36 } as const;
const textareaStyle = { ...inputStyle, minHeight: 86, padding: 12, resize: 'vertical' as const };
const rawJsonStyle = { ...textareaStyle, width: '100%', minHeight: 360, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, lineHeight: 1.55, boxSizing: 'border-box' as const };
const warningStyle = { color: '#fca5a5' } as const;
const assetPreviewStyle = { width: '100%', height: 180, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: '#020617' };
const advancedStyle = { display: 'grid', gap: 10, padding: 14, border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, background: 'rgba(255,255,255,.03)' } as const;
const phoneStyle = { width: 'min(330px, 100%)', margin: '0 auto', border: '1px solid rgba(148,163,184,.22)', borderRadius: 30, padding: 14, background: 'linear-gradient(180deg,#080808,#111827)', display: 'grid', gap: 10, minHeight: 560 } as const;
const phoneTopStyle = { textAlign: 'center' as const, color: '#94a3b8', fontSize: 12, fontWeight: 900 };
const phoneBannerStyle = { border: '1px solid rgba(245,197,66,.28)', borderRadius: 20, padding: 12, background: 'rgba(245,197,66,.10)', display: 'grid', gap: 6 } as const;
const phoneImageStyle = { width: '100%', height: 92, objectFit: 'cover' as const, borderRadius: 14 };
const phoneCardStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.05)', display: 'grid', gap: 4 } as const;
const phonePopupStyle = { marginTop: 'auto', border: '1px solid rgba(245,197,66,.28)', borderRadius: 18, padding: 12, background: '#111827', display: 'grid', gap: 5 } as const;
const desktopStyle = { minHeight: 280, overflow: 'hidden', border: '1px solid rgba(148,163,184,.22)', borderRadius: 16, background: '#f8fafc', color: '#0f172a', display: 'grid', alignContent: 'start' } as const;
const desktopHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: '#0f172a', color: '#f8fafc', fontSize: 12 } as const;
const desktopHeroStyle = { display: 'grid', gridTemplateColumns: 'minmax(110px, .8fr) 1.2fr', minHeight: 150, alignItems: 'center', gap: 14, padding: 16, background: 'linear-gradient(135deg,#e0f2fe,#fef3c7)' } as const;
const desktopImageStyle = { width: '100%', height: 118, objectFit: 'cover' as const, borderRadius: 10, background: '#cbd5e1' } as const;
const desktopAnnouncementStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, padding: 12 } as const;
