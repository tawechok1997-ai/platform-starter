'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminStack,
} from '../../../app/(admin)/_components/admin-ui';

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

const defaultCampaign: PromotionCampaign = {
  id: 'welcome-bonus',
  title: 'โบนัสต้อนรับ',
  description: 'รับโบนัสสำหรับรายการฝากแรกตามเงื่อนไขที่กำหนด',
  enabled: false,
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
};

export default function PromotionCenterPageV2() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([defaultCampaign]);
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  const warnings = useMemo(() => validateCampaigns(campaigns), [campaigns]);
  const sorted = useMemo(
    () => [...campaigns].filter((item) => item.enabled).sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)),
    [campaigns],
  );
  const stats = useMemo(() => ({
    enabled: campaigns.filter((item) => item.enabled).length,
    media: campaigns.filter((item) => item.imageUrl || item.iconUrl).length,
    warnings: warnings.length,
  }), [campaigns, warnings.length]);

  async function load() {
    setMessage('กำลังโหลดโปรโมชัน...');
    const response = await adminApiFetch('/admin/settings/features');
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.message ?? 'โหลดโปรโมชันไม่สำเร็จ');
      return;
    }
    setCampaigns(normalizeCampaigns(data?.settings?.promotion_campaigns));
    setMessage('');
  }

  async function save() {
    if (warnings.length > 0 || saving) return;
    setSaving(true);
    setMessage('กำลังบันทึกโปรโมชัน...');
    const response = await adminApiFetch('/admin/settings/features', {
      method: 'PUT',
      body: JSON.stringify({ promotion_campaigns: campaigns }),
    });
    const data = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? 'บันทึกโปรโมชันแล้ว การเปลี่ยนแปลงจะแสดงในหน้าสมาชิก' : data?.message ?? 'บันทึกโปรโมชันไม่สำเร็จ');
  }

  function patch(index: number, next: Partial<PromotionCampaign>) {
    setCampaigns((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item));
  }

  function move(index: number, direction: -1 | 1) {
    setCampaigns((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const sourceItem = next[index];
      const targetItem = next[target];
      if (!sourceItem || !targetItem) return current;
      next[index] = targetItem;
      next[target] = sourceItem;
      return next;
    });
  }

  return <AdminPage
    eyebrow="การตลาด"
    title="จัดการโปรโมชัน"
    description="ตั้งค่าโบนัส รูปภาพ ช่วงเวลา และลำดับที่สมาชิกจะเห็น"
    actions={<><AdminButton tone="secondary" disabled={saving} onClick={() => void load()}>รีเฟรช</AdminButton><AdminButton disabled={saving || warnings.length > 0} onClick={() => void save()}>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</AdminButton></>}
  >
    {message && <AdminNotice>{message}</AdminNotice>}
    {warnings.length > 0 && <AdminNotice tone="warning">{warnings.join(' • ')}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="เปิดใช้งาน" value={String(stats.enabled)} helper={`${campaigns.length} รายการทั้งหมด`} tone={stats.enabled ? 'success' : 'warning'} />
      <AdminMetric title="มีรูปหรือไอคอน" value={String(stats.media)} />
      <AdminMetric title="ต้องแก้ไข" value={String(stats.warnings)} tone={stats.warnings ? 'danger' : 'success'} />
      <AdminMetric title="การเรียงลำดับ" value="เลขมากก่อน" helper="กำหนดจากช่องลำดับ" />
    </AdminMetricGrid>

    <AdminGrid>
      <AdminCard title="รายการโปรโมชัน" description="แก้ไขข้อมูล เปิดหรือปิด และจัดลำดับการแสดงผล">
        <AdminStack>
          {campaigns.map((item, index) => <section key={`${item.id}-${index}`} style={editorStyle}>
            <div style={headerStyle}>
              <div><strong>{item.title || `โปรโมชัน ${index + 1}`}</strong><p style={mutedStyle}>{item.enabled ? 'สมาชิกมองเห็น' : 'ยังไม่แสดง'} · ลำดับ {item.priority ?? 0}</p></div>
              <div style={actionStyle}>
                <AdminBadge tone={item.enabled ? 'success' : 'neutral'}>{item.enabled ? 'เปิด' : 'ปิด'}</AdminBadge>
                <AdminButton tone="secondary" disabled={index === 0} onClick={() => move(index, -1)}>เลื่อนขึ้น</AdminButton>
                <AdminButton tone="secondary" disabled={index === campaigns.length - 1} onClick={() => move(index, 1)}>เลื่อนลง</AdminButton>
                <AdminButton tone="secondary" onClick={() => patch(index, { enabled: !item.enabled })}>{item.enabled ? 'ปิดการแสดงผล' : 'เปิดการแสดงผล'}</AdminButton>
                <AdminButton tone="danger" onClick={() => setCampaigns((current) => current.filter((_, itemIndex) => itemIndex !== index))}>ลบ</AdminButton>
              </div>
            </div>
            <div style={fieldGridStyle}>
              <TextField label="รหัสโปรโมชัน" value={item.id} onChange={(value) => patch(index, { id: slug(value) })} />
              <TextField label="ชื่อโปรโมชัน" value={item.title} onChange={(value) => patch(index, { title: value })} />
              <TextField label="ข้อความบนป้าย" value={item.badgeText ?? ''} onChange={(value) => patch(index, { badgeText: value })} />
              <TextField label="สีหลัก" value={item.accentColor ?? '#f5c542'} onChange={(value) => patch(index, { accentColor: value })} />
              <NumberField label="ลำดับ" value={Number(item.priority ?? 0)} onChange={(value) => patch(index, { priority: value })} />
              <TextField label="ลิงก์รูปโปรโมชัน" value={item.imageUrl ?? ''} onChange={(value) => patch(index, { imageUrl: value })} />
              <TextField label="ลิงก์ไอคอน" value={item.iconUrl ?? ''} onChange={(value) => patch(index, { iconUrl: value })} />
              <TextField label="รายละเอียด" value={item.description} onChange={(value) => patch(index, { description: value })} textarea />
              <label style={fieldStyle}><span>ประเภทโบนัส</span><select value={item.bonusType} onChange={(event) => patch(index, { bonusType: event.target.value as PromotionCampaign['bonusType'] })} style={inputStyle}><option value="percent">เปอร์เซ็นต์</option><option value="fixed">จำนวนเงินคงที่</option></select></label>
              <NumberField label="มูลค่าโบนัส" value={item.bonusValue} onChange={(value) => patch(index, { bonusValue: value })} />
              <NumberField label="ยอดฝากขั้นต่ำ" value={item.minDeposit} onChange={(value) => patch(index, { minDeposit: value })} />
              <NumberField label="โบนัสสูงสุด" value={item.maxBonus} onChange={(value) => patch(index, { maxBonus: value })} />
              <NumberField label="ยอดทำรายการที่กำหนด (เท่า)" value={item.turnoverMultiplier} onChange={(value) => patch(index, { turnoverMultiplier: value })} />
              <label style={fieldStyle}><span>วิธีรับโปรโมชัน</span><select value={item.claimMode} onChange={(event) => patch(index, { claimMode: event.target.value as PromotionCampaign['claimMode'] })} style={inputStyle}><option value="manual_review">ผู้ดูแลตรวจคำขอ</option><option value="auto_pending">สร้างคำขอรอตรวจอัตโนมัติ</option></select></label>
              <TextField label="วันที่เริ่ม" value={item.startsAt ?? ''} onChange={(value) => patch(index, { startsAt: value || undefined })} type="date" />
              <TextField label="วันที่สิ้นสุด" value={item.endsAt ?? ''} onChange={(value) => patch(index, { endsAt: value || undefined })} type="date" />
            </div>
          </section>)}
          {campaigns.length === 0 && <AdminEmpty>ยังไม่มีโปรโมชัน</AdminEmpty>}
          <AdminButton tone="secondary" onClick={() => setCampaigns((current) => [...current, createCampaign(current.length + 1)])}>เพิ่มโปรโมชัน</AdminButton>
        </AdminStack>
      </AdminCard>

      <AdminCard title="ตัวอย่างหน้าสมาชิก" description="แสดงเฉพาะรายการที่เปิดใช้งาน เรียงจากเลขลำดับมากไปน้อย">
        <AdminStack>{sorted.slice(0, 4).map((item) => <PromotionPreview key={item.id} item={item} />)}{sorted.length === 0 && <AdminEmpty>ยังไม่มีโปรโมชันที่เปิดให้สมาชิกเห็น</AdminEmpty>}</AdminStack>
      </AdminCard>
    </AdminGrid>

    <AdminCard title="สถานะระบบโบนัส" description="ส่วนที่ต้องตรวจให้พร้อมก่อนเปิดการทำงานอัตโนมัติ">
      <div style={statusGridStyle}><StatusItem label="สื่อโปรโมชัน" status="พร้อมใช้งาน" tone="success" /><StatusItem label="บัญชีโบนัส" status="แยกขั้นตอนตรวจสอบ" tone="warning" /><StatusItem label="ติดตามยอดทำรายการ" status="ยังต้องตรวจสอบ" tone="warning" /><StatusItem label="จ่ายโบนัสอัตโนมัติ" status="ปิดอยู่" tone="danger" /></div>
    </AdminCard>
  </AdminPage>;
}

function TextField({ label, value, onChange, textarea = false, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; type?: 'text' | 'date' }) {
  return <label style={fieldStyle}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} style={textareaStyle} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}</label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label style={fieldStyle}><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value || 0))} style={inputStyle} /></label>; }
function StatusItem({ label, status, tone }: { label: string; status: string; tone: 'success' | 'warning' | 'danger' }) { return <div style={statusItemStyle}><strong>{label}</strong><AdminBadge tone={tone}>{status}</AdminBadge></div>; }
function PromotionPreview({ item }: { item: PromotionCampaign }) { const accent = item.accentColor || '#f5c542'; return <section style={{ ...previewStyle, borderColor: `${accent}66` }}>{item.imageUrl && isValidUrl(item.imageUrl) ? <img src={item.imageUrl} alt={item.title} style={previewImageStyle} /> : <div style={{ ...previewFallbackStyle, color: accent }}>{item.iconUrl && isValidUrl(item.iconUrl) ? <img src={item.iconUrl} alt="" style={previewIconStyle} /> : '★'}</div>}<div style={previewBodyStyle}><AdminBadge tone="warning">{item.badgeText || bonusLabel(item)}</AdminBadge><h3>{item.title}</h3><p>{item.description}</p><small>ฝากขั้นต่ำ {money(item.minDeposit)} · ยอดทำรายการ {item.turnoverMultiplier} เท่า</small></div></section>; }
function bonusLabel(item: PromotionCampaign) { return item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue); }
function money(value: number) { return `฿${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function slug(value: unknown) { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || `promotion-${Date.now()}`; }
function isValidUrl(value: string) { try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function createCampaign(index: number): PromotionCampaign { return { ...defaultCampaign, id: `promotion-${Date.now()}`, title: `โปรโมชัน ${index}`, description: '', badgeText: 'NEW', priority: index * 10 }; }
function normalizeCampaigns(value: unknown): PromotionCampaign[] { if (!Array.isArray(value)) return [defaultCampaign]; return value.map((item: Record<string, unknown>, index) => ({ id: slug(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? ''), description: String(item.description ?? ''), enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', imageUrl: String(item.imageUrl ?? ''), iconUrl: String(item.iconUrl ?? ''), badgeText: String(item.badgeText ?? ''), accentColor: String(item.accentColor ?? '#f5c542'), priority: Number(item.priority ?? 0), startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined })); }
function validateCampaigns(campaigns: PromotionCampaign[]) { const warnings: string[] = []; const ids = new Set<string>(); for (const item of campaigns) { if (!item.id.trim()) warnings.push('มีรายการที่ยังไม่มีรหัส'); if (ids.has(item.id)) warnings.push(`รหัสซ้ำ: ${item.id}`); ids.add(item.id); if (item.enabled && !item.title.trim()) warnings.push('รายการที่เปิดใช้งานต้องมีชื่อ'); if (item.enabled && !item.description.trim()) warnings.push(`กรุณาใส่รายละเอียด: ${item.title || item.id}`); if (item.bonusType === 'percent' && item.bonusValue > 100) warnings.push('เปอร์เซ็นต์โบนัสต้องไม่เกิน 100%'); if ([item.maxBonus, item.minDeposit, item.bonusValue, item.turnoverMultiplier].some((value) => value < 0)) warnings.push('ตัวเลขต้องไม่ติดลบ'); if (item.enabled && item.turnoverMultiplier <= 0) warnings.push(`ยอดทำรายการต้องมากกว่า 0: ${item.title || item.id}`); if (item.startsAt && item.endsAt && item.startsAt > item.endsAt) warnings.push(`วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด: ${item.title || item.id}`); if (item.imageUrl && !isValidUrl(item.imageUrl)) warnings.push(`ลิงก์รูปไม่ถูกต้อง: ${item.title || item.id}`); if (item.iconUrl && !isValidUrl(item.iconUrl)) warnings.push(`ลิงก์ไอคอนไม่ถูกต้อง: ${item.title || item.id}`); } return warnings; }

const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const editorStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 14, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 14, minWidth: 0 } as const;
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' };
const fieldGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 } as const;
const fieldStyle = { display: 'grid', gap: 6, minWidth: 0, fontWeight: 800 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const textareaStyle = { ...inputStyle, minHeight: 92, padding: 12, resize: 'vertical' as const };
const statusGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 10 } as const;
const statusItemStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const };
const previewStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 20, overflow: 'hidden' as const, background: 'rgba(15,23,42,.88)' } as const;
const previewImageStyle = { width: '100%', height: 150, objectFit: 'cover' as const, display: 'block' };
const previewFallbackStyle = { height: 150, display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 900, background: 'rgba(255,255,255,.04)' } as const;
const previewIconStyle = { width: 68, height: 68, objectFit: 'cover' as const, borderRadius: 18 };
const previewBodyStyle = { padding: 14, display: 'grid', gap: 8 } as const;