'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { buildAdminListQuery, normalizeAdminListPayload, type AdminListPayload, useAdminListContract } from '../_components/admin-list-contract';
import { redactAdminPayload } from '../_components/admin-payload-redaction';
import { AdminBadge, AdminButton, AdminCard, AdminCode, AdminDataValue, AdminEmpty, AdminFilterBar, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPagination, AdminPayloadViewer, AdminRow, AdminStack } from '../_components/admin-ui';
import { humanStatus, statusTone } from '../_components/human-labels';

type WebhookLog = { id: string; eventType: string; status: string; signatureValid: boolean; idempotencyKey?: string | null; providerTransactionId?: string | null; responseStatus?: number | null; errorCode?: string | null; errorMessage?: string | null; rawPayload?: unknown; normalizedPayload?: unknown; createdAt: string; provider?: { name: string; code: string } };
type Metrics = { total: number; processed: number; failed: number; duplicate: number };
type WebhookPayload = AdminListPayload<WebhookLog> & { summary: Metrics };

const emptyPayload: WebhookPayload = { items: [], total: 0, page: 1, pageSize: 25, totalPages: 1, summary: { total: 0, processed: 0, failed: 0, duplicate: 0 } };

export default function WebhookLogsPage() {
  const [payload, setPayload] = useState<WebhookPayload>(emptyPayload);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลด Webhook...');
  const [loading, setLoading] = useState(false);
  const list = useAdminListContract({ initialPageSize: 25 });

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadLogs(); }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [list.page, list.pageSize, query, status]);

  async function loadLogs() {
    setLoading(true);
    setMessage('กำลังโหลด Webhook...');
    const suffix = buildAdminListQuery({ page: list.page, take: list.pageSize, search: query.trim(), status: status === 'all' ? undefined : status });
    const res = await adminApiFetch(`/admin/webhook-logs${suffix}`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด Webhook ไม่สำเร็จ'); return; }
    const normalized = normalizeAdminListPayload<WebhookLog>(data, list.page, list.pageSize);
    setPayload({ ...normalized, summary: data?.summary ?? { total: normalized.total, processed: 0, failed: 0, duplicate: 0 } });
    if (normalized.page !== list.page) list.setPage(normalized.page);
    setMessage('');
  }

  function clearFilters() { setQuery(''); setStatus('all'); list.resetPage(); }
  function updateQuery(value: string) { setQuery(value); list.resetPage(); }
  function updateStatus(value: string) { setStatus(value); list.resetPage(); }

  const metrics = payload.summary;
  return <AdminPage eyebrow="ระบบเชื่อมต่อ" title="Webhook จากค่าย" description="ตรวจ callback ลายเซ็น และรายการที่ต้องติดตาม" actions={<><AdminButton size="compact" tone="ghost" onClick={clearFilters}>ล้างตัวกรอง</AdminButton><AdminButton size="compact" onClick={() => void loadLogs()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(metrics.total)} helper="ตามตัวกรอง" /><AdminMetric title="ประมวลผลแล้ว" value={String(metrics.processed)} tone="success" /><AdminMetric title="รายการซ้ำ" value={String(metrics.duplicate)} tone={metrics.duplicate ? 'warning' : 'success'} /><AdminMetric title="มีปัญหา" value={String(metrics.failed)} tone={metrics.failed ? 'danger' : 'success'} /></AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminFilterBar resultText={loading ? 'กำลังโหลด...' : `${payload.items.length}/${payload.total} รายการ`}><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="ค้นหาค่าย รหัสรายการ หรือเหตุการณ์" /><select value={status} onChange={(event) => updateStatus(event.target.value)}><option value="all">ทุกสถานะ</option><option value="RECEIVED">รับข้อมูลแล้ว</option><option value="PROCESSED">ประมวลผลแล้ว</option><option value="FAILED">มีปัญหา</option><option value="DUPLICATE">รายการซ้ำ</option><option value="IGNORED">ข้ามรายการ</option><option value="RESOLVED">แก้ไขแล้ว</option></select><select aria-label="จำนวนรายการต่อหน้า" value={list.pageSize} onChange={(event) => list.setPageSize(Number(event.target.value))}>{list.allowedPageSizes.map((size) => <option key={size} value={size}>{size} / หน้า</option>)}</select></AdminFilterBar>
    <AdminStack>{payload.items.map((item) => <AdminCard key={item.id} compact tone={item.status === 'FAILED' || !item.signatureValid ? 'danger' : 'neutral'}>
      <AdminRow><div style={mainInfoStyle}><h2 style={titleStyle}>{eventLabel(item.eventType)}</h2><span style={mutedStyle}>{item.provider?.name ?? item.provider?.code ?? '-'} · HTTP {item.responseStatus ?? '-'}</span></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'danger'}>{item.signatureValid ? 'ลายเซ็นถูกต้อง' : 'ลายเซ็นไม่ถูกต้อง'}</AdminBadge><AdminButton size="compact" tone="ghost" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'ซ่อนข้อมูล' : 'ข้อมูลเทคนิค'}</AdminButton></div></AdminRow>
      <div style={detailGridStyle}><AdminDataValue label="รหัสกันซ้ำ"><AdminCode {...(item.idempotencyKey ? { title: item.idempotencyKey } : {})}>{shortId(item.idempotencyKey)}</AdminCode></AdminDataValue><AdminDataValue label="เลขอ้างอิงค่าย"><AdminCode {...(item.providerTransactionId ? { title: item.providerTransactionId } : {})}>{shortId(item.providerTransactionId)}</AdminCode></AdminDataValue><AdminDataValue label="สร้างเมื่อ">{new Date(item.createdAt).toLocaleString('th-TH')}</AdminDataValue></div>
      {item.errorMessage && <AdminNotice tone="danger">{webhookErrorLabel(item.errorCode)}</AdminNotice>}
      {expanded === item.id && <details open><summary style={summaryStyle}>ข้อมูลที่รับและแปลงแล้ว</summary><AdminPayloadViewer payload={redactAdminPayload({ rawPayload: item.rawPayload, normalizedPayload: item.normalizedPayload })} maxHeight={360} /></details>}
    </AdminCard>)}{!loading && payload.items.length === 0 && <AdminEmpty>ไม่พบ Webhook ตามตัวกรอง</AdminEmpty>}</AdminStack>
    {payload.total > 0 && <AdminPagination page={payload.page} totalPages={payload.totalPages} onPrevious={() => list.setPage(payload.page - 1)} onNext={() => list.setPage(payload.page + 1)} disabled={loading} />}
  </AdminPage>;
}

function shortId(value?: string | null) { if (!value) return '-'; return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-7)}` : value; }
function eventLabel(type: string) { const map: Record<string, string> = { BET_SETTLED: 'เดิมพันจบแล้ว', WIN: 'ผลชนะ', ROLLBACK: 'คืนรายการ', CANCEL: 'ยกเลิก', 'adapter.test': 'ทดสอบการเชื่อมต่อ' }; return map[type] ?? type; }
function webhookErrorLabel(code?: string | null) { const labels: Record<string, string> = { INVALID_SIGNATURE: 'ลายเซ็น Webhook ไม่ถูกต้อง', TIMEOUT: 'ระบบปลายทางตอบกลับช้า', DUPLICATE: 'พบ Webhook ซ้ำ ระบบไม่ได้ทำรายการซ้ำ', VALIDATION_ERROR: 'ข้อมูล Webhook ไม่ครบหรือไม่ถูกต้อง' }; return labels[code ?? ''] ?? 'ประมวลผล Webhook ไม่สำเร็จ กรุณาตรวจข้อมูลในรายละเอียด'; }
const mainInfoStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const detailGridStyle = { display: 'grid', gap: 8, marginTop: 2 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.45, overflowWrap: 'anywhere' as const };
const titleStyle = { margin: 0, fontSize: 19, lineHeight: 1.18 } as const;
const badgeStackStyle = { display: 'flex', gap: 7, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const summaryStyle = { cursor: 'pointer', color: '#cbd5e1', fontWeight: 800, fontSize: 13, marginBottom: 8 } as const;
