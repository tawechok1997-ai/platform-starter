'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus } from '../_components/human-labels';

type Provider = { id: string; name: string; code: string; status: string; walletMode: string; currency: string; metadata?: unknown };
type Endpoint = { id: string; type: string; url: string; isEnabled: boolean; timeoutMs: number };
type Credential = { id: string; type: string; maskedValue: string; isEnabled: boolean; rotatedAt?: string | null };
type Readiness = { ready: boolean; passed: number; total: number; checks: Array<{ key: string; label: string; ok: boolean }> };
type ProviderDetail = Provider & { endpoints: Endpoint[]; credentials: Credential[]; readiness?: Readiness; adapterRegistered?: boolean };
type Preflight = { ok: boolean; blockers?: string[]; flags?: Record<string, boolean>; checks?: Array<{ key: string; ok: boolean }> };
type View = 'BASIC' | 'ADVANCED';
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const TRANSFER_REQUIRED_ENDPOINTS = ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK'] as const;
const requiredByWalletMode: Record<string, readonly string[]> = {
  SEAMLESS: ['LAUNCH', 'BALANCE', 'WEBHOOK'],
  TRANSFER: TRANSFER_REQUIRED_ENDPOINTS,
  HYBRID: TRANSFER_REQUIRED_ENDPOINTS,
};

export default function GameApiSettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [view, setView] = useState<View>('BASIC');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('กำลังโหลดค่าย...');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  useEffect(() => { void loadProviders(); }, []);
  useEffect(() => { if (providerId) void loadProvider(providerId); else { setDetail(null); setPreflight(null); } }, [providerId]);
  const requiredEndpoints = useMemo<readonly string[]>(() => requiredByWalletMode[detail?.walletMode ?? 'TRANSFER'] ?? TRANSFER_REQUIRED_ENDPOINTS, [detail?.walletMode]);
  const endpointStatus = useMemo(() => requiredEndpoints.map((type) => ({ type, item: detail?.endpoints.find((endpoint) => endpoint.type === type), ok: Boolean(detail?.endpoints.find((endpoint) => endpoint.type === type)?.isEnabled) })), [detail?.endpoints, requiredEndpoints]);
  const enabledCredentials = detail?.credentials.filter((item) => item.isEnabled).length ?? 0;
  const flags = gateFlags(detail?.metadata, preflight?.flags);
  function showMessage(next: string, tone: NoticeTone = 'neutral') { setMessage(next); setMessageTone(tone); }
  async function loadProviders() { setLoading(true); showMessage('กำลังโหลดค่าย...'); const res = await adminApiFetch('/admin/game-providers'); const data: { items?: Provider[] } | null = await res.json().catch(() => null); if (!res.ok) { setLoading(false); showMessage('โหลดค่ายเกมไม่สำเร็จ', 'danger'); return; } const items = data?.items ?? []; setProviders(items); setProviderId((current) => current || items[0]?.id || ''); setLoading(false); showMessage(items.length ? '' : 'ยังไม่มีค่ายเกม', items.length ? 'neutral' : 'warning'); }
  async function loadProvider(id: string) { setLoading(true); showMessage('กำลังตรวจความพร้อม...'); const [detailRes, preflightRes] = await Promise.all([adminApiFetch(`/admin/game-providers/${id}`), adminApiFetch(`/admin/game-providers/${id}/preflight`)]); const detailData: ProviderDetail | null = await detailRes.json().catch(() => null); const preflightData: Preflight | null = await preflightRes.json().catch(() => null); setLoading(false); if (!detailRes.ok || !detailData) { setDetail(null); setPreflight(null); showMessage('โหลดการตั้งค่าค่ายไม่สำเร็จ', 'danger'); return; } setDetail(detailData); setPreflight(preflightRes.ok ? preflightData : null); showMessage(preflightRes.ok ? '' : 'โหลด Preflight ไม่สำเร็จ', preflightRes.ok ? 'neutral' : 'warning'); }
  return <AdminPage eyebrow="Game Platform" title="ตั้งค่า API เกม" description="ดูความพร้อมของค่ายก่อนแก้ไขหรือเปิดเงินจริง" actions={<><AdminLinkButton href="/provider-setup-wizard" tone="primary">เพิ่มค่าย</AdminLinkButton><AdminLinkButton href="/provider-risk">ตรวจ Preflight</AdminLinkButton></>}>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminToolbar><label style={labelStyle}>ค่ายเกม<select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle} disabled={!providers.length}><option value="">เลือกค่าย</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></label><div style={summaryStyle}><strong>{detail?.name ?? '-'}</strong><span>{detail ? `${humanStatus(detail.status)} · ${detail.walletMode} · ${detail.currency}` : 'ยังไม่ได้เลือกค่าย'}</span></div></AdminToolbar>
    {!loading && !detail && <AdminEmpty>ยังไม่มีข้อมูลค่าย</AdminEmpty>}
    {detail && <><AdminMetricGrid><AdminMetric title="Readiness" value={`${detail.readiness?.passed ?? 0}/${detail.readiness?.total ?? 0}`} helper={detail.readiness?.ready ? 'พร้อมตาม checklist' : 'ยังมีจุดต้องแก้'} tone={detail.readiness?.ready ? 'success' : 'warning'} /><AdminMetric title="Endpoint" value={`${endpointStatus.filter((item) => item.ok).length}/${endpointStatus.length}`} helper="endpoint ที่ต้องใช้" tone={endpointStatus.every((item) => item.ok) ? 'success' : 'warning'} /><AdminMetric title="Credential" value={String(enabledCredentials)} helper="รายการที่เปิดใช้" tone={enabledCredentials ? 'success' : 'danger'} /><AdminMetric title="Real money" value={flags.realMoneyEnabled ? 'เปิดอยู่' : 'ปิดอยู่'} helper={flags.realMoneyEnabled ? 'ต้องตรวจทันที' : 'ค่าเริ่มต้นปลอดภัย'} tone={flags.realMoneyEnabled ? 'danger' : 'success'} /></AdminMetricGrid>
      <AdminCard title="มุมมอง"><div style={actionRowStyle}><AdminButton tone={view === 'BASIC' ? 'primary' : 'secondary'} onClick={() => setView('BASIC')}>พื้นฐาน</AdminButton><AdminButton tone={view === 'ADVANCED' ? 'primary' : 'secondary'} onClick={() => setView('ADVANCED')}>ขั้นสูง</AdminButton></div></AdminCard>
      {view === 'BASIC' && <AdminStack><AdminCard title="Readiness checklist" description="สถานะจริงจากค่ายที่เลือก"><AdminStack>{detail.readiness?.checks.map((item) => <AdminRow key={item.key}><span>{readinessLabel(item.key, item.label)}</span><AdminBadge tone={item.ok ? 'success' : 'danger'}>{item.ok ? 'ผ่าน' : 'ต้องแก้'}</AdminBadge></AdminRow>)}{!detail.readiness?.checks.length && <AdminEmpty>ยังไม่มี checklist</AdminEmpty>}</AdminStack></AdminCard><AdminCard title="Real-money gate" description="แก้ gate จากหน้า Provider Risk เท่านั้น"><AdminStack><AdminRow><span>เปิดเงินจริง</span><AdminBadge tone={flags.realMoneyEnabled ? 'danger' : 'success'}>{flags.realMoneyEnabled ? 'เปิดอยู่' : 'ปิดอยู่'}</AdminBadge></AdminRow><AdminRow><span>เปิดโยกเงิน</span><AdminBadge tone={flags.transferEnabled ? 'warning' : 'neutral'}>{flags.transferEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge></AdminRow><AdminRow><span>Webhook settlement</span><AdminBadge tone={flags.webhookSettlementEnabled ? 'warning' : 'neutral'}>{flags.webhookSettlementEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge></AdminRow></AdminStack><div style={actionRowStyle}><AdminLinkButton href="/provider-risk">ตรวจและจัดการ gate</AdminLinkButton></div></AdminCard>{preflight && <AdminCard title="Preflight" description="ตรวจล่าสุดก่อนเปิดเงินจริง"><AdminRow><strong>{preflight.ok ? 'ผ่าน' : 'ยังไม่ผ่าน'}</strong><AdminBadge tone={preflight.ok ? 'success' : 'danger'}>{preflight.ok ? 'พร้อม' : 'มี blocker'}</AdminBadge></AdminRow>{preflight.blockers && preflight.blockers.length > 0 && <AdminNotice tone="danger">{preflight.blockers.map(preflightLabel).join(', ')}</AdminNotice>}</AdminCard>}</AdminStack>}
      {view === 'ADVANCED' && <AdminStack><AdminCard title="Endpoint completeness" description="ตาม wallet mode ของค่าย"><AdminStack>{endpointStatus.map(({ type, item, ok }) => <AdminRow key={type}><div><strong>{endpointLabel(type)}</strong><p style={mutedStyle}>{item?.url ?? 'ยังไม่มี URL'}</p></div><AdminBadge tone={ok ? 'success' : 'danger'}>{ok ? 'พร้อม' : 'ขาด'}</AdminBadge></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Credential state" description="แสดงเฉพาะค่าที่ปิดบัง"><AdminStack>{detail.credentials.map((item) => <AdminRow key={item.id}><div><strong>{credentialLabel(item.type)}</strong><p style={mutedStyle}>{item.maskedValue}</p></div><AdminBadge tone={item.isEnabled ? 'success' : 'danger'}>{item.isEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge></AdminRow>)}{detail.credentials.length === 0 && <AdminEmpty>ยังไม่มี credential</AdminEmpty>}</AdminStack><div style={actionRowStyle}><AdminLinkButton href="/provider-credentials">จัดการ credential</AdminLinkButton></div></AdminCard><AdminCard title="Endpoint ทั้งหมด" description="ใช้แก้ mapping รายค่าย"><AdminStack>{detail.endpoints.map((item) => <AdminRow key={item.id}><div><strong>{endpointLabel(item.type)}</strong><p style={mutedStyle}>{item.url} · timeout {item.timeoutMs} ms</p></div><AdminBadge tone={item.isEnabled ? 'success' : 'neutral'}>{item.isEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge></AdminRow>)}{detail.endpoints.length === 0 && <AdminEmpty>ยังไม่มี endpoint</AdminEmpty>}</AdminStack></AdminCard></AdminStack>}
    </>}
  </AdminPage>;
}

function gateFlags(metadata: unknown, preflightFlags?: Record<string, boolean>) { const value = metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {}; return { transferEnabled: preflightFlags?.transferEnabled === true || value.transferEnabled === true, realMoneyEnabled: preflightFlags?.realMoneyEnabled === true || value.realMoneyEnabled === true, webhookSettlementEnabled: preflightFlags?.webhookSettlementEnabled === true || value.webhookSettlementEnabled === true }; }
function endpointLabel(type: string) { const labels: Record<string, string> = { LAUNCH: 'เปิดเกม', BALANCE: 'ตรวจยอด', TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', GAME_LIST: 'รายการเกม', BET_HISTORY: 'ประวัติเกม', WEBHOOK: 'Webhook', HEALTH_CHECK: 'Health check' }; return labels[type] ?? type; }
function credentialLabel(type: string) { const labels: Record<string, string> = { API_KEY: 'API Key', SECRET_KEY: 'Secret Key', MERCHANT_ID: 'Merchant ID', AGENT_ID: 'Agent ID', WEBHOOK_SECRET: 'Webhook Secret' }; return labels[type] ?? type; }
function readinessLabel(key: string, label: string) { const labels: Record<string, string> = { adapter_registered: 'มี adapter', provider_active: 'ค่ายเปิดใช้งาน', launch_endpoint: 'Endpoint เปิดเกม', balance_endpoint: 'Endpoint ตรวจยอด', transfer_endpoints: 'Endpoint โยกเงิน', api_key: 'API Key', webhook_secret: 'Webhook Secret' }; return labels[key] ?? label; }
function preflightLabel(value: string) { const labels: Record<string, string> = { transferEnabled_false: 'ยังไม่เปิดโยกเงิน', walletSyncEnabled_false: 'ยังไม่เชื่อมวอเลต', realMoneyEnabled_false: 'ยังไม่เปิดเงินจริง', webhookSettlementEnabled_false: 'ยังไม่เปิด Webhook settlement', unresolved_mismatch: 'ยอดไม่ตรงค้างอยู่' }; return labels[value] ?? readinessLabel(value, value); }

const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const summaryStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.05)', display: 'grid', gap: 4, color: '#94a3b8' } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55, overflowWrap: 'anywhere' as const };
