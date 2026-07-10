'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

type LoginErrors = { identifier?: string; secret?: string };

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) { window.location.replace('/'); return; }
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Member Center');
  const description = textSetting(settings, 'website', 'site_description', 'จัดการบัญชี ฝาก ถอน และดูประวัติได้ในที่เดียว');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const flags = memberFeatureFlags(settings);
  const disabled = loading || !flags.login;
  const cssVars = { '--color-brand': primaryColor, '--color-bg': backgroundColor, '--color-card': cardColor, '--color-text': textColor } as React.CSSProperties;

  function validate() {
    const next: LoginErrors = {};
    if (!identifier.trim()) next.identifier = 'กรุณากรอกชื่อผู้ใช้ เบอร์โทร หรืออีเมล';
    if (!secret.trim()) next.secret = 'กรุณากรอกรหัสผ่าน';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flags.login) { setStatus('error'); setMessage('ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว'); return; }
    if (!validate()) { setStatus('error'); setMessage('กรุณาตรวจสอบข้อมูลที่ระบุไว้ด้านล่าง'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังเข้าสู่ระบบ...');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/member/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: identifier.trim(), secret, deviceId: 'web-member' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'); return; }
    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setStatus('success'); setMessage('เข้าสู่ระบบสำเร็จ');
    window.location.replace('/');
  }

  return <main className="public-auth-page" style={cssVars}>
    <section className="public-auth-shell">
      <aside className="public-auth-brand">
        <div className="public-auth-brand__mark">{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</div>
        <h1>{siteName}</h1>
        <p>{description}</p>
      </aside>
      <form className="public-auth-card" onSubmit={onSubmit} noValidate>
        <div className="public-auth-card__logo"><span>{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</span></div>
        <div className="public-auth-heading"><h2>เข้าสู่ระบบ</h2><p>กลับเข้าสู่ศูนย์สมาชิกของคุณ</p></div>
        {!flags.login && <div className="public-auth-alert public-auth-alert--error" role="alert">ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว</div>}
        {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}
        <label className="public-auth-field" htmlFor="login-identifier">ชื่อผู้ใช้ / เบอร์โทร / อีเมล<input id="login-identifier" className="public-auth-input" value={identifier} onChange={(event) => { setIdentifier(event.target.value); if (errors.identifier) setErrors((current) => ({ ...current, identifier: undefined })); }} disabled={disabled} autoComplete="username" placeholder="กรอกข้อมูลบัญชี" aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? 'login-identifier-error' : undefined} /></label>
        {errors.identifier && <span id="login-identifier-error" className="public-auth-field-error">{errors.identifier}</span>}
        <label className="public-auth-field" htmlFor="login-secret">รหัสผ่าน<div className="public-auth-input-wrap"><input id="login-secret" className="public-auth-input" value={secret} onChange={(event) => { setSecret(event.target.value); if (errors.secret) setErrors((current) => ({ ...current, secret: undefined })); }} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="current-password" placeholder="กรอกรหัสผ่าน" style={{ paddingRight: 58 }} aria-invalid={Boolean(errors.secret)} aria-describedby={errors.secret ? 'login-secret-error' : undefined} /><button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye" disabled={disabled} aria-label={showSecret ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showSecret ? '🙈' : '👁️'}</button></div></label>
        {errors.secret && <span id="login-secret-error" className="public-auth-field-error">{errors.secret}</span>}
        <button type="submit" disabled={disabled} className="public-auth-submit">{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
        {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
        {flags.registration && <p className="public-auth-footer">ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a></p>}
      </form>
    </section>
  </main>;
}
