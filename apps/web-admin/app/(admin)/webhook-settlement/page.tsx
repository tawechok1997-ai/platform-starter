'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type WebhookLog = { id: string; eventType: string; status: string; signatureValid: boolean; idempotencyKey?: string | null; providerTransactionId?: string | null; rawPayload?: any; normalizedPayload?: any; errorCode?: string | null; errorMessage?: string | null; createdAt: string; processedAt?: string | null; provider?: { name?: string | null; code?: string | null } | null };
type Payload = { items?: WebhookLog[]; summary?: { total: number; processed: number; failed: number; duplicate: number } };

const modes = ['success', 'failed', 'timeout', 'mismatch', 'duplicate', 'invalid_signature'];
const events = ['BET_SETTLED', 'WIN', 'ROLLBACK', 'simulator.transfer.completed'];

export default function WebhookSettlementPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลด webhook settlement...');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [mode, setMode] = useState('success');
  const [eventType, setEventType] = useState('BET_SETTLED');
  const [testResult, setTestResult] = useState<any>(null);
  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const res = await adminApiFetch('/admin/webhook-logs'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด webhook logs ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function generateWebhook() {
    setLoading(true); setMessage('กำลังสร้าง mock webhook...');
    const res = await adminApiFetch('/admin/money-ops/provider-simulator/scenarios');
    const scenarios = await res.json().catch(() => null);
    const body = { mode, eventType, amount: '100.00', currency: 'THB', idempotencyKey: mode === 'duplicate' ? 'sim_duplicate_key' : `webhook_test_${Date.now()}` };
    const sim = await adminApiFetch('/provider-simulator/webhook', { method: 'POST', body: JSON.stringify(body), skipAuth: true });
    const data = await sim.json().catch(() => null);
    setLoading(false);
    setTestResult({ request: body, simulatorScenarios: scenarios?.modes ?? [], result: data });
    setMessage(sim.ok ? 'สร้าง mock webhook แล้ว ดู payload ด้านล่าง' : data?.message ?? 'สร้าง mock webhook ไม่สำเร็จ');
  }
  const items = payload.items ?? [];
  const filtered = useMemo(() => status === 'all' ? items : items.filter((item) => item.status === status), [items, status]);
  const summary = payload.summary ?? { total: items.length, processed: items.filter((i) => i.status === 'PROCESSED').length, failed: items.filter((i) => i.status === 'FAILED').length, duplicate: items.filter((i) => i.status === 'DUPLICATE').length };
  return <AdminPage eyebrow="Game Platform" title="Webhook Settlement" description="ศูนย์ตรวจ webhook ก่อนปล่อยให้ webhook มีผลกับยอดเงินจริงแบบมี gate ไม่ใช่ให้ provider ถือปากกาเขียน wallet เอง" actions={<AdminButton onClick={load} disabled={loading}>Refresh</AdminButton>}>
    <AdminNotice>สถานะตอนนี้เป็น gated scaffold: ระบบ log, validate signature, dedup และแสดง settlement readiness ก่อน ยังไม่ auto-settle wallet จาก webhook จนกว่า webhookSettlementEnabled + rule mapping จะพร้อมจริง</AdminNotice>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Total" value={String(summary.total)} helper="latest 100" /><AdminMetric title="Processed" value={String(summary.processed)} helper="signature/dedup ผ่าน" /><AdminMetric title="Failed" value={String(summary.failed)} helper="invalid/error" /><AdminMetric title="Duplicate" value={String(summary.duplicate)} helper="idempotency ซ้ำ" /></AdminMetricGrid>

    <AdminCard title="Webhook Test Mode" description="สร้าง payload จำลองจาก simulator เพื่อทดสอบ duplicate / invalid signature / rollback ก่อนต่อค่ายจริง">
      <AdminStack>
        <AdminRow><label style={labelStyle}>Event<select value={eventType} onChange={(event) => setEventType(event.target.value)} style={inputStyle}>{events.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label style={labelStyle}>Mode<select value={mode} onChange={(event) => setMode(event.target.value)} style={inputStyle}>{modes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><AdminButton onClick={generateWebhook} disabled={loading}>Generate mock webhook</AdminButton></AdminRow>
        {testResult && <details style={detailsStyle} open><summary>mock webhook result</summary><pre style={preStyle}>{JSON.stringify(testResult, null, 2)}</pre></details>}
      </AdminStack>
    </AdminCard>

    <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">All</option><option value="PROCESSED">PROCESSED</option><option value="FAILED">FAILED</option><option value="DUPLICATE">DUPLICATE</option><option value="RECEIVED">RECEIVED</option></select><span style={mutedStyle}>{filtered.length}/{items.length} logs</span></AdminToolbar>
    <AdminCard title="Settlement readiness" description="ครบก่อนค่อยเปิด webhookSettlementEnabled"><AdminStack>{['signatureValid = true', 'idempotencyKey มีทุก event', 'duplicate ไม่ทำซ้ำ', 'eventType map กับ rule ได้', 'providerTransactionId match transfer ได้', 'reconciliation ไม่ mismatch'].map((item, index) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone={index < 3 ? 'success' : 'warning'}>{index < 3 ? 'Required' : 'Before settle'}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.eventType}</strong><p style={mutedStyle}>{item.provider?.name ?? item.provider?.code ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p><p style={smallStyle}>idempotency: {item.idempotencyKey ?? '-'} · tx: {item.providerTransactionId ?? '-'}</p></div><div style={actionsStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'danger'}>{item.signatureValid ? 'signature ok' : 'signature fail'}</AdminBadge></div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'} · {item.errorMessage}</AdminNotice>}<details style={detailsStyle}><summary>payload</summary><pre style={preStyle}>{JSON.stringify({ normalizedPayload: item.normalizedPayload, rawPayload: item.rawPayload }, null, 2)}</pre></details></AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มี webhook log</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'PROCESSED') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'DUPLICATE') return 'warning'; return 'neutral'; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const detailsStyle = { color: '#cbd5e1' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12 } as const;
