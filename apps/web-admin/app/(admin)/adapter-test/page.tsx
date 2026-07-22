'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus } from '../_components/human-labels';

type Provider = { id: string; name: string; code: string; status: string; walletMode?: string; currency?: string; adapterRegistered?: boolean; metadata?: unknown };
type ProviderEnvironment = 'PRODUCTION' | 'UAT' | 'DEMO';
type TestMode = 'SAFE' | 'PRODUCTION';
type MethodName = 'healthCheck' | 'launchGame' | 'getBalance' | 'transferIn' | 'transferOut' | 'syncGames' | 'getBetHistory' | 'validateWebhook' | 'parseWebhook';
type MethodRisk = 'safe' | 'money' | 'webhook';
type MethodMeta = { value: MethodName; label: string; description: string; risk: MethodRisk };
type AdapterResult = { ok?: boolean; [key: string]: unknown };
type TestResult = { ok?: boolean; provider?: { id: string; code: string }; method?: string; testMode?: TestMode; environment?: ProviderEnvironment; latencyMs?: number; checkedAt?: string; input?: unknown; result?: AdapterResult; message?: string };
type TestHistoryItem = { id: string; method: string; testMode: TestMode; environment: string; ok: boolean; latencyMs: number | null; createdAt: string; adminUser?: { id: string; username: string } | null };
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const methodOptions: Record<MethodName, MethodMeta> = {
  healthCheck: { value: 'healthCheck', label: 'ตรวจการเชื่อมต่อ', description: 'ตรวจว่า API ค่ายหรือ adapter ตอบหรือไม่', risk: 'safe' },
  launchGame: { value: 'launchGame', label: 'ทดสอบเปิดเกม', description: 'ตรวจลิงก์เปิดเกม', risk: 'safe' },
  getBalance: { value: 'getBalance', label: 'ตรวจยอด', description: 'อ่านยอดจากค่าย', risk: 'safe' },
  transferIn: { value: 'transferIn', label: 'โยกเข้าเกม', description: 'ใช้ได้เฉพาะ Demo หรือ Simulator', risk: 'money' },
  transferOut: { value: 'transferOut', label: 'โยกกลับวอเลต', description: 'ใช้ได้เฉพาะ Demo หรือ Simulator', risk: 'money' },
  syncGames: { value: 'syncGames', label: 'ดึงรายการเกม', description: 'ตรวจรายการเกมจากค่าย', risk: 'safe' },
  getBetHistory: { value: 'getBetHistory', label: 'อ่านประวัติเกม', description: 'ตรวจข้อมูลประวัติจากค่าย', risk: 'safe' },
  validateWebhook: { value: 'validateWebhook', label: 'ตรวจลายเซ็น Webhook', description: 'ตรวจ header และ signature', risk: 'webhook' },
  parseWebhook: { value: 'parseWebhook', label: 'อ่าน Webhook', description: 'แปลง callback เป็น event กลาง', risk: 'webhook' },
};

const methodList = Object.values(methodOptions);
const defaultPayload: Record<MethodName, string> = { healthCheck: '{}', launchGame: JSON.stringify({ userId: 'adapter-test-user', gameCode: 'demo-slot-001', returnUrl: 'https://example.com/member/games' }, null, 2), getBalance: JSON.stringify({ userId: 'adapter-test-user' }, null, 2), transferIn: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2), transferOut: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2), syncGames: '{}', getBetHistory: JSON.stringify({ from: new Date(Date.now() - 86400000).toISOString(), to: new Date().toISOString() }, null, 2), validateWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2), parseWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2) };

export default function AdapterTestPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [method, setMethod] = useState<MethodName>('healthCheck');
  const [testMode, setTestMode] = useState<TestMode>('SAFE');
  const [payloadText, setPayloadText] = useState(defaultPayload.healthCheck);
  const [result, setResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [message, setMessage] = useState('กำลังโหลดค่าย...');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const closeTechnicalRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { void loadProviders(); }, []);
  useEffect(() => { if (providerId) void loadHistory(providerId); else setHistory([]); }, [providerId]);
  useEffect(() => { if (!technicalOpen) return; const timer = window.setTimeout(() => closeTechnicalRef.current?.focus(), 0); const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setTechnicalOpen(false); }; window.addEventListener('keydown', onKeyDown); return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKeyDown); }; }, [technicalOpen]);
  const selectedProvider = useMemo(() => providers.find((item) => item.id === providerId), [providers, providerId]);
  const selectedMethod = methodOptions[method];
  const allowedMethods = methodList.filter((item) => methodAllowed(item, testMode, selectedProvider));
  function showMessage(nextMessage: string, tone: NoticeTone = 'neutral') { setMessage(nextMessage); setMessageTone(tone); }
  async function loadProviders() { setLoading(true); showMessage('กำลังโหลดค่าย...'); const res = await adminApiFetch('/admin/game-providers'); const data: { items?: Provider[] } | null = await res.json().catch(() => null); setLoading(false); if (!res.ok) { showMessage('โหลดค่ายเกมไม่สำเร็จ', 'danger'); return; } const items = data?.items ?? []; setProviders(items); setProviderId((current) => current || items[0]?.id || ''); showMessage(items.length ? '' : 'ยังไม่มีค่ายสำหรับทดสอบ', items.length ? 'neutral' : 'warning'); }
  async function loadHistory(id: string) { setHistoryLoading(true); const res = await adminApiFetch(`/admin/game-providers/${id}/adapter-test/history`); const data: { items?: TestHistoryItem[] } | null = await res.json().catch(() => null); setHistoryLoading(false); setHistory(res.ok ? data?.items ?? [] : []); }
  function changeMethod(next: MethodName) { setMethod(next); setPayloadText(defaultPayload[next]); setResult(null); setTechnicalOpen(false); }
  function selectProvider(nextProviderId: string) { const nextProvider = providers.find((item) => item.id === nextProviderId); setProviderId(nextProviderId); setTestMode('SAFE'); if (!methodAllowed(methodOptions[method], 'SAFE', nextProvider)) changeMethod('healthCheck'); else { setResult(null); setTechnicalOpen(false); } }
  function changeTestMode(next: TestMode) { if (next === 'PRODUCTION') { if (providerEnvironment(selectedProvider) !== 'PRODUCTION') { showMessage('Production Test ใช้ได้กับค่าย Production เท่านั้น', 'warning'); return; } if (!window.confirm('เปิด Production Test ใช่ไหม? ระบบจะไม่อนุญาตการโยกเงิน')) return; } setTestMode(next); const nextMethod = methodList.find((item) => methodAllowed(item, next, selectedProvider))?.value; if (!methodAllowed(methodOptions[method], next, selectedProvider) && nextMethod) changeMethod(nextMethod); }
  async function run(event?: FormEvent<HTMLFormElement>) { event?.preventDefault(); if (!providerId) { showMessage('เลือกค่ายก่อน', 'warning'); return; } let payload: Record<string, unknown> = {}; try { payload = payloadText.trim() ? JSON.parse(payloadText) as Record<string, unknown> : {}; } catch { showMessage('ข้อมูลทดสอบต้องเป็น JSON ที่ถูกต้อง', 'warning'); return; } setRunning(true); showMessage('กำลังทดสอบ...'); setResult(null); setTechnicalOpen(false); const res = await adminApiFetch(`/admin/game-providers/${providerId}/adapter-test/${method}`, { method: 'POST', body: JSON.stringify({ ...payload, testMode }) }); const data: TestResult | null = await res.json().catch(() => null); setRunning(false); if (!res.ok) { showMessage('ทดสอบไม่สำเร็จ', 'danger'); await loadHistory(providerId); return; } setResult(data); showMessage(data?.result?.ok === false ? 'ค่ายตอบว่าไม่สำเร็จ' : 'ทดสอบสำเร็จ', data?.result?.ok === false ? 'warning' : 'success'); await loadHistory(providerId); }
  return <AdminPage eyebrow="ขั้นสูง" title="ทดสอบ API ค่าย" description="แยกโหมดทดสอบและเก็บประวัติแบบไม่แสดง secret" actions={<AdminButton onClick={() => { void run(); }} disabled={running || !providerId}>{running ? 'กำลังทดสอบ...' : 'เริ่มทดสอบ'}</AdminButton>}>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="ค่าย" value={selectedProvider?.name ?? '-'} helper={selectedProvider?.code ?? 'เลือกค่าย'} /><AdminMetric title="โหมด" value={testMode === 'SAFE' ? 'Safe Test' : 'Production Test'} helper={environmentLabel(providerEnvironment(selectedProvider))} tone={testMode === 'SAFE' ? 'success' : 'warning'} /><AdminMetric title="เวลา" value={result?.latencyMs !== undefined ? `${result.latencyMs}ms` : '-'} helper="ครั้งล่าสุด" /><AdminMetric title="ผล" value={result?.result?.ok === false ? 'มีปัญหา' : result ? 'สำเร็จ' : '-'} helper="ผลลัพธ์ผ่านการปิดบัง" tone={result?.result?.ok === false ? 'danger' : result ? 'success' : 'neutral'} /></AdminMetricGrid>
    <AdminToolbar><label style={labelStyle}>ค่าย<select value={providerId} onChange={(event) => selectProvider(event.target.value)} style={inputStyle}><option value="">เลือกค่าย</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code}) · {environmentLabel(providerEnvironment(provider))}</option>)}</select></label><label style={labelStyle}>รายการทดสอบ<select value={method} onChange={(event) => changeMethod(event.target.value as MethodName)} style={inputStyle}>{allowedMethods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div style={summaryBoxStyle}><strong>{selectedProvider?.name ?? '-'}</strong><span>{selectedProvider ? `${humanStatus(selectedProvider.status)} · ${selectedProvider.currency ?? 'THB'} · ${environmentLabel(providerEnvironment(selectedProvider))}` : 'ยังไม่ได้เลือกค่าย'}</span></div></AdminToolbar>
    <AdminCard title="โหมดทดสอบ" description="Safe Test จำกัดสิ่งที่เสี่ยง ส่วน Production Test ไม่อนุญาตการโยกเงิน"><div style={actionRowStyle}><AdminButton tone={testMode === 'SAFE' ? 'primary' : 'secondary'} onClick={() => changeTestMode('SAFE')}>Safe Test</AdminButton><AdminButton tone={testMode === 'PRODUCTION' ? 'primary' : 'secondary'} onClick={() => changeTestMode('PRODUCTION')} disabled={providerEnvironment(selectedProvider) !== 'PRODUCTION'}>Production Test</AdminButton></div>{testMode === 'SAFE' && providerEnvironment(selectedProvider) === 'PRODUCTION' && <AdminNotice tone="warning">Production ใน Safe Test ใช้ได้เฉพาะตรวจการเชื่อมต่อและ Webhook</AdminNotice>}{testMode === 'PRODUCTION' && <AdminNotice tone="warning">Production Test ห้ามโยกเงิน และมีบันทึกประวัติทุกครั้ง</AdminNotice>}</AdminCard>
    <AdminCard title={selectedMethod.label} description={selectedMethod.description} action={<AdminBadge tone={selectedMethod.risk === 'money' ? 'danger' : selectedMethod.risk === 'webhook' ? 'warning' : 'success'}>{riskLabel(selectedMethod.risk)}</AdminBadge>}>
      {selectedMethod.risk === 'money' && <AdminNotice tone="danger">ใช้ได้เฉพาะ Demo หรือ Simulator</AdminNotice>}
      <form onSubmit={run} style={formStyle}><label style={labelWideStyle}>ข้อมูลทดสอบ JSON<textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} style={textareaStyle} spellCheck={false} /></label><div style={actionRowStyle}><AdminButton type="submit" disabled={running || !providerId}>{running ? 'กำลังทดสอบ...' : 'เริ่มทดสอบ'}</AdminButton><AdminButton type="button" tone="secondary" onClick={() => setPayloadText(defaultPayload[method])}>ใช้ค่าเริ่มต้น</AdminButton></div></form>
    </AdminCard>
    <AdminCard title="ผลล่าสุด" description="รายละเอียดเทคนิคเปิดดูเมื่อต้องแก้ปัญหาเท่านั้น">{result ? <AdminStack><AdminRow><div><strong>{selectedMethod.label}</strong><p style={mutedStyle}>{result.checkedAt ? new Date(result.checkedAt).toLocaleString('th-TH') : '-'}</p></div><AdminBadge tone={result.result?.ok === false ? 'danger' : 'success'}>{result.result?.ok === false ? 'มีปัญหา' : 'สำเร็จ'}</AdminBadge></AdminRow><AdminRow><span>Latency</span><strong>{result.latencyMs !== undefined ? `${result.latencyMs} ms` : '-'}</strong></AdminRow><div style={actionRowStyle}><AdminButton tone="secondary" onClick={() => setTechnicalOpen(true)}>ดูข้อมูลเทคนิค</AdminButton></div></AdminStack> : <AdminEmpty>ยังไม่มีผลทดสอบ</AdminEmpty>}</AdminCard>
    <AdminCard title="ประวัติการทดสอบ" description="20 รายการล่าสุด"><AdminStack>{historyLoading && <AdminEmpty>กำลังโหลดประวัติ</AdminEmpty>}{!historyLoading && history.map((item) => <AdminRow key={item.id}><div><strong>{methodOptions[item.method as MethodName]?.label ?? item.method}</strong><p style={mutedStyle}>{item.adminUser?.username ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')} · {item.testMode === 'SAFE' ? 'Safe Test' : 'Production Test'}</p></div><div style={actionRowStyle}><span style={mutedStyle}>{item.latencyMs === null ? '-' : `${item.latencyMs} ms`}</span><AdminBadge tone={item.ok ? 'success' : 'danger'}>{item.ok ? 'สำเร็จ' : 'ไม่สำเร็จ'}</AdminBadge></div></AdminRow>)}{!historyLoading && history.length === 0 && <AdminEmpty>ยังไม่มีประวัติ</AdminEmpty>}</AdminStack></AdminCard>
    {!loading && providers.length === 0 && <AdminEmpty>ยังไม่มีค่ายให้ทดสอบ ไปเพิ่มค่ายก่อน</AdminEmpty>}
    {technicalOpen && result && <div style={drawerLayerStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTechnicalOpen(false); }}><aside style={drawerStyle} role="dialog" aria-modal="true" aria-label="ข้อมูลเทคนิค"><AdminStack><AdminRow><div><p style={mutedStyle}>ข้อมูลเทคนิค</p><h2 style={{ margin: 0 }}>ผลการทดสอบ</h2></div><button ref={closeTechnicalRef} type="button" className="admin-ui-button admin-ui-button--ghost admin-ui-button--regular" onClick={() => setTechnicalOpen(false)}>ปิด</button></AdminRow><AdminNotice tone="warning">ข้อมูลทั้งหมดผ่านการปิดบัง secret แล้ว</AdminNotice><JsonBlock title="ผลจากค่ายหรือ adapter" value={result.result ?? result} /><JsonBlock title="ข้อมูลที่ส่ง" value={result.input ?? {}} /></AdminStack></aside></div>}
  </AdminPage>;
}

function providerEnvironment(provider?: Provider): ProviderEnvironment { const metadata = provider?.metadata && typeof provider.metadata === 'object' ? provider.metadata as Record<string, unknown> : {}; const declared = typeof metadata.environment === 'string' ? metadata.environment.toUpperCase() : ''; if (declared === 'PRODUCTION' || declared === 'UAT' || declared === 'DEMO') return declared; const code = provider?.code.toLowerCase() ?? ''; if (code.endsWith('-uat')) return 'UAT'; if (code.startsWith('demo-') || code.startsWith('simulator-')) return 'DEMO'; return 'PRODUCTION'; }
function isSafeTransferProvider(provider?: Provider) { return new Set(['demo-provider', 'demo-provider-uat', 'simulator-provider']).has(provider?.code.toLowerCase() ?? ''); }
function methodAllowed(item: MethodMeta, testMode: TestMode, provider?: Provider) { const environment = providerEnvironment(provider); if (testMode === 'PRODUCTION') return environment === 'PRODUCTION' && item.risk !== 'money'; if (item.risk === 'money') return isSafeTransferProvider(provider); return environment !== 'PRODUCTION' || new Set<MethodName>(['healthCheck', 'validateWebhook', 'parseWebhook']).has(item.value); }
function environmentLabel(environment: ProviderEnvironment) { return environment === 'PRODUCTION' ? 'Production' : environment === 'UAT' ? 'UAT' : 'Demo'; }
function riskLabel(risk: MethodRisk) { return risk === 'money' ? 'เกี่ยวกับเงิน' : risk === 'webhook' ? 'Webhook' : 'ปลอดภัย'; }
function JsonBlock({ title, value }: { title: string; value: unknown }) { return <section style={jsonBlockStyle}><strong>{title}</strong><pre style={preStyle}>{JSON.stringify(value ?? {}, null, 2)}</pre></section>; }

const formStyle = { display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const labelWideStyle = { ...labelStyle, gridColumn: '1 / -1' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const textareaStyle = { ...inputStyle, minHeight: 220, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre' as const };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' };
const summaryBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.05)', display: 'grid', gap: 4, color: '#94a3b8' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const drawerLayerStyle = { position: 'fixed' as const, inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(2,6,23,.62)', backdropFilter: 'blur(5px)' };
const drawerStyle = { width: 'min(720px, 100%)', height: '100%', overflow: 'auto' as const, padding: 24, background: '#111823', borderLeft: '1px solid rgba(148,163,184,.22)' };
const jsonBlockStyle = { display: 'grid', gap: 8 } as const;
const preStyle = { margin: 0, overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 620 };
