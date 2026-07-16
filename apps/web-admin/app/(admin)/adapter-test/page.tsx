'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus } from '../_components/human-labels';

type Provider = { id: string; name: string; code: string; status: string; walletMode?: string; currency?: string; adapterRegistered?: boolean };
type MethodName = 'healthCheck' | 'launchGame' | 'getBalance' | 'transferIn' | 'transferOut' | 'syncGames' | 'getBetHistory' | 'validateWebhook' | 'parseWebhook';
type MethodMeta = { value: MethodName; label: string; description: string; risk: 'safe' | 'money' | 'webhook' };
type TestResult = { ok?: boolean; provider?: { id: string; code: string }; method?: string; latencyMs?: number; checkedAt?: string; input?: unknown; result?: any; message?: string };
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const defaultMethod: MethodMeta = {
  value: 'healthCheck',
  label: 'ทดสอบว่าค่ายตอบไหม',
  description: 'เช็กว่า API ค่ายหรือ adapter พร้อมใช้งานไหม',
  risk: 'safe',
};

const methodOptions: MethodMeta[] = [
  defaultMethod,
  { value: 'launchGame', label: 'ทดสอบเปิดเกม', description: 'เช็กว่าเปิดเกมแล้วได้ลิงก์กลับมาหรือไม่', risk: 'safe' },
  { value: 'getBalance', label: 'ทดสอบเช็กยอด', description: 'เช็กยอดฝั่งค่าย ถ้าค่ายรองรับ', risk: 'safe' },
  { value: 'transferIn', label: 'ทดสอบโยกเข้าเกม', description: 'ใช้ sandbox/simulator เท่านั้น', risk: 'money' },
  { value: 'transferOut', label: 'ทดสอบโยกกลับวอเลต', description: 'ใช้ sandbox/simulator เท่านั้น', risk: 'money' },
  { value: 'syncGames', label: 'ทดสอบดึงเกม', description: 'เช็กว่าดึงรายการเกมจากค่ายได้ไหม', risk: 'safe' },
  { value: 'getBetHistory', label: 'ทดสอบประวัติเกม', description: 'เช็กว่าดึงประวัติจากค่ายได้ไหม', risk: 'safe' },
  { value: 'validateWebhook', label: 'ทดสอบลายเซ็น Webhook', description: 'เช็ก header/signature ของ callback', risk: 'webhook' },
  { value: 'parseWebhook', label: 'ทดสอบอ่าน Webhook', description: 'แปลงข้อมูล callback เป็น event กลาง', risk: 'webhook' },
];

const defaultPayload: Record<MethodName, string> = { healthCheck: '{}', launchGame: JSON.stringify({ userId: 'adapter-test-user', gameCode: 'demo-slot-001', returnUrl: 'https://example.com/member/games' }, null, 2), getBalance: JSON.stringify({ userId: 'adapter-test-user' }, null, 2), transferIn: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2), transferOut: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2), syncGames: '{}', getBetHistory: JSON.stringify({ from: new Date(Date.now() - 86400000).toISOString(), to: new Date().toISOString() }, null, 2), validateWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2), parseWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2) };

export default function AdapterTestPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [method, setMethod] = useState<MethodName>('healthCheck');
  const [payloadText, setPayloadText] = useState(defaultPayload.healthCheck);
  const [result, setResult] = useState<TestResult | null>(null);
  const [message, setMessage] = useState('กำลังโหลดค่าย...');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  useEffect(() => { loadProviders(); }, []);
  const selectedProvider = useMemo(() => providers.find((item) => item.id === providerId), [providers, providerId]);
  const selectedMethod = methodOptions.find((item) => item.value === method) ?? defaultMethod;
  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') { setMessage(nextMessage); setMessageTone(tone); }
  async function loadProviders() { setLoading(true); showMessage('กำลังโหลดค่าย...'); const res = await adminApiFetch('/admin/game-providers'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { showMessage(data?.message ?? 'โหลดค่ายไม่สำเร็จ', 'danger'); return; } const items = data?.items ?? []; setProviders(items); setProviderId((current) => current || items[0]?.id || ''); showMessage(items.length ? '' : 'ยังไม่มีค่ายสำหรับทดสอบ', items.length ? 'neutral' : 'warning'); }
  function changeMethod(next: MethodName) { setMethod(next); setPayloadText(defaultPayload[next]); setResult(null); }
  async function run(event?: FormEvent<HTMLFormElement>) { event?.preventDefault(); if (!providerId) { showMessage('เลือกค่ายก่อน', 'warning'); return; } let payload: Record<string, unknown> = {}; try { payload = payloadText.trim() ? JSON.parse(payloadText) : {}; } catch { showMessage('ข้อมูลทดสอบต้องเป็น JSON ที่ถูกต้อง', 'warning'); return; } setRunning(true); showMessage('กำลังทดสอบ API...'); setResult(null); const res = await adminApiFetch(`/admin/game-providers/${providerId}/adapter-test/${method}`, { method: 'POST', body: JSON.stringify(payload) }); const data = await res.json().catch(() => null); setRunning(false); setResult(data ?? null); if (!res.ok) { showMessage(data?.message ?? 'ทดสอบ API ไม่สำเร็จ', 'danger'); return; } showMessage(data?.result?.ok === false ? 'ค่ายตอบว่าไม่สำเร็จ ดูรายละเอียดด้านล่าง' : 'ทดสอบ API สำเร็จ', data?.result?.ok === false ? 'warning' : 'success'); }
  return <AdminPage eyebrow="ขั้นสูง" title="ทดสอบ API ค่าย" description="ใช้ตอนเชื่อมค่ายหรือแก้ปัญหา เลือกสิ่งที่ต้องการทดสอบแล้วดูผลลัพธ์" actions={<AdminButton onClick={() => run()} disabled={running || !providerId}>{running ? 'กำลังทดสอบ...' : 'เริ่มทดสอบ'}</AdminButton>}>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="ค่าย" value={selectedProvider?.name ?? '-'} helper={selectedProvider?.code ?? 'เลือกค่าย'} /><AdminMetric title="ทดสอบ" value={selectedMethod.label} helper={selectedMethod.description} /><AdminMetric title="เวลา" value={result?.latencyMs ? `${result.latencyMs}ms` : '-'} helper="ครั้งล่าสุด" /><AdminMetric title="ผล" value={result?.result?.ok === false ? 'มีปัญหา' : result ? 'สำเร็จ' : '-'} helper="ซ่อน secret แล้ว" /></AdminMetricGrid>
    <AdminToolbar><label style={labelStyle}>ค่าย<select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle}><option value="">เลือกค่าย</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></label><label style={labelStyle}>จะทดสอบอะไร<select value={method} onChange={(event) => changeMethod(event.target.value as MethodName)} style={inputStyle}>{methodOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div style={summaryBoxStyle}><strong>{selectedProvider?.name ?? '-'}</strong><span>{selectedProvider ? `${humanStatus(selectedProvider.status)} · ${selectedProvider.currency ?? 'THB'}` : 'ยังไม่ได้เลือกค่าย'}</span></div></AdminToolbar>
    <AdminCard title={selectedMethod.label} description={selectedMethod.description} action={<AdminBadge tone={selectedMethod.risk === 'money' ? 'danger' : selectedMethod.risk === 'webhook' ? 'warning' : 'success'}>{riskLabel(selectedMethod.risk)}</AdminBadge>}>
      {selectedMethod.risk === 'money' && <AdminNotice tone="danger">ทดสอบโยกเงินควรใช้ sandbox/simulator เท่านั้น อย่าเอาเงินจริงมาทดลองเหมือนกดปุ่มลิฟต์เล่น</AdminNotice>}
      <form onSubmit={run} style={formStyle}><label style={labelWideStyle}>ข้อมูลทดสอบ JSON<textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} style={textareaStyle} spellCheck={false} /></label><div style={actionRowStyle}><AdminButton type="submit" disabled={running || !providerId}>{running ? 'กำลังทดสอบ...' : 'เริ่มทดสอบ'}</AdminButton><AdminButton type="button" tone="secondary" onClick={() => setPayloadText(defaultPayload[method])}>ใช้ค่าเริ่มต้น</AdminButton></div></form>
    </AdminCard>
    <AdminToolbar><strong>ผลลัพธ์</strong><span style={mutedStyle}>รายละเอียดเทคนิคอยู่ตรงนี้ ใช้ตอน debug เท่านั้น</span></AdminToolbar>
    {result ? <AdminStack><AdminCard><AdminRow><strong>{selectedMethod.label}</strong><AdminBadge tone={result?.result?.ok === false ? 'danger' : 'success'}>{result?.result?.ok === false ? 'มีปัญหา' : 'สำเร็จ'}</AdminBadge></AdminRow><JsonBlock title="ผลจากค่าย/adapter" value={result.result ?? result} /><JsonBlock title="ข้อมูลที่ส่งไป" value={result.input ?? {}} /></AdminCard></AdminStack> : <AdminEmpty>ยังไม่มีผลทดสอบ</AdminEmpty>}
    {!loading && providers.length === 0 && <AdminEmpty>ยังไม่มีค่ายให้ทดสอบ ไปเพิ่มค่ายก่อน</AdminEmpty>}
  </AdminPage>;
}
function riskLabel(risk: string) { return risk === 'money' ? 'เกี่ยวกับเงิน' : risk === 'webhook' ? 'Webhook' : 'ปลอดภัย'; }
function JsonBlock({ title, value }: { title: string; value: unknown }) { return <details><summary style={summaryStyle}>{title}</summary><pre style={preStyle}>{JSON.stringify(value ?? {}, null, 2)}</pre></details>; }
const formStyle = { display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const labelWideStyle = { ...labelStyle, gridColumn: '1 / -1' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const textareaStyle = { ...inputStyle, minHeight: 220, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre' as const };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const summaryBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.05)', display: 'grid', gap: 4, color: '#94a3b8' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const summaryStyle = { cursor: 'pointer', fontWeight: 900, color: '#f8fafc' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 620 } as const;