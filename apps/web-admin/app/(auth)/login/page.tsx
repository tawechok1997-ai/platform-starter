'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const LOGIN_TIMEOUT_MS = 15000;

type Locale = 'th' | 'en';

const copy = {
  th: {
    title: 'เข้าสู่ระบบผู้ดูแล',
    subtitle: 'ใช้บัญชีผู้ดูแลที่ได้รับอนุญาต',
    username: 'ชื่อผู้ใช้',
    usernamePlaceholder: 'กรอกชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    passwordPlaceholder: 'กรอกรหัสผ่าน',
    twoFactor: 'รหัสยืนยัน 2FA',
    twoFactorOptional: 'กรอกเมื่อระบบร้องขอ',
    twoFactorPlaceholder: 'กรอกรหัส 6 หลัก',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    required: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
    requiresTwoFactor: 'กรอกรหัส 2FA แล้วเข้าสู่ระบบอีกครั้ง',
    incomplete: 'ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่',
    failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
    timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองใหม่',
    success: 'เข้าสู่ระบบสำเร็จ',
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
  },
  en: {
    title: 'Admin sign in',
    subtitle: 'Use an authorized administrator account',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    twoFactor: '2FA verification code',
    twoFactorOptional: 'Enter only when requested',
    twoFactorPlaceholder: 'Enter the 6-digit code',
    submit: 'Sign in',
    submitting: 'Signing in...',
    required: 'Enter your username and password',
    requiresTwoFactor: 'Enter your 2FA code and sign in again',
    incomplete: 'The server response was incomplete. Please try again',
    failed: 'Could not sign in. Please try again',
    timeout: 'The connection took too long. Please try again',
    success: 'Signed in successfully',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
} as const;

export default function AdminLoginPage() {
  const [locale, setLocale] = useState<Locale>('th');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('admin_access_token') || window.localStorage.getItem('admin_refresh_token')) {
      window.location.replace('/dashboard');
      return;
    }
    const savedLocale = window.localStorage.getItem('admin_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
  }, []);

  const t = copy[locale];

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem('admin_locale', next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !secret.trim()) {
      setStatus('error');
      setMessage(t.required);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);
    setLoading(true);
    setStatus('info');
    setMessage(t.submitting);

    try {
      const res = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          secret,
          twoFactorCode: twoFactorCode.trim() || undefined,
          deviceId: 'web-admin',
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus('error');
        setMessage(typeof data?.message === 'string' ? data.message : t.failed);
        return;
      }

      if (data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setStatus('info');
        setMessage(t.requiresTwoFactor);
        return;
      }

      if (!data?.accessToken || !data?.refreshToken) {
        setStatus('error');
        setMessage(t.incomplete);
        return;
      }

      window.localStorage.setItem('admin_access_token', data.accessToken);
      window.localStorage.setItem('admin_refresh_token', data.refreshToken);
      setStatus('success');
      setMessage(t.success);
      window.location.replace('/dashboard');
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error');
      setMessage(aborted ? t.timeout : t.failed);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return <main style={pageStyle}>
    <form onSubmit={onSubmit} style={cardStyle} noValidate>
      <div style={logoStyle} aria-hidden="true">A</div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={titleStyle}>{t.title}</h1>
      </div>

      <div style={languageRowStyle} aria-label="Language">
        <button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'} style={languageButtonStyle(locale === 'th')}>ไทย</button>
        <button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'} style={languageButtonStyle(locale === 'en')}>EN</button>
      </div>

      <label style={labelStyle}>{t.username}
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" disabled={loading} placeholder={t.usernamePlaceholder} style={inputStyle} />
      </label>

      <label style={labelStyle}>{t.password}
        <div style={passwordWrapStyle}>
          <input value={secret} onChange={(event) => setSecret(event.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="current-password" disabled={loading} placeholder={t.passwordPlaceholder} style={{ ...inputStyle, paddingRight: 66 }} />
          <button type="button" onClick={() => setShowSecret((value) => !value)} style={eyeButtonStyle} disabled={loading} aria-label={showSecret ? t.hidePassword : t.showPassword}>{showSecret ? (locale === 'th' ? 'ซ่อน' : 'Hide') : (locale === 'th' ? 'แสดง' : 'Show')}</button>
        </div>
      </label>

      {requiresTwoFactor && <label style={labelStyle}>{t.twoFactor}
        <span style={hintStyle}>{t.twoFactorOptional}</span>
        <input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" disabled={loading} placeholder={t.twoFactorPlaceholder} style={inputStyle} />
      </label>}

      <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.7 : 1 }}>{loading ? t.submitting : t.submit}</button>
      {message && <div style={alertStyle(status)} role={status === 'error' ? 'alert' : 'status'} aria-live={status === 'error' ? 'assertive' : 'polite'}>{message}</div>}
    </form>
  </main>;
}

const pageStyle = { minHeight: '100dvh', padding: 'max(16px, env(safe-area-inset-top)) 14px max(20px, env(safe-area-inset-bottom))', display: 'grid', placeItems: 'center', background: '#080b10', color: '#fff', boxSizing: 'border-box' } as const;
const cardStyle = { width: '100%', maxWidth: 390, display: 'grid', gap: 14, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22, padding: 20, background: '#101722', boxShadow: '0 20px 56px rgba(0,0,0,0.30)', boxSizing: 'border-box' } as const;
const logoStyle = { width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', justifySelf: 'center', fontWeight: 950, fontSize: 22, background: '#f5c542', color: '#111' } as const;
const titleStyle = { margin: 0, fontSize: 24, lineHeight: 1.15 } as const;
const languageRowStyle = { display: 'flex', justifyContent: 'center', gap: 18 } as const;
const languageButtonStyle = (active: boolean) => ({ position: 'relative' as const, minWidth: 42, minHeight: 36, padding: '4px 2px', border: 0, borderBottom: `2px solid ${active ? '#f5c542' : 'transparent'}`, borderRadius: 0, background: 'transparent', color: active ? '#fff' : '#9fb0c3', cursor: 'pointer', fontWeight: 800 } as const);
const labelStyle = { display: 'grid', gap: 7, fontWeight: 800, fontSize: 14 } as const;
const hintStyle = { color: '#8493a7', fontSize: 12, fontWeight: 500 } as const;
const inputStyle = { width: '100%', minHeight: 50, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#172231', color: '#fff', boxSizing: 'border-box', outline: 'none', fontSize: 16 } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const eyeButtonStyle = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', minWidth: 44, height: 32, padding: 0, borderRadius: 0, border: 0, background: 'transparent', color: 'rgba(255,255,255,.82)', cursor: 'pointer', fontSize: 12, fontWeight: 700, lineHeight: 1 } as const;
const submitStyle = { minHeight: 50, padding: 12, borderRadius: 14, border: 0, background: '#f5c542', color: '#111', fontWeight: 900, cursor: 'pointer', fontSize: 16 } as const;
function alertStyle(type: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: 11, background: type === 'error' ? 'rgba(255,70,70,0.10)' : type === 'success' ? 'rgba(80,255,140,0.10)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13 } as const; }