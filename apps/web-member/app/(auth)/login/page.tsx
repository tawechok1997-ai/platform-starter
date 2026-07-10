'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

type Locale = 'th' | 'en';
type LoginErrors = { identifier?: string; secret?: string };

const copy = {
  th: {
    title: 'เข้าสู่ระบบ',
    subtitle: 'เข้าสู่บัญชีของคุณ',
    identifier: 'ชื่อผู้ใช้ เบอร์โทร หรืออีเมล',
    identifierPlaceholder: 'กรอกข้อมูลบัญชี',
    password: 'รหัสผ่าน',
    passwordPlaceholder: 'กรอกรหัสผ่าน',
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    registerPrompt: 'ยังไม่มีบัญชี?',
    register: 'สมัครสมาชิก',
    loginDisabled: 'ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว',
    identifierRequired: 'กรุณากรอกชื่อผู้ใช้ เบอร์โทร หรืออีเมล',
    passwordRequired: 'กรุณากรอกรหัสผ่าน',
    checkFields: 'กรุณาตรวจสอบข้อมูลที่ระบุไว้ด้านล่าง',
    failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง',
    success: 'เข้าสู่ระบบสำเร็จ',
    timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองอีกครั้ง',
  },
  en: {
    title: 'Sign in',
    subtitle: 'Access your account',
    identifier: 'Username, phone, or email',
    identifierPlaceholder: 'Enter your account details',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Sign in',
    submitting: 'Signing in...',
    registerPrompt: 'New here?',
    register: 'Create account',
    loginDisabled: 'Sign-in is temporarily unavailable',
    identifierRequired: 'Enter your username, phone number, or email',
    passwordRequired: 'Enter your password',
    checkFields: 'Check the highlighted fields',
    failed: 'Could not sign in. Please try again',
    success: 'Signed in successfully',
    timeout: 'The connection took too long. Please try again',
  },
} as const;

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [locale, setLocale] = useState<Locale>('th');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) {
      window.location.replace('/');
      return;
    }
    const savedLocale = window.localStorage.getItem('member_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const t = copy[locale];
  const siteName = textSetting(settings, 'website', 'site_name', 'Member Center');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const flags = memberFeatureFlags(settings);
  const disabled = loading || !flags.login;
  const cssVars = useMemo(() => ({ '--color-brand': primaryColor, '--color-bg': backgroundColor, '--color-card': cardColor, '--color-text': textColor }) as React.CSSProperties, [primaryColor, backgroundColor, cardColor, textColor]);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem('member_locale', next);
  }

  function validate() {
    const next: LoginErrors = {};
    if (!identifier.trim()) next.identifier = t.identifierRequired;
    if (!secret.trim()) next.secret = t.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flags.login) { setStatus('error'); setMessage(t.loginDisabled); return; }
    if (!validate()) { setStatus('error'); setMessage(t.checkFields); return; }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setStatus('info');
    setMessage(t.submitting);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/member/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), secret, deviceId: 'web-member' }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(typeof data?.message === 'string' ? data.message : t.failed); return; }
      window.localStorage.setItem('member_access_token', data.accessToken);
      window.localStorage.setItem('member_refresh_token', data.refreshToken);
      setStatus('success');
      setMessage(t.success);
      window.location.replace('/');
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error');
      setMessage(aborted ? t.timeout : t.failed);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return <main className="public-auth-page" style={cssVars}>
    <section className="public-auth-shell" style={{ maxWidth: 440 }}>
      <form className="public-auth-card" onSubmit={onSubmit} noValidate>
        <div className="public-auth-card__logo"><span>{logoUrl ? <img src={logoUrl} alt={siteName} /> : brandMark}</span></div>
        <div className="public-auth-heading"><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <div aria-label="Language" style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'} className="public-auth-eye" style={{ position: 'static', width: 'auto', paddingInline: 12 }}>ไทย</button>
          <button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'} className="public-auth-eye" style={{ position: 'static', width: 'auto', paddingInline: 12 }}>EN</button>
        </div>
        {!flags.login && <div className="public-auth-alert public-auth-alert--error" role="alert">{t.loginDisabled}</div>}
        {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}
        <label className="public-auth-field" htmlFor="login-identifier">{t.identifier}<input id="login-identifier" className="public-auth-input" value={identifier} onChange={(event) => { setIdentifier(event.target.value); if (errors.identifier) setErrors((current) => ({ ...current, identifier: undefined })); }} disabled={disabled} autoComplete="username" placeholder={t.identifierPlaceholder} aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? 'login-identifier-error' : undefined} /></label>
        {errors.identifier && <span id="login-identifier-error" className="public-auth-field-error">{errors.identifier}</span>}
        <label className="public-auth-field" htmlFor="login-secret">{t.password}<div className="public-auth-input-wrap"><input id="login-secret" className="public-auth-input" value={secret} onChange={(event) => { setSecret(event.target.value); if (errors.secret) setErrors((current) => ({ ...current, secret: undefined })); }} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="current-password" placeholder={t.passwordPlaceholder} style={{ paddingRight: 58 }} aria-invalid={Boolean(errors.secret)} aria-describedby={errors.secret ? 'login-secret-error' : undefined} /><button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye" disabled={disabled} aria-label={showSecret ? t.hidePassword : t.showPassword}>{showSecret ? 'ซ่อน' : 'แสดง'}</button></div></label>
        {errors.secret && <span id="login-secret-error" className="public-auth-field-error">{errors.secret}</span>}
        <button type="submit" disabled={disabled} className="public-auth-submit">{loading ? t.submitting : t.submit}</button>
        {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
        {flags.registration && <p className="public-auth-footer">{t.registerPrompt} <a href="/register">{t.register}</a></p>}
      </form>
    </section>
  </main>;
}
