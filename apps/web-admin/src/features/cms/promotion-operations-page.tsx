'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../../../app/(admin)/_components/admin-ui';

type PromotionCategory = 'campaign' | 'banner' | 'bonus' | 'coupon' | 'reward';
type PromotionCampaign = {
  id: string; title: string; description: string; enabled: boolean; category?: PromotionCategory;
  bonusType: 'fixed' | 'percent'; bonusValue: number; minDeposit: number; maxBonus: number;
  turnoverMultiplier: number; claimMode: 'manual_review' | 'auto_pending'; imageUrl?: string;
  iconUrl?: string; badgeText?: string; accentColor?: string; priority?: number; startsAt?: string;
  endsAt?: string; couponCode?: string; rewardLabel?: string; lifecycle?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};
type ClaimSummary = { total: number; pending: number; approved: number; rejected: number };
type ViewKey = 'list' | PromotionCategory;

const EMPTY_CLAIMS: ClaimSummary = { total: 0, pending: 0, approved: 0, rejected: 0 };

export default function PromotionOperationsPage() {
  const [items, setItems] = useState<PromotionCampaign[]>([]);
  const [view, setView] = useState<ViewKey>('list');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [claims, setClaims] = useState<ClaimSummary>(EMPTY_CLAIMS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const savedSnapshot = useRef('[]');

  useEffect(() => { void load(); }, []);
  const currentSnapshot = useMemo(() => JSON.stringify(items), [items]);
  const dirty = !loading && currentSnapshot !== savedSnapshot.current;

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...items]
      .filter((item) => view === 'list' || categoryOf(item) === view)
      .filter((item) => !normalized || `${item.title} ${item.id} ${item.badgeText ?? ''} ${item.couponCode ?? ''}`.toLowerCase().includes(normalized))
      .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));
  }, [items, query, view]);

  const stats = useMemo(() => ({
    total: items.length,
    enabled: items.filter((item) => item.enabled).length,
    banners: items.filter((item) => Boolean(item.imageUrl)).length,
    coupons: items.filter((item) => categoryOf(item) === 'coupon').length,
    rewards: items.filter((item) => categoryOf(item) === 'reward').length,
  }), [items]);

  async function load(force = false) {
    if (dirty && !force) { setDiscardConfirmOpen(true); return; }
    setLoading(true); setMessage('');
    try {
      const [settingsResponse, claimsResponse] = await Promise.all([
        adminApiFetch('/admin/settings/features'),
        adminApiFetch('/admin/promotion-claims'),
      ]);
      const [settingsData, claimsData] = await Promise.all([
        settingsResponse.json().catch(() => null),
        claimsResponse.json().catch(() => null),
      ]);
      if (!settingsResponse.ok) throw new Error('โหลดโปรโมชันไม่สำเร็จ');
      const nextItems = normalizeCampaigns(settingsData?.settings?.promotion_campaigns);
      setItems(nextItems);
      savedSnapshot.current = JSON.stringify(nextItems);
      if (claimsResponse.ok) {
        const claimItems = Array.isArray(claimsData?.items) ? claimsData.items : [];
        setClaims({
          total: claimItems.length,
          pending: claimItems.filter((item: { status?: string }) => ['PENDING', 'OPEN', 'REVIEWING'].includes(String(item.status))).length,
          approved: claimItems.filter((item: { status?: string }) => ['APPROVED', 'RESOLVED'].includes(String(item.status))).length,
          rejected: claimItems.filter((item: { status?: string }) => ['REJECTED', 'DISMISSED'].includes(String(item.status))).length,
        });
      }
    } catch {
      setMessage('โหลด Promotion Operations ไม่สำเร็จ กรุณาลองใหม่');
    } finally { setLoading(false); }
  }

  async function save() {
    if (saving || !dirty) return;
    const errors = validate(items);
    if (errors.length) { setMessage(errors.join(' • ')); return; }
    setSaving(true); setMessage('กำลังบันทึกโปรโมชัน...');
    try {
      const response = await adminApiFetch('/admin/settings/features', { method: 'PUT', body: JSON.stringify({ promotion_campaigns: items }) });
      if (!response.ok) throw new Error();
      savedSnapshot.current = JSON.stringify(items);
      setMessage('บันทึก Promotion Module แล้ว');
    } catch {
      setMessage('บันทึกโปรโมชันไม่สำเร็จ กรุณาตรวจข้อมูลและลองใหม่');
    } finally { setSaving(false); }
  }

  function patch(id: string, next: Partial<PromotionCampaign>) { setItems((current) => current.map((item) => item.id === id ? { ...item, ...next } : item)); }
  function add(category: PromotionCategory) { setItems((current) => [...current, createCampaign(category, current.length + 1)]); setView(category); }
  function archiveSelected() { setItems((current) => current.map((item) => selectedIds.includes(item.id) ? { ...item, lifecycle: 'ARCHIVED', enabled: false } : item)); setSelectedIds([]); setArchiveConfirmOpen(false); setMessage('ย้ายรายการที่เลือกไป Archived แล้ว กดบันทึกเพื่อยืนยัน'); }

  return <AdminPage eyebrow="การตลาด" title="Promotion Operations" description="จัดการโปรโมชัน แบนเนอร์ โบนัส คูปอง แคมเปญ และรางวัลจากศูนย์เดียว" actions={<>
    {dirty && <AdminBadge tone="warning">ยังไม่บันทึก</AdminBadge>}
    {selectedIds.length > 0 && <AdminButton tone="danger" disabled={saving} onClick={() => setArchiveConfirmOpen(true)}>Archive ({selectedIds.length})</AdminButton>}
    <AdminButton tone="secondary" disabled={loading || saving} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>
    <AdminButton disabled={loading || saving || !dirty} onClick={() => void save()}>{saving ? 'กำลังบันทึก...' : dirty ? 'บันทึกทั้งหมด' : 'บันทึกแล้ว'}</AdminButton>
  </>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ต้อง') ? 'danger' : 'success'}>{message}</AdminNotice>}
    {dirty && <AdminNotice tone="warning">มีการแก้ไขที่ยังไม่บันทึก การรีเฟรชหรือออกจากหน้านี้อาจทำให้ข้อมูลหาย</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="โปรโมชันทั้งหมด" value={stats.total.toLocaleString('th-TH')} helper={`${stats.enabled} รายการเปิดใช้งาน`} />
      <AdminMetric title="แบนเนอร์พร้อมใช้" value={stats.banners.toLocaleString('th-TH')} tone={stats.banners ? 'success' : 'warning'} />
      <AdminMetric title="คูปอง / รางวัล" value={`${stats.coupons} / ${stats.rewards}`} />
      <AdminMetric title="คำขอรอตรวจ" value={claims.pending.toLocaleString('th-TH')} helper={`${claims.total} คำขอทั้งหมด`} tone={claims.pending ? 'warning' : 'success'} />
    </AdminMetricGrid>

    <section className="admin-promotion-ops" aria-busy={loading}>
      <nav className="admin-promotion-ops__tabs" aria-label="หมวดจัดการโปรโมชัน">{VIEW_OPTIONS.map((option) => <button key={option.value} type="button" aria-current={view === option.value ? 'page' : undefined} className={view === option.value ? 'is-active' : ''} onClick={() => setView(option.value)}>{option.label}</button>)}</nav>
      <div className="admin-promotion-ops__toolbar">
        <label><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ รหัส Badge หรือ Coupon Code" /></label>
        <div className="admin-promotion-ops__quick-add"><AdminButton tone="secondary" onClick={() => add(view === 'list' ? 'campaign' : view)}>เพิ่ม{viewLabel(view)}</AdminButton><a className="admin-ui-button admin-ui-button--ghost admin-ui-button--regular" href="/promotion-claims">ตรวจคำขอ</a></div>
      </div>

      {loading ? <div className="admin-promotion-ops__state">กำลังโหลดข้อมูลโปรโมชัน...</div> : filtered.length === 0 ? <AdminEmpty>ไม่พบรายการในหมวดนี้</AdminEmpty> : <div className="admin-promotion-ops__grid">{filtered.map((item) => <AdminCard key={item.id} tone={item.enabled ? 'success' : 'neutral'} compact><article className="admin-promotion-ops__card">
        <header><div><AdminBadge tone={lifecycleTone(item.lifecycle)}>{lifecycleLabel(item.lifecycle)}</AdminBadge><h2>{item.title || item.id}</h2><p>{categoryLabel(categoryOf(item))} · Priority {item.priority ?? 0}</p></div><div className="admin-promotion-ops__card-actions"><label><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /> เลือก</label><AdminButton size="compact" tone="secondary" onClick={() => patch(item.id, item.lifecycle === 'PUBLISHED' ? { lifecycle: 'DRAFT', enabled: false } : { lifecycle: 'PUBLISHED', enabled: true })}>{item.lifecycle === 'PUBLISHED' ? 'ย้าย Draft' : 'Publish'}</AdminButton><AdminButton size="compact" tone="danger" onClick={() => patch(item.id, { lifecycle: 'ARCHIVED', enabled: false })}>Archive</AdminButton></div></header>
        {item.imageUrl && <img className="admin-promotion-ops__banner" src={item.imageUrl} alt={`ตัวอย่างแบนเนอร์ ${item.title}`} />}
        <div className="admin-promotion-ops__fields">
          <Field label="รหัส" value={item.id} onChange={(value) => patch(item.id, { id: slug(value) })} />
          <Field label="ชื่อ" value={item.title} onChange={(value) => patch(item.id, { title: value })} />
          <label><span>หมวด</span><select value={categoryOf(item)} onChange={(event) => patch(item.id, { category: event.target.value as PromotionCategory })}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <NumberField label="Priority" value={Number(item.priority ?? 0)} onChange={(value) => patch(item.id, { priority: value })} />
          <Field label="Badge" value={item.badgeText ?? ''} onChange={(value) => patch(item.id, { badgeText: value })} />
          <Field label="สี Accent" value={item.accentColor ?? '#f5c542'} onChange={(value) => patch(item.id, { accentColor: value })} />
          <Field label="URL แบนเนอร์" value={item.imageUrl ?? ''} onChange={(value) => patch(item.id, { imageUrl: value })} />
          <Field label="URL ไอคอน" value={item.iconUrl ?? ''} onChange={(value) => patch(item.id, { iconUrl: value })} />
          <Field label="Coupon Code" value={item.couponCode ?? ''} onChange={(value) => patch(item.id, { couponCode: value.toUpperCase() })} />
          <Field label="ชื่อรางวัล" value={item.rewardLabel ?? ''} onChange={(value) => patch(item.id, { rewardLabel: value })} />
          <label><span>ประเภทโบนัส</span><select value={item.bonusType} onChange={(event) => patch(item.id, { bonusType: event.target.value as PromotionCampaign['bonusType'] })}><option value="percent">เปอร์เซ็นต์</option><option value="fixed">จำนวนคงที่</option></select></label>
          <NumberField label="มูลค่าโบนัส" value={item.bonusValue} onChange={(value) => patch(item.id, { bonusValue: value })} />
          <NumberField label="ฝากขั้นต่ำ" value={item.minDeposit} onChange={(value) => patch(item.id, { minDeposit: value })} />
          <NumberField label="โบนัสสูงสุด" value={item.maxBonus} onChange={(value) => patch(item.id, { maxBonus: value })} />
          <NumberField label="ยอดทำรายการ x" value={item.turnoverMultiplier} onChange={(value) => patch(item.id, { turnoverMultiplier: value })} />
          <label><span>วิธีรับ</span><select value={item.claimMode} onChange={(event) => patch(item.id, { claimMode: event.target.value as PromotionCampaign['claimMode'] })}><option value="manual_review">ผู้ดูแลตรวจ</option><option value="auto_pending">สร้างคำขออัตโนมัติ</option></select></label>
          <Field label="วันที่เริ่ม" type="date" value={item.startsAt ?? ''} onChange={(value) => patch(item.id, { startsAt: value || undefined })} />
          <Field label="วันที่สิ้นสุด" type="date" value={item.endsAt ?? ''} onChange={(value) => patch(item.id, { endsAt: value || undefined })} />
          <label className="is-wide"><span>รายละเอียด</span><textarea value={item.description} onChange={(event) => patch(item.id, { description: event.target.value })} /></label>
        </div>
      </article></AdminCard>)}</div>}
      <footer className="admin-promotion-ops__claim-summary"><span>อนุมัติแล้ว <strong>{claims.approved}</strong></span><span>ปฏิเสธแล้ว <strong>{claims.rejected}</strong></span><span>รอตรวจ <strong>{claims.pending}</strong></span></footer>
    </section>

    <AdminConfirmDialog open={archiveConfirmOpen} title="Archive รายการที่เลือก" description={`ย้าย ${selectedIds.length.toLocaleString('th-TH')} รายการไป Archived และปิดการเผยแพร่`} confirmLabel="ยืนยัน Archive" tone="danger" onCancel={() => setArchiveConfirmOpen(false)} onConfirm={archiveSelected} />
    <AdminConfirmDialog open={discardConfirmOpen} title="ทิ้งการแก้ไขที่ยังไม่บันทึก" description="การรีเฟรชจะโหลดข้อมูลล่าสุดและลบการแก้ไขในหน้านี้" confirmLabel="ทิ้งการแก้ไข" tone="danger" onCancel={() => setDiscardConfirmOpen(false)} onConfirm={() => { setDiscardConfirmOpen(false); void load(true); }} />
  </AdminPage>;
}

const VIEW_OPTIONS: Array<{ value: ViewKey; label: string }> = [{ value: 'list', label: 'รายการทั้งหมด' }, { value: 'banner', label: 'แบนเนอร์' }, { value: 'bonus', label: 'โบนัส' }, { value: 'coupon', label: 'คูปอง' }, { value: 'campaign', label: 'แคมเปญ' }, { value: 'reward', label: 'รางวัล' }];
const CATEGORY_OPTIONS = VIEW_OPTIONS.filter((item): item is { value: PromotionCategory; label: string } => item.value !== 'list');
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'date' }) { return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value || 0))} /></label>; }
function categoryOf(item: PromotionCampaign): PromotionCategory { return item.category ?? (item.couponCode ? 'coupon' : item.rewardLabel ? 'reward' : item.imageUrl ? 'banner' : item.bonusValue > 0 ? 'bonus' : 'campaign'); }
function categoryLabel(value: PromotionCategory) { return CATEGORY_OPTIONS.find((item) => item.value === value)?.label ?? value; }
function viewLabel(value: ViewKey) { return value === 'list' ? 'แคมเปญ' : categoryLabel(value); }
function lifecycleLabel(value: PromotionCampaign['lifecycle']) { return value === 'ARCHIVED' ? 'Archived' : value === 'PUBLISHED' ? 'Published' : 'Draft'; }
function lifecycleTone(value: PromotionCampaign['lifecycle']) { return value === 'ARCHIVED' ? 'neutral' : value === 'PUBLISHED' ? 'success' : 'warning'; }
function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, ''); }
function createCampaign(category: PromotionCategory, index: number): PromotionCampaign { return { id: `${category}-${Date.now()}`, title: `${categoryLabel(category)} ${index}`, description: '', enabled: false, lifecycle: 'DRAFT', category, bonusType: 'percent', bonusValue: category === 'bonus' ? 10 : 0, minDeposit: 0, maxBonus: 0, turnoverMultiplier: 1, claimMode: 'manual_review', badgeText: category.toUpperCase(), accentColor: '#f5c542', priority: index }; }
function normalizeCampaigns(value: unknown): PromotionCampaign[] { if (!Array.isArray(value)) return []; return value.filter((item): item is PromotionCampaign => Boolean(item && typeof item === 'object')).map((item, index) => ({ id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? `โปรโมชัน ${index + 1}`), description: String(item.description ?? ''), enabled: Boolean(item.enabled), lifecycle: item.lifecycle === 'ARCHIVED' ? 'ARCHIVED' : item.enabled ? 'PUBLISHED' : 'DRAFT', category: CATEGORY_OPTIONS.some((option) => option.value === item.category) ? item.category : undefined, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 1), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', imageUrl: String(item.imageUrl ?? ''), iconUrl: String(item.iconUrl ?? ''), badgeText: String(item.badgeText ?? ''), accentColor: String(item.accentColor ?? '#f5c542'), priority: Number(item.priority ?? index), startsAt: item.startsAt ? String(item.startsAt) : undefined, endsAt: item.endsAt ? String(item.endsAt) : undefined, couponCode: item.couponCode ? String(item.couponCode) : undefined, rewardLabel: item.rewardLabel ? String(item.rewardLabel) : undefined })); }
function validate(items: PromotionCampaign[]) { const errors: string[] = []; const ids = new Set<string>(); for (const item of items) { if (!item.id.trim()) errors.push('ทุกรายการต้องมีรหัส'); if (ids.has(item.id)) errors.push(`รหัสซ้ำ ${item.id}`); ids.add(item.id); if (!item.title.trim()) errors.push(`รายการ ${item.id || '-'} ต้องมีชื่อ`); if (item.startsAt && item.endsAt && item.startsAt > item.endsAt) errors.push(`${item.title}: วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม`); if (categoryOf(item) === 'coupon' && !item.couponCode?.trim()) errors.push(`${item.title}: ต้องมี Coupon Code`); } return [...new Set(errors)]; }
