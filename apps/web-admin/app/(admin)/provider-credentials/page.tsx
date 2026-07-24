'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
} from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string; metadata?: unknown };
type Credential = { id: string; type: string; maskedValue: string; isEnabled: boolean; rotatedAt?: string | null; createdAt: string; updatedAt: string };
type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type SafeTestResult = { provider: string; status: 'SUCCESS' | 'FAILED'; httpStatus: string; latency: string; testedAt: string };
type ProviderEnvironment = 'PRODUCTION' | 'UAT' | 'DEMO';
type EnvironmentFilter = 'ALL' | ProviderEnvironment;
type PendingAction =
  | { type: 'rotate'; providerId: string; credential: Credential }
  | { type: 'toggle'; providerId: string; credential: Credential }
  | { type: 'test-production'; providerId: string; providerName: string }
  | null;

export default function ProviderCredentialsPage() {
  const credentialRequestRef = useRef(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [items, setItems] = useState<Credential[]>([]);
  const [message, setMessage] = useState('กำลังโหลด API Key...');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [testResult, setTestResult] = useState<SafeTestResult | null>(null);
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentFilter>('ALL');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rotationValue, setRotationValue] = useState('');

  const showMessage = useCallback((nextMessage: string, tone: NoticeTone = 'neutral') => {
    setMessage(nextMessage);
    setMessageTone(tone);
  }, []);

  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    showMessage('กำลังโหลดค่าย...', 'neutral');
    try {
      const response = await adminApiFetch('/admin/game-providers');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('providers');
      const rows = payload.items.filter(isProvider);
      setProviders(rows);
      setProviderId((current) => current && rows.some((item) => item.id === current) ? current : rows[0]?.id ?? '');
      showMessage(rows.length ? '' : 'ยังไม่มีค่ายสำหรับตั้งค่า API Key', rows.length ? 'neutral' : 'warning');
    } catch {
      setProviders([]);
      setProviderId('');
      setItems([]);
      showMessage('โหลดค่ายเกมไม่สำเร็จ กรุณาลองใหม่', 'danger');
    } finally {
      setLoadingProviders(false);
    }
  }, [showMessage]);

  const loadCredentials = useCallback(async (id: string) => {
    if (!id) {
      setItems([]);
      return;
    }
    const requestId = credentialRequestRef.current + 1;
    credentialRequestRef.current = requestId;
    setLoadingCredentials(true);
    showMessage('กำลังโหลด API Key...', 'neutral');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${encodeURIComponent(id)}/credentials`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('credentials');
      if (credentialRequestRef.current !== requestId) return;
      setItems(payload.items.filter(isCredential));
      showMessage('');
    } catch {
      if (credentialRequestRef.current !== requestId) return;
      setItems([]);
      showMessage('โหลด API Key ไม่สำเร็จ กรุณาลองใหม่', 'danger');
    } finally {
      if (credentialRequestRef.current === requestId) setLoadingCredentials(false);
    }
  }, [showMessage]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    setItems([]);
    setTestResult(null);
    setPendingAction(null);
    setRotationValue('');
    void loadCredentials(providerId);
  }, [loadCredentials, providerId]);

  const visibleProviders = useMemo(
    () => providers.filter((item) => environmentFilter === 'ALL' || providerEnvironment(item) === environmentFilter),
    [environmentFilter, providers],
  );
  const selectedProvider = providers.find((item) => item.id === providerId);
  const enabled = items.filter((item) => item.isEnabled).length;
  const placeholders = items.filter(isPlaceholder).length;
  const stale = items.filter((item) => isOlderThanDays(item.rotatedAt, 90)).length;
  const pageBusy = loadingProviders || loadingCredentials || Boolean(busyKey);

  function selectEnvironment(next: EnvironmentFilter) {
    if (pageBusy) return;
    setEnvironmentFilter(next);
    const available = providers.filter((item) => next === 'ALL' || providerEnvironment(item) === next);
    const currentStillVisible = available.some((item) => item.id === providerId);
    const nextProviderId = currentStillVisible ? providerId : available[0]?.id ?? '';
    setProviderId(nextProviderId);
    setItems([]);
    setTestResult(null);
    showMessage(available.length ? '' : `ยังไม่มีค่าย${environmentLabel(next)}`, available.length ? 'neutral' : 'warning');
  }

  function requestRotate(item: Credential) {
    if (pageBusy || !providerId) return;
    setRotationValue('');
    setPendingAction({ type: 'rotate', providerId, credential: item });
  }

  function requestToggle(item: Credential) {
    if (pageBusy || !providerId) return;
    setPendingAction({ type: 'toggle', providerId, credential: item });
  }

  function requestProviderTest() {
    if (pageBusy || !selectedProvider) return;
    if (providerEnvironment(selectedProvider) === 'PRODUCTION') {
      setPendingAction({ type: 'test-production', providerId: selectedProvider.id, providerName: selectedProvider.name });
      return;
    }
    void testProvider(selectedProvider.id, selectedProvider.name);
  }

  async function executePendingAction() {
    const action = pendingAction;
    if (!action || pageBusy || action.providerId !== providerId) return;
    if (action.type === 'rotate') {
      const value = rotationValue.trim();
      if (value.length < 4 || value.length > 4096) {
        showMessage('ค่าใหม่ต้องมีความยาว 4 ถึง 4,096 ตัวอักษร', 'danger');
        return;
      }
      await rotateCredential(action.providerId, action.credential, value);
      return;
    }
    if (action.type === 'toggle') {
      await toggleCredential(action.providerId, action.credential);
      return;
    }
    await testProvider(action.providerId, action.providerName);
  }

  async function rotateCredential(targetProviderId: string, item: Credential, value: string) {
    const key = `rotate:${item.id}`;
    setBusyKey(key);
    showMessage(`กำลังเปลี่ยน ${credentialLabel(item.type)}...`, 'neutral');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${encodeURIComponent(targetProviderId)}/credentials/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, isEnabled: true }),
      });
      await response.json().catch(() => null);
      if (!response.ok) throw new Error('rotate');
      setPendingAction(null);
      setRotationValue('');
      showMessage(`เปลี่ยน ${credentialLabel(item.type)} แล้ว`, 'success');
      await loadCredentials(targetProviderId);
    } catch {
      showMessage('เปลี่ยน API Key ไม่สำเร็จ กรุณาลองใหม่', 'danger');
    } finally {
      setBusyKey('');
    }
  }

  async function toggleCredential(targetProviderId: string, item: Credential) {
    const key = `toggle:${item.id}`;
    setBusyKey(key);
    showMessage(`กำลัง${item.isEnabled ? 'ปิด' : 'เปิดใช้'} ${credentialLabel(item.type)}...`, 'neutral');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${encodeURIComponent(targetProviderId)}/credentials/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !item.isEnabled }),
      });
      await response.json().catch(() => null);
      if (!response.ok) throw new Error('toggle');
      setPendingAction(null);
      showMessage(`${item.isEnabled ? 'ปิด' : 'เปิดใช้'} ${credentialLabel(item.type)} แล้ว`, item.isEnabled ? 'warning' : 'success');
      await loadCredentials(targetProviderId);
    } catch {
      showMessage('บันทึกสถานะ API Key ไม่สำเร็จ กรุณาลองใหม่', 'danger');
    } finally {
      setBusyKey('');
    }
  }

  async function testProvider(targetProviderId: string, providerName: string) {
    setBusyKey('test-provider');
    setPendingAction(null);
    showMessage('กำลังทดสอบการเชื่อมต่อ...', 'neutral');
    const startedAt = performance.now();
    try {
      const response = await adminApiFetch(`/admin/game-providers/${encodeURIComponent(targetProviderId)}/health-check`, { method: 'POST' });
      await response.json().catch(() => null);
      const result = safeTestResult(response.ok, response.status, performance.now() - startedAt, providerName);
      setTestResult(result);
      showMessage(response.ok ? 'ทดสอบการเชื่อมต่อสำเร็จ' : 'ทดสอบการเชื่อมต่อไม่สำเร็จ', response.ok ? 'success' : 'danger');
    } catch {
      setTestResult(safeTestResult(false, 0, performance.now() - startedAt, providerName));
      showMessage('เชื่อมต่อระบบทดสอบค่ายเกมไม่สำเร็จ', 'danger');
    } finally {
      setBusyKey('');
    }
  }

  const confirmation = pendingAction ? confirmationFor(pendingAction) : null;

  return <AdminPage
    eyebrow="ตั้งค่าค่ายเกม"
    title="API Key / Secret"
    description="เก็บค่าแบบปิดบัง แยกตามสภาพแวดล้อม"
    actions={<>
      <AdminButton onClick={requestProviderTest} disabled={pageBusy || !providerId}>ทดสอบการเชื่อมต่อ</AdminButton>
      <AdminLinkButton href="/simple-game-settings">กลับตั้งค่าง่าย</AdminLinkButton>
    </>}
  >
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="ทั้งหมด" value={String(items.length)} helper="ค่าที่บันทึกไว้" />
      <AdminMetric title="เปิดใช้" value={String(enabled)} helper="ระบบนำไปใช้ได้" />
      <AdminMetric title="ปิดอยู่" value={String(items.length - enabled)} helper="ระบบไม่ใช้" />
      <AdminMetric title="ข้อมูลเก่า" value={String(placeholders)} helper="ต้องแก้ก่อนใช้จริง" tone={placeholders ? 'danger' : 'neutral'} />
      <AdminMetric title="นานเกิน 90 วัน" value={String(stale)} helper="ควรตรวจ" tone={stale ? 'warning' : 'neutral'} />
    </AdminMetricGrid>

    <AdminCard title="สภาพแวดล้อม" description="Production ใช้จริง, UAT ทดสอบ, Demo จำลอง">
      <div style={actionRowStyle} role="group" aria-label="เลือกสภาพแวดล้อม">
        {(['ALL', 'PRODUCTION', 'UAT', 'DEMO'] as const).map((environment) => <AdminButton
          key={environment}
          tone={environmentFilter === environment ? 'primary' : 'secondary'}
          disabled={pageBusy}
          onClick={() => selectEnvironment(environment)}
        >{environmentLabel(environment)}</AdminButton>)}
      </div>
    </AdminCard>

    <AdminCard
      title="เลือกค่าย"
      action={selectedProvider ? <AdminBadge tone={environmentTone(providerEnvironment(selectedProvider))}>{environmentLabel(providerEnvironment(selectedProvider))}</AdminBadge> : undefined}
    >
      <select
        value={providerId}
        onChange={(event) => setProviderId(event.target.value)}
        style={inputStyle}
        disabled={pageBusy || !visibleProviders.length}
      >
        {visibleProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code}) · {environmentLabel(providerEnvironment(provider))}</option>)}
      </select>
      {!visibleProviders.length && <AdminEmpty>ยังไม่มีค่าย{environmentLabel(environmentFilter)}</AdminEmpty>}
    </AdminCard>

    {placeholders > 0 && <AdminNotice tone="danger">พบ credential เก่าที่เป็น placeholder ให้เปลี่ยนก่อนใช้จริง</AdminNotice>}
    {stale > 0 && <AdminNotice tone="warning">มีค่าที่ไม่ได้เปลี่ยนเกิน 90 วันแล้ว ควรตรวจรอบเปลี่ยนคีย์เพื่อความปลอดภัย</AdminNotice>}

    <AdminStack>
      {items.map((item) => <AdminCard
        key={item.id}
        title={credentialLabel(item.type)}
        description={`เปลี่ยนล่าสุด: ${formatDate(item.rotatedAt)}`}
      >
        <AdminRow>
          <div>
            <strong>{safeMaskedValue(item.maskedValue)}</strong>
            <p style={mutedStyle}>อัปเดต {formatDate(item.updatedAt)}</p>
          </div>
          <div style={actionRowStyle}>
            <AdminBadge tone={item.isEnabled ? 'success' : 'danger'}>{item.isEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge>
            {isPlaceholder(item) && <AdminBadge tone="warning">ตัวอย่าง</AdminBadge>}
          </div>
        </AdminRow>
        <div style={actionRowStyle}>
          <AdminButton onClick={() => requestRotate(item)} disabled={pageBusy}>เปลี่ยนค่า</AdminButton>
          <AdminButton tone="secondary" onClick={() => requestToggle(item)} disabled={pageBusy}>{item.isEnabled ? 'ปิด' : 'เปิดใช้'}</AdminButton>
        </div>
      </AdminCard>)}
      {!loadingCredentials && items.length === 0 && <AdminEmpty>ยังไม่มี API Key / Secret</AdminEmpty>}
    </AdminStack>

    {testResult && <AdminCard title="ผลทดสอบ API" description="แสดงเฉพาะข้อมูลที่ปลอดภัย ไม่แสดง secret หรือ payload จากค่าย">
      <AdminStack>
        <AdminRow><strong>ค่าย</strong><span>{testResult.provider}</span></AdminRow>
        <AdminRow><strong>สถานะ</strong><AdminBadge tone={testResult.status === 'SUCCESS' ? 'success' : 'danger'}>{testResult.status === 'SUCCESS' ? 'สำเร็จ' : 'ไม่สำเร็จ'}</AdminBadge></AdminRow>
        <AdminRow><strong>HTTP status</strong><span>{testResult.httpStatus}</span></AdminRow>
        <AdminRow><strong>Latency</strong><span>{testResult.latency}</span></AdminRow>
        <AdminRow><strong>ทดสอบเมื่อ</strong><span>{testResult.testedAt}</span></AdminRow>
      </AdminStack>
    </AdminCard>}

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={confirmation?.title ?? 'ยืนยันการเปลี่ยน Credential'}
      description={confirmation?.description ?? 'ตรวจสอบข้อมูลก่อนดำเนินการ'}
      confirmLabel={confirmation?.label ?? 'ยืนยัน'}
      tone={confirmation?.tone ?? 'primary'}
      busy={Boolean(busyKey)}
      onCancel={() => { if (!busyKey) { setPendingAction(null); setRotationValue(''); } }}
      onConfirm={() => void executePendingAction()}
      details={pendingAction?.type === 'rotate' ? <label style={fieldStyle}>ค่าใหม่
        <input
          type="password"
          value={rotationValue}
          onChange={(event) => setRotationValue(event.target.value)}
          autoComplete="new-password"
          maxLength={4096}
          placeholder={`ค่าใหม่สำหรับ ${credentialLabel(pendingAction.credential.type)}`}
          style={inputStyle}
          disabled={Boolean(busyKey)}
        />
      </label> : null}
    />
  </AdminPage>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isProvider(value: unknown): value is Provider {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.code === 'string'
    && typeof value.status === 'string';
}

function isCredential(value: unknown): value is Credential {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.type === 'string'
    && typeof value.maskedValue === 'string'
    && typeof value.isEnabled === 'boolean'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string';
}

function providerEnvironment(provider: Provider): ProviderEnvironment {
  const metadata = isRecord(provider.metadata) ? provider.metadata : {};
  const declared = typeof metadata.environment === 'string' ? metadata.environment.toUpperCase() : '';
  if (declared === 'PRODUCTION' || declared === 'UAT' || declared === 'DEMO') return declared;
  if (provider.code.toLowerCase().endsWith('-uat')) return 'UAT';
  if (provider.code.toLowerCase().startsWith('demo-') || provider.code.toLowerCase().startsWith('simulator-')) return 'DEMO';
  return 'PRODUCTION';
}

function environmentLabel(environment: EnvironmentFilter) {
  const labels: Record<EnvironmentFilter, string> = { ALL: 'ทั้งหมด', PRODUCTION: 'Production', UAT: 'UAT', DEMO: 'Demo' };
  return labels[environment];
}

function environmentTone(environment: ProviderEnvironment) {
  return environment === 'PRODUCTION' ? 'danger' : environment === 'UAT' ? 'warning' : 'success';
}

function credentialLabel(type: string) {
  const map: Record<string, string> = {
    API_KEY: 'API Key',
    SECRET_KEY: 'Secret Key',
    MERCHANT_ID: 'Merchant ID',
    AGENT_ID: 'Agent ID',
    WEBHOOK_SECRET: 'Webhook Secret',
    TOKEN: 'Token',
  };
  return map[type] ?? type;
}

function isPlaceholder(item: Credential) {
  const value = item.maskedValue.toLowerCase();
  return value.includes('todo') || value.includes('placeholder');
}

function safeMaskedValue(value: string) {
  if (value.toLowerCase().includes('todo') || value.toLowerCase().includes('placeholder')) return value.slice(0, 80);
  if (/[*•]{3,}/.test(value)) return value.slice(0, 120);
  return '••••••••';
}

function isOlderThanDays(value: string | null | undefined, days: number) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}

function safeTestResult(ok: boolean, httpStatus: number, elapsedMs: number, provider?: string): SafeTestResult {
  return {
    provider: provider || '-',
    status: ok ? 'SUCCESS' : 'FAILED',
    httpStatus: httpStatus > 0 ? String(httpStatus) : '-',
    latency: `${Math.max(0, Math.round(elapsedMs)).toLocaleString('th-TH')} ms`,
    testedAt: new Date().toLocaleString('th-TH'),
  };
}

function confirmationFor(action: Exclude<PendingAction, null>) {
  if (action.type === 'rotate') return {
    title: `เปลี่ยน ${credentialLabel(action.credential.type)}`,
    description: 'ค่าเดิมจะถูกแทนที่และไม่สามารถเรียกกลับมาแสดงได้',
    label: 'เปลี่ยนค่า',
    tone: 'danger' as const,
  };
  if (action.type === 'toggle') return {
    title: `${action.credential.isEnabled ? 'ปิด' : 'เปิดใช้'} ${credentialLabel(action.credential.type)}`,
    description: action.credential.isEnabled ? 'การปิดค่านี้อาจทำให้ API ของค่ายใช้งานไม่ได้' : 'ระบบจะเริ่มนำค่านี้ไปใช้กับการเชื่อมต่อค่าย',
    label: action.credential.isEnabled ? 'ยืนยันปิด' : 'ยืนยันเปิดใช้',
    tone: action.credential.isEnabled ? 'danger' as const : 'primary' as const,
  };
  return {
    title: 'ทดสอบ Production Provider',
    description: `ทดสอบ health check ของ ${action.providerName} โดยไม่ทำรายการเงิน`,
    label: 'เริ่มทดสอบ',
    tone: 'danger' as const,
  };
}

const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const fieldStyle = { display: 'grid', gap: 8, color: '#cbd5e1', fontWeight: 800 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' as const };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
