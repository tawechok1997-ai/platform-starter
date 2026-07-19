'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../../../app/(admin)/_components/admin-ui';

type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type WalletMode = 'SEAMLESS' | 'TRANSFER' | 'HYBRID';
type EndpointType = 'LAUNCH' | 'BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'GAME_LIST' | 'BET_HISTORY' | 'WEBHOOK' | 'HEALTH_CHECK';
type CredentialType = 'API_KEY' | 'SECRET_KEY' | 'MERCHANT_ID' | 'AGENT_ID' | 'WEBHOOK_SECRET' | 'TOKEN';
type ProviderCounts = { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number };
type Readiness = { checks: Array<{ key: string; label: string; ok: boolean }>; ready: boolean; passed: number; total: number };
type HealthResult = { ok: boolean; providerCode: string; requestId: string; payload?: { status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }; readiness?: Readiness; checkedAt?: string };
type SyncResult = { ok: boolean; providerCode: string; created: number; updated: number; skipped: number; total?: number; checkedAt?: string };
type GameProvider = { id: string; name: string; code: string; logoUrl?: string | null; status: ProviderStatus; walletMode: WalletMode; currency: string; timezone: string; sortOrder: number; createdAt: string; updatedAt: string; _count?: ProviderCounts };
type ProviderEndpoint = { id: string; providerId: string; type: EndpointType; url: string; method: string; timeoutMs: number; retryCount: number; isEnabled: boolean; updatedAt: string };
type ProviderCredential = { id: string; providerId: string; type: CredentialType; maskedValue: string; isEnabled: boolean; rotatedAt?: string | null; updatedAt: string };
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

  useEffect(() => { void loadProviders(); }, []);
  const metrics = useMemo(() => ({ total: items.length, active: items.filter((item) => item.status === 'ACTIVE').length, attention: items.filter((item) => item.status === 'MAINTENANCE' || item.status === 'DEGRADED').length, games: items.reduce((sum, item) => sum + Number(item._count?.games ?? 0), 0) }), [items]);
  const readiness = health?.readiness ?? detail?.readiness;

  async function loadProviders() {
    setLoading(true);
    setMessage('กำลังโหลดค่ายเกม...');
    const res = await adminApiFetch('/admin/game-providers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดค่ายเกมไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  async function loadDetail(id: string) {
    setMessage('กำลังโหลดรายละเอียดค่ายเกม...');
    const res = await adminApiFetch(`/admin/game-providers/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายละเอียดค่ายเกมไม่สำเร็จ'); return; }
    setDetail(data);
    setHealth(null);
    setSyncResult(null);
    setMessage('');
  }

  function updateField<K extends keyof ProviderFormState>(key: K, value: ProviderFormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateEndpointField<K extends keyof EndpointFormState>(key: K, value: EndpointFormState[K]) { setEndpointForm((current) => ({ ...current, [key]: value })); }
  function updateCredentialField<K extends keyof CredentialFormState>(key: K, value: CredentialFormState[K]) { setCredentialForm((current) => ({ ...current, [key]: value })); }

  async function editProvider(item: GameProvider) {
    setForm({ id: item.id, name: item.name, code: item.code, logoUrl: item.logoUrl ?? '', status: item.status, walletMode: item.walletMode, currency: item.currency, timezone: item.timezone, sortOrder: String(item.sortOrder) });
    setEndpointForm(emptyEndpointForm);
    setCredentialForm(emptyCredentialForm);
    await loadDetail(item.id);
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
    const payload = { name: form.name.trim(), code: form.code.trim(), logoUrl: form.logoUrl.trim() || null, status: form.status, walletMode: form.walletMode, currency: form.currency.trim() || 'THB', timezone: form.timezone.trim() || 'Asia/Bangkok', sortOrder: Number(form.sortOrder || 100) };
    if (!payload.name || !payload.code) { setMessage('กรุณากรอกชื่อค่ายและรหัสค่าย'); return; }
    setSaving(true);
    const res = await adminApiFetch(form.id ? `/admin/game-providers/${form.id}` : '/admin/game-providers', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกค่ายเกมไม่สำเร็จ'); return; }
    setMessage(form.id ? 'บันทึกข้อมูลค่ายเกมแล้ว' : 'เพิ่มค่ายเกมแล้ว');
    setForm(emptyForm);
    setDetail(null);
    await loadProviders();
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.action === 'status' && pendingAction.status) {
      const { provider, status } = pendingAction;
      const res = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(data?.message ?? 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
      setItems((current) => current.map((item) => item.id === provider.id ? { ...item, ...data } : item));
      if (detail?.id === provider.id) setDetail((current) => current ? { ...current, ...data } : current);
      setMessage(`เปลี่ยนสถานะ ${provider.name} เป็น ${statusLabel(status)} แล้ว`);
      setPendingAction(null);
      return;
    }
    if (pendingAction.action === 'sync') {
      const provider = pendingAction.provider;
      setSyncing(true);
      const res = await adminApiFetch(`/admin/game-providers/${provider.id}/sync-games`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      setSyncing(false);
      if (!res.ok) { setMessage(data?.message ?? 'ซิงก์เกมไม่สำเร็จ'); return; }
      setSyncResult(data);
      setMessage(`ซิงก์เกมแล้ว: เพิ่ม ${data.created ?? 0}, อัปเดต ${data.updated ?? 0}, ข้าม ${data.skipped ?? 0}`);
      setPendingAction(null);
      await loadDetail(provider.id);
      await loadProviders();
    }
  }

  async function testConnection() {
    if (!detail) return;
    setChecking(true);
    setMessage('กำลังทดสอบการเชื่อมต่อ...');
    const res = await adminApiFetch(`/admin/game-providers/${detail.id}/health-check`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setChecking(false);
    if (!res.ok) { setMessage(data?.message ?? 'ทดสอบการเชื่อมต่อไม่สำเร็จ'); return; }
    setHealth(data);
    setMessage(data?.payload?.status === 'ONLINE' ? 'เชื่อมต่อค่ายได้ตามปกติ' : 'การเชื่อมต่อค่ายมีปัญหา');
    await loadDetail(detail.id);
  }

  async function submitEndpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const payload = { type: endpointForm.type, url: endpointForm.url.trim(), method: endpointForm.method, timeoutMs: Number(endpointForm.timeoutMs || 10000), retryCount: Number(endpointForm.retryCount || 2), isEnabled: endpointForm.isEnabled };
    if (!payload.url) { setMessage('กรุณากรอก URL endpoint'); return; }
    const res = await adminApiFetch(endpointForm.id ? `/admin/game-providers/${detail.id}/endpoints/${endpointForm.id}` : `/admin/game-providers/${detail.id}/endpoints`, { method: endpointForm.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึก endpoint ไม่สำเร็จ'); return; }
    setEndpointForm(emptyEndpointForm);
    await loadDetail(detail.id);
    await loadProviders();
    setMessage('บันทึก endpoint แล้ว');
  }

  async function submitCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const payload: Record<string, unknown> = { type: credentialForm.type, isEnabled: credentialForm.isEnabled };
    if (credentialForm.value.trim()) payload.value = credentialForm.value.trim();
    const res = await adminApiFetch(credentialForm.id ? `/admin/game-providers/${detail.id}/credentials/${credentialForm.id}` : `/admin/game-providers/${detail.id}/credentials`, { method: credentialForm.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกข้อมูลเชื่อมต่อไม่สำเร็จ'); return; }
    setCredentialForm(emptyCredentialForm);
    await loadDetail(detail.id);
    await loadProviders();
    setMessage('บันทึกข้อมูลเชื่อมต่อแล้ว');
  }

  function editEndpoint(item: ProviderEndpoint) { setEndpointForm({ id: item.id, type: item.type, url: item.url, method: item.method, timeoutMs: String(item.timeoutMs), retryCount: String(item.retryCount), isEnabled: item.isEnabled }); }
  function editCredential(item: ProviderCredential) { setCredentialForm({ id: item.id, type: item.type, value: '', isEnabled: item.isEnabled }); }

  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="ค่ายเกม" description="จัดการข้อมูลค่าย Endpoint ข้อมูลเชื่อมต่อ ความพร้อม และการซิงก์รายชื่อเกม" actions={<AdminButton onClick={() => void loadProviders()} disabled={loading}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="ค่ายทั้งหมด" value={String(metrics.total)} />
      <AdminMetric title="เปิดใช้งาน" value={String(metrics.active)} tone="success" />
      <AdminMetric title="ต้องตรวจ" value={String(metrics.attention)} tone={metrics.attention ? 'warning' : 'success'} />
      <AdminMetric title="เกมในระบบ" value={String(metrics.games)} />
    </AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminCard title={form.id ? 'แก้ไขค่ายเกม' : 'เพิ่มค่ายเกม'} description="ข้อมูลพื้นฐานและรูปแบบกระเป๋าเงินของค่าย">
      <form onSubmit={submit} style={formStyle}>
        <Field label="ชื่อค่าย"><input value={form.name} onChange={(event) => updateField('name', event.target.value)} style={inputStyle} placeholder="เช่น PG Soft" /></Field>
        <Field label="รหัสค่าย"><input value={form.code} onChange={(event) => updateField('code', event.target.value)} style={inputStyle} placeholder="เช่น pgsoft" /></Field>
        <Field label="URL โลโก้"><input value={form.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} style={inputStyle} placeholder="https://..." /></Field>
        <Field label="สถานะ"><select value={form.status} onChange={(event) => updateField('status', event.target.value as ProviderStatus)} style={inputStyle}>{(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'] as ProviderStatus[]).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></Field>
        <Field label="รูปแบบกระเป๋า"><select value={form.walletMode} onChange={(event) => updateField('walletMode', event.target.value as WalletMode)} style={inputStyle}><option value="TRANSFER">โยกเงินเข้าออก</option><option value="SEAMLESS">กระเป๋าเดียว</option><option value="HYBRID">ผสม</option></select></Field>
        <Field label="สกุลเงิน"><input value={form.currency} onChange={(event) => updateField('currency', event.target.value)} style={inputStyle} /></Field>
        <Field label="เขตเวลา"><input value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)} style={inputStyle} /></Field>
        <Field label="ลำดับ"><input value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} inputMode="numeric" style={inputStyle} /></Field>
        <div style={actionRowStyle}><AdminButton type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : form.id ? 'บันทึกค่าย' : 'เพิ่มค่าย'}</AdminButton>{form.id && <AdminButton type="button" tone="secondary" onClick={resetForm}>ยกเลิก</AdminButton>}</div>
      </form>
    </AdminCard>

    {detail && <AdminCard title={`รายละเอียด ${detail.name}`} description="ตรวจความพร้อม จัดการ Endpoint และข้อมูลเชื่อมต่อ" action={<div style={actionRowStyle}><AdminButton onClick={() => void testConnection()} disabled={checking}>{checking ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</AdminButton><AdminButton tone="secondary" onClick={() => setPendingAction({ action: 'sync', provider: detail })} disabled={syncing}>{syncing ? 'กำลังซิงก์...' : 'ซิงก์รายชื่อเกม'}</AdminButton></div>}>
      <AdminToolbar><strong>{detail.code}</strong><span style={mutedStyle}>{walletModeLabel(detail.walletMode)} · {statusLabel(detail.status)} · Adapter {detail.adapterRegistered ? 'พร้อม' : 'ยังไม่พร้อม'}</span></AdminToolbar>
      <AdminGrid>
        <section style={panelStyle}><h3 style={panelTitleStyle}>ความพร้อม</h3><p style={mutedStyle}>{readiness ? `ผ่าน ${readiness.passed} จาก ${readiness.total} รายการ` : 'ยังไม่มีผลตรวจ'}</p><AdminStack>{(readiness?.checks ?? []).map((item) => <AdminRow key={item.key}><strong>{item.label}</strong><AdminBadge tone={item.ok ? 'success' : 'warning'}>{item.ok ? 'ผ่าน' : 'รอตรวจ'}</AdminBadge></AdminRow>)}</AdminStack>{health?.payload && <AdminNotice tone={health.payload.status === 'ONLINE' ? 'success' : 'warning'}>{healthLabel(health.payload.status)} · {health.payload.latencyMs ?? '-'} ms</AdminNotice>}{syncResult && <AdminNotice tone="success">เพิ่ม {syncResult.created} · อัปเดต {syncResult.updated} · ข้าม {syncResult.skipped}</AdminNotice>}</section>
        <section style={panelStyle}><h3 style={panelTitleStyle}>จำนวนรายการ</h3><AdminStack><AdminRow><strong>Endpoint</strong><span>{detail._count?.endpoints ?? detail.endpoints?.length ?? 0}</span></AdminRow><AdminRow><strong>ข้อมูลเชื่อมต่อ</strong><span>{detail._count?.credentials ?? detail.credentials?.length ?? 0}</span></AdminRow><AdminRow><strong>เกม</strong><span>{detail._count?.games ?? 0}</span></AdminRow><AdminRow><strong>เซสชัน</strong><span>{detail._count?.sessions ?? 0}</span></AdminRow><AdminRow><strong>รายการโยกเงิน</strong><span>{detail._count?.transfers ?? 0}</span></AdminRow><AdminRow><strong>Webhook</strong><span>{detail._count?.webhookLogs ?? 0}</span></AdminRow></AdminStack></section>
      </AdminGrid>

      <AdminGrid>
        <AdminCard title="Endpoint" description="URL และนโยบาย retry ของแต่ละงาน"><form onSubmit={submitEndpoint} style={formStyle}><Field label="ประเภท"><select value={endpointForm.type} onChange={(event) => updateEndpointField('type', event.target.value as EndpointType)} style={inputStyle}>{ENDPOINT_TYPES.map((value) => <option key={value} value={value}>{endpointLabel(value)}</option>)}</select></Field><Field label="URL"><input value={endpointForm.url} onChange={(event) => updateEndpointField('url', event.target.value)} style={inputStyle} /></Field><Field label="Method"><select value={endpointForm.method} onChange={(event) => updateEndpointField('method', event.target.value)} style={inputStyle}><option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option></select></Field><Field label="Timeout (ms)"><input value={endpointForm.timeoutMs} onChange={(event) => updateEndpointField('timeoutMs', event.target.value)} style={inputStyle} /></Field><Field label="Retry"><input value={endpointForm.retryCount} onChange={(event) => updateEndpointField('retryCount', event.target.value)} style={inputStyle} /></Field><label style={checkStyle}><input type="checkbox" checked={endpointForm.isEnabled} onChange={(event) => updateEndpointField('isEnabled', event.target.checked)} /> เปิดใช้งาน</label><div style={actionRowStyle}><AdminButton type="submit">{endpointForm.id ? 'บันทึก Endpoint' : 'เพิ่ม Endpoint'}</AdminButton>{endpointForm.id && <AdminButton type="button" tone="secondary" onClick={() => setEndpointForm(emptyEndpointForm)}>ยกเลิก</AdminButton>}</div></form><AdminStack>{(detail.endpoints ?? []).map((item) => <AdminRow key={item.id}><div><strong>{endpointLabel(item.type)}</strong><p style={smallMutedStyle}>{item.method} · {item.url} · timeout {item.timeoutMs}ms · retry {item.retryCount}</p></div><div style={actionRowStyle}><AdminBadge tone={item.isEnabled ? 'success' : 'neutral'}>{item.isEnabled ? 'เปิด' : 'ปิด'}</AdminBadge><AdminButton tone="secondary" onClick={() => editEndpoint(item)}>แก้ไข</AdminButton></div></AdminRow>)}{(detail.endpoints ?? []).length === 0 && <AdminEmpty>ยังไม่มี Endpoint</AdminEmpty>}</AdminStack></AdminCard>
        <AdminCard title="ข้อมูลเชื่อมต่อ" description="ค่าลับจะแสดงแบบปิดบังเสมอ"><form onSubmit={submitCredential} style={formStyle}><Field label="ประเภท"><select value={credentialForm.type} onChange={(event) => updateCredentialField('type', event.target.value as CredentialType)} style={inputStyle}>{CREDENTIAL_TYPES.map((value) => <option key={value} value={value}>{credentialLabel(value)}</option>)}</select></Field><Field label="ค่าใหม่"><input type="password" value={credentialForm.value} onChange={(event) => updateCredentialField('value', event.target.value)} style={inputStyle} placeholder={credentialForm.id ? 'เว้นว่างเพื่อคงค่าเดิม' : 'กรอกค่าลับ'} /></Field><label style={checkStyle}><input type="checkbox" checked={credentialForm.isEnabled} onChange={(event) => updateCredentialField('isEnabled', event.target.checked)} /> เปิดใช้งาน</label><div style={actionRowStyle}><AdminButton type="submit">{credentialForm.id ? 'บันทึกข้อมูลเชื่อมต่อ' : 'เพิ่มข้อมูลเชื่อมต่อ'}</AdminButton>{credentialForm.id && <AdminButton type="button" tone="secondary" onClick={() => setCredentialForm(emptyCredentialForm)}>ยกเลิก</AdminButton>}</div></form><AdminStack>{(detail.credentials ?? []).map((item) => <AdminRow key={item.id}><div><strong>{credentialLabel(item.type)}</strong><p style={smallMutedStyle}>{item.maskedValue} · อัปเดต {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={actionRowStyle}><AdminBadge tone={item.isEnabled ? 'success' : 'neutral'}>{item.isEnabled ? 'เปิด' : 'ปิด'}</AdminBadge><AdminButton tone="secondary" onClick={() => editCredential(item)}>แก้ไข</AdminButton></div></AdminRow>)}{(detail.credentials ?? []).length === 0 && <AdminEmpty>ยังไม่มีข้อมูลเชื่อมต่อ</AdminEmpty>}</AdminStack></AdminCard>
      </AdminGrid>
    </AdminCard>}

    <AdminCard title="รายชื่อค่าย" description="เลือกค่ายเพื่อแก้ไขและตรวจความพร้อม">
      <AdminStack>{items.map((item) => <AdminRow key={item.id}><div><strong>{item.name}</strong><p style={mutedStyle}>{item.code} · {walletModeLabel(item.walletMode)} · เกม {item._count?.games ?? 0}</p><p style={smallMutedStyle}>อัปเดต {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={actionRowStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton tone="secondary" onClick={() => void editProvider(item)}>จัดการ</AdminButton><AdminButton tone={item.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => setPendingAction({ action: 'status', provider: item, status: item.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' })}>{item.status === 'ACTIVE' ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</AdminButton></div></AdminRow>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มีค่ายเกม</AdminEmpty>}</AdminStack>
    </AdminCard>

    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction ? pendingTitle(pendingAction) : ''} description={pendingAction?.action === 'sync' ? 'ระบบจะขอรายชื่อเกมล่าสุดจากค่ายและอัปเดตคลังเกมเดิม' : pendingAction?.status === 'ACTIVE' ? 'ค่ายจะกลับมาเปิดให้ระบบเรียกใช้งาน' : 'ค่ายจะถูกปิดปรับปรุงและไม่ควรถูกใช้เปิดเกมใหม่'} confirmLabel={pendingAction?.action === 'sync' ? 'ซิงก์เกม' : pendingAction?.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} tone={pendingAction?.action === 'status' && pendingAction.status !== 'ACTIVE' ? 'danger' : 'primary'} busy={syncing} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmPendingAction()} details={pendingAction ? <><p><strong>ค่าย:</strong> {pendingAction.provider.name}</p><p><strong>สถานะปัจจุบัน:</strong> {statusLabel(pendingAction.provider.status)}</p></> : null} />
  </AdminPage>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={labelStyle}><span>{label}</span>{children}</label>; }
function pendingTitle(action: PendingAction) { if (action.action === 'sync') return `ซิงก์เกมจาก ${action.provider.name}`; return `${action.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} ${action.provider.name}`; }
function statusLabel(status: ProviderStatus) { return ({ ACTIVE: 'เปิดใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'ประสิทธิภาพลดลง' } as Record<ProviderStatus, string>)[status]; }
function statusTone(status: ProviderStatus) { if (status === 'ACTIVE') return 'success'; if (status === 'MAINTENANCE' || status === 'DEGRADED') return 'warning'; return 'neutral'; }
function walletModeLabel(mode: WalletMode) { return ({ TRANSFER: 'โยกเงินเข้าออก', SEAMLESS: 'กระเป๋าเดียว', HYBRID: 'แบบผสม' } as Record<WalletMode, string>)[mode]; }
function healthLabel(status: 'ONLINE' | 'OFFLINE' | 'DEGRADED') { return ({ ONLINE: 'เชื่อมต่อปกติ', OFFLINE: 'เชื่อมต่อไม่ได้', DEGRADED: 'เชื่อมต่อช้าหรือไม่สมบูรณ์' } as const)[status]; }
function endpointLabel(type: EndpointType) { return ({ LAUNCH: 'เปิดเกม', BALANCE: 'ตรวจยอด', TRANSFER_IN: 'โยกเงินเข้า', TRANSFER_OUT: 'โยกเงินออก', GAME_LIST: 'รายชื่อเกม', BET_HISTORY: 'ประวัติเดิมพัน', WEBHOOK: 'Webhook', HEALTH_CHECK: 'ตรวจสุขภาพระบบ' } as Record<EndpointType, string>)[type]; }
function credentialLabel(type: CredentialType) { return ({ API_KEY: 'API Key', SECRET_KEY: 'Secret Key', MERCHANT_ID: 'Merchant ID', AGENT_ID: 'Agent ID', WEBHOOK_SECRET: 'Webhook Secret', TOKEN: 'Token' } as Record<CredentialType, string>)[type]; }
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, alignItems: 'end', minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#cbd5e1', fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const checkStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontWeight: 800, minHeight: 44 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12, wordBreak: 'break-all' as const };
const panelStyle = { padding: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.48)', minWidth: 0 } as const;
const panelTitleStyle = { margin: '0 0 8px', fontSize: 18 } as const;
