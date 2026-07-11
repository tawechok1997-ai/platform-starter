'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AntiBotWidget } from '../anti-bot-widget';

const LOGIN_TIMEOUT_MS = 15000;

type Locale = 'th' | 'en';

const copy = {
  th: {
    title: 'เข้าสู่ระบบผู้ดูแล', username: 'ชื่อผู้ใช้', usernamePlaceholder: 'กรอกชื่อผู้ใช้', password: 'รหัสผ่าน', passwordPlaceholder: 'กรอกรหัสผ่าน', twoFactor: 'รหัสยืนยัน 2FA', twoFactorOptional: 'กรอกเมื่อระบบร้องขอ', twoFactorPlaceholder: 'กรอกรหัส 6 หลัก', submit: 'เข้าสู่ระบบ', submitting: 'กำลังเข้าสู่ระบบ...', required: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ', requiresTwoFactor: 'กรอกรหัส 2FA แล้วเข้าสู่ระบบอีกครั้ง', incomplete: 'ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่', failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่', timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองใหม่', success: 'เข้าสู่ระบบสำเร็จ', showPassword: 'แสดงรหัสผ่าน', hidePassword: 'ซ่อนรหัสผ่าน',
  },
  en: {
    title: 'Admin sign in', username: 'Username', usernamePlaceholder: 'Enter your username', password: 'Password', passwordPlaceholder: 'Enter your password', twoFactor: '2FA verification code', twoFactorOptional: 'Enter only when requested', twoFactorPlaceholder: 'Enter the 6-digit code', submit: 'Sign in', submitting: 'Signing in...', required: 'Enter your username and password', captchaRequired: 'Complete the security verification', requiresTwoFactor: 'Enter your 2FA code and sign in again', incomplete: 'The server response was incomplete. Please try again', failed: 'Could not sign in. Please try again', timeout: 'The connection took too long. Please try again', success: 'Signed in successfully', showPassword: 'Show password', hidePassword: 'Hide password',
  },
} as const;

export default function AdminLoginPage() {
  const [locale, setLocale] = useState<Locale>('th');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('admin_access_token') || window.localStorage.getItem('admin_refresh_token')) { window.location.replace('/dashboard'); return; }
    const savedLocale = window.localStorage.getItem('admin_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
  }, []);

  const t = copy[locale];
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => { setCaptchaRequired(required); setCaptchaReady(ready); }, []);

  function changeLocale(next: Locale) { setLocale(next); window.localStorage.setItem('admin_locale', next); }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !secret.trim()) { setStatus('error'); setMessage(t.required); return; }
    if (captchaRequired && (!captchaReady || !captchaToken)) { setStatus('error'); setMessage(t.captchaRequired); return; }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);
    setLoading(true); setStatus('info'); setMessage(t.submitting);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), secret, twoFactorCode: twoFactorCode.trim() || undefined, captchaToken: captchaToken || undefined, deviceId: 'web-admin' }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(typeof data?.message === 'string' ? data.message : t.failed); setCaptchaResetKey((value) => value + 1); return; }
      if (data?.requiresTwoFactor) { setRequiresTwoFactor(true); setStatus('info'); setMessage(t.requiresTwoFactor); setCaptchaResetKey((value) => value + 1); return; }
      if (!data?.accessToken || !data?.refreshToken) { setStatus('error'); setMessage(t.incomplete); setCaptchaResetKey((value) => value + 1); return; }
      window.localStorage.setItem('admin_access_token', data.accessToken);
      window.localStorage.setItem('admin_refresh_token', data.refreshToken);
      setStatus('success'); setMessage(t.success); window.location.replace('/dashboard');
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally { window.clearTimeout(timeoutId); setLoading(false); }
  }

  const submitDisabled = loading || (captchaRequired && !captchaReady);
  return <main className="admin-auth-page">
    <div className="admin-auth-ambient" aria-hidden="true"><span /><span /></div>
    <section className="admin-auth-shell">
      <aside className="admin-auth-brand"><div className="admin-auth-brand__mark">A</div><p>Operations workspace</p><h1>{locale === 'th' ? 'ควบคุมระบบชัดเจน ตัดสินใจอย่างมั่นใจ' : 'Clear operations. Confident decisions.'}</h1><span>{locale === 'th' ? 'จัดการการเงิน ความเสี่ยง สมาชิก ค่ายเกม และความปลอดภัย จากพื้นที่ทำงานเดียว' : 'Manage finance, risk, members, providers and security from one focused workspace.'}</span><div className="admin-auth-status"><i /> {locale === 'th' ? 'สำหรับผู้ดูแลที่ได้รับอนุญาตเท่านั้น' : 'Authorized administrators only'}</div></aside>
    <form onSubmit={onSubmit} className="admin-auth-card" noValidate>
      <div className="admin-auth-mobile-mark" aria-hidden="true">A</div>
      <div className="admin-auth-heading"><p>Admin Console</p><h2>{t.title}</h2><span>{locale === 'th' ? 'กรอกข้อมูลประจำตัวเพื่อเข้าสู่พื้นที่จัดการ' : 'Use your administrator credentials to continue.'}</span></div>
      <div className="admin-auth-language" aria-label="Language">
        <button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'}>ไทย</button>
        <button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'}>EN</button>
      </div>
      <label className="admin-auth-field">{t.username}<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" disabled={loading} placeholder={t.usernamePlaceholder} /></label>
      <label className="admin-auth-field">{t.password}<div className="admin-auth-input-wrap"><input value={secret} onChange={(event) => setSecret(event.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="current-password" disabled={loading} placeholder={t.passwordPlaceholder} /><button type="button" onClick={() => setShowSecret((value) => !value)} disabled={loading} aria-label={showSecret ? t.hidePassword : t.showPassword}>{showSecret ? (locale === 'th' ? 'ซ่อน' : 'Hide') : (locale === 'th' ? 'แสดง' : 'Show')}</button></div></label>
      {requiresTwoFactor && <label className="admin-auth-field">{t.twoFactor}<span>{t.twoFactorOptional}</span><input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" disabled={loading} placeholder={t.twoFactorPlaceholder} /></label>}
      <AntiBotWidget endpoint="admin-login" locale={locale} resetKey={captchaResetKey} onToken={handleCaptchaToken} onRequiredChange={handleCaptchaState} />
      <button type="submit" disabled={submitDisabled} className="admin-auth-submit">{loading ? t.submitting : t.submit}</button>
      {message && <div className={`admin-auth-alert admin-auth-alert--${status}`} role={status === 'error' ? 'alert' : 'status'} aria-live={status === 'error' ? 'assertive' : 'polite'}>{message}</div>}
    </form>
    </section>
  </main>;
}
