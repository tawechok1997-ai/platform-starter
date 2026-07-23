'use client';

import type { Dispatch, SetStateAction } from 'react';
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
  AdminFilterBar,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
  AdminToolbar,
} from '../../../app/(admin)/_components/admin-ui';

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
  iconUrl?: string | undefined;
  badgeText?: string | undefined;
  accentColor?: string | undefined;
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
  iconUrl: '',
  badgeText: 'WELCOME',
  accentColor: '#f5c542',
  priority: 10,
}];

export default function PromotionCenterPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>(defaultCampaigns);
  const [savedCampaigns, setSavedCampaigns] = useState<PromotionCampaign[]>(defaultCampaigns);
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const { isDirty, saveState } = useAdminUnsavedChanges({ value: campaigns, savedValue: savedCampaigns, saving });

  useEffect(() => { void load(); }, []);

  const warnings = buildWarnings(campaigns);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return campaigns.filter((item) => {
      const searchable = `${item.title} ${item.id} ${item.badgeText ?? ''}`.toLowerCase();
      return (!keyword || searchable.includes(keyword))
        && (lifecycleFilter === 'all' || item.lifecycle === lifecycleFilter);
    });
  }, [campaigns, lifecycleFilter, query]);

  const sortedPreview = useMemo(
    () => [...campaigns]
      .filter((item) => item.lifecycle === 'published' && item.enabled)
      .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)),
    [campaigns],
  );

  const stats = useMemo(() => ({
    total: campaigns.length,
    draft: campaigns.filter((item) => item.lifecycle === 'draft').length,
    published: campaigns.filter((item) => item.lifecycle === 'published').length,
    archived: campaigns.filter((item) => item.lifecycle === 'archived').length,
  }), [campaigns]);

  const selectedVisible = filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลดโปรโมชัน...');
    try {
      const res = await adminApiFetch('/admin/settings/features');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'โหลดโปรโมชันไม่สำเร็จ');
        return;
      }
      const nextCampaigns = normalizeCampaigns(data?.settings?.promotion_campaigns);
      setCampaigns(nextCampaigns);
      setSavedCampaigns(nextCampaigns);
      setSelectedIds([]);
      setMessage('');
    } catch {
      setMessage('โหลดโปรโมชันไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function requestReload() {
    if (isDirty) {
      setConfirmReload(true);
      return;
    }
    void load();
  }

  function discardAndReload() {
    setConfirmReload(false);
    void load();
  }

  async function save() {
    if (warnings.length > 0) {
      setMessage(`ยังบันทึกไม่ได้: ${warnings.join(' • ')}`);
      return;
    }
    setSaving(true);
    setMessage('กำลังบันทึกโปรโมชัน...');
    try {
      const res = await adminApiFetch('/admin/settings/features', {
        method: 'PUT',
        body: JSON.stringify({ promotion_campaigns: campaigns }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'บันทึกโปรโมชันไม่สำเร็จ');
        return;
      }
      setSavedCampaigns(campaigns);
      setMessage('บันทึกโปรโมชันแล้ว');
    } catch {
      setMessage('บันทึกโปรโมชันไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  function setLifecycle(index: number, lifecycle: PromotionLifecycle) {
    patchCampaign(index, { lifecycle, enabled: lifecycle === 'published' }, setCampaigns);
  }

  function removeCampaign(index: number, id: string) {
    setCampaigns((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
  }

  function archiveSelected() {
    const ids = new Set(selectedIds);
    setCampaigns((current) => current.map((item) => (
      ids.has(item.id) ? { ...item, lifecycle: 'archived', enabled: false } : item
    )));
    setSelectedIds([]);
    setConfirmArchive(false);
    setMessage(`ย้าย ${ids.size} รายการไปคลังแล้ว กรุณาบันทึกการเปลี่ยนแปลง`);
  }

  return (
    <AdminPage
      eyebrow="Growth"
      title="Promotion Center"
      description="จัดการวงจรชีวิต การแสดงผล สื่อ และเงื่อนไขโปรโมชัน"
      actions={<>
        <AdminSaveStateBadge state={saveState} />
        <AdminButton tone="secondary" onClick={requestReload} disabled={loading || saving}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </AdminButton>
        <AdminButton onClick={() => void save()} disabled={loading || saving || warnings.length > 0 || !isDirty}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </AdminButton>
      </>}
    >
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminUnsavedChangesNotice isDirty={isDirty}>มีการแก้ไขโปรโมชันที่ยังไม่ได้บันทึก</AdminUnsavedChangesNotice>
      {warnings.length > 0 && <AdminNotice tone="danger">{warnings.join(' • ')}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title="ทั้งหมด" value={String(stats.total)} />
        <AdminMetric title="ฉบับร่าง" value={String(stats.draft)} tone="warning" />
        <AdminMetric title="เผยแพร่" value={String(stats.published)} tone="success" />
        <AdminMetric title="เก็บถาวร" value={String(stats.archived)} />
      </AdminMetricGrid>

      <AdminFilterBar resultText={loading ? 'กำลังโหลด...' : `${filtered.length}/${campaigns.length} รายการ`}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาชื่อ รหัส หรือ Badge"
          style={inputStyle}
        />
        <select
          value={lifecycleFilter}
          onChange={(event) => setLifecycleFilter(event.target.value as LifecycleFilter)}
          style={inputStyle}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="draft">ฉบับร่าง</option>
          <option value="published">เผยแพร่</option>
          <option value="archived">เก็บถาวร</option>
        </select>
        <AdminButton
          tone="secondary"
          disabled={loading || filtered.length === 0}
          onClick={() => setSelectedIds(selectedVisible ? [] : filtered.map((item) => item.id))}
        >
          {selectedVisible ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
        </AdminButton>
        <AdminButton
          tone="danger"
          disabled={loading || selectedIds.length === 0}
          onClick={() => setConfirmArchive(true)}
        >
          เก็บถาวร {selectedIds.length || ''}
        </AdminButton>
      </AdminFilterBar>

      <AdminGrid>
        <AdminCard title="Campaigns" tone="warning">
          <AdminStack>
            {filtered.map((item) => {
              const index = campaigns.findIndex((campaign) => campaign.id === item.id);
              return (
                <CampaignEditor
                  key={item.id}
                  item={item}
                  index={index}
                  count={campaigns.length}
                  selected={selectedIds.includes(item.id)}
                  onSelect={(selected) => setSelectedIds((current) => (
                    selected ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id)
                  ))}
                  onPatch={(patch) => patchCampaign(index, patch, setCampaigns)}
                  onLifecycle={(lifecycle) => setLifecycle(index, lifecycle)}
                  onRemove={() => removeCampaign(index, item.id)}
                  onMove={(direction) => moveCampaign(index, direction, setCampaigns)}
                />
              );
            })}
            {!loading && filtered.length === 0 && <AdminNotice>ไม่พบโปรโมชันตามตัวกรอง</AdminNotice>}
            <AdminButton
              tone="secondary"
              disabled={loading}
              onClick={() => setCampaigns((current) => [...current, createCampaign(current.length + 1)])}
            >
              เพิ่มโปรโมชัน
            </AdminButton>
          </AdminStack>
        </AdminCard>

        <AdminCard title="Member preview" description="แสดงเฉพาะรายการที่เผยแพร่และเปิดใช้งาน">
          <div style={previewShellStyle}>
            {sortedPreview.slice(0, 4).map((item) => <PromotionPreview key={item.id} item={item} />)}
            {!loading && sortedPreview.length === 0 && <AdminNotice>ยังไม่มีโปรที่เผยแพร่</AdminNotice>}
          </div>
        </AdminCard>
      </AdminGrid>

      <AdminToolbar>
        <strong>Preview JSON</strong>
        <span style={mutedStyle}>เก็บใน features.promotion_campaigns</span>
      </AdminToolbar>
      <pre style={preStyle}>{JSON.stringify(campaigns, null, 2)}</pre>

      <AdminConfirmDialog
        open={confirmArchive}
        title="เก็บโปรโมชันที่เลือก"
        description={`ย้าย ${selectedIds.length} รายการไปสถานะเก็บถาวร รายการจะไม่แสดงให้สมาชิกเห็น`}
        confirmLabel="เก็บถาวร"
        tone="danger"
        onCancel={() => setConfirmArchive(false)}
        onConfirm={archiveSelected}
        details={<p>ต้องกดบันทึกอีกครั้งจึงจะส่งผลจริง</p>}
      />
      <AdminConfirmDialog
        open={confirmReload}
        title="ทิ้งการแก้ไขที่ยังไม่บันทึก"
        description="ระบบจะโหลดข้อมูลโปรโมชันล่าสุดและยกเลิกการแก้ไขทั้งหมดในหน้านี้"
        confirmLabel="ทิ้งการแก้ไข"
        tone="danger"
        onCancel={() => setConfirmReload(false)}
        onConfirm={discardAndReload}
      />
    </AdminPage>
  );
}

function CampaignEditor({ item, index, count, selected, onSelect, onPatch, onLifecycle, onRemove, onMove }: {
  item: PromotionCampaign;
  index: number;
  count: number;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onPatch: (patch: Partial<PromotionCampaign>) => void;
  onLifecycle: (lifecycle: PromotionLifecycle) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const imageWarning = item.imageUrl && !isValidUrl(item.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined;
  const iconWarning = item.iconUrl && !isValidUrl(item.iconUrl) ? 'URL ไอคอนไม่ถูกต้อง' : undefined;

  return (
    <section style={editorStyle}>
      <AdminRow>
        <div style={headingStyle}>
          <label style={selectStyle}>
            <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} /> เลือก
          </label>
          <strong>{item.title || `Promotion ${index + 1}`}</strong>
          <p style={mutedStyle}>{lifecycleLabel(item.lifecycle)} · priority {item.priority ?? 0}</p>
        </div>
        <div style={actionRowStyle}>
          <AdminBadge tone={lifecycleTone(item.lifecycle)}>{lifecycleLabel(item.lifecycle)}</AdminBadge>
          {index > 0 && <AdminButton tone="secondary" onClick={() => onMove(-1)}>ขึ้น</AdminButton>}
          {index < count - 1 && <AdminButton tone="secondary" onClick={() => onMove(1)}>ลง</AdminButton>}
          <select
            value={item.lifecycle}
            onChange={(event) => onLifecycle(event.target.value as PromotionLifecycle)}
            style={compactSelectStyle}
          >
            <option value="draft">ฉบับร่าง</option>
            <option value="published">เผยแพร่</option>
            <option value="archived">เก็บถาวร</option>
          </select>
          <AdminButton tone="danger" onClick={onRemove}>ลบ</AdminButton>
        </div>
      </AdminRow>

      <div style={fieldGridStyle}>
        <Field label="รหัสโปร" value={item.id} onChange={(value) => onPatch({ id: slug(value) })} />
        <Field label="ชื่อโปร" value={item.title} onChange={(value) => onPatch({ title: value })} />
        <Field label="Badge" value={item.badgeText ?? ''} onChange={(value) => onPatch({ badgeText: value })} />
        <Field label="สี Accent" value={item.accentColor ?? '#f5c542'} onChange={(value) => onPatch({ accentColor: value || '#f5c542' })} />
        <NumberField label="Priority" value={Number(item.priority ?? 0)} onChange={(value) => onPatch({ priority: value })} />
        <Field label="รูปโปรโมชัน URL" value={item.imageUrl ?? ''} onChange={(value) => onPatch({ imageUrl: value })} warning={imageWarning} />
        <Field label="ไอคอน URL" value={item.iconUrl ?? ''} onChange={(value) => onPatch({ iconUrl: value })} warning={iconWarning} />
        <Field label="รายละเอียด" value={item.description} onChange={(value) => onPatch({ description: value })} textarea />
        <label style={fieldStyle}>
          <span>ประเภทโบนัส</span>
          <select value={item.bonusType} onChange={(event) => onPatch({ bonusType: event.target.value as PromotionCampaign['bonusType'] })} style={inputStyle}>
            <option value="percent">เปอร์เซ็นต์</option>
            <option value="fixed">จำนวนคงที่</option>
          </select>
        </label>
        <NumberField label="โบนัส" value={item.bonusValue} onChange={(value) => onPatch({ bonusValue: value })} />
        <NumberField label="ฝากขั้นต่ำ" value={item.minDeposit} onChange={(value) => onPatch({ minDeposit: value })} />
        <NumberField label="โบนัสสูงสุด" value={item.maxBonus} onChange={(value) => onPatch({ maxBonus: value })} />
        <NumberField label="เทิร์น x" value={item.turnoverMultiplier} onChange={(value) => onPatch({ turnoverMultiplier: value })} />
        <label style={fieldStyle}>
          <span>Claim mode</span>
          <select value={item.claimMode} onChange={(event) => onPatch({ claimMode: event.target.value as PromotionCampaign['claimMode'] })} style={inputStyle}>
            <option value="manual_review">แอดมินตรวจ</option>
            <option value="auto_pending">สร้างคำขอรอตรวจอัตโนมัติ</option>
          </select>
        </label>
        <Field label="เริ่ม" value={item.startsAt ?? ''} onChange={(value) => onPatch({ startsAt: value || undefined })} inputType="date" />
        <Field label="สิ้นสุด" value={item.endsAt ?? ''} onChange={(value) => onPatch({ endsAt: value || undefined })} inputType="date" />
      </div>
      {item.imageUrl && isValidUrl(item.imageUrl) && <img src={item.imageUrl} alt="" style={mediaPreviewStyle} />}
    </section>
  );
}

function PromotionPreview({ item }: { item: PromotionCampaign }) {
  const accent = item.accentColor || '#f5c542';
  return (
    <section style={{ ...previewCardStyle, borderColor: `${accent}66`, background: `linear-gradient(135deg, ${accent}26, rgba(15,23,42,.92))` }}>
      <div style={previewMediaStyle}>
        {item.imageUrl && isValidUrl(item.imageUrl)
          ? <img src={item.imageUrl} alt="" style={previewImageStyle} />
          : <div style={{ ...previewFallbackStyle, color: accent }}>{item.iconUrl && isValidUrl(item.iconUrl) ? <img src={item.iconUrl} alt="" style={previewIconStyle} /> : '★'}</div>}
      </div>
      <div style={previewBodyStyle}>
        <div style={actionRowStyle}>
          {item.iconUrl && isValidUrl(item.iconUrl) && <img src={item.iconUrl} alt="" style={miniIconStyle} />}
          <AdminBadge tone="warning">{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</AdminBadge>
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <span>ฝากขั้นต่ำ {money(item.minDeposit)} · เทิร์น x{item.turnoverMultiplier}</span>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, textarea = false, warning, inputType = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean | undefined;
  warning?: string | undefined;
  inputType?: 'text' | 'date' | undefined;
}) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      {textarea
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} style={textareaStyle} />
        : <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}
      {warning && <small style={warningStyle}>{warning}</small>}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value || 0))} style={inputStyle} />
    </label>
  );
}

function normalizeCampaigns(value: unknown): PromotionCampaign[] {
  if (!Array.isArray(value)) return defaultCampaigns;
  return value.map((item: Record<string, unknown>, index) => {
    const lifecycle: PromotionLifecycle = item.lifecycle === 'archived'
      ? 'archived'
      : item.lifecycle === 'published' || item.enabled === true
        ? 'published'
        : 'draft';
    return {
      id: slug(item.id ?? `promotion-${index + 1}`),
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      enabled: lifecycle === 'published' && item.enabled !== false,
      lifecycle,
      bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent',
      bonusValue: Number(item.bonusValue ?? 0),
      minDeposit: Number(item.minDeposit ?? 0),
      maxBonus: Number(item.maxBonus ?? 0),
      turnoverMultiplier: Number(item.turnoverMultiplier ?? 0),
      claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review',
      imageUrl: String(item.imageUrl ?? ''),
      iconUrl: String(item.iconUrl ?? ''),
      badgeText: String(item.badgeText ?? ''),
      accentColor: String(item.accentColor ?? '#f5c542'),
      priority: Number(item.priority ?? 0),
      startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined,
      endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined,
    };
  });
}

function createCampaign(index: number): PromotionCampaign {
  return {
    id: `promotion-${Date.now()}`,
    title: `โปรโมชัน ${index}`,
    description: '',
    enabled: false,
    lifecycle: 'draft',
    bonusType: 'percent',
    bonusValue: 10,
    minDeposit: 100,
    maxBonus: 500,
    turnoverMultiplier: 3,
    claimMode: 'manual_review',
    imageUrl: '',
    iconUrl: '',
    badgeText: 'NEW',
    accentColor: '#f5c542',
    priority: index * 10,
  };
}

function patchCampaign(
  index: number,
  patch: Partial<PromotionCampaign>,
  setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>,
) {
  setCampaigns((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
}

function moveCampaign(
  index: number,
  direction: -1 | 1,
  setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>,
) {
  setCampaigns((current) => {
    const target = index + direction;
    if (index < 0 || target < 0 || index >= current.length || target >= current.length) return current;
    const source = current[index];
    const destination = current[target];
    if (!source || !destination) return current;
    const next = [...current];
    next[index] = destination;
    next[target] = source;
    return next;
  });
}

function buildWarnings(campaigns: PromotionCampaign[]) {
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const item of campaigns) {
    if (!item.id.trim()) warnings.push('มีโปรที่ไม่มีรหัส');
    if (ids.has(item.id)) warnings.push(`รหัสโปรซ้ำ: ${item.id}`);
    ids.add(item.id);
    if (item.lifecycle === 'published' && !item.title.trim()) warnings.push('มีโปรเผยแพร่แต่ไม่มีชื่อ');
    if (item.lifecycle === 'published' && !item.description.trim()) warnings.push(`โปรที่เผยแพร่ต้องมีรายละเอียด: ${item.title || item.id}`);
    if (item.bonusType === 'percent' && item.bonusValue > 100) warnings.push('เปอร์เซ็นต์โบนัสเกิน 100%');
    if (item.maxBonus < 0 || item.minDeposit < 0 || item.bonusValue < 0 || item.turnoverMultiplier < 0) warnings.push('ตัวเลขโปรโมชันต้องไม่ติดลบ');
    if (item.lifecycle === 'published' && item.turnoverMultiplier <= 0) warnings.push(`โปรที่เผยแพร่ต้องมีเทิร์นมากกว่า 0: ${item.title || item.id}`);
    if (item.startsAt && item.endsAt && item.startsAt > item.endsAt) warnings.push(`วันเริ่มต้องไม่เกินวันสิ้นสุด: ${item.title || item.id}`);
    if (item.imageUrl && !isValidUrl(item.imageUrl)) warnings.push(`URL รูปโปรไม่ถูกต้อง: ${item.title || item.id}`);
    if (item.iconUrl && !isValidUrl(item.iconUrl)) warnings.push(`URL ไอคอนไม่ถูกต้อง: ${item.title || item.id}`);
  }
  return warnings;
}

function lifecycleLabel(value: PromotionLifecycle) {
  return value === 'published' ? 'เผยแพร่' : value === 'archived' ? 'เก็บถาวร' : 'ฉบับร่าง';
}

function lifecycleTone(value: PromotionLifecycle): 'success' | 'neutral' | 'warning' {
  return value === 'published' ? 'success' : value === 'archived' ? 'neutral' : 'warning';
}

function slug(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || `promotion-${Date.now()}`;
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function money(value: number) {
  return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const headingStyle = { display: 'grid', gap: 4 } as const;
const selectStyle = { display: 'flex', alignItems: 'center', gap: 7, color: '#cbd5e1', fontSize: 12 } as const;
const editorStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 12 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end', alignItems: 'center' } as const;
const fieldGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const compactSelectStyle = { ...inputStyle, minHeight: 36 } as const;
const textareaStyle = { ...inputStyle, minHeight: 86, padding: 12, resize: 'vertical' as const };
const warningStyle = { color: '#fca5a5' } as const;
const previewShellStyle = { display: 'grid', gap: 10 } as const;
const previewCardStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 22, overflow: 'hidden' as const, display: 'grid', gap: 0 } as const;
const previewMediaStyle = { minHeight: 132, background: 'rgba(255,255,255,.05)', display: 'grid', placeItems: 'center' } as const;
const previewImageStyle = { width: '100%', height: 150, objectFit: 'cover' as const, display: 'block' };
const previewFallbackStyle = { width: '100%', height: 150, display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 950, background: 'rgba(255,255,255,.05)' } as const;
const previewIconStyle = { width: 68, height: 68, objectFit: 'cover' as const, borderRadius: 18 };
const miniIconStyle = { width: 32, height: 32, objectFit: 'cover' as const, borderRadius: 10, border: '1px solid rgba(255,255,255,.14)' };
const previewBodyStyle = { padding: 14, display: 'grid', gap: 7 } as const;
const mediaPreviewStyle = { width: '100%', maxHeight: 160, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.16)' };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 14, background: '#020617', color: '#cbd5e1' } as const;
