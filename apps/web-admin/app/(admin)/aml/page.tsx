'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus, severityLabel, statusTone } from '../_components/human-labels';

type AlertStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AmlAlert = { id: string; type: string; severity: AlertSeverity; status: AlertStatus; memberId?: string | null; shortMemberId?: string | null; title: string; description?: string | null; createdAt: string };
type RiskResponse = { items?: unknown[]; total?: number; pageCount?: number };

const AML_TYPES = ['RAPID_DEPOSIT_WITHDRAWAL', 'HIGH_WITHDRAWAL', 'REPEATED_TOPUPS', 'WALLET_LEDGER_MISMATCH'] as const;
const STATUS_OPTIONS: Array<'' | AlertStatus> = ['', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
const SEVERITY_OPTIONS: Array<'' | AlertSeverity> = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function isAmlAlert(value: unknown): value is AmlAlert {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AmlAlert>;
  return typeof item.id === 'string' && typeof item.type === 'string' && AML_TYPES.includes(item.type as (typeof AML_TYPES)[number]) && typeof item.title === 'string' && typeof item.createdAt === 'string' && typeof item.severity === 'string' && typeof item.status === 'string';
}

export default function AmlPage() {
  const [items, setItems] = useState<AmlAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'' | AlertStatus>('OPEN');
  const [severity, setSeverity] = useState<'' | AlertSeverity>('');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const pageBusy = loading || Boolean(busyKey);

  useEffect(() => { void load(); }, [status, severity]);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: '1', take: '100' });
      if (status) query.set('status', status);
      if (severity) query.set('severity', severity);
      const response = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
      const data = await response.json().catch(() => null) as RiskResponse | null;
      if (!response.ok || !data || typeof data !== 'object') throw new Error('load');
      const nextItems = Array.isArray(data.items) ? data.items.filter(isAmlAlert) : [];
      setItems(nextItems);
      setTotal(Number.isFinite(Number(data.total)) ? Number(data.total) : nextItems.length);
      setMessage('');
    } catch {
      setItems([]);
      setTotal(0);
      setMessage('โหลดคิว AML ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function startReview(id: string) {
    if (pageBusy) return;
    setBusyKey(`review:${id}`);
    try {
      const response = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'REVIEWING' }) });
      await response.json().catch(() => null);
      if (!response.ok) throw new Error('review');
      await load();
      setMessage('ย้ายรายการเข้าสู่การตรวจสอบแล้ว');
    } catch {
      setMessage('เริ่มตรวจสอบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  const openCount = items.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING').length;
  const urgentCount = items.filter((item) => item.severity === 'HIGH' || item.severity === 'CRITICAL').length;

  return <AdminPage eyebrow="ความเสี่ยง" title="AML Review Center" description="ตรวจรูปแบบฝากถอนผิดปกติ จัดลำดับเคสเร่งด่วน และเปิดหลักฐานที่เกี่ยวข้องจากคิวเดียว" actions={<><AdminButton tone="secondary" onClick={() => void load()} disabled={pageBusy}>รีเฟรช</AdminButton><AdminLinkButton href="/risk-alerts" tone="primary">เปิด Alerts ทั้งหมด</AdminLinkButton></>}>
    <AdminMetricGrid>
      <AdminMetric title="คิวที่แสดง" value={String(items.length)} helper={`${total} รายการจาก API ก่อนกรองประเภท AML`} />
      <AdminMetric title="กำลังดำเนินการ" value={String(openCount)} helper="เปิดอยู่และกำลังตรวจ" tone={openCount ? 'warning' : 'success'} />
      <AdminMetric title="เร่งด่วน" value={String(urgentCount)} helper="Critical และ High" tone={urgentCount ? 'danger' : 'success'} />
      <AdminMetric title="รูปแบบที่ตรวจ" value={String(AML_TYPES.length)} helper="ธุรกรรมหลักที่ต้องเฝ้าระวัง" />
    </AdminMetricGrid>

    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    <AdminCard title="ตัวกรอง AML" description="กรองคิวตามสถานะและระดับความเสี่ยง">
      <AdminToolbar>
        <label style={fieldStyle}>สถานะ<select value={status} disabled={pageBusy} onChange={(event) => setStatus(event.target.value as '' | AlertStatus)} style={inputStyle}>{STATUS_OPTIONS.map((value) => <option key={value || 'ALL'} value={value}>{value ? humanStatus(value) : 'ทั้งหมด'}</option>)}</select></label>
        <label style={fieldStyle}>ระดับความเสี่ยง<select value={severity} disabled={pageBusy} onChange={(event) => setSeverity(event.target.value as '' | AlertSeverity)} style={inputStyle}>{SEVERITY_OPTIONS.map((value) => <option key={value || 'ALL'} value={value}>{value ? severityLabel(value) : 'ทั้งหมด'}</option>)}</select></label>
      </AdminToolbar>
    </AdminCard>

    <AdminCard title="AML Investigation Queue" description="เปิดรายละเอียดและบันทึกหลักฐานก่อน Resolve หรือ Dismiss">
      <AdminStack>
        {loading ? <AdminEmpty>กำลังโหลดคิว AML...</AdminEmpty> : items.length === 0 ? <AdminEmpty>ไม่พบรายการ AML ตามตัวกรอง</AdminEmpty> : items.map((item) => <AdminRow key={item.id}>
          <div style={alertBodyStyle}>
            <div style={badgeRowStyle}><AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge>{typeLabel(item.type)}</AdminBadge></div>
            <strong>{item.title}</strong>
            {item.description && <span style={mutedStyle}>{item.description}</span>}
            <span style={mutedStyle}>สมาชิก {item.shortMemberId ?? item.memberId?.slice(0, 8) ?? '-'} · พบเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}</span>
          </div>
          <div style={actionStyle}>
            <AdminLinkButton href={`/risk-alerts/${item.id}`}>ดูรายละเอียด</AdminLinkButton>
            <AdminButton tone="secondary" disabled={pageBusy || item.status === 'REVIEWING' || item.status === 'RESOLVED' || item.status === 'DISMISSED'} onClick={() => void startReview(item.id)}>{busyKey === `review:${item.id}` ? 'กำลังเริ่ม...' : 'เริ่มตรวจ'}</AdminButton>
          </div>
        </AdminRow>)}
      </AdminStack>
    </AdminCard>

    <AdminCard title="เกณฑ์ก่อนปิดเคส" description="ทุกเคสควรมีหลักฐานและเหตุผล ไม่ใช่ปิดเพื่อให้ Dashboard ดูสงบ">
      <AdminStack>{['ยืนยันเจ้าของบัญชีและสมาชิก', 'ตรวจรายการฝาก ถอน และยอดคงเหลือ', 'อ่าน Timeline และหมายเหตุเดิม', 'บันทึกเหตุผล Resolve หรือ Dismiss'].map((item) => <AdminRow key={item}><span>{item}</span><AdminBadge tone="success">ต้องตรวจ</AdminBadge></AdminRow>)}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

function severityTone(value: AlertSeverity) { if (value === 'CRITICAL' || value === 'HIGH') return 'danger'; if (value === 'MEDIUM') return 'warning'; return 'neutral'; }
function typeLabel(value: string) { return ({ RAPID_DEPOSIT_WITHDRAWAL: 'ฝากแล้วถอนเร็ว', HIGH_WITHDRAWAL: 'ถอนยอดสูง', REPEATED_TOPUPS: 'ฝากถี่ผิดปกติ', WALLET_LEDGER_MISMATCH: 'ยอดบัญชีไม่ตรง' } as Record<string, string>)[value] ?? value; }
const fieldStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900, minWidth: 0 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180, fontSize: 16 } as const;
const alertBodyStyle = { display: 'grid', gap: 8, flex: '1 1 260px', minWidth: 0 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const mutedStyle = { color: '#94a3b8', fontSize: 13, lineHeight: 1.5 } as const;
