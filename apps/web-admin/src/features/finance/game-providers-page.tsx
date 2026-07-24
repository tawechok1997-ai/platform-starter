'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';
import { buildAdminListQuery, normalizeAdminListPayload, type AdminListPayload, useAdminListContract } from '../../../app/(admin)/_components/admin-list-contract';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminDrawer, AdminEmpty, AdminFilterBar, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminPagination, AdminRow, AdminStack, AdminToolbar } from '../../../app/(admin)/_components/admin-ui';

type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type WalletMode = 'SEAMLESS' | 'TRANSFER' | 'HYBRID';
type EndpointType = 'LAUNCH' | 'BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'GAME_LIST' | 'BET_HISTORY' | 'WEBHOOK' | 'HEALTH_CHECK';
type CredentialType = 'API_KEY' | 'SECRET_KEY' | 'MERCHANT_ID' | 'AGENT_ID' | 'WEBHOOK_SECRET' | 'TOKEN';
type BusyAction = 'list' | 'detail' | 'provider' | 'status' | 'sync' | 'health' | 'endpoint' | 'credential' | null;
type ProviderCounts = { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number };
type Readiness = { checks: Array<{ key: string; label: string; ok: boolean }>; ready: boolean; passed: number; total: number };
type HealthResult = { payload?: { status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }; readiness?: Readiness };
type SyncResult = { created: number; updated: number; skipped: number };
type GameProvider = { id: string; name: string; code: string; logoUrl?: string | null; status: ProviderStatus; walletMode: WalletMode; currency: string; timezone: string; sortOrder: number; createdAt: string; updatedAt: string; _count?: ProviderCounts };
type ProviderEndpoint = { id: string; providerId: string; type: EndpointType; url: string; method: string; timeoutMs: number; retryCount: number; isEnabled: boolean; updatedAt: string };
type ProviderCredential = { id: string; providerId: string; type: CredentialType; maskedValue: string; isEnabled: boolean; updatedAt: string };
type ProviderDetail = GameProvider & { endpoints?: ProviderEndpoint[]; credentials?: ProviderCredential[]; readiness?: Readiness; adapterRegistered?: boolean };
type ProviderFormState = { id?: string; name: string; code: string; logoUrl: string; status: ProviderStatus; walletMode: WalletMode; currency: string; timezone: string; sortOrder: string };
type EndpointFormState = { id?: string; type: EndpointType; url: string; method: string; timeoutMs: string; retryCount: string; isEnabled: boolean };
type CredentialFormState = { id?: string; type: CredentialType; value: string; isEnabled: boolean };
type PendingAction = { action: 'status' | 'sync'; provider: GameProvider; status?: ProviderStatus };
type ProviderPayload = AdminListPayload<GameProvider> & { summary: { total: number; active: number; attention: number; games: number } };

const emptyForm: ProviderFormState = { name: '', code: '', logoUrl: '', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: '100' };
const emptyEndpointForm: EndpointFormState = { type: 'LAUNCH', url: '', method: 'POST', timeoutMs: '10000', retryCount: '2', isEnabled: true };
const emptyCredentialForm: CredentialFormState = { type: 'API_KEY', value: '', isEnabled: true };
const emptyPayload: ProviderPayload = { items: [], total: 0, page: 1, pageSize: 25, totalPages: 1, summary: { total: 0, active: 0, attention: 0, games: 0 } };
const endpointTypes: EndpointType[] = ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'];
const credentialTypes: CredentialType[] = ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET', 'TOKEN'];

export default function GameProvidersPage() {
  const [payload, setPayload] = useState<ProviderPayload>(emptyPayload);
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [endpointForm, setEndpointForm] = useState<EndpointFormState>(emptyEndpointForm);
  const [credentialForm, setCredentialForm] = useState<CredentialFormState>(emptyCredentialForm);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<BusyAction>('list');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProviderStatus>('ALL');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'ATTENTION' | 'NORMAL'>('ALL');
  const list = useAdminListContract({ initialPageSize: 25 });
  const readiness = health?.readiness ?? detail?.readiness;
  const locked = busy !== null;

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProviders(); }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [list.page, list.pageSize, query, statusFilter, healthFilter]);

  async function loadProviders() {
    if (busy && busy !== 'list') return;
    setBusy('list');
    setMessage('กำลังโหลดค่ายเกม...');
    try {
      const suffix = buildAdminListQuery({ page: list.page, take: list.pageSize, search: query.trim(), status: statusFilter === 'ALL' ? undefined : statusFilter, health: healthFilter === 'ALL' ? undefined : healthFilter });
      const response = await adminApiFetch(`/admin/game-providers${suffix}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error('list');
      const normalized = normalizeAdminListPayload<GameProvider>(data, list.page, list.pageSize);
      setPayload({ ...normalized, summary: data?.summary ?? emptyPayload.summary });
      if (normalized.page !== list.page) list.setPage(normalized.page);
      setMessage('');
    } catch {
      setMessage('โหลดค่ายเกมไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function loadDetail(id: string) {
    setBusy('detail');
    setMessage('กำลังโหลดรายละเอียดค่ายเกม...');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${id}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.id) throw new Error('detail');
      setDetail(data);
      setHealth(null);
      setSyncResult(null);
      setMessage('');
    } catch {
      setMessage('โหลดรายละเอียดค่ายเกมไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function editProvider(item: GameProvider) {
    if (locked) return;
    setForm({ id: item.id, name: item.name, code: item.code, logoUrl: item.logoUrl ?? '', status: item.status, walletMode: item.walletMode, currency: item.currency, timezone: item.timezone, sortOrder: String(item.sortOrder) });
    setEndpointForm(emptyEndpointForm);
    setCredentialForm(emptyCredentialForm);
    await loadDetail(item.id);
  }

  function closeDetail() {
    if (locked) return;
    setForm(emptyForm); setDetail(null); setHealth(null); setSyncResult(null); setEndpointForm(emptyEndpointForm); setCredentialForm(emptyCredentialForm); setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const body = { name: form.name.trim(), code: form.code.trim(), logoUrl: form.logoUrl.trim() || null, status: form.status, walletMode: form.walletMode, currency: form.currency.trim() || 'THB', timezone: form.timezone.trim() || 'Asia/Bangkok', sortOrder: Number(form.sortOrder || 100) };
    if (!body.name || !body.code) return setMessage('กรุณากรอกชื่อค่ายและรหัสค่าย');
    setBusy('provider');
    try {
      const response = await adminApiFetch(form.id ? `/admin/game-providers/${form.id}` : '/admin/game-providers', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (!response.ok) throw new Error('provider');
      const savedMessage = form.id ? 'บันทึกข้อมูลค่ายเกมแล้ว' : 'เพิ่มค่ายเกมแล้ว';
      setForm(emptyForm); setDetail(null);
      setBusy(null);
      await loadProviders();
      setMessage(savedMessage);
    } catch {
      setMessage('บันทึกค่ายเกมไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction || locked) return;
    const action = pendingAction;
    setBusy(action.action === 'sync' ? 'sync' : 'status');
    try {
      if (action.action === 'status' && action.status) {
        const response = await adminApiFetch(`/admin/game-providers/${action.provider.id}`, { method: 'PATCH', body: JSON.stringify({ status: action.status }) });
        if (!response.ok) throw new Error('status');
        setMessage(`เปลี่ยนสถานะ ${action.provider.name} เป็น ${statusLabel(action.status)} แล้ว`);
      } else {
        const response = await adminApiFetch(`/admin/game-providers/${action.provider.id}/sync-games`, { method: 'POST' });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error('sync');
        setSyncResult({ created: Number(data?.created ?? 0), updated: Number(data?.updated ?? 0), skipped: Number(data?.skipped ?? 0) });
        setMessage(`ซิงก์เกมแล้ว: เพิ่ม ${data?.created ?? 0}, อัปเดต ${data?.updated ?? 0}, ข้าม ${data?.skipped ?? 0}`);
      }
      setPendingAction(null);
      setBusy(null);
      if (detail?.id === action.provider.id) await loadDetail(action.provider.id);
      await loadProviders();
    } catch {
      setMessage(action.action === 'sync' ? 'ซิงก์เกมไม่สำเร็จ' : 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function testConnection() {
    if (!detail || locked) return;
    const id = detail.id;
    setBusy('health'); setMessage('กำลังทดสอบการเชื่อมต่อ...');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${id}/health-check`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error('health');
      setHealth(data);
      setMessage(data?.payload?.status === 'ONLINE' ? 'เชื่อมต่อค่ายได้ตามปกติ' : 'การเชื่อมต่อค่ายมีปัญหา');
      setBusy(null);
      await loadDetail(id);
    } catch {
      setMessage('ทดสอบการเชื่อมต่อไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function submitEndpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || locked) return;
    const id = detail.id;
    const body = { type: endpointForm.type, url: endpointForm.url.trim(), method: endpointForm.method, timeoutMs: Number(endpointForm.timeoutMs || 10000), retryCount: Number(endpointForm.retryCount || 2), isEnabled: endpointForm.isEnabled };
    if (!body.url) return setMessage('กรุณากรอก URL endpoint');
    setBusy('endpoint');
    try {
      const response = await adminApiFetch(endpointForm.id ? `/admin/game-providers/${id}/endpoints/${endpointForm.id}` : `/admin/game-providers/${id}/endpoints`, { method: endpointForm.id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (!response.ok) throw new Error('endpoint');
      setEndpointForm(emptyEndpointForm); setBusy(null);
      await Promise.all([loadDetail(id), loadProviders()]);
      setMessage('บันทึก endpoint แล้ว');
    } catch {
      setMessage('บันทึก endpoint ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function submitCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || locked) return;
    const id = detail.id;
    const body: Record<string, unknown> = { type: credentialForm.type, isEnabled: credentialForm.isEnabled };
    if (credentialForm.value.trim()) body.value = credentialForm.value.trim();
    setBusy('credential');
    try {
      const response = await adminApiFetch(credentialForm.id ? `/admin/game-providers/${id}/credentials/${credentialForm.id}` : `/admin/game-providers/${id}/credentials`, { method: credentialForm.id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (!response.ok) throw new Error('credential');
      setCredentialForm(emptyCredentialForm); setBusy(null);
      await Promise.all([loadDetail(id), loadProviders()]);
      setMessage('บันทึกข้อมูลเชื่อมต่อแล้ว');
    } catch {
      setMessage('บันทึกข้อมูลเชื่อมต่อไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  const metrics = payload.summary;
  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="ค่ายเกม" description="จัดการข้อมูลค่าย Endpoint ข้อมูลเชื่อมต่อ ความพร้อม และการซิงก์รายชื่อเกม" actions={<AdminButton onClick={() => void loadProviders()} disabled={locked}>รีเฟรช</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="ค่ายทั้งหมด" value={String(metrics.total)} /><AdminMetric title="เปิดใช้งาน" value={String(metrics.active)} tone="success" /><AdminMetric title="ต้องตรวจ" value={String(metrics.attention)} tone={metrics.attention ? 'warning' : 'success'} /><AdminMetric title="เกมในระบบ" value={String(metrics.games)} /></AdminMetricGrid>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminCard title="เพิ่มค่ายเกม" description="ข้อมูลพื้นฐานและรูปแบบกระเป๋าเงินของค่าย"><ProviderForm form={form} busy={busy === 'provider'} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onSubmit={submit} /></AdminCard>
    <AdminCard title="รายชื่อค่าย" description="เลือกค่ายเพื่อแก้ไขและตรวจความพร้อม">
      <AdminFilterBar resultText={busy === 'list' ? 'กำลังโหลด...' : `แสดง ${payload.items.length}/${payload.total} ค่าย`}><Filter label="ค้นหา"><input value={query} disabled={locked} onChange={(event) => { setQuery(event.target.value); list.resetPage(); }} placeholder="ชื่อหรือรหัสค่าย" style={inputStyle} /></Filter><Filter label="สถานะ"><select value={statusFilter} disabled={locked} onChange={(event) => { setStatusFilter(event.target.value as 'ALL' | ProviderStatus); list.resetPage(); }} style={inputStyle}><option value="ALL">ทั้งหมด</option>{(['ACTIVE','INACTIVE','MAINTENANCE','DEGRADED'] as ProviderStatus[]).map((value) => <option key={value}>{value}</option>)}</select></Filter><Filter label="สุขภาพ"><select value={healthFilter} disabled={locked} onChange={(event) => { setHealthFilter(event.target.value as 'ALL' | 'ATTENTION' | 'NORMAL'); list.resetPage(); }} style={inputStyle}><option value="ALL">ทั้งหมด</option><option value="ATTENTION">ต้องตรวจ</option><option value="NORMAL">ปกติ</option></select></Filter></AdminFilterBar>
      <AdminStack>{payload.items.map((item) => <AdminRow key={item.id}><div><strong>{item.name}</strong><p style={mutedStyle}>{item.code} · {walletModeLabel(item.walletMode)} · เกม {item._count?.games ?? 0}</p></div><div style={actionRowStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminButton tone="secondary" disabled={locked} onClick={() => void editProvider(item)}>จัดการ</AdminButton><AdminButton tone={item.status === 'ACTIVE' ? 'danger' : 'success'} disabled={locked} onClick={() => setPendingAction({ action: 'status', provider: item, status: item.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' })}>{item.status === 'ACTIVE' ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</AdminButton></div></AdminRow>)}{!locked && payload.items.length === 0 && <AdminEmpty>ยังไม่มีค่ายเกมตามตัวกรอง</AdminEmpty>}</AdminStack>
      {payload.total > 0 && <AdminPagination page={payload.page} totalPages={payload.totalPages} disabled={locked} onPrevious={() => list.setPage(payload.page - 1)} onNext={() => list.setPage(payload.page + 1)} />}
    </AdminCard>
    <AdminDrawer open={Boolean(detail)} title={detail ? `รายละเอียด ${detail.name}` : 'รายละเอียดค่าย'} description={detail ? `${detail.code} · ${walletModeLabel(detail.walletMode)}` : undefined} busy={locked} onClose={closeDetail}>
      {detail && <AdminStack><AdminToolbar><AdminButton disabled={locked} onClick={() => void testConnection()}>{busy === 'health' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</AdminButton><AdminButton tone="secondary" disabled={locked} onClick={() => setPendingAction({ action: 'sync', provider: detail })}>{busy === 'sync' ? 'กำลังซิงก์...' : 'ซิงก์รายชื่อเกม'}</AdminButton></AdminToolbar><AdminGrid><AdminCard title="ความพร้อม"><p>{readiness ? `ผ่าน ${readiness.passed} จาก ${readiness.total} รายการ` : 'ยังไม่มีผลตรวจ'}</p>{health?.payload && <AdminNotice tone={health.payload.status === 'ONLINE' ? 'success' : 'warning'}>{healthLabel(health.payload.status)} · {health.payload.latencyMs ?? '-'} ms</AdminNotice>}{syncResult && <AdminNotice tone="success">เพิ่ม {syncResult.created} · อัปเดต {syncResult.updated} · ข้าม {syncResult.skipped}</AdminNotice>}</AdminCard><AdminCard title="จำนวนรายการ"><AdminStack><AdminRow><strong>Endpoint</strong><span>{detail.endpoints?.length ?? 0}</span></AdminRow><AdminRow><strong>ข้อมูลเชื่อมต่อ</strong><span>{detail.credentials?.length ?? 0}</span></AdminRow></AdminStack></AdminCard></AdminGrid><ProviderDetailForms detail={detail} endpointForm={endpointForm} credentialForm={credentialForm} busy={locked} onEndpointChange={(key, value) => setEndpointForm((current) => ({ ...current, [key]: value }))} onCredentialChange={(key, value) => setCredentialForm((current) => ({ ...current, [key]: value }))} onEndpointSubmit={submitEndpoint} onCredentialSubmit={submitCredential} onEditEndpoint={(item) => setEndpointForm({ id: item.id, type: item.type, url: item.url, method: item.method, timeoutMs: String(item.timeoutMs), retryCount: String(item.retryCount), isEnabled: item.isEnabled })} onEditCredential={(item) => setCredentialForm({ id: item.id, type: item.type, value: '', isEnabled: item.isEnabled })} /></AdminStack>}
    </AdminDrawer>
    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction ? pendingTitle(pendingAction) : ''} description={pendingAction?.action === 'sync' ? 'ระบบจะขอรายชื่อเกมล่าสุดจากค่ายและอัปเดตคลังเกมเดิม' : 'ยืนยันการเปลี่ยนสถานะค่าย'} confirmLabel={pendingAction?.action === 'sync' ? 'ซิงก์เกม' : 'ยืนยัน'} tone={pendingAction?.status === 'MAINTENANCE' ? 'danger' : 'primary'} busy={busy === 'sync' || busy === 'status'} onCancel={() => { if (!locked) setPendingAction(null); }} onConfirm={() => void confirmPendingAction()} />
  </AdminPage>;
}

function ProviderForm({ form, busy, onChange, onSubmit }: { form: ProviderFormState; busy: boolean; onChange: <K extends keyof ProviderFormState>(key: K, value: ProviderFormState[K]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit} style={formStyle}><Field label="ชื่อค่าย"><input disabled={busy} value={form.name} onChange={(e) => onChange('name', e.target.value)} style={inputStyle} /></Field><Field label="รหัสค่าย"><input disabled={busy} value={form.code} onChange={(e) => onChange('code', e.target.value)} style={inputStyle} /></Field><Field label="URL โลโก้"><input disabled={busy} value={form.logoUrl} onChange={(e) => onChange('logoUrl', e.target.value)} style={inputStyle} /></Field><Field label="สถานะ"><select disabled={busy} value={form.status} onChange={(e) => onChange('status', e.target.value as ProviderStatus)} style={inputStyle}>{(['ACTIVE','INACTIVE','MAINTENANCE','DEGRADED'] as ProviderStatus[]).map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="รูปแบบกระเป๋า"><select disabled={busy} value={form.walletMode} onChange={(e) => onChange('walletMode', e.target.value as WalletMode)} style={inputStyle}><option value="TRANSFER">โยกเงินเข้าออก</option><option value="SEAMLESS">กระเป๋าเดียว</option><option value="HYBRID">ผสม</option></select></Field><Field label="สกุลเงิน"><input disabled={busy} value={form.currency} onChange={(e) => onChange('currency', e.target.value)} style={inputStyle} /></Field><Field label="เขตเวลา"><input disabled={busy} value={form.timezone} onChange={(e) => onChange('timezone', e.target.value)} style={inputStyle} /></Field><Field label="ลำดับ"><input disabled={busy} value={form.sortOrder} onChange={(e) => onChange('sortOrder', e.target.value)} style={inputStyle} /></Field><AdminButton type="submit" disabled={busy}>{busy ? 'กำลังบันทึก...' : form.id ? 'บันทึกค่าย' : 'เพิ่มค่าย'}</AdminButton></form>; }

function ProviderDetailForms({ detail, endpointForm, credentialForm, busy, onEndpointChange, onCredentialChange, onEndpointSubmit, onCredentialSubmit, onEditEndpoint, onEditCredential }: { detail: ProviderDetail; endpointForm: EndpointFormState; credentialForm: CredentialFormState; busy: boolean; onEndpointChange: <K extends keyof EndpointFormState>(key: K, value: EndpointFormState[K]) => void; onCredentialChange: <K extends keyof CredentialFormState>(key: K, value: CredentialFormState[K]) => void; onEndpointSubmit: (event: FormEvent<HTMLFormElement>) => void; onCredentialSubmit: (event: FormEvent<HTMLFormElement>) => void; onEditEndpoint: (item: ProviderEndpoint) => void; onEditCredential: (item: ProviderCredential) => void }) { return <AdminGrid><AdminCard title="Endpoint"><form onSubmit={onEndpointSubmit} style={formStyle}><Field label="ประเภท"><select disabled={busy} value={endpointForm.type} onChange={(e) => onEndpointChange('type', e.target.value as EndpointType)} style={inputStyle}>{endpointTypes.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="URL"><input disabled={busy} value={endpointForm.url} onChange={(e) => onEndpointChange('url', e.target.value)} style={inputStyle} /></Field><Field label="Method"><select disabled={busy} value={endpointForm.method} onChange={(e) => onEndpointChange('method', e.target.value)} style={inputStyle}><option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option></select></Field><Field label="Timeout"><input disabled={busy} value={endpointForm.timeoutMs} onChange={(e) => onEndpointChange('timeoutMs', e.target.value)} style={inputStyle} /></Field><Field label="Retry"><input disabled={busy} value={endpointForm.retryCount} onChange={(e) => onEndpointChange('retryCount', e.target.value)} style={inputStyle} /></Field><AdminButton type="submit" disabled={busy}>บันทึก Endpoint</AdminButton></form><AdminStack>{(detail.endpoints ?? []).map((item) => <AdminRow key={item.id}><span>{endpointLabel(item.type)} · {item.url}</span><AdminButton tone="secondary" disabled={busy} onClick={() => onEditEndpoint(item)}>แก้ไข</AdminButton></AdminRow>)}</AdminStack></AdminCard><AdminCard title="ข้อมูลเชื่อมต่อ"><form onSubmit={onCredentialSubmit} style={formStyle}><Field label="ประเภท"><select disabled={busy} value={credentialForm.type} onChange={(e) => onCredentialChange('type', e.target.value as CredentialType)} style={inputStyle}>{credentialTypes.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="ค่าใหม่"><input type="password" disabled={busy} value={credentialForm.value} onChange={(e) => onCredentialChange('value', e.target.value)} style={inputStyle} /></Field><AdminButton type="submit" disabled={busy}>บันทึกข้อมูลเชื่อมต่อ</AdminButton></form><AdminStack>{(detail.credentials ?? []).map((item) => <AdminRow key={item.id}><span>{credentialLabel(item.type)} · {item.maskedValue}</span><AdminButton tone="secondary" disabled={busy} onClick={() => onEditCredential(item)}>แก้ไข</AdminButton></AdminRow>)}</AdminStack></AdminCard></AdminGrid>; }

function Field({ label, children }: { label: string; children: ReactNode }) { return <label style={labelStyle}><span>{label}</span>{children}</label>; }
function Filter({ label, children }: { label: string; children: ReactNode }) { return <label style={filterLabelStyle}><span>{label}</span>{children}</label>; }
function pendingTitle(action: PendingAction) { return action.action === 'sync' ? `ซิงก์เกมจาก ${action.provider.name}` : `${action.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} ${action.provider.name}`; }
function statusLabel(status: ProviderStatus) { return ({ ACTIVE: 'เปิดใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'ประสิทธิภาพลดลง' } as Record<ProviderStatus, string>)[status]; }
function statusTone(status: ProviderStatus) { return status === 'ACTIVE' ? 'success' : status === 'MAINTENANCE' || status === 'DEGRADED' ? 'warning' : 'neutral'; }
function walletModeLabel(mode: WalletMode) { return ({ TRANSFER: 'โยกเงินเข้าออก', SEAMLESS: 'กระเป๋าเดียว', HYBRID: 'แบบผสม' } as Record<WalletMode, string>)[mode]; }
function healthLabel(status: 'ONLINE' | 'OFFLINE' | 'DEGRADED') { return ({ ONLINE: 'เชื่อมต่อปกติ', OFFLINE: 'เชื่อมต่อไม่ได้', DEGRADED: 'เชื่อมต่อช้าหรือไม่สมบูรณ์' } as const)[status]; }
function endpointLabel(type: EndpointType) { return ({ LAUNCH: 'เปิดเกม', BALANCE: 'ตรวจยอด', TRANSFER_IN: 'โยกเงินเข้า', TRANSFER_OUT: 'โยกเงินออก', GAME_LIST: 'รายชื่อเกม', BET_HISTORY: 'ประวัติเดิมพัน', WEBHOOK: 'Webhook', HEALTH_CHECK: 'ตรวจสุขภาพระบบ' } as Record<EndpointType, string>)[type]; }
function credentialLabel(type: CredentialType) { return ({ API_KEY: 'API Key', SECRET_KEY: 'Secret Key', MERCHANT_ID: 'Merchant ID', AGENT_ID: 'Agent ID', WEBHOOK_SECRET: 'Webhook Secret', TOKEN: 'Token' } as Record<CredentialType, string>)[type]; }
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, alignItems: 'end', minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#cbd5e1', fontWeight: 800, minWidth: 0 } as const;
const filterLabelStyle = { ...labelStyle, minWidth: 'min(100%, 190px)' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;