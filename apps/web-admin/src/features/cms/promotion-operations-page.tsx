'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../../../app/(admin)/_components/admin-ui';

type Lifecycle = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type MemberCategory = 'new_member' | 'daily' | 'privilege' | 'cashback';
type ClaimPeriod = 'lifetime' | 'day' | 'week' | 'month' | 'year';
type TurnoverBasis = 'bonus' | 'deposit' | 'deposit_plus_bonus';
type Campaign = {
  id: string; title: string; description: string; enabled: boolean; lifecycle: Lifecycle;
  sourcePromotionId?: number | undefined; sourceCode?: string | undefined; sourceType?: string | undefined; promotionGroupId?: number | undefined;
  memberCategory: MemberCategory; bonusType: 'fixed' | 'percent'; bonusValue: number; minDeposit: number; maxBonus: number;
  turnoverMultiplier: number; turnoverBasis: TurnoverBasis; claimMode: 'manual_review' | 'auto_pending';
  imageUrl: string; desktopImageUrl: string; mobileImageUrl: string; sourceImageUrl: string; desktopAssetId?: string | undefined; mobileAssetId?: string | undefined;
  iconUrl?: string | undefined; badgeText: string; accentColor: string; priority: number; startsAt?: string | undefined; endsAt?: string | undefined;
  detailHtml: string; termsHtml: string; allowedGames: string; excludedGames: string; claimButtonLabel: string; claimSuccessMessage: string;
  maxClaimsPerMember: number; claimLimitPeriod: ClaimPeriod; requiresApprovedDeposit: boolean; depositOrdinal: number; consecutiveDepositDays: number;
  depositWindowHours: number; maxWithdrawal: number; disableBotWithdrawal: boolean; isRecommended: boolean;
};
type Claim = { campaignId?: string; status?: string };

export default function PromotionOperationsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Campaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'all' | MemberCategory>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const saved = useRef('[]');
  const snapshot = useMemo(() => JSON.stringify(items), [items]);
  const dirty = !loading && snapshot !== saved.current;

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const filtered = useMemo(() => items
    .filter((item) => group === 'all' || item.memberCategory === group)
    .filter((item) => !query.trim() || `${item.title} ${item.id} ${item.sourceCode ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.priority - a.priority), [group, items, query]);
  const missing = useMemo(() => templates.filter((template) => !items.some((item) => matchesCampaign(item, template))), [items, templates]);
  const claimStats = useMemo(() => ({
    total: claims.length,
    pending: claims.filter((item) => ['PENDING', 'OPEN', 'REVIEWING'].includes(String(item.status))).length,
    approved: claims.filter((item) => ['APPROVED', 'RESOLVED'].includes(String(item.status))).length,
  }), [claims]);
  const claimsByCampaign = useMemo(() => {
    const map = new Map<string, number>();
    for (const claim of claims) if (claim.campaignId) map.set(claim.campaignId, (map.get(claim.campaignId) ?? 0) + 1);
    return map;
  }, [claims]);

  async function load() {
    setLoading(true); setMessage('');
    try {
      const [templatesRes, claimsRes] = await Promise.all([
        adminApiFetch('/public/promotions'),
        adminApiFetch('/admin/promotion-claims'),
      ]);
      const [templatesData, claimsData] = await Promise.all([
        templatesRes.json().catch(() => null),
        claimsRes.json().catch(() => null),
      ]);
      if (!templatesRes.ok) throw new Error();

      const settingsRes = await adminApiFetch('/admin/settings/features');
      const settingsData = await settingsRes.json().catch(() => null);
      if (!settingsRes.ok) throw new Error();

      const nextTemplates = normalize(templatesData?.items);
      const stored = normalize(settingsData?.settings?.promotion_campaigns);
      const next = mergeCampaigns(stored, nextTemplates);
      setTemplates(nextTemplates);
      setItems(next);
      setClaims(Array.isArray(claimsData?.items) ? claimsData.items : []);
      saved.current = JSON.stringify(next);
    } catch { setMessage('โหลดข้อมูลโปรโมชั่นไม่สำเร็จ'); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!dirty || saving) return;
    const errors = validate(items);
    if (errors.length) { setMessage(errors.join(' • ')); return; }
    setSaving(true); setMessage('กำลังบันทึก...');
    try {
      const response = await adminApiFetch('/admin/settings/features', { method: 'PUT', body: JSON.stringify({ promotion_campaigns: items.map(canonicalizeCampaign) }) });
      if (!response.ok) throw new Error();
      const canonical = items.map(canonicalizeCampaign);
      setItems(canonical);
      saved.current = JSON.stringify(canonical);
      setMessage('บันทึกโปรโมชั่นกลางแล้ว หน้า Desktop, Mobile และ Popup จะใช้ข้อมูลชุดนี้');
    } catch { setMessage('บันทึกโปรโมชั่นไม่สำเร็จ'); }
    finally { setSaving(false); }
  }

  const patch = (id: string, next: Partial<Campaign>) => setItems((current) => current.map((item) => item.id === id ? canonicalizeCampaign({ ...item, ...next }) : item));
  const syncAssets = () => {
    const next = mergeCampaigns(items, templates);
    setItems(next);
    setMessage(missing.length ? `เพิ่มโปรโมชั่นจาก Asset ${missing.length} รายการแล้ว กดบันทึกเพื่อยืนยัน` : 'โปรโมชั่นจาก Asset อยู่ใน Settings ครบแล้ว');
  };
  const add = () => setItems((current) => [...current, blank(current.length + 1)]);

  return <AdminPage eyebrow="การตลาด" title="ตั้งค่าโปรโมชั่นกลาง" description="แก้รูป ข้อมูล รายละเอียด เงื่อนไข และสิทธิ์จากจุดเดียว ทุกหน้า Member ใช้ข้อมูลจาก /public/promotions" actions={<>
    {dirty ? <AdminBadge tone="warning">ยังไม่บันทึก</AdminBadge> : null}
    <AdminButton tone="secondary" disabled={loading || saving} onClick={syncAssets}>ซิงก์จาก Asset ({missing.length})</AdminButton>
    <AdminButton tone="secondary" disabled={loading || saving} onClick={add}>เพิ่มโปรโมชั่น</AdminButton>
    <AdminButton tone="secondary" disabled={loading || saving || dirty} onClick={() => void load()}>รีเฟรช</AdminButton>
    <AdminButton disabled={!dirty || loading || saving} onClick={() => void save()}>{saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}</AdminButton>
  </>}>
    {message ? <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ต้อง') ? 'danger' : 'success'}>{message}</AdminNotice> : null}
    <AdminMetricGrid>
      <AdminMetric title="โปรโมชั่นใน Settings" value={items.length.toLocaleString('th-TH')} helper={`${items.filter((item) => item.enabled && item.lifecycle === 'PUBLISHED').length} รายการเปิดใช้`} />
      <AdminMetric title="โปรโมชั่นจาก Asset" value={templates.length.toLocaleString('th-TH')} helper={missing.length ? `${missing.length} รายการรอซิงก์` : 'ซิงก์ครบแล้ว'} />
      <AdminMetric title="คำขอรับทั้งหมด" value={claimStats.total.toLocaleString('th-TH')} helper={`${claimStats.pending} รายการรอตรวจ`} />
      <AdminMetric title="อนุมัติแล้ว" value={claimStats.approved.toLocaleString('th-TH')} />
    </AdminMetricGrid>

    <section className="admin-promotion-ops">
      <div className="admin-promotion-ops__toolbar">
        <label><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ รหัส หรือ Source code" /></label>
        <label><span>หมวด Member</span><select value={group} onChange={(event) => setGroup(event.target.value as typeof group)}>{GROUPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <a className="admin-ui-button admin-ui-button--ghost admin-ui-button--regular" href="/promotion-claims">ตรวจคำขอรับโปรโมชั่น</a>
      </div>
      {loading ? <div className="admin-promotion-ops__state">กำลังโหลด...</div> : filtered.length === 0 ? <AdminEmpty>ไม่พบโปรโมชั่น</AdminEmpty> : <div className="admin-promotion-ops__grid">
        {filtered.map((item) => <AdminCard key={item.id} tone={item.enabled && item.lifecycle === 'PUBLISHED' ? 'success' : 'neutral'} compact>
          <article className="admin-promotion-ops__card">
            <header><div><AdminBadge tone={item.lifecycle === 'PUBLISHED' ? 'success' : item.lifecycle === 'ARCHIVED' ? 'neutral' : 'warning'}>{item.lifecycle}</AdminBadge><h2>{item.title || item.id}</h2><p>{groupLabel(item.memberCategory)} · Priority {item.priority} · รับแล้ว {claimsByCampaign.get(item.id) ?? 0}</p></div><div className="admin-promotion-ops__card-actions"><AdminButton size="compact" tone="secondary" onClick={() => patch(item.id, item.lifecycle === 'PUBLISHED' ? { lifecycle: 'DRAFT', enabled: false } : { lifecycle: 'PUBLISHED', enabled: true })}>{item.lifecycle === 'PUBLISHED' ? 'ปิดใช้งาน' : 'เผยแพร่'}</AdminButton><AdminButton size="compact" tone="danger" onClick={() => patch(item.id, { lifecycle: 'ARCHIVED', enabled: false })}>Archive</AdminButton></div></header>
            {canonicalImage(item) ? <img className="admin-promotion-ops__banner" src={canonicalImage(item)} alt={`ตัวอย่าง ${item.title}`} /> : null}
            <div className="admin-promotion-ops__fields">
              <Field label="รหัสระบบ" value={item.id} onChange={(value) => patch(item.id, { id: slug(value) })} />
              <Field label="ชื่อโปรโมชั่น" value={item.title} onChange={(value) => patch(item.id, { title: value })} />
              <Field label="Source ID" value={item.sourcePromotionId?.toString() ?? ''} onChange={(value) => patch(item.id, { sourcePromotionId: optionalNumber(value) })} />
              <Field label="Source code" value={item.sourceCode ?? ''} onChange={(value) => patch(item.id, { sourceCode: value || undefined })} />
              <Field label="Source type" value={item.sourceType ?? ''} onChange={(value) => patch(item.id, { sourceType: value || undefined })} />
              <Select label="หมวด Member" value={item.memberCategory} options={GROUPS.slice(1)} onChange={(value) => patch(item.id, { memberCategory: value as MemberCategory })} />
              <NumberField label="ลำดับ" value={item.priority} onChange={(value) => patch(item.id, { priority: value })} />
              <Field label="Badge" value={item.badgeText} onChange={(value) => patch(item.id, { badgeText: value })} />
              <Field label="สี Accent" value={item.accentColor} onChange={(value) => patch(item.id, { accentColor: value })} />
              <Field label="รูปโปรโมชั่นทุกอุปกรณ์" value={canonicalImage(item)} onChange={(value) => patch(item.id, { imageUrl: value, desktopImageUrl: value, mobileImageUrl: value })} />
              <Field label="CDN สำรอง" value={item.sourceImageUrl} onChange={(value) => patch(item.id, { sourceImageUrl: value })} />
              <Field label="Asset ID" value={item.desktopAssetId ?? item.mobileAssetId ?? ''} onChange={(value) => patch(item.id, { desktopAssetId: value || undefined, mobileAssetId: value || undefined })} />
              <Select label="ประเภทโบนัส" value={item.bonusType} options={[{ value: 'percent', label: 'เปอร์เซ็นต์' }, { value: 'fixed', label: 'จำนวนคงที่' }]} onChange={(value) => patch(item.id, { bonusType: value as Campaign['bonusType'] })} />
              <NumberField label="มูลค่าโบนัส" value={item.bonusValue} onChange={(value) => patch(item.id, { bonusValue: value })} />
              <NumberField label="ฝากขั้นต่ำ" value={item.minDeposit} onChange={(value) => patch(item.id, { minDeposit: value })} />
              <NumberField label="โบนัสสูงสุด" value={item.maxBonus} onChange={(value) => patch(item.id, { maxBonus: value })} />
              <NumberField label="เทิร์น x" value={item.turnoverMultiplier} onChange={(value) => patch(item.id, { turnoverMultiplier: value })} />
              <Select label="ฐานคำนวณเทิร์น" value={item.turnoverBasis} options={TURNOVER_OPTIONS} onChange={(value) => patch(item.id, { turnoverBasis: value as TurnoverBasis })} />
              <Select label="วิธีรับ" value={item.claimMode} options={[{ value: 'manual_review', label: 'ผู้ดูแลตรวจ' }, { value: 'auto_pending', label: 'สร้างคำขออัตโนมัติ' }]} onChange={(value) => patch(item.id, { claimMode: value as Campaign['claimMode'] })} />
              <NumberField label="รับสูงสุดต่อสมาชิก" value={item.maxClaimsPerMember} onChange={(value) => patch(item.id, { maxClaimsPerMember: Math.max(0, value) })} />
              <Select label="รอบจำกัดสิทธิ์" value={item.claimLimitPeriod} options={PERIOD_OPTIONS} onChange={(value) => patch(item.id, { claimLimitPeriod: value as ClaimPeriod })} />
              <Check label="ต้องมีรายการฝากอนุมัติ" checked={item.requiresApprovedDeposit} onChange={(value) => patch(item.id, { requiresApprovedDeposit: value })} />
              <NumberField label="ฝากลำดับที่" value={item.depositOrdinal} onChange={(value) => patch(item.id, { depositOrdinal: Math.max(0, value) })} />
              <NumberField label="ฝากต่อเนื่องกี่วัน" value={item.consecutiveDepositDays} onChange={(value) => patch(item.id, { consecutiveDepositDays: Math.max(0, value) })} />
              <NumberField label="ช่วงเวลารายการฝาก (ชม.)" value={item.depositWindowHours} onChange={(value) => patch(item.id, { depositWindowHours: Math.max(0, value) })} />
              <NumberField label="ถอนสูงสุด" value={item.maxWithdrawal} onChange={(value) => patch(item.id, { maxWithdrawal: Math.max(0, value) })} />
              <Check label="ปิดถอนอัตโนมัติ" checked={item.disableBotWithdrawal} onChange={(value) => patch(item.id, { disableBotWithdrawal: value })} />
              <Check label="โปรโมชั่นแนะนำ" checked={item.isRecommended} onChange={(value) => patch(item.id, { isRecommended: value })} />
              <Field label="เริ่มใช้งาน" type="datetime-local" value={toLocal(item.startsAt)} onChange={(value) => patch(item.id, { startsAt: fromLocal(value) })} />
              <Field label="สิ้นสุด" type="datetime-local" value={toLocal(item.endsAt)} onChange={(value) => patch(item.id, { endsAt: fromLocal(value) })} />
              <Field label="ข้อความปุ่มรับ" value={item.claimButtonLabel} onChange={(value) => patch(item.id, { claimButtonLabel: value })} />
              <Field label="ข้อความเมื่อรับสำเร็จ" value={item.claimSuccessMessage} onChange={(value) => patch(item.id, { claimSuccessMessage: value })} />
              <TextArea label="คำอธิบายย่อ" value={item.description} onChange={(value) => patch(item.id, { description: value })} />
              <TextArea label="รายละเอียด HTML" value={item.detailHtml} onChange={(value) => patch(item.id, { detailHtml: value })} />
              <TextArea label="เงื่อนไข HTML" value={item.termsHtml} onChange={(value) => patch(item.id, { termsHtml: value })} />
              <TextArea label="เกมที่ร่วมรายการ" value={item.allowedGames} onChange={(value) => patch(item.id, { allowedGames: value })} />
              <TextArea label="เกมที่ไม่ร่วมรายการ" value={item.excludedGames} onChange={(value) => patch(item.id, { excludedGames: value })} />
            </div>
          </article>
        </AdminCard>)}
      </div>}
    </section>
  </AdminPage>;
}

const GROUPS = [{ value: 'all', label: 'ทั้งหมด' }, { value: 'new_member', label: 'สมาชิกใหม่' }, { value: 'daily', label: 'ประจำวัน' }, { value: 'privilege', label: 'สิทธิพิเศษ' }, { value: 'cashback', label: 'คืนยอดเสีย' }];
const TURNOVER_OPTIONS = [{ value: 'bonus', label: 'โบนัส' }, { value: 'deposit', label: 'ยอดฝาก' }, { value: 'deposit_plus_bonus', label: 'ยอดฝาก + โบนัส' }];
const PERIOD_OPTIONS = [{ value: 'lifetime', label: 'ตลอดอายุบัญชี' }, { value: 'day', label: 'ต่อวัน' }, { value: 'week', label: 'ต่อสัปดาห์' }, { value: 'month', label: 'ต่อเดือน' }, { value: 'year', label: 'ต่อปี' }];
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'datetime-local' }) { return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value || 0))} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="is-wide"><span>{label}</span><textarea rows={6} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function groupLabel(value: MemberCategory) { return GROUPS.find((item) => item.value === value)?.label ?? value; }
function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, ''); }
function toLocal(value?: string) { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function fromLocal(value: string) { if (!value) return undefined; const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date.toISOString(); }
function optionalNumber(value: string) { const next = Number(value); return value.trim() && Number.isFinite(next) ? next : undefined; }
function num(value: unknown, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }
function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback; }
function optionalText(value: unknown) { return typeof value === 'string' && value.trim() ? value : undefined; }
function canonicalImage(item: Pick<Campaign, 'imageUrl' | 'desktopImageUrl' | 'mobileImageUrl' | 'sourceImageUrl'>) { return item.imageUrl.trim() || item.desktopImageUrl.trim() || item.mobileImageUrl.trim() || item.sourceImageUrl.trim(); }
function canonicalizeCampaign(item: Campaign): Campaign { const image = canonicalImage(item); return { ...item, imageUrl: image, desktopImageUrl: image, mobileImageUrl: image }; }
function matchesCampaign(left: Campaign, right: Campaign) { return left.id === right.id || (left.sourcePromotionId !== undefined && left.sourcePromotionId === right.sourcePromotionId); }
function mergeCampaigns(stored: Campaign[], templates: Campaign[]) {
  const used = new Set<Campaign>();
  const merged = templates.map((template) => {
    const override = stored.find((item) => matchesCampaign(item, template));
    if (override) used.add(override);
    return canonicalizeCampaign(override ? { ...template, ...override } : template);
  });
  return [...merged, ...stored.filter((item) => !used.has(item)).map(canonicalizeCampaign)];
}
function normalize(value: unknown): Campaign[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))).map((item, index) => {
    const lifecycleRaw = String(item.lifecycle ?? '').toUpperCase();
    const enabled = item.enabled !== false;
    const lifecycle: Lifecycle = lifecycleRaw === 'ARCHIVED' ? 'ARCHIVED' : lifecycleRaw === 'DRAFT' || !enabled ? 'DRAFT' : 'PUBLISHED';
    const image = text(item.imageUrl) || text(item.desktopImageUrl) || text(item.mobileImageUrl) || text(item.sourceImageUrl);
    const result: Campaign = {
      id: text(item.id, `promotion-${index + 1}`), title: text(item.title, `โปรโมชั่น ${index + 1}`), description: text(item.description), enabled, lifecycle,
      memberCategory: item.memberCategory === 'new_member' || item.memberCategory === 'daily' || item.memberCategory === 'cashback' ? item.memberCategory : 'privilege',
      bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: num(item.bonusValue), minDeposit: num(item.minDeposit), maxBonus: num(item.maxBonus),
      turnoverMultiplier: num(item.turnoverMultiplier), turnoverBasis: item.turnoverBasis === 'deposit' || item.turnoverBasis === 'deposit_plus_bonus' ? item.turnoverBasis : 'bonus', claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review',
      imageUrl: image, desktopImageUrl: image, mobileImageUrl: image, sourceImageUrl: text(item.sourceImageUrl), badgeText: text(item.badgeText, 'PROMOTION'), accentColor: text(item.accentColor, '#944fe8'), priority: num(item.priority, index),
      detailHtml: text(item.detailHtml), termsHtml: text(item.termsHtml), allowedGames: text(item.allowedGames), excludedGames: text(item.excludedGames), claimButtonLabel: text(item.claimButtonLabel, 'กดรับโปรโมชั่น'), claimSuccessMessage: text(item.claimSuccessMessage, 'ส่งคำขอรับโปรโมชั่นเรียบร้อยแล้ว'),
      maxClaimsPerMember: Math.max(0, num(item.maxClaimsPerMember, 1)), claimLimitPeriod: item.claimLimitPeriod === 'day' || item.claimLimitPeriod === 'week' || item.claimLimitPeriod === 'month' || item.claimLimitPeriod === 'year' ? item.claimLimitPeriod : 'lifetime',
      requiresApprovedDeposit: item.requiresApprovedDeposit === true, depositOrdinal: Math.max(0, num(item.depositOrdinal)), consecutiveDepositDays: Math.max(0, num(item.consecutiveDepositDays)), depositWindowHours: Math.max(0, num(item.depositWindowHours)), maxWithdrawal: Math.max(0, num(item.maxWithdrawal)), disableBotWithdrawal: item.disableBotWithdrawal === true, isRecommended: item.isRecommended === true,
    };
    assign(result, 'sourcePromotionId', Number.isFinite(Number(item.sourcePromotionId)) ? Number(item.sourcePromotionId) : undefined); assign(result, 'sourceCode', optionalText(item.sourceCode)); assign(result, 'sourceType', optionalText(item.sourceType)); assign(result, 'promotionGroupId', Number.isFinite(Number(item.promotionGroupId)) ? Number(item.promotionGroupId) : undefined); assign(result, 'desktopAssetId', optionalText(item.desktopAssetId)); assign(result, 'mobileAssetId', optionalText(item.mobileAssetId)); assign(result, 'iconUrl', optionalText(item.iconUrl)); assign(result, 'startsAt', optionalText(item.startsAt)); assign(result, 'endsAt', optionalText(item.endsAt));
    return canonicalizeCampaign(result);
  });
}
function assign<K extends keyof Campaign>(target: Campaign, key: K, value: Campaign[K] | undefined) { if (value !== undefined) target[key] = value as never; }
function blank(index: number): Campaign { return { id: `promotion-${Date.now()}`, title: `โปรโมชั่น ${index}`, description: '', enabled: false, lifecycle: 'DRAFT', memberCategory: 'privilege', bonusType: 'percent', bonusValue: 0, minDeposit: 0, maxBonus: 0, turnoverMultiplier: 1, turnoverBasis: 'deposit_plus_bonus', claimMode: 'manual_review', imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', sourceImageUrl: '', badgeText: 'PROMOTION', accentColor: '#944fe8', priority: index, detailHtml: '', termsHtml: '', allowedGames: '', excludedGames: '', claimButtonLabel: 'กดรับโปรโมชั่น', claimSuccessMessage: 'ส่งคำขอรับโปรโมชั่นเรียบร้อยแล้ว', maxClaimsPerMember: 1, claimLimitPeriod: 'lifetime', requiresApprovedDeposit: false, depositOrdinal: 0, consecutiveDepositDays: 0, depositWindowHours: 0, maxWithdrawal: 0, disableBotWithdrawal: false, isRecommended: false }; }
function validate(items: Campaign[]) { const errors: string[] = []; const ids = new Set<string>(); for (const item of items) { if (!item.id.trim()) errors.push('ทุกรายการต้องมีรหัส'); if (ids.has(item.id)) errors.push(`รหัสซ้ำ ${item.id}`); ids.add(item.id); if (!item.title.trim()) errors.push(`${item.id}: ต้องมีชื่อ`); if (item.enabled && !canonicalImage(item)) errors.push(`${item.title}: ต้องมีรูปโปรโมชั่น`); if (item.startsAt && item.endsAt && Date.parse(item.startsAt) > Date.parse(item.endsAt)) errors.push(`${item.title}: วันสิ้นสุดไม่ถูกต้อง`); if (item.requiresApprovedDeposit && item.minDeposit <= 0) errors.push(`${item.title}: ต้องกำหนดยอดฝากขั้นต่ำ`); } return [...new Set(errors)]; }
