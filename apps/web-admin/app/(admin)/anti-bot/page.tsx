'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type Provider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
type Routes = { ADMIN_LOGIN: boolean; MEMBER_LOGIN: boolean; MEMBER_REGISTER: boolean };
type Config = { enabled: boolean; provider: Provider; siteKey: string; secretConfigured: boolean; routes: Routes; adaptiveMode: boolean; emergencyMode: boolean };
type BusyKey = '' | 'load' | 'save' | 'test';

const EMPTY_CONFIG: Config = { enabled: false, provider: 'TURNSTILE', siteKey: '', secretConfigured: false, routes: { ADMIN_LOGIN: false, MEMBER_LOGIN: false, MEMBER_REGISTER: false }, adaptiveMode: true, emergencyMode: false };

export default function AntiBotPage() {
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [secret, setSecret] = useState('');
  const [testToken, setTestToken] = useState('');
  const [message, setMessage] = useState('กำลังโหลดการตั้งค่า Anti-bot...');
  const [busyKey, setBusyKey] = useState<BusyKey>('');
  const [providerTested, setProviderTested] = useState(false);
  const [credentialsDirty, setCredentialsDirty] = useState(false);

  useEffect(() => { void load(); }, []);

  const saving = Boolean(busyKey);
  const hasSiteKey = Boolean(config.siteKey.trim());
  const hasSecret = config.secretConfigured || Boolean(secret.trim());
  const hasProtectedRoute = Object.values(config.routes).some(Boolean);
  const providerReady = providerTested || (config.enabled && config.secretConfigured && !credentialsDirty);
  const readyToEnable = hasSiteKey && hasSecret && hasProtectedRoute && providerReady;
  const readiness = useMemo(() => [hasSiteKey, hasSecret, hasProtectedRoute, providerReady].filter(Boolean).length, [hasProtectedRoute, hasSecret, hasSiteKey, providerReady]);
  const savedProviderConfig = hasSiteKey && config.secretConfigured && !credentialsDirty;

  async function load() {
    if (busyKey) return;
    setBusyKey('load');
    setMessage('กำลังโหลดการตั้งค่า Anti-bot...');
    try {
      const response = await adminApiFetch('/admin/security/anti-bot');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isConfig(payload)) throw new Error('load');
      setConfig(payload);
      setSecret('');
      setTestToken('');
      setProviderTested(false);
      setCredentialsDirty(false);
      setMessage('');
    } catch {
      setMessage('โหลดการตั้งค่า Anti-bot ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function save() {
    if (busyKey) return;
    if (config.enabled && !readyToEnable) { setMessage('ยังเปิดใช้ไม่ได้ กรุณาตั้งค่า key, route และทดสอบ provider ให้ครบ'); return; }
    setBusyKey('save');
    setMessage('');
    try {
      const response = await adminApiFetch('/admin/security/anti-bot', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...config, secret: secret.trim() || undefined }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isConfig(payload)) throw new Error('save');
      setConfig(payload);
      setSecret('');
      setCredentialsDirty(false);
      setMessage('บันทึกการตั้งค่า Anti-bot แล้ว');
    } catch {
      setMessage('บันทึกการตั้งค่า Anti-bot ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function testProvider() {
    if (busyKey) return;
    if (!testToken.trim()) { setMessage('กรอก CAPTCHA response token สำหรับทดสอบก่อน'); return; }
    if (!savedProviderConfig) { setMessage('บันทึก Provider, Site key และ Secret ก่อนทดสอบ'); return; }
    setBusyKey('test');
    setMessage('กำลังทดสอบ provider...');
    setProviderTested(false);
    try {
      const response = await adminApiFetch('/admin/security/anti-bot/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: testToken.trim() }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isTestResult(payload) || !payload.success) throw new Error('test');
      setProviderTested(true);
      setTestToken('');
      setMessage('ทดสอบ provider สำเร็จ');
    } catch {
      setMessage('ทดสอบ provider ไม่ผ่าน กรุณาตรวจ key, token และสถานะ provider');
    } finally {
      setBusyKey('');
    }
  }

  function setRoute(key: keyof Routes, value: boolean) {
    if (saving) return;
    setConfig((current) => ({ ...current, routes: { ...current.routes, [key]: value } }));
  }

  function setProvider(value: Provider) {
    if (saving) return;
    setConfig((current) => ({ ...current, provider: value }));
    setCredentialsDirty(true);
    setProviderTested(false);
  }

  function setSiteKey(value: string) {
    if (saving) return;
    setConfig((current) => ({ ...current, siteKey: value }));
    setCredentialsDirty(true);
    setProviderTested(false);
  }

  function setSecretValue(value: string) {
    if (saving) return;
    setSecret(value);
    setCredentialsDirty(true);
    setProviderTested(false);
  }

  function toggleEnabled(value: boolean) {
    if (saving) return;
    if (value && !readyToEnable) { setMessage('ยังเปิดใช้ไม่ได้ กรุณาทำ Setup Checklist ให้ครบ'); return; }
    setConfig((current) => ({ ...current, enabled: value }));
  }

  return <AdminPage eyebrow="Security" title="CAPTCHA / Anti-bot" description="ตั้งค่าการป้องกัน bot แบบเป็นขั้นตอน โดยไม่เปิด route ก่อนระบบพร้อม" actions={<AdminButton type="button" tone="secondary" disabled={saving} onClick={() => void load()}>{busyKey === 'load' ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <div className="admin-antibot">
      {message && <AdminNotice tone={messageTone(message)}>{message}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title="Setup progress" value={`${readiness}/4`} helper="Key, Secret, Route, Test" tone={readiness === 4 ? 'success' : 'warning'} />
        <AdminMetric title="Provider" value={config.provider} />
        <AdminMetric title="Protected routes" value={String(Object.values(config.routes).filter(Boolean).length)} tone={hasProtectedRoute ? 'success' : 'warning'} />
        <AdminMetric title="Status" value={config.enabled ? 'ENABLED' : 'DISABLED'} tone={config.enabled ? 'success' : 'warning'} />
      </AdminMetricGrid>

      <div className="admin-antibot-progress" role="progressbar" aria-label="Anti-bot setup progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={readiness}><span style={{ width: `${readiness * 25}%` }} /></div>

      <AdminCard title="Setup Checklist" description="ทำตามลำดับก่อนเปิดใช้งานจริง">
        <AdminStack>
          <Step number="1" title="เลือก Provider และใส่ Site key" done={hasSiteKey} />
          <Step number="2" title="ตั้งค่า Secret key และบันทึก" done={config.secretConfigured && !credentialsDirty} />
          <Step number="3" title="เลือก Route ที่ต้องป้องกัน" done={hasProtectedRoute} />
          <Step number="4" title="ทดสอบ Provider ด้วย token จริง" done={providerReady} />
        </AdminStack>
      </AdminCard>

      <AdminCard title="สถานะ" description="ระบบจะไม่ยอมเปิดจนกว่า Setup Checklist จะครบ">
        <AdminStack>
          <div className="admin-antibot-status-row"><span>ระบบ Anti-bot</span><span /><AdminBadge tone={config.enabled ? 'success' : 'warning'}>{config.enabled ? 'ENABLED' : 'DISABLED'}</AdminBadge></div>
          <label className="admin-antibot-check"><input type="checkbox" checked={config.enabled} onChange={(event) => toggleEnabled(event.target.checked)} disabled={saving || (!config.enabled && !readyToEnable)} /><span>เปิดใช้งาน Anti-bot</span></label>
          {!readyToEnable && !config.enabled && <small className="admin-antibot-hint">ปุ่มเปิดใช้จะพร้อมเมื่อ Key, Secret, Route และ Provider Test ผ่านครบ</small>}
          <label className="admin-antibot-check"><input type="checkbox" checked={config.adaptiveMode} onChange={(event) => setConfig((current) => ({ ...current, adaptiveMode: event.target.checked }))} disabled={saving} /><span>Adaptive challenge</span></label>
          <label className="admin-antibot-check"><input type="checkbox" checked={config.emergencyMode} onChange={(event) => setConfig((current) => ({ ...current, emergencyMode: event.target.checked }))} disabled={saving} /><span>Emergency mode</span></label>
        </AdminStack>
      </AdminCard>

      <AdminCard title="Provider" description="รองรับ Cloudflare Turnstile, Google reCAPTCHA และ hCaptcha">
        <div className="admin-antibot-grid">
          <label className="admin-antibot-field"><span>Provider</span><select value={config.provider} onChange={(event) => setProvider(event.target.value as Provider)} disabled={saving}><option value="TURNSTILE">Cloudflare Turnstile</option><option value="RECAPTCHA">Google reCAPTCHA</option><option value="HCAPTCHA">hCaptcha</option></select></label>
          <label className="admin-antibot-field"><span>Site key</span><input value={config.siteKey} onChange={(event) => setSiteKey(event.target.value)} autoComplete="off" disabled={saving} /></label>
          <label className="admin-antibot-field"><span>Secret key</span><input value={secret} onChange={(event) => setSecretValue(event.target.value)} placeholder={config.secretConfigured ? 'ตั้งค่าแล้ว ••••••••' : 'ยังไม่ได้ตั้งค่า'} type="password" autoComplete="new-password" disabled={saving} /></label>
        </div>
        {credentialsDirty && <small className="admin-antibot-hint">มีการเปลี่ยน Provider หรือ key กรุณาบันทึกก่อนทดสอบ</small>}
      </AdminCard>

      <AdminCard title="Route ที่ป้องกัน" description="เลือกอย่างน้อยหนึ่ง route ก่อนเปิดใช้งาน">
        <div className="admin-antibot-grid">
          <label className="admin-antibot-check"><input type="checkbox" checked={config.routes.ADMIN_LOGIN} onChange={(event) => setRoute('ADMIN_LOGIN', event.target.checked)} disabled={saving} /><span>Admin Login</span></label>
          <label className="admin-antibot-check"><input type="checkbox" checked={config.routes.MEMBER_LOGIN} onChange={(event) => setRoute('MEMBER_LOGIN', event.target.checked)} disabled={saving} /><span>Member Login</span></label>
          <label className="admin-antibot-check"><input type="checkbox" checked={config.routes.MEMBER_REGISTER} onChange={(event) => setRoute('MEMBER_REGISTER', event.target.checked)} disabled={saving} /><span>Member Register</span></label>
        </div>
      </AdminCard>

      <AdminCard title="ทดสอบ Provider" description="ใช้ response token จริงเพื่อยืนยัน Secret ที่บันทึกแล้ว โดยไม่เปิด route ก่อน">
        <div className="admin-antibot-grid"><label className="admin-antibot-field"><span>Response token</span><input value={testToken} onChange={(event) => setTestToken(event.target.value)} placeholder="CAPTCHA response token" disabled={saving} /></label><AdminButton type="button" tone="secondary" onClick={() => void testProvider()} disabled={saving || !savedProviderConfig}>{busyKey === 'test' ? 'กำลังทดสอบ...' : 'ทดสอบ'}</AdminButton></div>
      </AdminCard>

      <div className="admin-antibot-actions"><AdminButton type="button" onClick={() => void save()} disabled={saving}>{busyKey === 'save' ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</AdminButton></div>
    </div>
  </AdminPage>;
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isProvider(value: unknown): value is Provider { return value === 'TURNSTILE' || value === 'RECAPTCHA' || value === 'HCAPTCHA'; }
function isRoutes(value: unknown): value is Routes { return isRecord(value) && typeof value.ADMIN_LOGIN === 'boolean' && typeof value.MEMBER_LOGIN === 'boolean' && typeof value.MEMBER_REGISTER === 'boolean'; }
function isConfig(value: unknown): value is Config { return isRecord(value) && typeof value.enabled === 'boolean' && isProvider(value.provider) && typeof value.siteKey === 'string' && typeof value.secretConfigured === 'boolean' && isRoutes(value.routes) && typeof value.adaptiveMode === 'boolean' && typeof value.emergencyMode === 'boolean'; }
function isTestResult(value: unknown): value is { success: boolean } { return isRecord(value) && typeof value.success === 'boolean'; }
function messageTone(message: string): 'neutral' | 'success' | 'warning' | 'danger' { if (message.includes('สำเร็จ') || message.includes('แล้ว')) return 'success'; if (message.includes('ไม่สำเร็จ') || message.includes('ไม่ผ่าน')) return 'danger'; if (message.includes('ยัง') || message.includes('กรุณา')) return 'warning'; return 'neutral'; }
function Step({ number, title, done }: { number: string; title: string; done: boolean }) { return <div className="admin-antibot-step" data-complete={done || undefined}><span className="admin-antibot-step__number">{number}</span><span className="admin-antibot-step__copy">{title}</span><AdminBadge tone={done ? 'success' : 'warning'}>{done ? 'พร้อม' : 'ยังไม่ครบ'}</AdminBadge></div>; }