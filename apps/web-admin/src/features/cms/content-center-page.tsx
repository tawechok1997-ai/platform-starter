'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
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
  AdminSkeleton,
  AdminStack,
  AdminToolbar,
} from '../../../app/(admin)/_components/admin-ui';
import {
  AdminSaveStateBadge,
  AdminUnsavedChangesNotice,
  useAdminUnsavedChanges,
} from '../../../app/(admin)/_components/admin-unsaved-changes';
import {
  cmsAssetUrl,
  cmsLifecyclePatch,
  defaultContent,
  isCmsPublished,
  normalizeContent,
  parseCmsContentJson,
  referencedAssetIds,
  responsiveMediaUrls,
  stringifyCmsContent,
  type CmsAnnouncement,
  type CmsAsset,
  type CmsBanner,
  type CmsContent,
  type CmsFaq,
  type CmsLifecycle,
  type CmsResponsiveMedia,
} from './media-contract';
import { useAdminPermissions } from './use-admin-permissions';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MEMBER_URL = process.env.NEXT_PUBLIC_MEMBER_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

type SectionId = 'assets' | 'banners' | 'popup' | 'announcements' | 'faqs' | 'advanced';
const sections: Array<{ id: SectionId; label: string }> = [
  { id: 'assets', label: 'Asset Library' },
  { id: 'banners', label: 'Banners' },
  { id: 'popup', label: 'Popup' },
  { id: 'announcements', label: 'ข่าวและกิจกรรม' },
  { id: 'faqs', label: 'FAQ' },
  { id: 'advanced', label: 'Advanced' },
];

export default function ContentCenterMediaPage() {
  const [content, setContent] = useState<CmsContent>(defaultContent);
  const [savedContent, setSavedContent] = useState<CmsContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState<SectionId>('assets');
  const [assetQuery, setAssetQuery] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadTag, setUploadTag] = useState('banner');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<CmsAsset | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  const [rawJson, setRawJson] = useState(() => stringifyCmsContent(defaultContent));
  const [rawDirty, setRawDirty] = useState(false);
  const [rawError, setRawError] = useState('');
  const permission = useAdminPermissions();
  const canUpdate = permission.can('settings.features.update');
  const busy = loading || saving || uploading;
  const warnings = useMemo(() => validateContent(content), [content]);
  const { isDirty, saveState } = useAdminUnsavedChanges({
    value: { content, raw: rawDirty ? rawJson : '' },
    savedValue: { content: savedContent, raw: '' },
    saving: saving || uploading,
  });

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!rawDirty) setRawJson(stringifyCmsContent(content));
  }, [content, rawDirty]);

  const stats = useMemo(() => {
    const lifecycle = [...content.banners, content.popup, ...content.announcements, ...content.faqs];
    return {
      assets: content.assets.length,
      bundled: content.assets.filter((asset) => asset.source === 'bundled').length,
      uploaded: content.assets.filter((asset) => asset.storageKey).length,
      published: lifecycle.filter(isCmsPublished).length,
      draft: lifecycle.filter((item) => item.lifecycle === 'draft').length,
      archived: lifecycle.filter((item) => item.lifecycle === 'archived').length,
    };
  }, [content]);

  const filteredAssets = useMemo(() => {
    const query = assetQuery.trim().toLocaleLowerCase('th');
    if (!query) return content.assets;
    return content.assets.filter((asset) => `${asset.name} ${asset.id} ${asset.tag ?? ''}`.toLocaleLowerCase('th').includes(query));
  }, [assetQuery, content.assets]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด Content Center...');
    try {
      const response = await adminApiFetch('/admin/settings/features');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'โหลด Content Center ไม่สำเร็จ');
      const next = normalizeContent(data?.settings?.cms_content);
      setContent(next);
      setSavedContent(next);
      setRawJson(stringifyCmsContent(next));
      setRawDirty(false);
      setRawError('');
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลด Content Center ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function save(nextContent = content) {
    if (!canUpdate) {
      setMessage('บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไข Content Center');
      return false;
    }
    const nextWarnings = validateContent(nextContent);
    if (nextWarnings.length) {
      setMessage(`ยังบันทึกไม่ได้: ${nextWarnings.join(' • ')}`);
      return false;
    }
    setSaving(true);
    setMessage('กำลังบันทึก Content Center...');
    try {
      const response = await adminApiFetch('/admin/settings/features', {
        method: 'PUT',
        body: JSON.stringify({ cms_content: nextContent }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'บันทึก Content Center ไม่สำเร็จ');
      setSavedContent(nextContent);
      setRawJson(stringifyCmsContent(nextContent));
      setRawDirty(false);
      setRawError('');
      setMessage('บันทึก Content Center แล้ว หน้า Member จะอ่านค่ารอบถัดไปโดยไม่ต้อง Deploy');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึก Content Center ไม่สำเร็จ');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function requestReload() {
    if (isDirty || rawDirty) setConfirmReload(true);
    else void load();
  }

  async function uploadAsset() {
    if (!canUpdate || !uploadFile) return;
    const invalid = validateUpload(uploadFile);
    if (invalid) { setMessage(invalid); return; }
    setUploading(true);
    setMessage('กำลังอัปโหลด Asset...');
    try {
      const response = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'POST',
        body: JSON.stringify({
          name: uploadName.trim() || uploadFile.name,
          tag: uploadTag.trim(),
          type: uploadFile.type.startsWith('video/') ? 'video' : 'image',
          dataUrl: await fileToDataUrl(uploadFile),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'อัปโหลด Asset ไม่สำเร็จ');
      const uploaded = normalizeContent({ assets: [data], banners: [], announcements: [], faqs: [] }).assets.find((asset) => asset.id === data?.id);
      if (!uploaded) throw new Error('API ส่งข้อมูล Asset ไม่ถูกต้อง');
      const nextAssets = content.assets.some((asset) => asset.id === uploaded.id)
        ? content.assets.map((asset) => asset.id === uploaded.id ? { ...asset, ...uploaded } : asset)
        : [...content.assets, uploaded];
      const next = { ...content, assets: nextAssets };
      setContent(next);
      setUploadFile(null);
      setUploadName('');
      const saved = await save(next);
      if (saved) setMessage(data?.deduplicated ? 'พบไฟล์เดิม ระบบนำ Asset ที่มีอยู่กลับมาใช้โดยไม่สร้างไฟล์ซ้ำ' : 'อัปโหลดและบันทึก Asset แล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'อัปโหลด Asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function removeSelectedAsset() {
    const asset = deleteAsset;
    if (!asset || !canUpdate) return;
    const usage = assetUsage(content, asset.id);
    if (usage.length) {
      setDeleteAsset(null);
      setMessage(`ลบไม่ได้ Asset ยังถูกใช้ใน ${usage.join(', ')}`);
      return;
    }
    if (asset.protected || asset.source === 'bundled') {
      setDeleteAsset(null);
      setMessage('Asset ค่าเริ่มต้นมี ID คงที่ จึงลบไม่ได้ แต่เปลี่ยน URL หรือปิดใช้งานได้');
      return;
    }
    setUploading(true);
    try {
      if (asset.storageKey) {
        const response = await adminApiFetch('/admin/settings/cms-assets', {
          method: 'DELETE',
          body: JSON.stringify({ storageKey: asset.storageKey }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message ?? 'ลบไฟล์ไม่สำเร็จ');
      }
      const next = { ...content, assets: content.assets.filter((item) => item.id !== asset.id) };
      setContent(next);
      setDeleteAsset(null);
      await save(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ลบ Asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  function applyRawJson() {
    const parsed = parseCmsContentJson(rawJson);
    if (!parsed.ok) { setRawError(parsed.message); return; }
    setContent(parsed.content);
    setRawJson(stringifyCmsContent(parsed.content));
    setRawDirty(false);
    setRawError('');
    setMessage('นำ JSON มาใช้แล้ว ตรวจ Preview และกดบันทึกอีกครั้ง');
  }

  return (
    <AdminPage
      eyebrow="Brand & Experience"
      title="Content Center"
      description="จัดการรูป Banner, Popup, ข่าว, กิจกรรม และ Asset ที่หน้า Member ใช้งานจริง"
      actions={<>
        <AdminSaveStateBadge state={saveState} />
        <AdminButton tone="secondary" onClick={requestReload} disabled={busy}>รีเฟรช</AdminButton>
        {canUpdate && <AdminButton onClick={() => void save()} disabled={busy || !isDirty || warnings.length > 0}>บันทึก</AdminButton>}
      </>}
    >
      <style jsx global>{pageCss}</style>
      {message && <AdminNotice tone={message.includes('ไม่ได้') || message.includes('ไม่สำเร็จ') || message.includes('ลบไม่ได้') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
      <AdminUnsavedChangesNotice isDirty={isDirty || rawDirty}>มีการแก้ไข Content Center ที่ยังไม่ได้บันทึก</AdminUnsavedChangesNotice>
      {!permission.ready && <AdminNotice>กำลังตรวจสิทธิ์การแก้ไข...</AdminNotice>}
      {permission.ready && !canUpdate && <AdminNotice tone="warning">โหมดอ่านอย่างเดียว ปุ่มแก้ไข อัปโหลด ลบ และบันทึกถูกปิดตามสิทธิ์</AdminNotice>}
      {warnings.length > 0 && <AdminNotice tone="danger">{warnings.join(' • ')}</AdminNotice>}

      <nav className="cms-section-nav" aria-label="ส่วนของ Content Center">
        {sections.map((section) => <button key={section.id} type="button" className={activeSection === section.id ? 'is-active' : ''} onClick={() => { setActiveSection(section.id); document.getElementById(`cms-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{section.label}</button>)}
      </nav>

      <AdminMetricGrid>
        <AdminMetric title="Assets" value={String(stats.assets)} helper={`${stats.bundled} ค่าเริ่มต้น · ${stats.uploaded} อัปโหลด`} />
        <AdminMetric title="เผยแพร่" value={String(stats.published)} tone="success" />
        <AdminMetric title="ฉบับร่าง" value={String(stats.draft)} tone="warning" />
        <AdminMetric title="เก็บถาวร" value={String(stats.archived)} />
      </AdminMetricGrid>

      {loading ? <AdminSkeleton lines={8} /> : <>
        <section id="cms-assets" className="cms-anchor">
          <AdminGrid>
            <AdminCard title="อัปโหลด Asset" description="ตรวจ MIME, ขนาด, signature และ SHA-256 ก่อนเก็บ" tone="success">
              <AdminStack>
                <Field label="ชื่อ Asset" value={uploadName} onChange={setUploadName} disabled={!canUpdate} helper="เว้นว่างเพื่อใช้ชื่อไฟล์" />
                <Field label="Tag" value={uploadTag} onChange={setUploadTag} disabled={!canUpdate} helper="เช่น banner, news, popup" />
                <label className="cms-field"><span>ไฟล์</span><input type="file" disabled={!canUpdate || busy} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />{uploadFile && <small>{uploadFile.name} · {formatBytes(uploadFile.size)}</small>}</label>
                {canUpdate && <AdminButton onClick={() => void uploadAsset()} disabled={busy || !uploadFile}>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและเพิ่มเข้า Library'}</AdminButton>}
              </AdminStack>
            </AdminCard>
            <AdminCard title="Member Preview" description="Desktop และ Mobile ใช้รูปคนละชุดได้">
              <Preview content={content} />
            </AdminCard>
          </AdminGrid>

          <AdminCard title="Asset Library" description="ค่าเริ่มต้นมี Stable Asset ID เพื่อป้องกันรายการซ้ำและรักษา reference">
            <AdminToolbar><input className="cms-input" value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} placeholder="ค้นหาชื่อ, ID หรือ tag" /><span>{filteredAssets.length}/{content.assets.length} รายการ</span></AdminToolbar>
            <div className="cms-asset-grid">
              {filteredAssets.map((asset) => <AssetCard key={asset.id} asset={asset} canUpdate={canUpdate} usage={assetUsage(content, asset.id)} onPatch={(patch) => patchAsset(asset.id, patch, setContent)} onDelete={() => setDeleteAsset(asset)} />)}
            </div>
          </AdminCard>
        </section>

        <section id="cms-banners" className="cms-anchor">
          <AdminCard title="Homepage Banners" description="แยกรูป Desktop/Mobile, เปิดปิด, เรียงลำดับ และกำหนดลิงก์ปลายทาง" tone="success">
            <AdminStack>
              {content.banners.map((banner, index) => <LifecycleCard key={banner.id} title={banner.title || `Banner ${index + 1}`} item={banner} canUpdate={canUpdate} onLifecycle={(lifecycle) => patchBanner(index, cmsLifecyclePatch(lifecycle), setContent)} onToggle={() => patchBanner(index, { enabled: !banner.enabled }, setContent)} onMoveUp={index > 0 ? () => moveItem('banners', index, -1, setContent) : undefined} onMoveDown={index < content.banners.length - 1 ? () => moveItem('banners', index, 1, setContent) : undefined} onRemove={() => setContent((current) => ({ ...current, banners: current.banners.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Field label="Stable ID" value={banner.id} onChange={(value) => patchBanner(index, { id: slug(value) }, setContent)} disabled={!canUpdate} />
                <Field label="หัวข้อ" value={banner.title} onChange={(value) => patchBanner(index, { title: value }, setContent)} disabled={!canUpdate} />
                <Field label="ข้อความรอง" value={banner.subtitle} onChange={(value) => patchBanner(index, { subtitle: value }, setContent)} disabled={!canUpdate} />
                <Field label="ลิงก์ปลายทาง" value={banner.href} onChange={(value) => patchBanner(index, { href: value }, setContent)} disabled={!canUpdate} />
                <ResponsiveMediaFields media={banner} assets={content.assets} disabled={!canUpdate} onPatch={(patch) => patchBanner(index, patch, setContent)} />
              </LifecycleCard>)}
              {canUpdate && <AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, banners: [...current.banners, createBanner(current.banners.length)] }))}>เพิ่ม Banner</AdminButton>}
            </AdminStack>
          </AdminCard>
        </section>

        <section id="cms-popup" className="cms-anchor">
          <AdminCard title="Popup" description="เปลี่ยนรูปและ version เพื่อให้ Member เห็นประกาศรอบใหม่" tone="warning">
            <LifecycleCard title="Popup หลัก" item={content.popup} canUpdate={canUpdate} onLifecycle={(lifecycle) => setContent((current) => ({ ...current, popup: { ...current.popup, ...cmsLifecyclePatch(lifecycle) } }))} onToggle={() => setContent((current) => ({ ...current, popup: { ...current.popup, enabled: !current.popup.enabled } }))}>
              <Field label="หัวข้อ" value={content.popup.title} onChange={(value) => patchPopup({ title: value }, setContent)} disabled={!canUpdate} />
              <Field label="ข้อความ" value={content.popup.message} onChange={(value) => patchPopup({ message: value }, setContent)} disabled={!canUpdate} textarea />
              <Field label="ข้อความปุ่ม" value={content.popup.ctaLabel} onChange={(value) => patchPopup({ ctaLabel: value }, setContent)} disabled={!canUpdate} />
              <Field label="ลิงก์ปลายทาง" value={content.popup.href} onChange={(value) => patchPopup({ href: value }, setContent)} disabled={!canUpdate} />
              <ResponsiveMediaFields media={content.popup} assets={content.assets} disabled={!canUpdate} onPatch={(patch) => patchPopup(patch, setContent)} />
              <AdminRow><strong>Version</strong><span>{content.popup.version}</span>{canUpdate && <AdminButton tone="secondary" size="compact" onClick={() => patchPopup({ version: `v${Date.now()}` }, setContent)}>สร้าง Version ใหม่</AdminButton>}</AdminRow>
            </LifecycleCard>
          </AdminCard>
        </section>

        <section id="cms-announcements" className="cms-anchor">
          <AdminCard title="ข่าวสาร กิจกรรม และประกาศ" description="Member อ่านข้อมูลจาก Public API พร้อมรูป Desktop/Mobile">
            <AdminStack>
              {content.announcements.map((item, index) => <LifecycleCard key={item.id} title={item.title || `รายการ ${index + 1}`} item={item} canUpdate={canUpdate} onLifecycle={(lifecycle) => patchAnnouncement(index, cmsLifecyclePatch(lifecycle), setContent)} onToggle={() => patchAnnouncement(index, { enabled: !item.enabled }, setContent)} onMoveUp={index > 0 ? () => moveItem('announcements', index, -1, setContent) : undefined} onMoveDown={index < content.announcements.length - 1 ? () => moveItem('announcements', index, 1, setContent) : undefined} onRemove={() => setContent((current) => ({ ...current, announcements: current.announcements.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Field label="Stable ID" value={item.id} onChange={(value) => patchAnnouncement(index, { id: slug(value) }, setContent)} disabled={!canUpdate} />
                <label className="cms-field"><span>ประเภท</span><select disabled={!canUpdate} value={item.kind} onChange={(event) => patchAnnouncement(index, { kind: event.target.value as CmsAnnouncement['kind'] }, setContent)}><option value="news">ข่าวสาร</option><option value="event">กิจกรรม</option><option value="promotion">โปรโมชัน</option><option value="system">ระบบ</option></select></label>
                <Field label="หัวข้อ" value={item.title} onChange={(value) => patchAnnouncement(index, { title: value }, setContent)} disabled={!canUpdate} />
                <Field label="ข้อความ" value={item.message} onChange={(value) => patchAnnouncement(index, { message: value }, setContent)} disabled={!canUpdate} textarea />
                <Field label="ลิงก์ปลายทาง" value={item.href ?? ''} onChange={(value) => patchAnnouncement(index, { href: value }, setContent)} disabled={!canUpdate} />
                <ResponsiveMediaFields media={item} assets={content.assets} disabled={!canUpdate} onPatch={(patch) => patchAnnouncement(index, patch, setContent)} />
              </LifecycleCard>)}
              {canUpdate && <AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, announcements: [...current.announcements, createAnnouncement(current.announcements.length)] }))}>เพิ่มข่าวหรือกิจกรรม</AdminButton>}
            </AdminStack>
          </AdminCard>
        </section>

        <section id="cms-faqs" className="cms-anchor">
          <AdminCard title="FAQ">
            <AdminStack>
              {content.faqs.map((item, index) => <LifecycleCard key={item.id} title={item.question || `FAQ ${index + 1}`} item={item} canUpdate={canUpdate} onLifecycle={(lifecycle) => patchFaq(index, cmsLifecyclePatch(lifecycle), setContent)} onToggle={() => patchFaq(index, { enabled: !item.enabled }, setContent)} onMoveUp={index > 0 ? () => moveItem('faqs', index, -1, setContent) : undefined} onMoveDown={index < content.faqs.length - 1 ? () => moveItem('faqs', index, 1, setContent) : undefined} onRemove={() => setContent((current) => ({ ...current, faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index) }))}>
                <Field label="คำถาม" value={item.question} onChange={(value) => patchFaq(index, { question: value }, setContent)} disabled={!canUpdate} />
                <Field label="คำตอบ" value={item.answer} onChange={(value) => patchFaq(index, { answer: value }, setContent)} disabled={!canUpdate} textarea />
              </LifecycleCard>)}
              {canUpdate && <AdminButton tone="secondary" onClick={() => setContent((current) => ({ ...current, faqs: [...current.faqs, createFaq(current.faqs.length)] }))}>เพิ่ม FAQ</AdminButton>}
            </AdminStack>
          </AdminCard>
        </section>

        <section id="cms-advanced" className="cms-anchor">
          <AdminCard title="Advanced JSON" description="สำหรับตรวจสัญญาข้อมูลเท่านั้น JSON ยังต้องผ่าน normalization และกดบันทึก">
            <textarea className="cms-json" value={rawJson} disabled={!canUpdate} spellCheck={false} onChange={(event) => { setRawJson(event.target.value); setRawDirty(true); setRawError(''); }} />
            {rawError && <AdminNotice tone="danger">{rawError}</AdminNotice>}
            {canUpdate && <AdminToolbar><AdminButton onClick={applyRawJson} disabled={!rawDirty || busy}>นำ JSON มาใช้</AdminButton><AdminButton tone="secondary" onClick={() => { setRawJson(stringifyCmsContent(content)); setRawDirty(false); setRawError(''); }} disabled={busy}>คืนค่าจากฟอร์ม</AdminButton></AdminToolbar>}
          </AdminCard>
        </section>
      </>}

      {canUpdate && isDirty && <div className="cms-sticky-actions"><span>มีการแก้ไขที่ยังไม่บันทึก</span><AdminButton tone="secondary" onClick={requestReload} disabled={busy}>ยกเลิกการแก้ไข</AdminButton><AdminButton onClick={() => void save()} disabled={busy || warnings.length > 0}>บันทึกทั้งหมด</AdminButton></div>}

      <AdminConfirmDialog open={Boolean(deleteAsset)} title="ลบ Asset" description={deleteAsset ? `ลบ ${deleteAsset.name} ออกจาก Asset Library` : ''} confirmLabel="ลบ Asset" tone="danger" busy={uploading} onCancel={() => setDeleteAsset(null)} onConfirm={() => void removeSelectedAsset()} details={deleteAsset ? <p>Backend จะตรวจซ้ำว่า Asset ไม่ถูกอ้างอิงจาก Banner, Popup, ข่าว หรือ Promotion</p> : undefined} />
      <AdminConfirmDialog open={confirmReload} title="ทิ้งการแก้ไขที่ยังไม่บันทึก" description="ระบบจะโหลดข้อมูลล่าสุดจาก Database และยกเลิกการแก้ไขในหน้านี้" confirmLabel="ทิ้งการแก้ไข" tone="danger" onCancel={() => setConfirmReload(false)} onConfirm={() => { setConfirmReload(false); void load(); }} />
    </AdminPage>
  );
}

function AssetCard({ asset, usage, canUpdate, onPatch, onDelete }: { asset: CmsAsset; usage: string[]; canUpdate: boolean; onPatch: (patch: Partial<CmsAsset>) => void; onDelete: () => void }) {
  return <article className="cms-editor-card">
    <AdminRow><div><strong>{asset.name}</strong><small className="cms-muted">{asset.id}</small></div><div className="cms-actions"><AdminBadge tone={asset.enabled ? 'success' : 'neutral'}>{asset.enabled ? 'เปิด' : 'ปิด'}</AdminBadge>{asset.source === 'bundled' && <AdminBadge>ค่าเริ่มต้น</AdminBadge>}</div></AdminRow>
    {asset.type === 'image' && asset.url && <MediaPreview desktop={asset.url} mobile={asset.url} alt={asset.name} />}
    <div className="cms-form-grid">
      <Field label="ชื่อ" value={asset.name} onChange={(value) => onPatch({ name: value })} disabled={!canUpdate} />
      <Field label="URL" value={asset.url} onChange={(value) => onPatch({ url: value })} disabled={!canUpdate} />
      <Field label="Tag" value={asset.tag ?? ''} onChange={(value) => onPatch({ tag: value })} disabled={!canUpdate} />
    </div>
    {usage.length > 0 && <small className="cms-usage">ใช้งานใน: {usage.join(', ')}</small>}
    {asset.sha256 && <small className="cms-muted">SHA-256: {asset.sha256}</small>}
    {canUpdate && <div className="cms-actions"><AdminButton tone="secondary" size="compact" onClick={() => onPatch({ enabled: !asset.enabled })}>{asset.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</AdminButton>{!asset.protected && <AdminButton tone="danger" size="compact" onClick={onDelete} disabled={usage.length > 0}>ลบ</AdminButton>}</div>}
  </article>;
}

function LifecycleCard({ title, item, canUpdate, onLifecycle, onToggle, onRemove, onMoveUp, onMoveDown, children }: { title: string; item: { lifecycle: CmsLifecycle; enabled: boolean }; canUpdate: boolean; onLifecycle: (value: CmsLifecycle) => void; onToggle: () => void; onRemove?: (() => void) | undefined; onMoveUp?: (() => void) | undefined; onMoveDown?: (() => void) | undefined; children: ReactNode }) {
  return <article className="cms-editor-card">
    <AdminRow><div><strong>{title}</strong><small className="cms-muted">{lifecycleLabel(item.lifecycle)}</small></div><div className="cms-actions"><AdminBadge tone={item.lifecycle === 'published' ? 'success' : item.lifecycle === 'draft' ? 'warning' : 'neutral'}>{lifecycleLabel(item.lifecycle)}</AdminBadge>{canUpdate && <><select className="cms-compact" value={item.lifecycle} onChange={(event) => onLifecycle(event.target.value as CmsLifecycle)}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select>{onMoveUp && <AdminButton tone="secondary" size="compact" onClick={onMoveUp}>ขึ้น</AdminButton>}{onMoveDown && <AdminButton tone="secondary" size="compact" onClick={onMoveDown}>ลง</AdminButton>}<AdminButton tone="secondary" size="compact" onClick={onToggle} disabled={item.lifecycle !== 'published'}>{item.enabled ? 'ซ่อน' : 'แสดง'}</AdminButton>{onRemove && <AdminButton tone="danger" size="compact" onClick={onRemove}>ลบ</AdminButton>}</>}</div></AdminRow>
    <div className="cms-form-grid">{children}</div>
  </article>;
}

function ResponsiveMediaFields({ media, assets, disabled, onPatch }: { media: CmsResponsiveMedia; assets: CmsAsset[]; disabled: boolean; onPatch: (patch: Partial<CmsResponsiveMedia>) => void }) {
  const urls = responsiveMediaUrls(media, assets);
  return <>
    <AssetSelect label="Asset Desktop" value={media.desktopAssetId ?? media.assetId ?? ''} assets={assets} disabled={disabled} onChange={(desktopAssetId) => onPatch({ desktopAssetId, assetId: desktopAssetId, desktopImageUrl: cmsAssetUrl(assets, desktopAssetId), imageUrl: cmsAssetUrl(assets, desktopAssetId) })} />
    <Field label="Desktop URL" value={media.desktopImageUrl ?? media.imageUrl ?? ''} onChange={(desktopImageUrl) => onPatch({ desktopImageUrl, imageUrl: desktopImageUrl, desktopAssetId: '', assetId: '' })} disabled={disabled} />
    <AssetSelect label="Asset Mobile" value={media.mobileAssetId ?? ''} assets={assets} disabled={disabled} onChange={(mobileAssetId) => onPatch({ mobileAssetId, mobileImageUrl: cmsAssetUrl(assets, mobileAssetId) })} />
    <Field label="Mobile URL" value={media.mobileImageUrl ?? ''} onChange={(mobileImageUrl) => onPatch({ mobileImageUrl, mobileAssetId: '' })} disabled={disabled} helper="ว่างได้ ระบบจะ fallback ไป Desktop" />
    {(urls.desktop || urls.mobile) && <div className="cms-media-span"><MediaPreview desktop={urls.desktop} mobile={urls.mobile} alt="Media preview" /></div>}
  </>;
}

function AssetSelect({ label, value, assets, disabled, onChange }: { label: string; value: string; assets: CmsAsset[]; disabled: boolean; onChange: (value: string) => void }) {
  return <label className="cms-field"><span>{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">ไม่เลือก Asset</option>{assets.filter((asset) => asset.enabled && asset.type === 'image' && asset.url).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} · {asset.id}</option>)}</select></label>;
}

function Field({ label, value, onChange, disabled, textarea = false, helper }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; textarea?: boolean; helper?: string }) {
  return <label className="cms-field"><span>{label}</span>{textarea ? <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /> : <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />}{helper && <small>{helper}</small>}</label>;
}

function Preview({ content }: { content: CmsContent }) {
  const banner = content.banners.find(isCmsPublished);
  const announcement = content.announcements.find(isCmsPublished);
  const bannerUrls = banner ? responsiveMediaUrls(banner, content.assets) : { desktop: '', mobile: '', legacy: '' };
  return <div className="cms-preview-grid"><div className="cms-device cms-device--desktop"><small>DESKTOP</small>{banner ? <MediaPreview desktop={bannerUrls.desktop} mobile={bannerUrls.mobile} alt={banner.title} /> : <p>ยังไม่มี Banner เผยแพร่</p>}<strong>{banner?.title}</strong><p>{announcement?.title}</p></div><div className="cms-device cms-device--mobile"><small>MOBILE</small>{banner ? <MediaPreview desktop={bannerUrls.desktop} mobile={bannerUrls.mobile} alt={banner.title} forceMobile /> : <p>ยังไม่มี Banner เผยแพร่</p>}<strong>{banner?.title}</strong><p>{announcement?.title}</p></div></div>;
}

function MediaPreview({ desktop, mobile, alt, forceMobile = false }: { desktop: string; mobile: string; alt: string; forceMobile?: boolean }) {
  const primary = forceMobile ? mobile || desktop : desktop || mobile;
  if (!primary) return <div className="cms-media-empty">ไม่มีรูป</div>;
  return <picture className="cms-media-preview">{!forceMobile && mobile && <source media="(max-width: 640px)" srcSet={resolveAssetUrl(mobile)} />}<img src={resolveAssetUrl(primary)} alt={alt} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('is-broken'); }} /></picture>;
}

function patchAsset(id: string, patch: Partial<CmsAsset>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, assets: current.assets.map((item) => item.id === id ? { ...item, ...patch } : item) })); }
function patchBanner(index: number, patch: Partial<CmsBanner>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
function patchPopup(patch: Partial<CmsContent['popup']>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, popup: { ...current.popup, ...patch } })); }
function patchAnnouncement(index: number, patch: Partial<CmsAnnouncement>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, announcements: current.announcements.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }
function patchFaq(index: number, patch: Partial<CmsFaq>, setContent: Dispatch<SetStateAction<CmsContent>>) { setContent((current) => ({ ...current, faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })); }

function moveItem(key: 'banners' | 'announcements' | 'faqs', index: number, direction: -1 | 1, setContent: Dispatch<SetStateAction<CmsContent>>) {
  setContent((current) => {
    const list = [...current[key]] as Array<CmsBanner | CmsAnnouncement | CmsFaq>;
    const target = index + direction;
    if (target < 0 || target >= list.length) return current;
    [list[index], list[target]] = [list[target]!, list[index]!];
    return { ...current, [key]: list } as CmsContent;
  });
}

function assetUsage(content: CmsContent, id: string) {
  const usage: string[] = [];
  content.banners.forEach((item, index) => { if ([item.assetId, item.desktopAssetId, item.mobileAssetId].includes(id)) usage.push(`Banner ${index + 1}`); });
  if ([content.popup.assetId, content.popup.desktopAssetId, content.popup.mobileAssetId].includes(id)) usage.push('Popup');
  content.announcements.forEach((item, index) => { if ([item.assetId, item.desktopAssetId, item.mobileAssetId].includes(id)) usage.push(`ข่าว/กิจกรรม ${index + 1}`); });
  return usage;
}

function validateContent(content: CmsContent) {
  const warnings: string[] = [];
  const assetIds = new Set<string>();
  for (const asset of content.assets) {
    if (!asset.id.trim()) warnings.push('มี Asset ที่ไม่มี ID');
    if (assetIds.has(asset.id)) warnings.push(`Asset ID ซ้ำ: ${asset.id}`);
    assetIds.add(asset.id);
    if (asset.url && !isAssetUrl(asset.url)) warnings.push(`URL Asset ไม่ถูกต้อง: ${asset.name}`);
  }
  const itemIds = new Set<string>();
  for (const item of [...content.banners, ...content.announcements, ...content.faqs]) {
    const id = 'id' in item ? item.id : '';
    if (id && itemIds.has(id)) warnings.push(`Content ID ซ้ำ: ${id}`);
    if (id) itemIds.add(id);
  }
  content.banners.forEach((item) => {
    if (isCmsPublished(item) && !item.title.trim()) warnings.push('Banner ที่เผยแพร่ต้องมีหัวข้อ');
    if (!isSafeHref(item.href)) warnings.push(`ลิงก์ Banner ไม่ปลอดภัย: ${item.title || item.id}`);
    validateMedia(item, assetIds, warnings, item.title || item.id);
  });
  validateMedia(content.popup, assetIds, warnings, 'Popup');
  if (isCmsPublished(content.popup) && !content.popup.message.trim()) warnings.push('Popup ที่เผยแพร่ต้องมีข้อความ');
  content.announcements.forEach((item) => {
    if (isCmsPublished(item) && (!item.title.trim() || !item.message.trim())) warnings.push(`ข่าว/กิจกรรมที่เผยแพร่ต้องมีหัวข้อและข้อความ: ${item.id}`);
    if (item.href && !isSafeHref(item.href)) warnings.push(`ลิงก์ข่าว/กิจกรรมไม่ปลอดภัย: ${item.id}`);
    validateMedia(item, assetIds, warnings, item.title || item.id);
  });
  const referenced = referencedAssetIds(content);
  referenced.forEach((id) => { if (!assetIds.has(id)) warnings.push(`อ้างอิง Asset ที่ไม่มีอยู่: ${id}`); });
  return [...new Set(warnings)];
}

function validateMedia(media: CmsResponsiveMedia, assetIds: Set<string>, warnings: string[], label: string) {
  [media.imageUrl, media.desktopImageUrl, media.mobileImageUrl].forEach((url) => { if (url && !isAssetUrl(url)) warnings.push(`URL รูปไม่ถูกต้อง: ${label}`); });
  [media.assetId, media.desktopAssetId, media.mobileAssetId].forEach((id) => { if (id && !assetIds.has(id)) warnings.push(`Asset อ้างอิงไม่พบ: ${label} → ${id}`); });
}

function validateUpload(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) return 'รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP4 และ WebM';
  if (!file.size) return 'ไฟล์ว่าง';
  const max = file.type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  return file.size > max ? `ไฟล์ใหญ่เกิน ${Math.floor(max / 1024 / 1024)} MB` : '';
}

function isAssetUrl(value: string) {
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}
function isSafeHref(value: string) { return value.startsWith('/') && !value.startsWith('//') || isAssetUrl(value) && /^https?:/i.test(value); }
function resolveAssetUrl(value: string) { if (!value) return ''; if (value.startsWith('/public/cms-assets/')) return `${API_URL.replace(/\/$/, '')}${value}`; if (value.startsWith('/') && MEMBER_URL) return `${MEMBER_URL.replace(/\/$/, '')}${value}`; return value; }
function lifecycleLabel(value: CmsLifecycle) { return value === 'published' ? 'เผยแพร่' : value === 'archived' ? 'เก็บถาวร' : 'ฉบับร่าง'; }
function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, ''); }
function createBanner(index: number): CmsBanner { return { id: `banner-${Date.now()}`, title: `Banner ${index + 1}`, subtitle: '', href: '/browse/promotions', lifecycle: 'draft', enabled: false, imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', assetId: '', desktopAssetId: '', mobileAssetId: '' }; }
function createAnnouncement(index: number): CmsAnnouncement { return { id: `announcement-${Date.now()}`, kind: 'news', title: `ข่าวสาร ${index + 1}`, message: '', href: '', lifecycle: 'draft', enabled: false, imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', assetId: '', desktopAssetId: '', mobileAssetId: '' }; }
function createFaq(index: number): CmsFaq { return { id: `faq-${Date.now()}`, question: `คำถาม ${index + 1}`, answer: '', lifecycle: 'draft', enabled: false }; }
function fileToDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); }); }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

const pageCss = `
.cms-section-nav{position:sticky;top:8px;z-index:20;display:flex;gap:8px;overflow-x:auto;padding:10px;margin:0 0 18px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:rgba(8,12,20,.94);backdrop-filter:blur(14px)}
.cms-section-nav button{white-space:nowrap;border:0;border-radius:10px;padding:9px 12px;background:transparent;color:inherit;font-weight:800;cursor:pointer}.cms-section-nav button.is-active{background:rgba(245,197,66,.15);color:#f5c542}.cms-anchor{scroll-margin-top:90px;margin-top:18px}.cms-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cms-field{display:grid;gap:6px;min-width:0;font-weight:800}.cms-field input,.cms-field textarea,.cms-field select,.cms-input,.cms-compact{width:100%;min-height:44px;border:1px solid rgba(148,163,184,.24);border-radius:10px;background:rgba(15,23,42,.72);color:inherit;padding:10px 12px}.cms-field textarea{min-height:96px;resize:vertical}.cms-field small,.cms-muted{display:block;color:#94a3b8;font-weight:600;overflow-wrap:anywhere}.cms-asset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cms-editor-card{display:grid;gap:14px;min-width:0;padding:16px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:rgba(15,23,42,.42)}.cms-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.cms-media-span{grid-column:1/-1}.cms-media-preview{display:block;position:relative;min-height:120px;border-radius:12px;overflow:hidden;background:rgba(2,6,23,.72)}.cms-media-preview img{display:block;width:100%;height:clamp(120px,20vw,260px);object-fit:cover}.cms-media-preview.is-broken:after{content:'รูปโหลดไม่สำเร็จ ระบบ Member จะใช้ fallback';display:grid;place-items:center;min-height:120px;padding:20px;color:#fca5a5;text-align:center}.cms-media-empty{display:grid;place-items:center;min-height:120px;border:1px dashed rgba(148,163,184,.3);border-radius:12px;color:#94a3b8}.cms-preview-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}.cms-device{display:grid;gap:8px;min-width:0;padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:14px;background:#080b12;overflow:hidden}.cms-device--mobile{max-width:260px;justify-self:center}.cms-device .cms-media-preview img{height:150px}.cms-device--mobile .cms-media-preview img{height:220px}.cms-usage{color:#fbbf24}.cms-json{width:100%;min-height:360px;border:1px solid rgba(148,163,184,.24);border-radius:12px;background:#05070d;color:#dbeafe;padding:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}.cms-sticky-actions{position:sticky;bottom:12px;z-index:30;display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:20px;padding:12px 14px;border:1px solid rgba(245,197,66,.35);border-radius:14px;background:rgba(8,12,20,.96);box-shadow:0 12px 40px rgba(0,0,0,.35)}.cms-sticky-actions span{margin-right:auto;font-weight:800;color:#f5c542}
@media(max-width:900px){.cms-form-grid,.cms-asset-grid,.cms-preview-grid{grid-template-columns:1fr}.cms-device--mobile{max-width:none;width:100%}.cms-sticky-actions{flex-wrap:wrap}.cms-sticky-actions span{width:100%}}
@media(max-width:560px){.cms-editor-card{padding:12px}.cms-section-nav{top:4px;margin-inline:-4px}.cms-actions{justify-content:flex-start}.cms-sticky-actions{bottom:6px}.cms-sticky-actions button{flex:1}}
`;
