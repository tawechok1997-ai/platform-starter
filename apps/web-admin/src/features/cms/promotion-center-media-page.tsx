'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminFilterBar,
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
import { cmsAssetUrl, normalizeContent, type CmsAsset } from './media-contract';
import { useAdminPermissions } from './use-admin-permissions';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MEMBER_URL = process.env.NEXT_PUBLIC_MEMBER_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';

type PromotionLifecycle = 'draft' | 'published' | 'archived';
type LifecycleFilter = 'all' | PromotionLifecycle;

type PromotionCampaign = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  lifecycle: PromotionLifecycle;
  bonusType: 'fixed' | 'percent';
  bonusValue: number;
  minDeposit: number;
  maxBonus: number;
  turnoverMultiplier: number;
  claimMode: 'manual_review' | 'auto_pending';
  imageUrl?: string | undefined;
  desktopImageUrl?: string | undefined;
  mobileImageUrl?: string | undefined;
  desktopAssetId?: string | undefined;
  mobileAssetId?: string | undefined;
  iconUrl?: string | undefined;
  badgeText?: string | undefined;
  accentColor?: string | undefined;
  href?: string | undefined;
  priority?: number | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
};

const defaultCampaigns: PromotionCampaign[] = [{
  id: 'welcome-bonus',
  title: 'โบนัสต้อนรับ',
  description: 'รับโบนัสสำหรับรายการฝากแรกตามเงื่อนไขที่กำหนด',
  enabled: false,
  lifecycle: 'draft',
  bonusType: 'percent',
  bonusValue: 10,
  minDeposit: 100,
  maxBonus: 500,
  turnoverMultiplier: 3,
  claimMode: 'manual_review',
  imageUrl: '',
  desktopImageUrl: '',
  mobileImageUrl: '',
  desktopAssetId: '',
  mobileAssetId: '',
  iconUrl: '',
  badgeText: 'WELCOME',
  accentColor: '#f5c542',
  href: '/promotions',
  priority: 10,
}];

export default function PromotionCenterMediaPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>(defaultCampaigns);
  const [savedCampaigns, setSavedCampaigns] = useState<PromotionCampaign[]>(defaultCampaigns);
  const [assets, setAssets] = useState<CmsAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LifecycleFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const permission = useAdminPermissions();
  const canUpdate = permission.can('settings.features.update');
  const warnings = useMemo(() => validateCampaigns(campaigns, assets), [assets, campaigns]);
  const { isDirty, saveState } = useAdminUnsavedChanges({ value: campaigns, savedValue: savedCampaigns, saving });

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('th');
    return campaigns.filter((item) => {
      const searchable = `${item.title} ${item.id} ${item.badgeText ?? ''}`.toLocaleLowerCase('th');
      return (!keyword || searchable.includes(keyword)) && (filter === 'all' || item.lifecycle === filter);
    });
  }, [campaigns, filter, query]);

  const preview = useMemo(() => [...campaigns]
    .filter((item) => item.lifecycle === 'published' && item.enabled)
    .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)), [campaigns]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    published: campaigns.filter((item) => item.lifecycle === 'published').length,
    draft: campaigns.filter((item) => item.lifecycle === 'draft').length,
    archived: campaigns.filter((item) => item.lifecycle === 'archived').length,
  }), [campaigns]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด Promotion Center...');
    try {
      const response = await adminApiFetch('/admin/settings/features');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'โหลด Promotion Center ไม่สำเร็จ');
      const next = normalizeCampaigns(data?.settings?.promotion_campaigns);
      setCampaigns(next);
      setSavedCampaigns(next);
      setAssets(normalizeContent(data?.settings?.cms_content).assets);
      setSelectedIds([]);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลด Promotion Center ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!canUpdate) { setMessage('บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไข Promotion Center'); return; }
    if (warnings.length) { setMessage(`ยังบันทึกไม่ได้: ${warnings.join(' • ')}`); return; }
    setSaving(true);
    setMessage('กำลังบันทึกโปรโมชัน...');
    try {
      const response = await adminApiFetch('/admin/settings/features', {
        method: 'PUT',
        body: JSON.stringify({ promotion_campaigns: campaigns }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'บันทึกโปรโมชันไม่สำเร็จ');
      setSavedCampaigns(campaigns);
      setMessage('บันทึกโปรโมชันแล้ว Public API และหน้า Member จะอ่านค่าชุดใหม่');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกโปรโมชันไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  function requestReload() {
    if (isDirty) setConfirmReload(true);
    else void load();
  }

  function archiveSelected() {
    const ids = new Set(selectedIds);
    setCampaigns((current) => current.map((item) => ids.has(item.id) ? { ...item, lifecycle: 'archived', enabled: false } : item));
    setSelectedIds([]);
    setConfirmArchive(false);
    setMessage(`ย้าย ${ids.size} รายการไปคลังแล้ว กรุณากดบันทึก`);
  }

  return <AdminPage
    eyebrow="Brand & Experience"
    title="Promotion Center"
    description="จัดการเงื่อนไขและสื่อ Desktop/Mobile ของโปรโมชันจาก Asset Library เดียวกับ Content Center"
    actions={<><AdminSaveStateBadge state={saveState} /><AdminButton tone="secondary" onClick={requestReload} disabled={loading || saving}>รีเฟรช</AdminButton>{canUpdate && <AdminButton onClick={() => void save()} disabled={loading || saving || !isDirty || warnings.length > 0}>บันทึก</AdminButton>}</>}
  >
    <style jsx global>{pageCss}</style>
    {message && <AdminNotice tone={message.includes('ไม่ได้') || message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminUnsavedChangesNotice isDirty={isDirty}>มีการแก้ไขโปรโมชันที่ยังไม่ได้บันทึก</AdminUnsavedChangesNotice>
    {permission.ready && !canUpdate && <AdminNotice tone="warning">โหมดอ่านอย่างเดียว ปุ่มสร้าง แก้ไข ลบ เก็บถาวร และบันทึกถูกปิดตามสิทธิ์</AdminNotice>}
    {warnings.length > 0 && <AdminNotice tone="danger">{warnings.join(' • ')}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="ทั้งหมด" value={String(stats.total)} />
      <AdminMetric title="เผยแพร่" value={String(stats.published)} tone="success" />
      <AdminMetric title="ฉบับร่าง" value={String(stats.draft)} tone="warning" />
      <AdminMetric title="เก็บถาวร" value={String(stats.archived)} />
    </AdminMetricGrid>

    {loading ? <AdminSkeleton lines={8} /> : <>
      <AdminFilterBar resultText={`${filtered.length}/${campaigns.length} รายการ`}>
        <input className="promotion-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส หรือ Badge" />
        <select className="promotion-input" value={filter} onChange={(event) => setFilter(event.target.value as LifecycleFilter)}><option value="all">ทุกสถานะ</option><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select>
        {canUpdate && <><AdminButton tone="secondary" onClick={() => setSelectedIds(filtered.every((item) => selectedIds.includes(item.id)) ? [] : filtered.map((item) => item.id))} disabled={!filtered.length}>{filtered.every((item) => selectedIds.includes(item.id)) ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}</AdminButton><AdminButton tone="danger" onClick={() => setConfirmArchive(true)} disabled={!selectedIds.length}>เก็บถาวร {selectedIds.length || ''}</AdminButton></>}
      </AdminFilterBar>

      <AdminGrid>
        <AdminCard title="Campaigns" description="รายการจริงที่เก็บใน features.promotion_campaigns" tone="warning">
          <AdminStack>
            {filtered.map((item) => {
              const index = campaigns.findIndex((campaign) => campaign.id === item.id);
              return <CampaignEditor key={`${item.id}-${index}`} item={item} assets={assets} index={index} count={campaigns.length} canUpdate={canUpdate} selected={selectedIds.includes(item.id)} onSelect={(selected) => setSelectedIds((current) => selected ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} onPatch={(patch) => patchCampaign(index, patch, setCampaigns)} onMove={(direction) => moveCampaign(index, direction, setCampaigns)} onRemove={() => { setCampaigns((current) => current.filter((_, itemIndex) => itemIndex !== index)); setSelectedIds((current) => current.filter((id) => id !== item.id)); }} />;
            })}
            {!filtered.length && <AdminNotice>ไม่พบโปรโมชันตามตัวกรอง</AdminNotice>}
            {canUpdate && <AdminButton tone="secondary" onClick={() => setCampaigns((current) => [...current, createCampaign(current.length + 1)])}>เพิ่มโปรโมชัน</AdminButton>}
          </AdminStack>
        </AdminCard>

        <AdminCard title="Member Preview" description="แสดงเฉพาะรายการ Published และเปิดใช้งาน">
          <div className="promotion-preview-list">
            {preview.slice(0, 6).map((item) => <PromotionPreview key={item.id} item={item} assets={assets} />)}
            {!preview.length && <AdminNotice>ยังไม่มีโปรโมชันที่เผยแพร่</AdminNotice>}
          </div>
        </AdminCard>
      </AdminGrid>
    </>}

    {canUpdate && isDirty && <div className="promotion-sticky"><span>มีการแก้ไขที่ยังไม่บันทึก</span><AdminButton tone="secondary" onClick={requestReload} disabled={saving}>ยกเลิกการแก้ไข</AdminButton><AdminButton onClick={() => void save()} disabled={saving || warnings.length > 0}>บันทึกทั้งหมด</AdminButton></div>}

    <AdminConfirmDialog open={confirmArchive} title="เก็บโปรโมชันที่เลือก" description={`ย้าย ${selectedIds.length} รายการไปสถานะ Archived และซ่อนจาก Member`} confirmLabel="เก็บถาวร" tone="danger" onCancel={() => setConfirmArchive(false)} onConfirm={archiveSelected} details={<p>การเปลี่ยนแปลงจะส่งผลจริงหลังจากกดบันทึก</p>} />
    <AdminConfirmDialog open={confirmReload} title="ทิ้งการแก้ไขที่ยังไม่บันทึก" description="โหลดข้อมูลโปรโมชันล่าสุดจาก Database และยกเลิกการแก้ไขทั้งหมด" confirmLabel="ทิ้งการแก้ไข" tone="danger" onCancel={() => setConfirmReload(false)} onConfirm={() => { setConfirmReload(false); void load(); }} />
  </AdminPage>;
}

function CampaignEditor({ item, assets, index, count, canUpdate, selected, onSelect, onPatch, onMove, onRemove }: { item: PromotionCampaign; assets: CmsAsset[]; index: number; count: number; canUpdate: boolean; selected: boolean; onSelect: (value: boolean) => void; onPatch: (patch: Partial<PromotionCampaign>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  const media = promotionMedia(item, assets);
  return <article className="promotion-editor">
    <AdminRow><div>{canUpdate && <label className="promotion-select"><input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} /> เลือก</label>}<strong>{item.title || `Promotion ${index + 1}`}</strong><small>{item.id} · priority {item.priority ?? 0}</small></div><div className="promotion-actions"><AdminBadge tone={item.lifecycle === 'published' ? 'success' : item.lifecycle === 'draft' ? 'warning' : 'neutral'}>{lifecycleLabel(item.lifecycle)}</AdminBadge>{canUpdate && <><select className="promotion-compact" value={item.lifecycle} onChange={(event) => { const lifecycle = event.target.value as PromotionLifecycle; onPatch({ lifecycle, enabled: lifecycle === 'published' }); }}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select>{index > 0 && <AdminButton tone="secondary" size="compact" onClick={() => onMove(-1)}>ขึ้น</AdminButton>}{index < count - 1 && <AdminButton tone="secondary" size="compact" onClick={() => onMove(1)}>ลง</AdminButton>}<AdminButton tone="secondary" size="compact" onClick={() => onPatch({ enabled: !item.enabled })} disabled={item.lifecycle !== 'published'}>{item.enabled ? 'ซ่อน' : 'แสดง'}</AdminButton><AdminButton tone="danger" size="compact" onClick={onRemove}>ลบ</AdminButton></>}</div></AdminRow>
    <div className="promotion-form-grid">
      <Field label="Stable ID" value={item.id} disabled={!canUpdate} onChange={(value) => onPatch({ id: slug(value) })} />
      <Field label="ชื่อโปรโมชัน" value={item.title} disabled={!canUpdate} onChange={(value) => onPatch({ title: value })} />
      <Field label="Badge" value={item.badgeText ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ badgeText: value })} />
      <Field label="Accent Color" value={item.accentColor ?? '#f5c542'} disabled={!canUpdate} onChange={(value) => onPatch({ accentColor: value })} inputType="color" />
      <NumberField label="Priority" value={Number(item.priority ?? 0)} disabled={!canUpdate} onChange={(value) => onPatch({ priority: value })} />
      <Field label="ลิงก์ปลายทาง" value={item.href ?? '/promotions'} disabled={!canUpdate} onChange={(value) => onPatch({ href: value })} />
      <AssetSelect label="Asset Desktop" value={item.desktopAssetId ?? ''} assets={assets} disabled={!canUpdate} onChange={(desktopAssetId) => onPatch({ desktopAssetId, desktopImageUrl: cmsAssetUrl(assets, desktopAssetId), imageUrl: cmsAssetUrl(assets, desktopAssetId) })} />
      <Field label="Desktop URL" value={item.desktopImageUrl ?? item.imageUrl ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ desktopImageUrl: value, imageUrl: value, desktopAssetId: '' })} />
      <AssetSelect label="Asset Mobile" value={item.mobileAssetId ?? ''} assets={assets} disabled={!canUpdate} onChange={(mobileAssetId) => onPatch({ mobileAssetId, mobileImageUrl: cmsAssetUrl(assets, mobileAssetId) })} />
      <Field label="Mobile URL" value={item.mobileImageUrl ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ mobileImageUrl: value, mobileAssetId: '' })} helper="ว่างได้ ระบบจะ fallback ไป Desktop" />
      <Field label="ไอคอน URL" value={item.iconUrl ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ iconUrl: value })} />
      <Field label="รายละเอียด" value={item.description} disabled={!canUpdate} onChange={(value) => onPatch({ description: value })} textarea />
      <label className="promotion-field"><span>ประเภทโบนัส</span><select disabled={!canUpdate} value={item.bonusType} onChange={(event) => onPatch({ bonusType: event.target.value as PromotionCampaign['bonusType'] })}><option value="percent">เปอร์เซ็นต์</option><option value="fixed">จำนวนคงที่</option></select></label>
      <NumberField label="โบนัส" value={item.bonusValue} disabled={!canUpdate} onChange={(value) => onPatch({ bonusValue: value })} />
      <NumberField label="ฝากขั้นต่ำ" value={item.minDeposit} disabled={!canUpdate} onChange={(value) => onPatch({ minDeposit: value })} />
      <NumberField label="โบนัสสูงสุด" value={item.maxBonus} disabled={!canUpdate} onChange={(value) => onPatch({ maxBonus: value })} />
      <NumberField label="เทิร์น x" value={item.turnoverMultiplier} disabled={!canUpdate} onChange={(value) => onPatch({ turnoverMultiplier: value })} />
      <label className="promotion-field"><span>Claim mode</span><select disabled={!canUpdate} value={item.claimMode} onChange={(event) => onPatch({ claimMode: event.target.value as PromotionCampaign['claimMode'] })}><option value="manual_review">แอดมินตรวจ</option><option value="auto_pending">สร้างคำขอรอตรวจอัตโนมัติ</option></select></label>
      <Field label="เริ่ม" value={item.startsAt ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ startsAt: value || undefined })} inputType="date" />
      <Field label="สิ้นสุด" value={item.endsAt ?? ''} disabled={!canUpdate} onChange={(value) => onPatch({ endsAt: value || undefined })} inputType="date" />
    </div>
    {(media.desktop || media.mobile) && <MediaPreview desktop={media.desktop} mobile={media.mobile} alt={item.title} />}
  </article>;
}

function PromotionPreview({ item, assets }: { item: PromotionCampaign; assets: CmsAsset[] }) {
  const media = promotionMedia(item, assets);
  return <article className="promotion-preview" style={{ borderColor: `${item.accentColor || '#f5c542'}66` }}><MediaPreview desktop={media.desktop} mobile={media.mobile} alt={item.title} /><div><AdminBadge tone="warning">{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</AdminBadge><h3>{item.title}</h3><p>{item.description}</p><small>ฝากขั้นต่ำ {money(item.minDeposit)} · เทิร์น x{item.turnoverMultiplier}</small></div></article>;
}

function AssetSelect({ label, value, assets, disabled, onChange }: { label: string; value: string; assets: CmsAsset[]; disabled: boolean; onChange: (value: string) => void }) {
  return <label className="promotion-field"><span>{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">ไม่เลือก Asset</option>{assets.filter((asset) => asset.enabled && asset.type === 'image' && asset.url).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} · {asset.id}</option>)}</select></label>;
}

function Field({ label, value, disabled, onChange, textarea = false, helper, inputType = 'text' }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void; textarea?: boolean; helper?: string; inputType?: 'text' | 'date' | 'color' }) {
  return <label className="promotion-field"><span>{label}</span>{textarea ? <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /> : <input type={inputType} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />}{helper && <small>{helper}</small>}</label>;
}
function NumberField({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) { return <label className="promotion-field"><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} disabled={disabled} onChange={(event) => onChange(Number(event.target.value || 0))} /></label>; }

function MediaPreview({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  const primary = desktop || mobile;
  if (!primary) return <div className="promotion-media-empty">ไม่มีรูป</div>;
  return <picture className="promotion-media"><source media="(max-width: 640px)" srcSet={resolveAssetUrl(mobile || desktop)} /><img src={resolveAssetUrl(primary)} alt={alt} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('is-broken'); }} /></picture>;
}

function normalizeCampaigns(value: unknown): PromotionCampaign[] {
  if (!Array.isArray(value)) return defaultCampaigns;
  return value.map((raw: unknown, index) => {
    const item = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const lifecycle: PromotionLifecycle = item.lifecycle === 'archived' ? 'archived' : item.lifecycle === 'published' || item.enabled === true ? 'published' : 'draft';
    const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? '');
    return {
      id: slug(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? ''), description: String(item.description ?? ''),
      enabled: lifecycle === 'published' && item.enabled !== false, lifecycle,
      bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0),
      claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review',
      imageUrl: legacyImage, desktopImageUrl: String(item.desktopImageUrl ?? legacyImage), mobileImageUrl: String(item.mobileImageUrl ?? legacyImage), desktopAssetId: String(item.desktopAssetId ?? ''), mobileAssetId: String(item.mobileAssetId ?? ''),
      iconUrl: String(item.iconUrl ?? ''), badgeText: String(item.badgeText ?? ''), accentColor: String(item.accentColor ?? '#f5c542'), href: String(item.href ?? '/promotions'), priority: Number(item.priority ?? 0),
      startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined,
    };
  });
}

function promotionMedia(item: PromotionCampaign, assets: CmsAsset[]) {
  const desktop = cmsAssetUrl(assets, item.desktopAssetId) || item.desktopImageUrl || item.imageUrl || '';
  const mobile = cmsAssetUrl(assets, item.mobileAssetId) || item.mobileImageUrl || desktop;
  return { desktop, mobile };
}
function patchCampaign(index: number, patch: Partial<PromotionCampaign>, setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>) { setCampaigns((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
function moveCampaign(index: number, direction: -1 | 1, setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>) { setCampaigns((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target]!, next[index]!]; return next; }); }
function createCampaign(index: number): PromotionCampaign { return { ...defaultCampaigns[0]!, id: `promotion-${Date.now()}`, title: `โปรโมชัน ${index}`, lifecycle: 'draft', enabled: false, priority: index * 10 }; }

function validateCampaigns(campaigns: PromotionCampaign[], assets: CmsAsset[]) {
  const warnings: string[] = [];
  const ids = new Set<string>();
  const assetIds = new Set(assets.map((asset) => asset.id));
  for (const item of campaigns) {
    if (!item.id) warnings.push('มีโปรโมชันที่ไม่มี Stable ID');
    if (ids.has(item.id)) warnings.push(`รหัสโปรซ้ำ: ${item.id}`);
    ids.add(item.id);
    if (item.lifecycle === 'published' && (!item.title.trim() || !item.description.trim())) warnings.push(`โปรโมชันที่เผยแพร่ต้องมีชื่อและรายละเอียด: ${item.id}`);
    if (item.bonusType === 'percent' && item.bonusValue > 100) warnings.push(`เปอร์เซ็นต์โบนัสเกิน 100%: ${item.id}`);
    if ([item.bonusValue, item.minDeposit, item.maxBonus, item.turnoverMultiplier].some((number) => number < 0)) warnings.push(`ตัวเลขติดลบ: ${item.id}`);
    if (item.lifecycle === 'published' && item.turnoverMultiplier <= 0) warnings.push(`โปรโมชันที่เผยแพร่ต้องมีเทิร์นมากกว่า 0: ${item.id}`);
    if (item.startsAt && item.endsAt && item.startsAt > item.endsAt) warnings.push(`วันเริ่มมากกว่าวันสิ้นสุด: ${item.id}`);
    if (item.href && !isSafeHref(item.href)) warnings.push(`ลิงก์ไม่ปลอดภัย: ${item.id}`);
    [item.imageUrl, item.desktopImageUrl, item.mobileImageUrl, item.iconUrl].forEach((url) => { if (url && !isAssetUrl(url)) warnings.push(`URL สื่อไม่ถูกต้อง: ${item.id}`); });
    [item.desktopAssetId, item.mobileAssetId].forEach((id) => { if (id && !assetIds.has(id)) warnings.push(`Asset ไม่พบ: ${item.id} → ${id}`); });
  }
  return [...new Set(warnings)];
}

function isAssetUrl(value: string) { if (!value) return true; if (value.startsWith('/') && !value.startsWith('//')) return true; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function isSafeHref(value: string) { return value.startsWith('/') && !value.startsWith('//') || /^https?:\/\//i.test(value); }
function resolveAssetUrl(value: string) { if (value.startsWith('/public/cms-assets/')) return `${API_URL.replace(/\/$/, '')}${value}`; if (value.startsWith('/') && MEMBER_URL) return `${MEMBER_URL.replace(/\/$/, '')}${value}`; return value; }
function lifecycleLabel(value: PromotionLifecycle) { return value === 'published' ? 'เผยแพร่' : value === 'archived' ? 'เก็บถาวร' : 'ฉบับร่าง'; }
function slug(value: unknown) { return String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, ''); }
function money(value: number) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value); }

const pageCss = `
.promotion-input,.promotion-field input,.promotion-field textarea,.promotion-field select,.promotion-compact{width:100%;min-height:44px;border:1px solid rgba(148,163,184,.24);border-radius:10px;background:rgba(15,23,42,.72);color:inherit;padding:10px 12px}.promotion-editor{display:grid;gap:14px;padding:16px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:rgba(15,23,42,.42)}.promotion-editor small{display:block;color:#94a3b8}.promotion-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.promotion-compact{width:auto;min-height:36px;padding:6px 9px}.promotion-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.promotion-field{display:grid;gap:6px;min-width:0;font-weight:800}.promotion-field textarea{min-height:94px;resize:vertical}.promotion-field small{font-weight:600}.promotion-select{display:flex;gap:8px;align-items:center;margin-bottom:6px}.promotion-preview-list{display:grid;gap:14px}.promotion-preview{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:14px;overflow:hidden;border:1px solid;border-radius:14px;background:rgba(15,23,42,.54)}.promotion-preview>div{padding:14px}.promotion-media{display:block;min-height:140px;border-radius:12px;overflow:hidden;background:rgba(2,6,23,.72)}.promotion-preview .promotion-media{border-radius:0}.promotion-media img{display:block;width:100%;height:clamp(140px,20vw,280px);object-fit:cover}.promotion-media.is-broken:after{content:'รูปโหลดไม่สำเร็จ · Member จะใช้ fallback';display:grid;place-items:center;min-height:140px;padding:20px;color:#fca5a5;text-align:center}.promotion-media-empty{display:grid;place-items:center;min-height:140px;border:1px dashed rgba(148,163,184,.3);border-radius:12px;color:#94a3b8}.promotion-sticky{position:sticky;bottom:12px;z-index:30;display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:20px;padding:12px 14px;border:1px solid rgba(245,197,66,.35);border-radius:14px;background:rgba(8,12,20,.96);box-shadow:0 12px 40px rgba(0,0,0,.35)}.promotion-sticky span{margin-right:auto;color:#f5c542;font-weight:800}
@media(max-width:900px){.promotion-form-grid{grid-template-columns:1fr}.promotion-preview{grid-template-columns:1fr}.promotion-actions{justify-content:flex-start}.promotion-sticky{flex-wrap:wrap}.promotion-sticky span{width:100%}}
@media(max-width:560px){.promotion-editor{padding:12px}.promotion-sticky{bottom:6px}.promotion-sticky button{flex:1}}
`;
