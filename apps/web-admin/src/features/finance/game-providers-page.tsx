'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminFilterBar,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
  AdminToolbar,
} from '../../../app/(admin)/_components/admin-ui';

type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type WalletMode = 'SEAMLESS' | 'TRANSFER' | 'HYBRID';
type EndpointType = 'LAUNCH' | 'BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'GAME_LIST' | 'BET_HISTORY' | 'WEBHOOK' | 'HEALTH_CHECK';
type CredentialType = 'API_KEY' | 'SECRET_KEY' | 'MERCHANT_ID' | 'AGENT_ID' | 'WEBHOOK_SECRET' | 'TOKEN';
type ProviderCounts = { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number };
type Readiness = { checks: Array<{ key: string; label: string; ok: boolean }>; ready: boolean; passed: number; total: number };
type HealthResult = { payload?: { status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }; readiness?: Readiness };
type SyncResult = { created: number; updated: number; skipped: number };
type GameProvider = { id: string; name: string; code: string; logoUrl?: string | null; status: ProviderStatus; walletMode: WalletMode; currency: string; timezone: string; sortOrder: number; updatedAt: string; _count?: ProviderCounts };
type ProviderEndpoint = { id: string; type: EndpointType; url: string; method: string; timeoutMs: number; retryCount: number; isEnabled: boolean };
type ProviderCredential = { id: string; type: CredentialType; maskedValue: string; isEnabled: boolean; updatedAt: string };
type ProviderDetail = GameProvider & { endpoints?: ProviderEndpoint[]; credentials?: ProviderCredential[]; readiness?: Readiness; adapterRegistered?: boolean };
type ProviderFormState = { id?: string; name: string; code: string; logoUrl: string; status: ProviderStatus; walletMode: WalletMode; currency: string; timezone: string; sortOrder: string };
type EndpointFormState = { id?: string; type: EndpointType; url: string; method: string; timeoutMs: string; retryCount: string; isEnabled: boolean };
type CredentialFormState = { id?: string; type: CredentialType; value: string; isEnabled: boolean };
type PendingAction = { action: 'status' | 'sync'; provider: GameProvider; status?: ProviderStatus };

const emptyForm: ProviderFormState = { name: '', code: '', logoUrl: '', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: '100' };
const emptyEndpointForm: EndpointFormState = { type: 'LAUNCH', url: '', method: 'POST', timeoutMs: '10000', retryCount: '2', isEnabled: true };
const emptyCredentialForm: CredentialFormState = { type: 'API_KEY', value: '', isEnabled: true };
const ENDPOINT_TYPES: EndpointType[] = ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'];
const CREDENTIAL_TYPES: CredentialType[] = ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET', 'TOKEN'];

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

export default function GameProvidersPage() {
  const [items, setItems] = useState<GameProvider[]>([]);
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [endpointForm, setEndpointForm] = useState<EndpointFormState>(emptyEndpointForm);
  const [credentialForm, setCredentialForm] = useState<CredentialFormState>(emptyCredentialForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProviderStatus>('ALL');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'ATTENTION' | 'NORMAL'>('ALL');

  useEffect(() => { void loadProviders(); }, []);

  const metrics = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'ACTIVE').length,
    attention: items.filter((item) => item.status === 'MAINTENANCE' || item.status === 'DEGRADED').length,
    games: items.reduce((sum, item) => sum + Number(item._count?.games ?? 0), 0),
  }), [items]);

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const attention = item.status === 'MAINTENANCE' || item.status === 'DEGRADED';
      return (!keyword || `${item.name} ${item.code}`.toLowerCase().includes(keyword))
        && (statusFilter === 'ALL' || item.status === statusFilter)
        && (healthFilter === 'ALL' || (healthFilter === 'ATTENTION' ? attention : !attention));
    });
  }, [healthFilter, items, query, statusFilter]);

  const readiness = health?.readiness ?? detail?.readiness;

  async function loadProviders() {
    setLoading(true);
    setMessage('กำลังโหลดค่ายเกม...');
    const response = await adminApiFetch('/admin/game-providers');
    const data = await readJson<{ items?: GameProvider[] }>(response);
    setLoading(false);
    if (!response.ok) { setMessage('โหลดค่ายเกมไม่สำเร็จ'); return; }
    setItems(data?.items ?? []);
    setMessage('');
  }

  async function loadDetail(id: string) {
    setMessage('กำลังโหลดรายละเอียดค่ายเกม...');
    const response = await adminApiFetch(`/admin/game-providers/${id}`);
    const data = await readJson<ProviderDetail>(response);
    if (!response.ok || !data) { setMessage('โหลดรายละเอียดค่ายเกมไม่สำเร็จ'); return; }
    setDetail(data);
    setHealth(null);
    setSyncResult(null);
    setMessage('');
  }

  function resetForm() {
    setForm(emptyForm);
    setDetail(null);
    setHealth(null);
    setSyncResult(null);
    setEndpointForm(emptyEndpointForm);
    setCredentialForm(emptyCredentialForm);
    setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { ...form, logoUrl: form.logoUrl.trim() || null, sortOrder: Number(form.sortOrder || 100), name: form.name.trim(), code: form.code.trim() };
    if (!payload.name || !payload.code) { setMessage('กรุณากรอกชื่อค่ายและรหัสค่าย'); return; }
    setSaving(true);
    const response = await adminApiFetch(form.id ? `/admin/game-providers/${form.id}` : '/admin/game-providers', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (!response.ok) { setMessage('บันทึกค่ายเกมไม่สำเร็จ'); return; }
    resetForm();
    setMessage(form.id ? 'บันทึกข้อมูลค่ายเกมแล้ว' : 'เพิ่มค่ายเกมแล้ว');
    await loadProviders();
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    const { provider } = pendingAction;
    if (pendingAction.action === 'status' && pendingAction.status) {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status: pendingAction.status }) });
      const data = await readJson<Partial<GameProvider>>(response);
      if (!response.ok) { setMessage('เปลี่ยนสถานะไม่สำเร็จ'); return; }
      setItems((current) => current.map((item) => item.id === provider.id ? { ...item, ...data } : item));
      if (detail?.id === provider.id) setDetail((current) => current ? { ...current, ...data } : current);
      setMessage(`เปลี่ยนสถานะ ${provider.name} แล้ว`);
      setPendingAction(null);
      return;
    }
    setSyncing(true);
    const response = await adminApiFetch(`/admin/game-providers/${provider.id}/sync-games`, { method: 'POST' });
    const data = await readJson<SyncResult>(response);
    setSyncing(false);
    if (!response.ok || !data) { setMessage('ซิงก์เกมไม่สำเร็จ'); return; }
    setSyncResult(data);
    setMessage(`ซิงก์เกมแล้ว: เพิ่ม ${data.created}, อัปเดต ${data.updated}, ข้าม ${data.skipped}`);
    setPendingAction(null);
    await Promise.all([loadDetail(provider.id), loadProviders()]);
  }

  async function testConnection() {
    if (!detail) return;
    setChecking(true);
    const response = await adminApiFetch(`/admin/game-providers/${detail.id}/health-check`, { method: 'POST' });
    const data = await readJson<HealthResult>(response);
    setChecking(false);
    if (!response.ok || !data) { setMessage('ทดสอบการเชื่อมต่อไม่สำเร็จ'); return; }
    setHealth(data);
    setMessage(data.payload?.status === 'ONLINE' ? 'เชื่อมต่อค่ายได้ตามปกติ' : 'การเชื่อมต่อค่ายมีปัญหา');
  }

  async function submitEndpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !endpointForm.url.trim()) { setMessage('กรุณากรอก URL endpoint'); return; }
    const response = await adminApiFetch(endpointForm.id ? `/admin/game-providers/${detail.id}/endpoints/${endpointForm.id}` : `/admin/game-providers/${detail.id}/endpoints`, {
      method: endpointForm.id ? 'PATCH' : 'POST',
      body: JSON.stringify({ ...endpointForm, timeoutMs: Number(endpointForm.timeoutMs || 10000), retryCount: Number(endpointForm.retryCount || 2) }),
    });
    if (!response.ok) { setMessage('บันทึก endpoint ไม่สำเร็จ'); return; }
    setEndpointForm(emptyEndpointForm);
    await loadDetail(detail.id);
    setMessage('บันทึก endpoint แล้ว');
  }

  async function submitCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const payload: Record<string, unknown> = { type: credentialForm.type, isEnabled: credentialForm.isEnabled };
    if (credentialForm.value.trim()) payload.value = credentialForm.value.trim();
    const response = await adminApiFetch(credentialForm.id ? `/admin/game-providers/${detail.id}/credentials/${credentialForm.id}` : `/admin/game-providers/${detail.id}/credentials`, {
      method: credentialForm.id ? 'PATCH' : 'POST', body: JSON.stringify(payload),
    });
    if (!response.ok) { setMessage('บันทึกข้อมูลเชื่อมต่อไม่สำเร็จ'); return; }
    setCredentialForm(emptyCredentialForm);
    await loadDetail(detail.id);
    setMessage('บันทึกข้อมูลเชื่อมต่อแล้ว');
  }

  return (
    <AdminPage eyebrow="แพลตฟอร์มเกม" title="ค่ายเกม" description="จัดการค่าย Endpoint ข้อมูลเชื่อมต่อ และการซิงก์รายชื่อเกม" actions={<AdminButton onClick={() => void loadProviders()} disabled={loading}>รีเฟรช</AdminButton>}>
      <AdminMetricGrid>
        <AdminMetric title="ค่ายทั้งหมด" value={String(metrics.total)} />
        <AdminMetric title="เปิดใช้งาน" value={String(metrics.active)} tone="success" />
        <AdminMetric title="ต้องตรวจ" value={String(metrics.attention)} tone={metrics.attention ? 'warning' : 'success'} />
        <AdminMetric title="เกมในระบบ" value={String(metrics.games)} />
      </AdminMetricGrid>
      {message && <AdminNotice>{message}</AdminNotice>}

      <AdminCard title={form.id ? 'แก้ไขค่ายเกม' : 'เพิ่มค่ายเกม'}>
        <form onSubmit={submit} style={formStyle}>
          <Field label="ชื่อค่าย"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={inputStyle} /></Field>
          <Field label="รหัสค่าย"><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} style={inputStyle} /></Field>
          <Field label="URL โลโก้"><input value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} style={inputStyle} /></Field>
          <Field label="สถานะ"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProviderStatus })} style={inputStyle}>{(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'] as ProviderStatus[]).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></Field>
          <Field label="รูปแบบกระเป๋า"><select value={form.walletMode} onChange={(event) => setForm({ ...form, walletMode: event.target.value as WalletMode })} style={inputStyle}><option value="TRANSFER">โยกเงินเข้าออก</option><option value="SEAMLESS">กระเป๋าเดียว</option><option value="HYBRID">ผสม</option></select></Field>
          <Field label="สกุลเงิน"><input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} style={inputStyle} /></Field>
          <Field label="เขตเวลา"><input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} style={inputStyle} /></Field>
          <Field label="ลำดับ"><input value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} style={inputStyle} /></Field>
          <div style={actionRowStyle}><AdminButton type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</AdminButton>{form.id && <AdminButton type="button" tone="secondary" onClick={resetForm}>ยกเลิก</AdminButton>}</div>
        </form>
      </AdminCard>

      {detail && <AdminCard title={`รายละเอียด ${detail.name}`} action={<div style={actionRowStyle}><AdminButton onClick={() => void testConnection()} disabled={checking}>ทดสอบการเชื่อมต่อ</AdminButton><AdminButton tone="secondary" onClick={() => setPendingAction({ action: 'sync', provider: detail })}>ซิงก์รายชื่อเกม</AdminButton></div>}>
        <AdminToolbar><strong>{detail.code}</strong><span>{walletModeLabel(detail.walletMode)} · {statusLabel(detail.status)} · Adapter {detail.adapterRegistered ? 'พร้อม' : 'ยังไม่พร้อม'}</span></AdminToolbar>
        <AdminGrid>
          <section style={panelStyle}><h3>ความพร้อม</h3><p>{readiness ? `ผ่าน ${readiness.passed}/${readiness.total}` : 'ยังไม่มีผลตรวจ'}</p>{health?.payload && <AdminNotice>{healthLabel(health.payload.status)} · {health.payload.latencyMs ?? '-'} ms</AdminNotice>}{syncResult && <AdminNotice tone="success">เพิ่ม {syncResult.created} · อัปเดต {syncResult.updated} · ข้าม {syncResult.skipped}</AdminNotice>}</section>
          <section style={panelStyle}><h3>จำนวนรายการ</h3><AdminStack><AdminRow><strong>Endpoint</strong><span>{detail.endpoints?.length ?? 0}</span></AdminRow><AdminRow><strong>ข้อมูลเชื่อมต่อ</strong><span>{detail.credentials?.length ?? 0}</span></AdminRow><AdminRow><strong>เกม</strong><span>{detail._count?.games ?? 0}</span></AdminRow></AdminStack></section>
        </AdminGrid>
        <AdminGrid>
          <AdminCard title="Endpoint"><form onSubmit={submitEndpoint} style={formStyle}><Field label="ประเภท"><select value={endpointForm.type} onChange={(event) => setEndpointForm({ ...endpointForm, type: event.target.value as EndpointType })} style={inputStyle}>{ENDPOINT_TYPES.map((value) => <option key={value} value={value}>{endpointLabel(value)}</option>)}</select></Field><Field label="URL"><input value={endpointForm.url} onChange={(event) => setEndpointForm({ ...endpointForm, url: event.target.value })} style={inputStyle} /></Field><AdminButton type="submit">บันทึก Endpoint</AdminButton></form><AdminStack>{(detail.endpoints ?? []).map((item) => <AdminRow key={item.id}><span>{endpointLabel(item.type)} · {item.url}</span><AdminBadge tone={item.isEnabled ? 'success' : 'neutral'}>{item.isEnabled ? 'เปิด' : 'ปิด'}</AdminBadge></AdminRow>)}{!detail.endpoints?.length && <AdminEmpty>ยังไม่มี Endpoint</AdminEmpty>}</AdminStack></AdminCard>
          <AdminCard title="ข้อมูลเชื่อมต่อ"><form onSubmit={submitCredential} style={formStyle}><Field label="ประเภท"><select value={credentialForm.type} onChange={(event) => setCredentialForm({ ...credentialForm, type: event.target.value as CredentialType })} style={inputStyle}>{CREDENTIAL_TYPES.map((value) => <option key={value} value={value}>{credentialLabel(value)}</option>)}</select></Field><Field label="ค่าใหม่"><input type="password" value={credentialForm.value} onChange={(event) => setCredentialForm({ ...credentialForm, value: event.target.value })} style={inputStyle} /></Field><AdminButton type="submit">บันทึกข้อมูลเชื่อมต่อ</AdminButton></form><AdminStack>{(detail.credentials ?? []).map((item) => <AdminRow key={item.id}><span>{credentialLabel(item.type)} · {item.maskedValue}</span><AdminBadge tone={item.isEnabled ? 'success' : 'neutral'}>{item.isEnabled ? 'เปิด' : 'ปิด'}</AdminBadge></AdminRow>)}{!detail.credentials?.length && <AdminEmpty>ยังไม่มีข้อมูลเชื่อมต่อ</AdminEmpty>}</AdminStack></AdminCard>
        </AdminGrid>
      </AdminCard>}

      <AdminCard title="รายชื่อค่าย">
        <AdminFilterBar resultText={`แสดง ${visibleItems.length}/${items.length} ค่าย`}><Field label="ค้นหา"><input value={query} onChange={(event) => setQuery(event.target.value)} style={inputStyle} /></Field></AdminFilterBar>
        <AdminStack>{visibleItems.map((item) => <AdminRow key={item.id}><div><strong>{item.name}</strong><p>{item.code} · {walletModeLabel(item.walletMode)}</p></div><div style={actionRowStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton tone="secondary" onClick={() => { setForm({ id: item.id, name: item.name, code: item.code, logoUrl: item.logoUrl ?? '', status: item.status, walletMode: item.walletMode, currency: item.currency, timezone: item.timezone, sortOrder: String(item.sortOrder) }); void loadDetail(item.id); }}>จัดการ</AdminButton><AdminButton tone={item.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => setPendingAction({ action: 'status', provider: item, status: item.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' })}>{item.status === 'ACTIVE' ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</AdminButton></div></AdminRow>)}{!loading && visibleItems.length === 0 && <AdminEmpty>ไม่พบค่าย</AdminEmpty>}</AdminStack>
      </AdminCard>

      <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction ? `${pendingAction.action === 'sync' ? 'ซิงก์เกม' : 'เปลี่ยนสถานะ'} ${pendingAction.provider.name}` : ''} description="ยืนยันการดำเนินการกับค่ายเกมนี้" confirmLabel="ยืนยัน" tone={pendingAction?.action === 'status' && pendingAction.status !== 'ACTIVE' ? 'danger' : 'primary'} busy={syncing} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmPendingAction()} />
    </AdminPage>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label style={labelStyle}><span>{label}</span>{children}</label>; }
function statusLabel(status: ProviderStatus) { return ({ ACTIVE: 'เปิดใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'ประสิทธิภาพลดลง' } as Record<ProviderStatus, string>)[status]; }
function statusTone(status: ProviderStatus) { return status === 'ACTIVE' ? 'success' : status === 'MAINTENANCE' || status === 'DEGRADED' ? 'warning' : 'neutral'; }
function walletModeLabel(mode: WalletMode) { return ({ TRANSFER: 'โยกเงินเข้าออก', SEAMLESS: 'กระเป๋าเดียว', HYBRID: 'แบบผสม' } as Record<WalletMode, string>)[mode]; }
function healthLabel(status: 'ONLINE' | 'OFFLINE' | 'DEGRADED') { return ({ ONLINE: 'เชื่อมต่อปกติ', OFFLINE: 'เชื่อมต่อไม่ได้', DEGRADED: 'เชื่อมต่อไม่สมบูรณ์' } as const)[status]; }
function endpointLabel(type: EndpointType) { return ({ LAUNCH: 'เปิดเกม', BALANCE: 'ตรวจยอด', TRANSFER_IN: 'โยกเงินเข้า', TRANSFER_OUT: 'โยกเงินออก', GAME_LIST: 'รายชื่อเกม', BET_HISTORY: 'ประวัติเดิมพัน', WEBHOOK: 'Webhook', HEALTH_CHECK: 'ตรวจสุขภาพระบบ' } as Record<EndpointType, string>)[type]; }
function credentialLabel(type: CredentialType) { return ({ API_KEY: 'API Key', SECRET_KEY: 'Secret Key', MERCHANT_ID: 'Merchant ID', AGENT_ID: 'Agent ID', WEBHOOK_SECRET: 'Webhook Secret', TOKEN: 'Token' } as Record<CredentialType, string>)[type]; }
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, alignItems: 'end' } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#cbd5e1', fontWeight: 800 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const panelStyle = { padding: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.48)' } as const;
