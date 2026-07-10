'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus, statusTone } from '../_components/human-labels';

type WebhookLog = { id: string; eventType: string; status: string; signatureValid: boolean; idempotencyKey?: string | null; providerTransactionId?: string | null; responseStatus?: number | null; errorCode?: string | null; errorMessage?: string | null; rawPayload?: unknown; normalizedPayload?: unknown; createdAt: string; provider?: { name: string; code: string } };
type Payload = { items?: WebhookLog[]; summary?: { total: number; processed: number; failed: number; duplicate: number } };

export default function WebhookLogsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลด Webhook...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadLogs(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.eventType, item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, processed: items.filter((item) => item.status === 'PROCESSED').length, failed: items.filter((item) => item.status === 'FAILED').length, duplicate: items.filter((item) => item.status === 'DUPLICATE').length }, [payload.summary, items]);
  async function loadLogs() { setLoading(true); setMessage('กำลังโหลด Webhook...'); const res = await adminApiFetch('/admin/webhook-logs'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด Webhook ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  return <AdminPage eyebrow="ขั้นสูง" title="Webhook จากค่าย" description="ดู callback ที่ค่ายส่งมา ตอนนี้ใช้เพื่อตรวจสอบและ debug ก่อนให้กระทบเงินจริง" actions={<AdminButton onClick={loadLogs} disabled={loading}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(metrics.total)} helper="ล่าสุด 100" /><AdminMetric title="ทำแล้ว" value={String(metrics.processed)} helper="รับได้" /><AdminMetric title="ซ้ำ" value={String(metrics.duplicate)} helper="กันรายการซ้ำ" /><AdminMetric title="มีปัญหา" value={String(metrics.failed)} helper="ต้องตรวจ" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา tx / ค่าย / key" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">ทุกสถานะ</option><option value="PROCESSED">ทำแล้ว</option><option value="FAILED">มีปัญหา</option><option value="DUPLICATE">ซ้ำ</option></select><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${filtered.length}/${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{eventLabel(item.eventType)}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · response {item.responseStatus ?? '-'}</p><p style={smallMutedStyle}>รหัสกันซ้ำ: {item.idempotencyKey ?? '-'}</p><p style={smallMutedStyle}>เลขอ้างอิงค่าย: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'warning'}>{item.signatureValid ? 'ลายเซ็นถูก' : 'ลายเซ็นผิด'}</AdminBadge><AdminButton tone="secondary" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'ซ่อนข้อมูลเทคนิค' : 'ข้อมูลเทคนิค'}</AdminButton></div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorMessage}</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{JSON.stringify({ rawPayload: item.rawPayload, normalizedPayload: item.normalizedPayload }, null, 2)}</pre>}<p style={smallMutedStyle}>สร้างเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มี Webhook</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function eventLabel(type: string) { const map: Record<string, string> = { BET_SETTLED: 'เดิมพันจบแล้ว', WIN: 'มีผลชนะ', ROLLBACK: 'คืนรายการ', CANCEL: 'ยกเลิก', 'adapter.test': 'ทดสอบ' }; return map[type] ?? type; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
