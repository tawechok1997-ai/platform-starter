'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type Provider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
type Config = { enabled: boolean; provider: Provider; siteKey: string; secretConfigured: boolean; routes: { ADMIN_LOGIN: boolean; MEMBER_LOGIN: boolean; MEMBER_REGISTER: boolean }; adaptiveMode: boolean; emergencyMode: boolean };

const EMPTY_CONFIG: Config = { enabled: false, provider: 'TURNSTILE', siteKey: '', secretConfigured: false, routes: { ADMIN_LOGIN: false, MEMBER_LOGIN: false, MEMBER_REGISTER: false }, adaptiveMode: true, emergencyMode: false };

export default function AntiBotPage() {
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [secret, setSecret] = useState('');
  const [testToken, setTestToken] = useState('');
  const [message, setMessage] = useState('กำลังโหลดการตั้งค่า Anti-bot...');
  const [saving, setSaving] = useState(false);
  const [providerTested, setProviderTested] = useState(false);

  useEffect(() => { void load(); }, []);

  const hasSiteKey = Boolean(config.siteKey.trim());
  const hasSecret = config.secretConfigured || Boolean(secret.trim());
  const hasProtectedRoute = Object.values(config.routes).some(Boolean);
  const readyToEnable = hasSiteKey && hasSecret && hasProtectedRoute && providerTested;
  const readiness = useMemo(() => [hasSiteKey, hasSecret, hasProtectedRoute, providerTested].filter(Boolean).length, [hasProtectedRoute, hasSecret, hasSiteKey, providerTested]);

  async function load() {
    try {
      const response = await adminApiFetch('/admin/security/anti-bot');
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage('โหลดการตั้งค่า Anti-bot ไม่สำเร็จ'); return; }
      setConfig(payload);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบ Anti-bot ไม่สำเร็จ');
    }
  }

  async function save() {
    if (config.enabled && !readyToEnable) { setMessage('ยังเปิดใช้ไม่ได้ กรุณาตั้งค่า key, route และทดสอบ provider ให้ครบ'); return; }
    setSaving(true); setMessage('');
    try {
      const response = await adminApiFetch('/admin/security/anti-bot', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...config, secret: secret.trim() || undefined }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage('บันทึกการตั้งค่าไม่สำเร็จ'); return; }
      setConfig(payload); setSecret(''); setMessage('บันทึกการตั้งค่า Anti-bot แล้ว');
    } catch {
      setMessage('เชื่อมต่อระบบ Anti-bot ไม่สำเร็จ');
    } finally { setSaving(false); }
  }

  async function testProvider() {
    if (!testToken.trim()) { setMessage('กรอก CAPTCHA response token สำหรับทดสอบก่อน'); return; }
    if (!hasSiteKey || !hasSecret) { setMessage('ตั้งค่า Site key และ Secret ก่อนทดสอบ provider'); return; }
    setSaving(true); setMessage('กำลังทดสอบ provider...'); setProviderTested(false);
    try {
      const response = await adminApiFetch('/admin/security/anti-bot/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: testToken.trim() }) });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.success) { setProviderTested(true); setMessage('ทดสอบ provider สำเร็จ'); }
      else setMessage('ทดสอบ provider ไม่ผ่าน กรุณาตรวจ key และ token');
    } catch {
      setMessage('เชื่อมต่อ provider ไม่สำเร็จ');
    } finally { setSaving(false); }
  }

  function setRoute(key: keyof Config['routes'], value: boolean) { setConfig((current) => ({ ...current, routes: { ...current.routes, [key]: value } })); }
  function toggleEnabled(value: boolean) { if (value && !readyToEnable) { setMessage('ยังเปิดใช้ไม่ได้ กรุณาทำ Setup Checklist ให้ครบ'); return; } setConfig((current) => ({ ...current, enabled: value })); }

  return <AdminPage eyebrow="Security" title="CAPTCHA / Anti-bot" description="ตั้งค่าการป้องกัน bot แบบเป็นขั้นตอน โดยไม่เปิด route ก่อนระบบพร้อม">
    {message && <AdminNotice tone={message.includes('ไม่') || message.includes('ยัง') ? 'warning' : 'neutral'}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Setup progress" value={`${readiness}/4`} helper="Key, Secret, Route, Test" tone={readiness === 4 ? 'success' : 'warning'} />
      <AdminMetric title="Provider" value={config.provider} />
      <AdminMetric title="Protected routes" value={String(Object.values(config.routes).filter(Boolean).length)} tone={hasProtectedRoute ? 'success' : 'warning'} />
      <AdminMetric title="Status" value={config.enabled ? 'ENABLED' : 'DISABLED'} tone={config.enabled ? 'success' : 'warning'} />
    </AdminMetricGrid>

    <AdminCard title="Setup Checklist" description="ทำตามลำดับก่อนเปิดใช้งานจริง">
      <AdminStack>
        <Step number="1" title="เลือก Provider และใส่ Site key" done={hasSiteKey} />
        <Step number="2" title="ตั้งค่า Secret key" done={hasSecret} />
        <Step number="3" title="เลือก Route ที่ต้องป้องกัน" done={hasProtectedRoute} />
        <Step number="4" title="ทดสอบ Provider ด้วย token จริง" done={providerTested} />
      </AdminStack>
    </AdminCard>

    <AdminCard title="สถานะ" description="ระบบจะไม่ยอมเปิดจนกว่า Setup Checklist จะครบ">
      <AdminStack>
        <div style={rowStyle}><span>ระบบ Anti-bot</span><AdminBadge tone={config.enabled ? 'success' : 'warning'}>{config.enabled ? 'ENABLED' : 'DISABLED'}</AdminBadge></div>
        <label style={checkStyle}><input type="checkbox" checked={config.enabled} onChange={(event) => toggleEnabled(event.target.checked)} disabled={saving || (!config.enabled && !readyToEnable)} /> เปิดใช้งาน Anti-bot</label>
        {!readyToEnable && !config.enabled && <small style={hintStyle}>ปุ่มเปิดใช้จะพร้อมเมื่อ Key, Secret, Route และ Provider Test ผ่านครบ</small>}
        <label style={checkStyle}><input type="checkbox" checked={config.adaptiveMode} onChange={(event) => setConfig({ ...config, adaptiveMode: event.target.checked })} /> Adaptive challenge</label>
        <label style={checkStyle}><input type="checkbox" checked={config.emergencyMode} onChange={(event) => setConfig({ ...config, emergencyMode: event.target.checked })} /> Emergency mode</label>
      </AdminStack>
    </AdminCard>

    <AdminCard title="Provider" description="รองรับ Cloudflare Turnstile, Google reCAPTCHA และ hCaptcha">
      <div style={gridStyle}>
        <label style={fieldStyle}>Provider<select value={config.provider} onChange={(event) => { setConfig({ ...config, provider: event.target.value as Provider }); setProviderTested(false); }} style={inputStyle}><option value="TURNSTILE">Cloudflare Turnstile</option><option value="RECAPTCHA">Google reCAPTCHA</option><option value="HCAPTCHA">hCaptcha</option></select></label>
        <label style={fieldStyle}>Site key<input value={config.siteKey} onChange={(event) => { setConfig({ ...config, siteKey: event.target.value }); setProviderTested(false); }} style={inputStyle} autoComplete="off" /></label>
        <label style={fieldStyle}>Secret key<input value={secret} onChange={(event) => { setSecret(event.target.value); setProviderTested(false); }} placeholder={config.secretConfigured ? 'ตั้งค่าแล้ว ••••••••' : 'ยังไม่ได้ตั้งค่า'} style={inputStyle} type="password" autoComplete="new-password" /></label>
      </div>
    </AdminCard>

    <AdminCard title="Route ที่ป้องกัน" description="เลือกอย่างน้อยหนึ่ง route ก่อนเปิดใช้งาน">
      <AdminStack>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.ADMIN_LOGIN} onChange={(event) => setRoute('ADMIN_LOGIN', event.target.checked)} /> Admin Login</label>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.MEMBER_LOGIN} onChange={(event) => setRoute('MEMBER_LOGIN', event.target.checked)} /> Member Login</label>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.MEMBER_REGISTER} onChange={(event) => setRoute('MEMBER_REGISTER', event.target.checked)} /> Member Register</label>
      </AdminStack>
    </AdminCard>

    <AdminCard title="ทดสอบ Provider" description="ใช้ response token จริงเพื่อยืนยัน Secret โดยไม่เปิด route ก่อน">
      <div style={gridStyle}><input value={testToken} onChange={(event) => setTestToken(event.target.value)} placeholder="CAPTCHA response token" style={inputStyle} /><AdminButton type="button" tone="secondary" onClick={() => void testProvider()} disabled={saving || !hasSiteKey || !hasSecret}>ทดสอบ</AdminButton></div>
    </AdminCard>

    <div style={actionStyle}><AdminButton type="button" onClick={() => void save()} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</AdminButton></div>
  </AdminPage>;
}

function Step({ number, title, done }: { number: string; title: string; done: boolean }) { return <div style={rowStyle}><span><strong>{number}.</strong> {title}</span><AdminBadge tone={done ? 'success' : 'warning'}>{done ? 'พร้อม' : 'ยังไม่ครบ'}</AdminBadge></div>; }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 } as const;
const fieldStyle = { display: 'grid', gap: 8, color: '#e2e8f0', fontWeight: 800 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.24)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%', boxSizing: 'border-box' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' } as const;
const checkStyle = { display: 'flex', gap: 10, alignItems: 'center', minHeight: 44, color: '#e2e8f0', fontWeight: 800 } as const;
const hintStyle = { color: '#94a3b8', lineHeight: 1.5 } as const;
const actionStyle = { display: 'flex', justifyContent: 'flex-end' } as const;
