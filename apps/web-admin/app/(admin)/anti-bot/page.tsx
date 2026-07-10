'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminCard, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type Provider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
type Config = {
  enabled: boolean;
  provider: Provider;
  siteKey: string;
  secretConfigured: boolean;
  routes: {
    ADMIN_LOGIN: boolean;
    MEMBER_LOGIN: boolean;
    MEMBER_REGISTER: boolean;
  };
  adaptiveMode: boolean;
  emergencyMode: boolean;
};

const EMPTY_CONFIG: Config = {
  enabled: false,
  provider: 'TURNSTILE',
  siteKey: '',
  secretConfigured: false,
  routes: { ADMIN_LOGIN: false, MEMBER_LOGIN: false, MEMBER_REGISTER: false },
  adaptiveMode: true,
  emergencyMode: false,
};

export default function AntiBotPage() {
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [secret, setSecret] = useState('');
  const [testToken, setTestToken] = useState('');
  const [message, setMessage] = useState('กำลังโหลดการตั้งค่า Anti-bot...');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const response = await adminApiFetch('/admin/security/anti-bot');
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message ?? 'โหลดการตั้งค่า Anti-bot ไม่สำเร็จ');
        return;
      }
      setConfig(payload);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบ Anti-bot ไม่สำเร็จ');
    }
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const response = await adminApiFetch('/admin/security/anti-bot', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...config, secret: secret.trim() || undefined }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message ?? 'บันทึกการตั้งค่าไม่สำเร็จ');
        return;
      }
      setConfig(payload);
      setSecret('');
      setMessage('บันทึกการตั้งค่า Anti-bot แล้ว');
    } catch {
      setMessage('เชื่อมต่อระบบ Anti-bot ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function testProvider() {
    if (!testToken.trim()) {
      setMessage('กรอก CAPTCHA response token สำหรับทดสอบก่อน');
      return;
    }
    setSaving(true);
    setMessage('กำลังทดสอบ provider...');
    try {
      const response = await adminApiFetch('/admin/security/anti-bot/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: testToken.trim() }),
      });
      const payload = await response.json().catch(() => null);
      setMessage(response.ok && payload?.success ? 'ทดสอบ provider สำเร็จ' : `ทดสอบไม่ผ่าน${payload?.errorCodes?.length ? `: ${payload.errorCodes.join(', ')}` : ''}`);
    } catch {
      setMessage('เชื่อมต่อ provider ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  function setRoute(key: keyof Config['routes'], value: boolean) {
    setConfig((current) => ({ ...current, routes: { ...current.routes, [key]: value } }));
  }

  return <AdminPage eyebrow="Security" title="CAPTCHA / Anti-bot" description="ตั้งค่าการป้องกัน bot สำหรับหน้าเข้าสู่ระบบและสมัครสมาชิก โดยค่าเริ่มต้นจะปิดไว้เพื่อไม่ล็อกผู้ใช้ทุกคนออกจากระบบ">
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminCard title="สถานะ" description="เปิดใช้เฉพาะเมื่อ Site key, Secret และ Route พร้อมแล้ว">
      <AdminStack>
        <div style={rowStyle}><span>ระบบ Anti-bot</span><AdminBadge tone={config.enabled ? 'success' : 'warning'}>{config.enabled ? 'ENABLED' : 'DISABLED'}</AdminBadge></div>
        <label style={checkStyle}><input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ ...config, enabled: event.target.checked })} /> เปิดใช้งาน Anti-bot</label>
        <label style={checkStyle}><input type="checkbox" checked={config.adaptiveMode} onChange={(event) => setConfig({ ...config, adaptiveMode: event.target.checked })} /> Adaptive challenge</label>
        <label style={checkStyle}><input type="checkbox" checked={config.emergencyMode} onChange={(event) => setConfig({ ...config, emergencyMode: event.target.checked })} /> Emergency mode</label>
      </AdminStack>
    </AdminCard>

    <AdminCard title="Provider" description="รองรับ Cloudflare Turnstile, Google reCAPTCHA และ hCaptcha">
      <div style={gridStyle}>
        <label style={fieldStyle}>Provider<select value={config.provider} onChange={(event) => setConfig({ ...config, provider: event.target.value as Provider })} style={inputStyle}><option value="TURNSTILE">Cloudflare Turnstile</option><option value="RECAPTCHA">Google reCAPTCHA</option><option value="HCAPTCHA">hCaptcha</option></select></label>
        <label style={fieldStyle}>Site key<input value={config.siteKey} onChange={(event) => setConfig({ ...config, siteKey: event.target.value })} style={inputStyle} autoComplete="off" /></label>
        <label style={fieldStyle}>Secret key<input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={config.secretConfigured ? 'ตั้งค่าแล้ว ••••••••' : 'ยังไม่ได้ตั้งค่า'} style={inputStyle} type="password" autoComplete="new-password" /></label>
      </div>
    </AdminCard>

    <AdminCard title="Route ที่ป้องกัน" description="เปิดทีละ route หลังทดสอบ provider ผ่านแล้ว">
      <AdminStack>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.ADMIN_LOGIN} onChange={(event) => setRoute('ADMIN_LOGIN', event.target.checked)} /> Admin Login</label>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.MEMBER_LOGIN} onChange={(event) => setRoute('MEMBER_LOGIN', event.target.checked)} /> Member Login</label>
        <label style={checkStyle}><input type="checkbox" checked={config.routes.MEMBER_REGISTER} onChange={(event) => setRoute('MEMBER_REGISTER', event.target.checked)} /> Member Register</label>
      </AdminStack>
    </AdminCard>

    <AdminCard title="ทดสอบ Provider" description="ใช้ response token จริงจาก widget ทดสอบ Secret โดยไม่เปิดใช้งาน route ก่อน">
      <div style={gridStyle}><input value={testToken} onChange={(event) => setTestToken(event.target.value)} placeholder="CAPTCHA response token" style={inputStyle} /><button type="button" onClick={testProvider} disabled={saving} style={secondaryButtonStyle}>ทดสอบ</button></div>
    </AdminCard>

    <div style={actionStyle}><button type="button" onClick={save} disabled={saving} style={primaryButtonStyle}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</button></div>
  </AdminPage>;
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 } as const;
const fieldStyle = { display: 'grid', gap: 8, color: '#e2e8f0', fontWeight: 800 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.24)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%', boxSizing: 'border-box' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' } as const;
const checkStyle = { display: 'flex', gap: 10, alignItems: 'center', minHeight: 40, color: '#e2e8f0', fontWeight: 800 } as const;
const actionStyle = { display: 'flex', justifyContent: 'flex-end' } as const;
const primaryButtonStyle = { minHeight: 46, border: 0, borderRadius: 12, background: '#f5c542', color: '#111827', padding: '0 18px', fontWeight: 950, cursor: 'pointer' } as const;
const secondaryButtonStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.28)', background: '#172033', color: '#f8fafc', padding: '0 16px', fontWeight: 900, cursor: 'pointer' } as const;
