'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { severityLabel } from '../_components/human-labels';

type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AdminOption = { id: string; username: string; email: string };
type InvestigationAlert = { id: string; type: string; severity: AlertSeverity; status: 'REVIEWING'; memberId?: string | null; shortMemberId?: string | null; title: string; description?: string | null; refType?: string | null; refId?: string | null; assignedToAdminId?: string | null; assignedAt?: string | null; assignedToAdmin?: AdminOption | null; createdAt: string; updatedAt?: string | null };
type RiskResponse = { items?: unknown[]; total?: number };

const SEVERITY_OPTIONS: Array<'' | AlertSeverity> = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const OWNER_OPTIONS = ['', 'ASSIGNED', 'UNASSIGNED'] as const;
type OwnerFilter = (typeof OWNER_OPTIONS)[number];

function isInvestigationAlert(value: unknown): value is InvestigationAlert {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<InvestigationAlert>;
  return typeof item.id === 'string' && typeof item.type === 'string' && item.status === 'REVIEWING' && typeof item.title === 'string' && typeof item.createdAt === 'string' && typeof item.severity === 'string';
}

export default function InvestigationPage() {
  const [items, setItems] = useState<InvestigationAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState<'' | AlertSeverity>('');
  const [owner, setOwner] = useState<OwnerFilter>('');
  const [loading, setLoading] = useState(true);
  const [referenceTime, setReferenceTime] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, [severity]);

  async function load() {
    if (loading && items.length > 0) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({ status: 'REVIEWING', page: '1', take: '100' });
      if (severity) query.set('severity', severity);
      const response = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
      const data = await response.json().catch(() => null) as RiskResponse | null;
      if (!response.ok || !data || typeof data !== 'object') throw new Error('load');
      const nextItems = Array.isArray(data.items) ? data.items.filter(isInvestigationAlert) : [];
      setItems(nextItems);
      setTotal(Number.isFinite(Number(data.total)) ? Number(data.total) : nextItems.length);
      setReferenceTime(Date.now());
      setMessage('');
    } catch {
      setItems([]);
      setTotal(0);
      setReferenceTime(0);
      setMessage('โหลดคิวสืบสวนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const visibleItems = items.filter((item) => owner === 'ASSIGNED' ? Boolean(item.assignedToAdminId) : owner === 'UNASSIGNED' ? !item.assignedToAdminId : true);
  const urgentCount = visibleItems.filter((item) => item.severity === 'HIGH' || item.severity === 'CRITICAL').length;
  const unassignedCount = visibleItems.filter((item) => !item.assignedToAdminId).length;
  const staleCount = referenceTime ? visibleItems.filter((item) => referenceTime - new Date(item.updatedAt ?? item.createdAt).getTime() > 24 * 60 * 60 * 1000).length : 0;

  return <AdminPage eyebrow="ความเสี่ยง" title="Investigation Queue" description="รวมเคสที่กำลังตรวจสอบ จัดลำดับความเร่งด่วน และเปิดหลักฐานหรือสมาชิกที่เกี่ยวข้องจากคิวเดียว" actions={<><AdminButton tone="secondary" onClick={() => void load()} disabled={loading}>รีเฟรช</AdminButton><AdminLinkButton href="/risk-alerts" tone="primary">เปิด Risk Alerts</AdminLinkButton></>}>
    <AdminMetricGrid>
      <AdminMetric title="คิวที่แสดง" value={String(visibleItems.length)} helper={`${total} รายการจาก API`} />
      <AdminMetric title="เร่งด่วน" value={String(urgentCount)} helper="Critical และ High" tone={urgentCount ? 'danger' : 'success'} />
      <AdminMetric title="ยังไม่มีผู้รับผิดชอบ" value={String(unassignedCount)} helper="ควรมอบหมายก่อนตรวจต่อ" tone={unassignedCount ? 'warning' : 'success'} />
      <AdminMetric title="ค้างเกิน 24 ชั่วโมง" value={String(staleCount)} helper="อิงเวลาที่โหลดข้อมูลล่าสุด" tone={staleCount ? 'warning' : 'success'} />
    </AdminMetricGrid>

    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    <AdminCard title="ตัวกรองคิวสืบสวน" description="กรองตามระดับความเสี่ยงและสถานะผู้รับผิดชอบ">
      <AdminToolbar>
        <label style={fieldStyle}>ระดับความเสี่ยง<select value={severity} disabled={loading} onChange={(event) => setSeverity(event.target.value as '' | AlertSeverity)} style={inputStyle}>{SEVERITY_OPTIONS.map((value) => <option key={value || 'ALL'} value={value}>{value ? severityLabel(value) : 'ทั้งหมด'}</option>)}</select></label>
        <label style={fieldStyle}>ผู้รับผิดชอบ<select value={owner} disabled={loading} onChange={(event) => setOwner(event.target.value as OwnerFilter)} style={inputStyle}><option value="">ทั้งหมด</option><option value="ASSIGNED">มอบหมายแล้ว</option><option value="UNASSIGNED">ยังไม่มอบหมาย</option></select></label>
      </AdminToolbar>
    </AdminCard>

    <AdminCard title="เคสที่กำลังตรวจสอบ" description="เปิดรายละเอียดเพื่อดู Timeline, Metadata, Related Links และบันทึกผลก่อนปิดเคส">
      <AdminStack>
        {loading ? <AdminEmpty>กำลังโหลดคิวสืบสวน...</AdminEmpty> : visibleItems.length === 0 ? <AdminEmpty>ไม่พบเคสที่กำลังตรวจตามตัวกรอง</AdminEmpty> : visibleItems.map((item) => <AdminRow key={item.id}>
          <div style={bodyStyle}>
            <div style={badgeRowStyle}><AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge><AdminBadge tone={item.assignedToAdminId ? 'success' : 'warning'}>{item.assignedToAdminId ? 'มีผู้รับผิดชอบ' : 'ยังไม่มอบหมาย'}</AdminBadge><AdminBadge>{item.type}</AdminBadge></div>
            <strong>{item.title}</strong>
            {item.description && <span style={mutedStyle}>{item.description}</span>}
            <span style={mutedStyle}>ผู้รับผิดชอบ {item.assignedToAdmin?.username ?? '-'} · อ้างอิง {item.refType ?? '-'} / {item.refId?.slice(0, 10) ?? '-'} · อัปเดต {new Date(item.updatedAt ?? item.createdAt).toLocaleString('th-TH')}</span>
          </div>
          <div style={actionStyle}>{item.memberId && <AdminLinkButton href={`/members/${item.memberId}`} tone="secondary">ดูสมาชิก</AdminLinkButton>}<AdminLinkButton href={`/risk-alerts/${item.id}`}>ตรวจรายละเอียด</AdminLinkButton></div>
        </AdminRow>)}
      </AdminStack>
    </AdminCard>
  </AdminPage>;
}

function severityTone(value: AlertSeverity) { if (value === 'CRITICAL' || value === 'HIGH') return 'danger'; if (value === 'MEDIUM') return 'warning'; return 'neutral'; }
const fieldStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900, minWidth: 0 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180, fontSize: 16 } as const;
const bodyStyle = { display: 'grid', gap: 8, flex: '1 1 260px', minWidth: 0 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const mutedStyle = { color: '#94a3b8', fontSize: 13, lineHeight: 1.5 } as const;
