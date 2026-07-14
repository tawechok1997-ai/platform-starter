'use client';

import { createApiClient } from '@platform/api-client';
import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string };
type WebhookResult = { ok?: boolean; message?: string; [key: string]: unknown };

const events = ['BET_SETTLED', 'WIN', 'ROLLBACK', 'CANCEL', 'adapter.test'];
const localApiClient = createApiClient({ baseUrl: '', retry: 0, cache: 'no-store' });

export default function WebhookTestPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerCode, setProviderCode] = useState('');
  const [eventType, setEventType] = useState('adapter.test');
  const [idempotencyKey, setIdempotencyKey] = useState(`mock_webhook_${Date.now()}`);
  const [invalidSignature, setInvalidSignature] = useState(false);
  const [result, setResult] = useState<WebhookResult | null>(null);
  const [message, setMessage] = useState('กำลังโหลด provider...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadProviders(); }, []);
  async function loadProviders() { const res = await adminApiFetch('/admin/game-providers'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ'); return; } const items = data.items ?? []; setProviders(items); setProviderCode(items[0]?.code ?? ''); setMessage(''); }
  async function send() {
    if (!providerCode) { setMessage('เลือก provider ก่อน'); return; }
    const body = { eventType, idempotencyKey, providerTransactionId: `tx_${idempotencyKey}`, roundId: `round_${idempotencyKey}`, amount: '1.00', currency: 'THB', testMode: true };
    const timestamp = new Date().toISOString();
    const signature = invalidSignature ? 'invalid-signature' : 'mock-browser-signature';
    setLoading(true); setMessage('กำลังส่ง mock webhook...');
    try {
      const data = await localApiClient.requestJson<WebhookResult, typeof body>(`/api/provider-webhooks/${encodeURIComponent(providerCode)}`, body, {
        method: 'POST',
        auth: false,
        headers: { 'x-timestamp': timestamp, 'x-signature': signature },
      });
      setResult(data);
      setMessage(data.ok === false ? data.message ?? 'ส่ง mock webhook ไม่สำเร็จ' : 'ส่ง mock webhook แล้ว');
    } catch (error) {
      const failed = error as { message?: string; payload?: WebhookResult };
      setResult(failed.payload ?? null);
      setMessage(failed.payload?.message ?? failed.message ?? 'ส่ง mock webhook ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }
  return <AdminPage eyebrow="Game Platform" title="Mock Webhook Test" description="ยิง webhook จำลองเพื่อทดสอบ validate, duplicate, invalid signature และ log ก่อนเปิดรับ callback ค่ายจริง" actions={<AdminButton onClick={send} disabled={loading || !providerCode}>{loading ? 'กำลังส่ง...' : 'Send Mock Webhook'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Provider" value={providerCode || '-'} helper="provider code" /><AdminMetric title="Event" value={eventType} helper="mock event" /><AdminMetric title="Signature" value={invalidSignature ? 'invalid' : 'mock'} helper="browser-safe header" /><AdminMetric title="Result" value={result?.ok === false ? 'FAILED' : result ? 'DONE' : '-'} helper="last send" /></AdminMetricGrid>
    <AdminNotice>หมายเหตุ: ถ้าใช้ generic adapter ที่ตรวจ HMAC จริง ให้ใช้หน้า Adapter Test Harness method validateWebhook สำหรับ signed payload ที่ถูกต้อง หน้านี้ไว้ทดสอบ log/duplicate/invalid แบบ browser-safe</AdminNotice>
    <AdminCard title="Mock payload" description="ทดสอบ idempotency/duplicate ได้ด้วยการกดส่งซ้ำ key เดิม"><div style={formStyle}><label style={labelStyle}>Provider<select value={providerCode} onChange={(event) => setProviderCode(event.target.value)} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.code}>{provider.name} ({provider.code})</option>)}</select></label><label style={labelStyle}>Event<select value={eventType} onChange={(event) => setEventType(event.target.value)} style={inputStyle}>{events.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label style={labelStyle}>Idempotency Key<input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} style={inputStyle} /></label><label style={checkStyle}><input type="checkbox" checked={invalidSignature} onChange={(event) => setInvalidSignature(event.target.checked)} /> ส่ง invalid signature</label></div></AdminCard>
    {result ? <AdminStack><AdminCard title="Webhook response"><AdminRow><strong>Status</strong><AdminBadge tone={result?.ok === false ? 'danger' : 'success'}>{result?.ok === false ? 'FAILED' : 'OK'}</AdminBadge></AdminRow><pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre></AdminCard></AdminStack> : <AdminEmpty>ยังไม่มีผล mock webhook</AdminEmpty>}
  </AdminPage>;
}
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const checkStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 };
