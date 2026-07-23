'use client';

import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import { AdminSaveStateBadge, AdminUnsavedChangesNotice, useAdminUnsavedChanges } from '../../../app/(admin)/_components/admin-unsaved-changes';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../../app/(admin)/_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);

type CmsAsset = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'link';
  tag?: string;
  enabled: boolean;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  source?: 'upload' | 'url';
};

type CmsContent = {
  assets: CmsAsset[];
  banners: Array<{ title: string; subtitle: string; imageUrl: string; href: string; enabled: boolean; assetId?: string }>;
  popup: { title: string; message: string; ctaLabel: string; href: string; enabled: boolean; version?: string; assetId?: string; imageUrl?: string };
  announcements: Array<{ title: string; message: string; enabled: boolean }>;
  faqs: Array<{ question: string; answer: string; enabled: boolean }>;
};

const defaultContent: CmsContent = {
  assets: [],
  banners: [{ title: 'พร้อมเล่นทุกเกม', subtitle: 'ฝาก ถอน เล่นเกม และดูประวัติได้ในมือถือเครื่องเดียว', imageUrl: '', href: '/games', enabled: true }],
  popup: { title: 'ประกาศ', message: 'ยินดีต้อนรับ', ctaLabel: 'ดูเกม', href: '/games', enabled: false, version: 'v1' },
  announcements: [{ title: 'ระบบพร้อมใช้งาน', message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ', enabled: true }],
  faqs: [{ question: 'ฝากใช้เวลานานไหม', answer: 'หลังแนบสลิป แอดมินจะตรวจและอนุมัติให้เร็วที่สุด', enabled: true }],
};

export default function ContentCenterPage() {
  const [content, setContent] = useState<CmsContent>(defaultContent);
  const [savedContent, setSavedContent] = useState<CmsContent>(defaultContent);
  const [message, setMessage] = useState('กำลังโหลด CMS...');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadTag, setUploadTag] = useState('banner');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { isDirty, saveState } = useAdminUnsavedChanges({ value: content, savedValue: savedContent, saving: saving || uploading });

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => ({
    banners: content.banners.filter((item) => item.enabled).length,
    assets: content.assets.filter((item) => item.enabled).length,
    uploaded: content.assets.filter((item) => item.storageKey).length,
    announcements: content.announcements.filter((item) => item.enabled).length,
    popup: content.popup.enabled ? 1 : 0,
    brokenImages: countBrokenImages(content),
  }), [content]);
  const warnings = useMemo(() => buildWarnings(content), [content]);

  async function load() {
    const res = await adminApiFetch('/admin/settings/features');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด CMS ไม่สำเร็จ'); return; }
    const nextContent = normalizeContent(data?.settings?.cms_content);
    setContent(nextContent);
    setSavedContent(nextContent);
    setMessage('');
  }

  function requestReload() {
    if (isDirty && !window.confirm('มีการแก้ไข CMS ที่ยังไม่ได้บันทึก ต้องการทิ้งการแก้ไขและโหลดใหม่หรือไม่')) return;
    void load();
  }

  async function save(nextContent = content) {
    setSaving(true);
    setMessage('กำลังบันทึก CMS...');
    const res = await adminApiFetch('/admin/settings/features', { method: 'PUT', body: JSON.stringify({ cms_content: nextContent }) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึก CMS ไม่สำเร็จ'); return false; }
    setSavedContent(nextContent);
    setMessage('บันทึก CMS แล้ว');
    return true;
  }

  async function uploadAsset() {
    if (!uploadFile) { setMessage('เลือกไฟล์ก่อนอัปโหลด'); return; }
    const validation = validateFile(uploadFile);
    if (validation) { setMessage(validation); return; }

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
      if (!res.ok) { setMessage(data?.message ?? 'อัปโหลด asset ไม่สำเร็จ'); return; }

      const nextContent = { ...content, assets: [...content.assets, data as CmsAsset] };
      setContent(nextContent);
      setUploadFile(null);
      setUploadName('');
      const saved = await save(nextContent);
      setMessage(saved ? 'อัปโหลดและบันทึก asset แล้ว' : 'อัปโหลดแล้ว แต่บันทึก CMS ไม่สำเร็จ กรุณาลองบันทึกอีกครั้ง');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'อัปโหลด asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(asset: CmsAsset) {
    const usage = assetUsage(content, asset.id);
    if (usage.length) { setMessage(`ลบไม่ได้ เพราะ asset ยังถูกใช้ใน ${usage.join(', ')}`); return; }

    if (asset.storageKey) {
      const res = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'DELETE',
        body: JSON.stringify({ storageKey: asset.storageKey }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(data?.message ?? 'ลบไฟล์จาก storage ไม่สำเร็จ'); return; }
    }

    const nextContent = { ...content, assets: content.assets.filter((item) => item.id !== asset.id) };
    setContent(nextContent);
    const saved = await save(nextContent);
    setMessage(saved ? 'ลบ asset แล้ว' : 'ลบไฟล์แล้ว แต่บันทึก CMS ไม่สำเร็จ กรุณารีเฟรชและตรวจสอบ');
  }

  function resetPopupVersion() {
    patchPopup({ version: `v${Date.now()}` }, setContent);
    setMessage('เปลี่ยน popup version แล้ว สมาชิกจะเห็น popup ใหม่หลังบันทึก');
  }

  return <AdminPage eyebrow="Content" title="CMS / Asset Library" description="จัดการ banner, popup, announcement, FAQ และ binary asset ที่เก็บใน private storage พร้อม public read endpoint" actions={<><AdminSaveStateBadge state={saveState} /><AdminButton onClick={requestReload} tone="secondary" disabled={saving || uploading}>รีเฟรช</AdminButton><AdminButton onClick={() => void save()} disabled={saving || uploading || !isDirty}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</AdminButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminUnsavedChangesNotice isDirty={isDirty}>มีการแก้ไข CMS ที่ยังไม่ได้บันทึก ระบบจะเตือนก่อนออกจากหน้านี้</AdminUnsavedChangesNotice>
    {warnings.length > 0 && <AdminNotice>{warnings.join(' • ')}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric tone="success" title="Banner เปิดอยู่" value={String(stats.banners)} helper={`${content.banners.length} รายการ`} />
      <AdminMetric tone="success" title="Assets" value={String(stats.assets)} helper={`${stats.uploaded} ไฟล์อัปโหลด`} />
      <AdminMetric tone={stats.popup ? 'success' : 'neutral'} title="Popup" value={stats.popup ? 'เปิด' : 'ปิด'} helper={`version ${content.popup.version ?? 'v1'}`} />
      <AdminMetric tone={stats.brokenImages > 0 ? 'danger' : 'neutral'} title="Asset ผิดรูปแบบ" value={String(stats.brokenImages)} helper="URL หรือ storage path" />
    </AdminMetricGrid>

    <AdminGrid>
      <AdminCard title="อัปโหลด Asset" description="JPEG, PNG, WebP, GIF ไม่เกิน 8 MB · MP4, WebM ไม่เกิน 25 MB" tone="success">
        <AdminStack>
          <label style={fieldStyle}><span>ไฟล์</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} style={inputStyle} /></label>
          <Field label="ชื่อ Asset" value={uploadName} onChange={setUploadName} />
          <Field label="Tag" value={uploadTag} onChange={setUploadTag} />
          {uploadFile && <AdminRow><strong>{uploadFile.name}</strong><span>{uploadFile.type} · {formatBytes(uploadFile.size)}</span></AdminRow>}
          <AdminButton onClick={() => void uploadAsset()} disabled={uploading || !uploadFile}>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและเพิ่มเข้า Library'}</AdminButton>
        </AdminStack>
      </AdminCard>
      <AdminCard title="Preview มือถือ" description="ดูภาพรวมแบบ member home ย่อส่วน"><MobilePreview content={content} /></AdminCard>
      <AdminCard title="Preview PC" description="ตรวจ banner และเนื้อหาก่อนเปิดใช้งาน"><DesktopPreview content={content} /></AdminCard>
    </AdminGrid>

    <AdminGrid>
      <AdminCard title="Asset Library" description="ไฟล์อัปโหลดและ URL ภายนอกที่เลือกใช้ซ้ำใน banner และ popup" tone="warning">
        <AdminStack>
          {content.assets.map((asset, index) => <EditorCard key={asset.id} title={asset.name || `Asset ${index + 1}`} enabled={asset.enabled} onToggle={() => patchAsset(index, { enabled: !asset.enabled }, setContent)} onRemove={() => void removeAsset(asset)}>
            <Field label="ชื่อ" value={asset.name} onChange={(value) => patchAsset(index, { name: value }, setContent)} />
            <label style={fieldStyle}><span>ประเภท</span><select value={asset.type} disabled={Boolean(asset.storageKey)} onChange={(event) => patchAsset(index, { type: event.target.value as CmsAsset['type'] }, setContent)} style={inputStyle}><option value="image">image</option><option value="video">video</option><option value="link">link</option></select></label>
            <Field label="URL" value={asset.url} onChange={(value) => patchAsset(index, { url: value }, setContent)} warning={asset.url && !isAssetUrl(asset.url) ? 'URL ไม่ถูกต้อง' : undefined} />
            <Field label="Tag" value={asset.tag ?? ''} onChange={(value) => patchAsset(index, { tag: value }, setContent)} />
            {asset.storageKey && <AdminRow><strong>Storage</strong><span>{asset.storageKey} · {formatBytes(asset.sizeBytes ?? 0)}</span></AdminRow>}
            {asset.sha256 && <small style={mutedStyle}>SHA-256: {asset.sha256}</small>}
            {asset.type === 'image' && isAssetUrl(asset.url) && asset.url && <img src={resolveAssetUrl(asset.url)} alt="" style={assetPreviewStyle} />}
            {asset.type === 'video' && isAssetUrl(asset.url) && asset.url && <video src={resolveAssetUrl(asset.url)} controls preload="metadata" style={assetPreviewStyle} />}
          </EditorCard>)}
          <AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, assets: [...current.assets, { id: `asset_${Date.now()}`, name: 'Asset URL ใหม่', url: '', type: 'image', tag: 'banner', enabled: true, source: 'url' }] }))}>เพิ่ม Asset URL</AdminButton>
        </AdminStack>
      </AdminCard>
    </AdminGrid>

    <AdminGrid>
      <AdminCard title="Banner หน้าแรก" tone="success"><AdminStack>{content.banners.map((item, index) => <EditorCard key={index} title={`Banner ${index + 1}`} enabled={item.enabled} onToggle={() => patchBanner(index, { enabled: !item.enabled }, setContent)} onRemove={() => setContent((current) => ({ ...current, banners: current.banners.filter((_, i) => i !== index) }))} onMoveUp={index > 0 ? () => moveItem('banners', index, -1, setContent) : undefined} onMoveDown={index < content.banners.length - 1 ? () => moveItem('banners', index, 1, setContent) : undefined}><Field label="หัวข้อ" value={item.title} onChange={(value) => patchBanner(index, { title: value }, setContent)} /><Field label="ข้อความรอง" value={item.subtitle} onChange={(value) => patchBanner(index, { subtitle: value }, setContent)} /><AssetSelect value={item.assetId ?? ''} assets={content.assets} onChange={(assetId) => patchBanner(index, { assetId, imageUrl: assetUrl(content.assets, assetId) || item.imageUrl }, setContent)} /><Field label="ลิงก์รูป" value={item.imageUrl} onChange={(value) => patchBanner(index, { imageUrl: value, assetId: '' }, setContent)} warning={item.imageUrl && !isAssetUrl(item.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined} /><Field label="ลิงก์ปุ่ม" value={item.href} onChange={(value) => patchBanner(index, { href: value }, setContent)} warning={!isSafeHref(item.href) ? 'ลิงก์ควรขึ้นต้น / หรือ http/https' : undefined} /></EditorCard>)}<AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, banners: [...current.banners, { title: 'Banner ใหม่', subtitle: '', imageUrl: '', href: '/games', enabled: true }] }))}>เพิ่ม Banner</AdminButton></AdminStack></AdminCard>
      <AdminCard title="Popup" tone={content.popup.enabled ? 'warning' : 'neutral'}><AdminStack><EditorCard title="Popup หลัก" enabled={content.popup.enabled} onToggle={() => setContent((current) => ({ ...current, popup: { ...current.popup, enabled: !current.popup.enabled } }))}><Field label="หัวข้อ" value={content.popup.title} onChange={(value) => patchPopup({ title: value }, setContent)} /><Field label="ข้อความ" value={content.popup.message} onChange={(value) => patchPopup({ message: value }, setContent)} textarea /><AssetSelect value={content.popup.assetId ?? ''} assets={content.assets} onChange={(assetId) => patchPopup({ assetId, imageUrl: assetUrl(content.assets, assetId) || content.popup.imageUrl || '' }, setContent)} /><Field label="รูป Popup" value={content.popup.imageUrl ?? ''} onChange={(value) => patchPopup({ imageUrl: value, assetId: '' }, setContent)} warning={content.popup.imageUrl && !isAssetUrl(content.popup.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined} /><Field label="ปุ่ม" value={content.popup.ctaLabel} onChange={(value) => patchPopup({ ctaLabel: value }, setContent)} /><Field label="ลิงก์" value={content.popup.href} onChange={(value) => patchPopup({ href: value }, setContent)} warning={!isSafeHref(content.popup.href) ? 'ลิงก์ควรขึ้นต้น / หรือ http/https' : undefined} /><AdminRow><strong>Version</strong><span>{content.popup.version ?? 'v1'}</span></AdminRow><AdminButton tone="secondary" onClick={resetPopupVersion}>ให้สมาชิกเห็น popup ใหม่อีกครั้ง</AdminButton></EditorCard></AdminStack></AdminCard>
    </AdminGrid>

    <AdminGrid>
      <AdminCard title="Announcement" tone="warning"><AdminStack>{content.announcements.map((item, index) => <EditorCard key={index} title={`ประกาศ ${index + 1}`} enabled={item.enabled} onToggle={() => patchAnnouncement(index, { enabled: !item.enabled }, setContent)} onRemove={() => setContent((current) => ({ ...current, announcements: current.announcements.filter((_, i) => i !== index) }))} onMoveUp={index > 0 ? () => moveItem('announcements', index, -1, setContent) : undefined} onMoveDown={index < content.announcements.length - 1 ? () => moveItem('announcements', index, 1, setContent) : undefined}><Field label="หัวข้อ" value={item.title} onChange={(value) => patchAnnouncement(index, { title: value }, setContent)} /><Field label="ข้อความ" value={item.message} onChange={(value) => patchAnnouncement(index, { message: value }, setContent)} textarea /></EditorCard>)}<AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, announcements: [...current.announcements, { title: 'ประกาศใหม่', message: '', enabled: true }] }))}>เพิ่มประกาศ</AdminButton></AdminStack></AdminCard>
      <AdminCard title="FAQ" tone="neutral"><AdminStack>{content.faqs.map((item, index) => <EditorCard key={index} title={`FAQ ${index + 1}`} enabled={item.enabled} onToggle={() => patchFaq(index, { enabled: !item.enabled }, setContent)} onRemove={() => setContent((current) => ({ ...current, faqs: current.faqs.filter((_, i) => i !== index) }))} onMoveUp={index > 0 ? () => moveItem('faqs', index, -1, setContent) : undefined} onMoveDown={index < content.faqs.length - 1 ? () => moveItem('faqs', index, 1, setContent) : undefined}><Field label="คำถาม" value={item.question} onChange={(value) => patchFaq(index, { question: value }, setContent)} /><Field label="คำตอบ" value={item.answer} onChange={(value) => patchFaq(index, { answer: value }, setContent)} textarea /></EditorCard>)}<AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, faqs: [...current.faqs, { question: 'คำถามใหม่', answer: '', enabled: true }] }))}>เพิ่ม FAQ</AdminButton></AdminStack></AdminCard>
    </AdminGrid>

    <details style={advancedStyle}>
      <summary>Advanced: Preview JSON</summary>
      <span style={mutedStyle}>metadata อยู่ใน features.cms_content ส่วน binary อยู่ใน storage</span>
      <pre style={preStyle}>{JSON.stringify(content, null, 2)}</pre>
    </details>
  </AdminPage>;
}

function EditorCard({ title, enabled, onToggle, onRemove, onMoveUp, onMoveDown, children }: { title: string; enabled: boolean; onToggle: () => void; onRemove?: (() => void) | undefined; onMoveUp?: (() => void) | undefined; onMoveDown?: (() => void) | undefined; children: ReactNode }) { return <div style={editorStyle}><AdminRow><strong>{title}</strong><div style={rowActionsStyle}><AdminBadge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'เปิด' : 'ปิด'}</AdminBadge>{onMoveUp && <AdminButton tone="secondary" onClick={onMoveUp}>ขึ้น</AdminButton>}{onMoveDown && <AdminButton tone="secondary" onClick={onMoveDown}>ลง</AdminButton>}<AdminButton tone="secondary" onClick={onToggle}>{enabled ? 'ปิด' : 'เปิด'}</AdminButton>{onRemove && <AdminButton tone="danger" onClick={onRemove}>ลบ</AdminButton>}</div></AdminRow><div style={fieldGridStyle}>{children}</div></div>; }
function Field({ label, value, onChange, textarea = false, warning }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; warning?: string | undefined }) { return <label style={fieldStyle}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} style={textareaStyle} /> : <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}{warning && <small style={warningStyle}>{warning}</small>}</label>; }
function AssetSelect({ value, assets, onChange }: { value: string; assets: CmsAsset[]; onChange: (assetId: string) => void }) { const imageAssets = assets.filter((asset) => asset.enabled && asset.type === 'image' && isAssetUrl(asset.url)); return <label style={fieldStyle}><span>เลือกจาก Asset Library</span><select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}><option value="">ไม่เลือก asset</option>{imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} {asset.tag ? `· ${asset.tag}` : ''}</option>)}</select></label>; }
function MobilePreview({ content }: { content: CmsContent }) { const banner = content.banners.find((item) => item.enabled); const announcements = content.announcements.filter((item) => item.enabled).slice(0, 2); const faqs = content.faqs.filter((item) => item.enabled).slice(0, 2); const bannerImage = banner ? assetUrl(content.assets, banner.assetId) || banner.imageUrl : ''; const popupImage = assetUrl(content.assets, content.popup.assetId) || content.popup.imageUrl || ''; return <div style={phoneStyle}><div style={phoneTopStyle}>Member preview</div>{banner && <section style={phoneBannerStyle}>{bannerImage && isAssetUrl(bannerImage) && <img src={resolveAssetUrl(bannerImage)} alt="" style={phoneImageStyle} />}<strong>{banner.title || 'Banner'}</strong><span>{banner.subtitle || 'ข้อความรอง'}</span><em>{banner.href || '/games'}</em></section>}{announcements.map((item, index) => <div key={index} style={phoneCardStyle}><strong>{item.title || 'ประกาศ'}</strong><span>{item.message || 'ข้อความประกาศ'}</span></div>)}{faqs.map((item, index) => <div key={index} style={phoneCardStyle}><strong>{item.question || 'คำถาม'}</strong><span>{item.answer || 'คำตอบ'}</span></div>)}{content.popup.enabled && <div style={phonePopupStyle}>{popupImage && isAssetUrl(popupImage) && <img src={resolveAssetUrl(popupImage)} alt="" style={phoneImageStyle} />}<strong>{content.popup.title}</strong><span>{content.popup.message}</span><em>{content.popup.ctaLabel}</em></div>}</div>; }
function DesktopPreview({ content }: { content: CmsContent }) { const banner = content.banners.find((item) => item.enabled); const announcements = content.announcements.filter((item) => item.enabled).slice(0, 3); const bannerImage = banner ? assetUrl(content.assets, banner.assetId) || banner.imageUrl : ''; return <div style={desktopStyle}><header style={desktopHeaderStyle}><strong>Member site</strong><span>หน้าแรก · เกม · โปรโมชั่น · ติดต่อเรา</span></header>{banner ? <section style={desktopHeroStyle}>{bannerImage && isAssetUrl(bannerImage) && <img src={resolveAssetUrl(bannerImage)} alt="" style={desktopImageStyle} />}<div><strong>{banner.title || 'Banner'}</strong><p>{banner.subtitle || 'ข้อความรอง'}</p><em>{banner.href || '/games'}</em></div></section> : <div style={phoneCardStyle}>ยังไม่มี Banner ที่เปิดใช้งาน</div>}<section style={desktopAnnouncementStyle}>{announcements.map((item, index) => <div key={index}><strong>{item.title || 'ประกาศ'}</strong><span>{item.message || 'ข้อความประกาศ'}</span></div>)}</section></div>; }
function normalizeContent(value: unknown): CmsContent { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as Partial<CmsContent> : {}; const assets = Array.isArray((data as any).assets) ? (data as any).assets.map((item: any, index: number) => ({ id: String(item.id ?? `asset_${index}`), name: String(item.name ?? `Asset ${index + 1}`), url: String(item.url ?? ''), type: item.type === 'video' || item.type === 'link' ? item.type : 'image', tag: String(item.tag ?? ''), enabled: item.enabled !== false, storageKey: typeof item.storageKey === 'string' ? item.storageKey : undefined, mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined, sizeBytes: Number.isFinite(Number(item.sizeBytes)) ? Number(item.sizeBytes) : undefined, sha256: typeof item.sha256 === 'string' ? item.sha256 : undefined, source: item.source === 'upload' ? 'upload' : 'url' })) : defaultContent.assets; return { assets, banners: Array.isArray(data.banners) ? data.banners.map((item: any) => ({ title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), imageUrl: String(item.imageUrl ?? ''), href: String(item.href ?? '/games'), enabled: item.enabled !== false, assetId: String(item.assetId ?? '') })) : defaultContent.banners, popup: { ...defaultContent.popup, ...(data.popup && typeof data.popup === 'object' ? data.popup : {}) } as CmsContent['popup'], announcements: Array.isArray(data.announcements) ? data.announcements.map((item: any) => ({ title: String(item.title ?? ''), message: String(item.message ?? ''), enabled: item.enabled !== false })) : defaultContent.announcements, faqs: Array.isArray(data.faqs) ? data.faqs.map((item: any) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? ''), enabled: item.enabled !== false })) : defaultContent.faqs }; }

function patchAsset(index: number, patch: Partial<CmsAsset>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, assets: current.assets.map((item, i) => i === index ? { ...item, ...patch } : item) })); }
function patchBanner(index: number, patch: Partial<CmsContent['banners'][number]>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, banners: current.banners.map((item, i) => i === index ? { ...item, ...patch } : item) })); }
function patchPopup(patch: Partial<CmsContent['popup']>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, popup: { ...current.popup, ...patch } })); }
function patchAnnouncement(index: number, patch: Partial<CmsContent['announcements'][number]>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, announcements: current.announcements.map((item, i) => i === index ? { ...item, ...patch } : item) })); }
function patchFaq(index: number, patch: Partial<CmsContent['faqs'][number]>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, faqs: current.faqs.map((item, i) => i === index ? { ...item, ...patch } : item) })); }
function moveItem(key: 'banners' | 'announcements' | 'faqs', index: number, direction: -1 | 1, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => { const list = [...current[key]] as any[]; const target = index + direction; if (target < 0 || target >= list.length) return current; [list[index], list[target]] = [list[target], list[index]]; return { ...current, [key]: list }; }); }
function assetUrl(assets: CmsAsset[], assetId?: string) { if (!assetId) return ''; return assets.find((asset) => asset.id === assetId && asset.enabled)?.url ?? ''; }
function assetUsage(content: CmsContent, assetId: string) { const usage: string[] = []; content.banners.forEach((banner, index) => { if (banner.assetId === assetId) usage.push(`Banner ${index + 1}`); }); if (content.popup.assetId === assetId) usage.push('Popup'); return usage; }
function resolveAssetUrl(value: string) { if (value.startsWith('/public/cms-assets/')) return `${API_URL.replace(/\/$/, '')}${value}`; return value; }
function isAssetUrl(value: string) { if (!value) return true; if (/^\/public\/cms-assets\/[0-9a-f-]+\.(?:jpg|png|webp|gif|mp4|webm)$/i.test(value)) return true; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function isSafeHref(value: string) { if (value?.startsWith('/')) return true; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function countBrokenImages(content: CmsContent) { const bannerBroken = content.banners.filter((item) => item.imageUrl && !isAssetUrl(item.imageUrl)).length; const assetBroken = content.assets.filter((item) => item.url && !isAssetUrl(item.url)).length; const popupBroken = content.popup.imageUrl && !isAssetUrl(content.popup.imageUrl) ? 1 : 0; return bannerBroken + assetBroken + popupBroken; }
function buildWarnings(content: CmsContent) { const warnings: string[] = []; if (countBrokenImages(content) > 0) warnings.push('มี asset หรือรูปที่ไม่ถูกต้อง'); if (content.banners.some((item) => !item.title.trim() && item.enabled)) warnings.push('มี banner เปิดอยู่แต่ไม่มีหัวข้อ'); if (content.popup.enabled && !content.popup.message.trim()) warnings.push('เปิด popup แต่ยังไม่มีข้อความ'); return warnings; }
function validateFile(file: File) { if (!ACCEPTED_TYPES.has(file.type)) return 'รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP4 และ WebM'; const max = file.type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES; if (file.size === 0) return 'ไฟล์ว่าง'; if (file.size > max) return `ไฟล์ใหญ่เกิน ${Math.floor(max / 1024 / 1024)} MB`; return ''; }
function fileToDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); }); }
function formatBytes(bytes: number) { if (!bytes) return '0 B'; if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

const mutedStyle = { color: '#94a3b8', overflowWrap: 'anywhere' as const };
const editorStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10 } as const;
const rowActionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const fieldGridStyle = { display: 'grid', gap: 10 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, maxWidth: '100%' } as const;
const textareaStyle = { ...inputStyle, minHeight: 86, padding: 12, resize: 'vertical' as const };
const warningStyle = { color: '#fca5a5' } as const;
const assetPreviewStyle = { width: '100%', height: 180, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: '#020617' };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 14, background: '#020617', color: '#cbd5e1' } as const;
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
