'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type PromotionCampaign = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  bonusType: 'fixed' | 'percent';
  bonusValue: number;
  minDeposit: number;
  maxBonus: number;
  turnoverMultiplier: number;
  claimMode: 'manual_review' | 'auto_pending';
  imageUrl?: string;
  iconUrl?: string;
  badgeText?: string;
  accentColor?: string;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
};

const defaultCampaigns: PromotionCampaign[] = [
  { id: 'welcome-bonus', title: 'โบนัสต้อนรับ', description: 'รับโบนัสสำหรับรายการฝากแรกตามเงื่อนไขที่กำหนด', enabled: false, bonusType: 'percent', bonusValue: 10, minDeposit: 100, maxBonus: 500, turnoverMultiplier: 3, claimMode: 'manual_review', imageUrl: '', iconUrl: '', badgeText: 'WELCOME', accentColor: '#f5c542', priority: 10 },
];

export default function PromotionCenterPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>(defaultCampaigns);
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  const [saving, setSaving] = useState(false);
  useEffect(() => { load(); }, []);
  const sorted = useMemo(() => [...campaigns].sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)), [campaigns]);
  const warnings = buildWarnings(campaigns);
  const stats = useMemo(() => ({ enabled: campaigns.filter((item) => item.enabled).length, total: campaigns.length, media: campaigns.filter((item) => item.imageUrl || item.iconUrl).length, warnings: warnings.length }), [campaigns, warnings.length]);
  async function load() { const res = await adminApiFetch('/admin/settings/features'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลดโปรโมชันไม่สำเร็จ'); return; } setCampaigns(normalizeCampaigns(data?.settings?.promotion_campaigns)); setMessage(''); }
  async function save() { setSaving(true); setMessage('กำลังบันทึกโปรโมชัน...'); const res = await adminApiFetch('/admin/settings/features', { method: 'PUT', body: JSON.stringify({ promotion_campaigns: campaigns }) }); const data = await res.json().catch(() => null); setSaving(false); if (!res.ok) { setMessage(data?.message ?? 'บันทึกโปรโมชันไม่สำเร็จ'); return; } setMessage('บันทึกโปรโมชันแล้ว รูป/ไอคอน/badge จะแสดงบนหน้า member'); }
  return <AdminPage eyebrow="Growth" title="Promotion Media" description="ตั้งค่าโปรโมชัน รูปภาพ ไอคอน badge สี accent และลำดับแสดงผลให้สมาชิกเห็นได้จริง" actions={<><AdminButton tone="secondary" onClick={load}>รีเฟรช</AdminButton><AdminButton onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</AdminButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {warnings.length > 0 && <AdminNotice>{warnings.join(' • ')}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={stats.enabled > 0 ? 'success' : 'warning'} title="โปรที่เปิด" value={String(stats.enabled)} helper={`${stats.total} รายการ`} /><AdminMetric tone="success" title="Media" value={String(stats.media)} helper="มีรูปหรือไอคอน" /><AdminMetric tone="warning" title="Sorted by" value="Priority" helper="เลขมากขึ้นก่อน" /><AdminMetric tone={stats.warnings > 0 ? 'danger' : 'success'} title="Warnings" value={String(stats.warnings)} /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Campaigns" tone="warning"><AdminStack>{campaigns.map((item, index) => <CampaignEditor key={item.id} item={item} index={index} count={campaigns.length} onPatch={(patch) => patchCampaign(index, patch, setCampaigns)} onRemove={() => setCampaigns((current) => current.filter((_, i) => i !== index))} onMove={(direction) => moveCampaign(index, direction, setCampaigns)} />)}<AdminButton tone="secondary" onClick={() => setCampaigns((current) => [...current, createCampaign(current.length + 1)])}>เพิ่มโปรโมชัน</AdminButton></AdminStack></AdminCard><AdminCard title="Member preview" description="ตัวอย่างการ์ดโปรบนมือถือ เรียงตาม priority"><div style={previewShellStyle}>{sorted.filter((item) => item.enabled).slice(0, 4).map((item) => <PromotionPreview key={item.id} item={item} />)}{sorted.filter((item) => item.enabled).length === 0 && <AdminNotice>ยังไม่มีโปรที่เปิดให้สมาชิกเห็น</AdminNotice>}</div></AdminCard></AdminGrid>
    <AdminCard title="Guard ก่อนเปิดเงินจริง" tone="danger"><AdminStack><AdminRow><strong>Promotion media</strong><AdminBadge tone="success">ใช้งานจริง</AdminBadge></AdminRow><AdminRow><strong>Bonus ledger</strong><AdminBadge tone="warning">แยก workflow</AdminBadge></AdminRow><AdminRow><strong>Turnover tracking</strong><AdminBadge tone="warning">manual / pending auto</AdminBadge></AdminRow><AdminRow><strong>Auto settlement</strong><AdminBadge tone="danger">ปิดไว้ก่อน</AdminBadge></AdminRow></AdminStack></AdminCard>
    <AdminToolbar><strong>Preview JSON</strong><span style={mutedStyle}>เก็บใน features.promotion_campaigns</span></AdminToolbar><pre style={preStyle}>{JSON.stringify(campaigns, null, 2)}</pre>
  </AdminPage>;
}

function CampaignEditor({ item, index, count, onPatch, onRemove, onMove }: { item: PromotionCampaign; index: number; count: number; onPatch: (patch: Partial<PromotionCampaign>) => void; onRemove: () => void; onMove: (direction: -1 | 1) => void }) {
  return <section style={editorStyle}><AdminRow><div><strong>{item.title || `Promotion ${index + 1}`}</strong><p style={mutedStyle}>{item.enabled ? 'เปิดให้สมาชิกเห็น' : 'ปิดอยู่'} · priority {item.priority ?? 0}</p></div><div style={actionRowStyle}><AdminBadge tone={item.enabled ? 'success' : 'neutral'}>{item.enabled ? 'เปิด' : 'ปิด'}</AdminBadge>{index > 0 && <AdminButton tone="secondary" onClick={() => onMove(-1)}>ขึ้น</AdminButton>}{index < count - 1 && <AdminButton tone="secondary" onClick={() => onMove(1)}>ลง</AdminButton>}<AdminButton tone="secondary" onClick={() => onPatch({ enabled: !item.enabled })}>{item.enabled ? 'ปิด' : 'เปิด'}</AdminButton><AdminButton tone="danger" onClick={onRemove}>ลบ</AdminButton></div></AdminRow><div style={fieldGridStyle}><Field label="รหัสโปร" value={item.id} onChange={(value) => onPatch({ id: slug(value) })} /><Field label="ชื่อโปร" value={item.title} onChange={(value) => onPatch({ title: value })} /><Field label="Badge" value={item.badgeText ?? ''} onChange={(value) => onPatch({ badgeText: value })} /><Field label="สี Accent" value={item.accentColor ?? '#f5c542'} onChange={(value) => onPatch({ accentColor: value || '#f5c542' })} /><NumberField label="Priority" value={Number(item.priority ?? 0)} onChange={(value) => onPatch({ priority: value })} /><Field label="รูปโปรโมชัน URL" value={item.imageUrl ?? ''} onChange={(value) => onPatch({ imageUrl: value })} warning={item.imageUrl && !isValidUrl(item.imageUrl) ? 'URL รูปไม่ถูกต้อง' : undefined} /><Field label="ไอคอน URL" value={item.iconUrl ?? ''} onChange={(value) => onPatch({ iconUrl: value })} warning={item.iconUrl && !isValidUrl(item.iconUrl) ? 'URL ไอคอนไม่ถูกต้อง' : undefined} /><Field label="รายละเอียด" value={item.description} onChange={(value) => onPatch({ description: value })} textarea /><label style={fieldStyle}><span>ประเภทโบนัส</span><select value={item.bonusType} onChange={(event) => onPatch({ bonusType: event.target.value as PromotionCampaign['bonusType'] })} style={inputStyle}><option value="percent">เปอร์เซ็นต์</option><option value="fixed">จำนวนคงที่</option></select></label><NumberField label="โบนัส" value={item.bonusValue} onChange={(value) => onPatch({ bonusValue: value })} /><NumberField label="ฝากขั้นต่ำ" value={item.minDeposit} onChange={(value) => onPatch({ minDeposit: value })} /><NumberField label="โบนัสสูงสุด" value={item.maxBonus} onChange={(value) => onPatch({ maxBonus: value })} /><NumberField label="เทิร์น x" value={item.turnoverMultiplier} onChange={(value) => onPatch({ turnoverMultiplier: value })} /><label style={fieldStyle}><span>Claim mode</span><select value={item.claimMode} onChange={(event) => onPatch({ claimMode: event.target.value as PromotionCampaign['claimMode'] })} style={inputStyle}><option value="manual_review">แอดมินตรวจ</option><option value="auto_pending">สร้างคำขอรอตรวจอัตโนมัติ</option></select></label><Field label="เริ่ม" value={item.startsAt ?? ''} onChange={(value) => onPatch({ startsAt: value || undefined })} /><Field label="สิ้นสุด" value={item.endsAt ?? ''} onChange={(value) => onPatch({ endsAt: value || undefined })} /></div>{item.imageUrl && isValidUrl(item.imageUrl) && <img src={item.imageUrl} alt="" style={mediaPreviewStyle} />}</section>;
}
function PromotionPreview({ item }: { item: PromotionCampaign }) { const accent = item.accentColor || '#f5c542'; return <section style={{ ...previewCardStyle, borderColor: `${accent}66`, background: `linear-gradient(135deg, ${accent}26, rgba(15,23,42,.92))` }}><div style={previewMediaStyle}>{item.imageUrl && isValidUrl(item.imageUrl) ? <img src={item.imageUrl} alt="" style={previewImageStyle} /> : <div style={{ ...previewFallbackStyle, color: accent }}>{item.iconUrl && isValidUrl(item.iconUrl) ? <img src={item.iconUrl} alt="" style={previewIconStyle} /> : '★'}</div>}</div><div style={previewBodyStyle}><div style={actionRowStyle}>{item.iconUrl && isValidUrl(item.iconUrl) && <img src={item.iconUrl} alt="" style={miniIconStyle} />}<AdminBadge tone="warning">{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</AdminBadge></div><h3>{item.title}</h3><p>{item.description}</p><span>ฝากขั้นต่ำ {money(item.minDeposit)} · เทิร์น x{item.turnoverMultiplier}</span></div></section>; }
function Field({ label, value, onChange, textarea = false, warning }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; warning?: string }) { return <label style={fieldStyle}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} style={textareaStyle} /> : <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}{warning && <small style={warningStyle}>{warning}</small>}</label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label style={fieldStyle}><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value || 0))} style={inputStyle} /></label>; }
function normalizeCampaigns(value: unknown): PromotionCampaign[] { if (!Array.isArray(value)) return defaultCampaigns; return value.map((item: any, index) => ({ id: slug(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? ''), description: String(item.description ?? ''), enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', imageUrl: String(item.imageUrl ?? ''), iconUrl: String(item.iconUrl ?? ''), badgeText: String(item.badgeText ?? ''), accentColor: String(item.accentColor ?? '#f5c542'), priority: Number(item.priority ?? 0), startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined })); }
function createCampaign(index: number): PromotionCampaign { return { id: `promotion-${Date.now()}`, title: `โปรโมชัน ${index}`, description: '', enabled: false, bonusType: 'percent', bonusValue: 10, minDeposit: 100, maxBonus: 500, turnoverMultiplier: 3, claimMode: 'manual_review', imageUrl: '', iconUrl: '', badgeText: 'NEW', accentColor: '#f5c542', priority: index * 10 }; }
function patchCampaign(index: number, patch: Partial<PromotionCampaign>, setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>) { setCampaigns((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
function moveCampaign(index: number, direction: -1 | 1, setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>) { setCampaigns((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
function buildWarnings(campaigns: PromotionCampaign[]) { const warnings = []; const ids = new Set<string>(); for (const item of campaigns) { if (!item.id.trim()) warnings.push('มีโปรที่ไม่มีรหัส'); if (ids.has(item.id)) warnings.push(`รหัสโปรซ้ำ: ${item.id}`); ids.add(item.id); if (item.enabled && !item.title.trim()) warnings.push('มีโปรเปิดอยู่แต่ไม่มีชื่อ'); if (item.bonusType === 'percent' && item.bonusValue > 100) warnings.push('เปอร์เซ็นต์โบนัสเกิน 100%'); if (item.maxBonus < 0 || item.minDeposit < 0 || item.bonusValue < 0) warnings.push('ตัวเลขโปรโมชันต้องไม่ติดลบ'); if (item.imageUrl && !isValidUrl(item.imageUrl)) warnings.push(`URL รูปโปรไม่ถูกต้อง: ${item.title || item.id}`); if (item.iconUrl && !isValidUrl(item.iconUrl)) warnings.push(`URL ไอคอนไม่ถูกต้อง: ${item.title || item.id}`); } return warnings; }
function slug(value: unknown) { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || `promotion-${Date.now()}`; }
function isValidUrl(value: string) { if (!value) return true; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const editorStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 12 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end', alignItems: 'center' };
const fieldGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
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
