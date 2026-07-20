'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminCode, AdminDataValue, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
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

  useEffect(() => { void loadLogs(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.eventType, item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, processed: items.filter((item) => item.status === 'PROCESSED').length, failed: items.filter((item) => item.status === 'FAILED').length, duplicate: items.filter((item) => item.status === 'DUPLICATE').length }, [payload.summary, items]);

  async function loadLogs() {
    setLoading(true);
    setMessage('กำลังโหลด Webhook...');
    const res = await adminApiFetch('/admin/webhook-logs');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด Webhook ไม่สำเร็จ'); return; }
    setPayload(data ?? {});
    setMessage('');
  }

  function clearFilters() { setQuery(''); setStatus('all'); }

  return <AdminPage eyebrow="ระบบเชื่อมต่อ" title="Webhook จากค่าย" description="ตรวจ callback ลายเซ็น และรายการที่ต้องติดตาม" actions={<><AdminButton size="compact" tone="ghost" onClick={clearFilters}>ล้างตัวกรอง</AdminButton><AdminButton size="compact" onClick={() => void loadLogs()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(metrics.total)} helper="รายการล่าสุด" /><AdminMetric title="ประมวลผลแล้ว" value={String(metrics.processed)} tone="success" /><AdminMetric title="รายการซ้ำ" value={String(metrics.duplicate)} tone={metrics.duplicate ? 'warning' : 'success'} /><AdminMetric title="มีปัญหา" value={String(metrics.failed)} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาค่าย รหัสรายการ หรือ Event" /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">ทุกสถานะ</option><option value="PROCESSED">ประมวลผลแล้ว</option><option value="FAILED">มีปัญหา</option><option value="DUPLICATE">รายการซ้ำ</option></select><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${filtered.length}/${items.length} รายการ`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id} compact tone={item.status === 'FAILED' || !item.signatureValid ? 'danger' : 'neutral'}>
      <AdminRow><div style={mainInfoStyle}><h2 style={titleStyle}>{eventLabel(item.eventType)}</h2><span style={mutedStyle}>{item.provider?.name ?? item.provider?.code ?? '-'} · HTTP {item.responseStatus ?? '-'}</span></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'danger'}>{item.signatureValid ? 'ลายเซ็นถูกต้อง' : 'ลายเซ็นไม่ถูกต้อง'}</AdminBadge><AdminButton size="compact" tone="ghost" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'ซ่อนข้อมูล' : 'ข้อมูลเทคนิค'}</AdminButton></div></AdminRow>
      <div style={detailGridStyle}>
        <AdminDataValue label="รหัสกันซ้ำ"><AdminCode title={item.idempotencyKey ?? undefined}>{shortId(item.idempotencyKey)}</AdminCode></AdminDataValue>
        <AdminDataValue label="เลขอ้างอิงค่าย"><AdminCode title={item.providerTransactionId ?? undefined}>{shortId(item.providerTransactionId)}</AdminCode></AdminDataValue>
        <AdminDataValue label="สร้างเมื่อ">{new Date(item.createdAt).toLocaleString('th-TH')}</AdminDataValue>
      </div>
      {item.errorMessage && <AdminNotice tone="danger">{item.errorCode ? `${item.errorCode}: ` : ''}{item.errorMessage}</AdminNotice>}
      {expanded === item.id && <details open><summary style={summaryStyle}>Payload ที่รับและแปลงแล้ว</summary><pre style={preStyle}>{JSON.stringify({ rawPayload: item.rawPayload, normalizedPayload: item.normalizedPayload }, null, 2)}</pre></details>}
    </AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ไม่พบ Webhook ตามตัวกรอง</AdminEmpty>}</AdminStack>
  </AdminPage>;
}

function shortId(value?: string | null) { if (!value) return '-'; return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-7)}` : value; }
function eventLabel(type: string) { const map: Record<string, string> = { BET_SETTLED: 'เดิมพันจบแล้ว', WIN: 'ผลชนะ', ROLLBACK: 'คืนรายการ', CANCEL: 'ยกเลิก', 'adapter.test': 'ทดสอบการเชื่อมต่อ' }; return map[type] ?? type; }
const mainInfoStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const detailGridStyle = { display: 'grid', gap: 8, marginTop: 2 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.45, overflowWrap: 'anywhere' as const };
const titleStyle = { margin: 0, fontSize: 19, lineHeight: 1.18 } as const;
const badgeStackStyle = { display: 'flex', gap: 7, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const summaryStyle = { cursor: 'pointer', color: '#cbd5e1', fontWeight: 800, fontSize: 13, marginBottom: 8 } as const;
const preStyle = { margin: 0, padding: 10, borderRadius: 12, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, overflowWrap: 'anywhere' as const, whiteSpace: 'pre-wrap' as const, fontSize: 12, lineHeight: 1.5, maxHeight: 360 };