'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createAuthBrandRuntime } from '../../components/auth/auth-brand-runtime';
import { AntiBotWidget } from '../anti-bot-widget';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags } from '../../site-settings';
import { memberApiFetch } from '../../member-api';
import { resolveMemberLoginDestination } from '../../../src/features/auth/auth-redirect';

type Locale = 'th' | 'en';
type LoginErrors = { identifier?: string; secret?: string };

const copy = {
  th: { title: 'เข้าสู่ระบบ', identifier: 'เบอร์โทรศัพท์', identifierPlaceholder: '', password: 'รหัสผ่าน', passwordPlaceholder: '', showPassword: 'แสดงรหัสผ่าน', hidePassword: 'ซ่อนรหัสผ่าน', submit: 'เข้าสู่ระบบ', submitting: 'กำลังเข้าสู่ระบบ...', register: 'สมัครสมาชิก', loginDisabled: 'ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว', identifierRequired: 'กรุณากรอกเบอร์โทรศัพท์', passwordRequired: 'กรุณากรอกรหัสผ่าน', captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ', checkFields: 'กรุณาตรวจสอบข้อมูลที่ระบุไว้ด้านล่าง', failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง', success: 'เข้าสู่ระบบสำเร็จ', timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองอีกครั้ง', supportPrompt: 'พบปัญหาการใช้งาน', support: 'ติดต่อเจ้าหน้าที่', forgot: 'ลืมรหัสผ่าน?', close: 'ปิดหน้าต่าง' },
  en: { title: 'Sign in', identifier: 'Phone number', identifierPlaceholder: '', password: 'Password', passwordPlaceholder: '', showPassword: 'Show password', hidePassword: 'Hide password', submit: 'Sign in', submitting: 'Signing in...', register: 'Register', loginDisabled: 'Sign-in is temporarily unavailable', identifierRequired: 'Enter your phone number', passwordRequired: 'Enter your password', captchaRequired: 'Complete the security verification', checkFields: 'Check the highlighted fields', failed: 'Could not sign in. Please try again', success: 'Signed in successfully', timeout: 'The connection took too long. Please try again', supportPrompt: 'Having trouble?', support: 'Contact support', forgot: 'Forgot password?', close: 'Close window' },
} as const;

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [locale, setLocale] = useState<Locale>('th');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) {
      window.location.replace(resolveMemberLoginDestination(window.location.search));
      return;
    }
    const savedLocale = window.localStorage.getItem('member_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const t = copy[locale];
  const authBrand = useMemo(() => createAuthBrandRuntime(settings, 'login'), [settings]);
  const flags = memberFeatureFlags(settings);
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => { setCaptchaRequired(required); setCaptchaReady(ready); }, []);
  const disabled = loading || !flags.login || (captchaRequired && !captchaReady);

  function validate() {
    const next: LoginErrors = {};
    if (!identifier.trim()) next.identifier = t.identifierRequired;
    if (!secret.trim()) next.secret = t.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearFieldError(field: keyof LoginErrors) {
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flags.login) { setStatus('error'); setMessage(t.loginDisabled); return; }
    if (!validate()) { setStatus('error'); setMessage(t.checkFields); return; }
    if (captchaRequired && (!captchaReady || !captchaToken)) { setStatus('error'); setMessage(t.captchaRequired); return; }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true); setStatus('info'); setMessage(t.submitting);
    try {
      const res = await memberApiFetch('/member/auth/login', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), secret, captchaToken: captchaToken || undefined, deviceId: 'web-member' }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(typeof data?.message === 'string' ? data.message : t.failed); setCaptchaResetKey((value) => value + 1); return; }
      window.localStorage.setItem('member_access_token', data.accessToken);
      window.localStorage.setItem('member_refresh_token', data.refreshToken);
      setStatus('success'); setMessage(t.success);
      window.location.replace(resolveMemberLoginDestination(window.location.search));
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <main className="public-auth-page source-login-page" style={authBrand.style} data-brand-code={String((settings.website as Record<string, unknown> | undefined)?.brand_code ?? 'default')}>
      <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
      <div className="public-auth-backdrop" aria-hidden="true" />

      <section className="public-auth-shell public-auth-modal source-login-modal" data-auth-mode="login" role="dialog" aria-modal="true" aria-labelledby="member-login-title">
        <Link href="/" className="public-auth-close source-login-close" aria-label={t.close}>
          <span>{t.close}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10.8837 10L15 5.88375L14.1163 5L10 9.11625L5.88375 5L5 5.88375L9.11625 10L5 14.1163L5.88375 15L10 10.8837L14.1163 15L15 14.1163L10.8837 10Z" fill="currentColor" />
          </svg>
        </Link>

        <div className="source-login-visual" aria-hidden="true">
          <img src="https://noah345.shop/images/wallpaper_login.webp" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        </div>

        <div className="source-login-form-shell">
          <nav className="public-auth-tabs source-login-tabs" aria-label={locale === 'th' ? 'บัญชีสมาชิก' : 'Member account'}>
            <Link href="/register">{t.register}</Link>
            <Link href="/login" aria-current="page">{t.title}</Link>
          </nav>

          <form className="public-auth-card source-login-card" onSubmit={onSubmit} noValidate>
            <div className="public-auth-heading source-login-heading">
              <h1 id="member-login-title">{t.title}</h1>
            </div>

            {!flags.login && <div className="public-auth-alert public-auth-alert--error" role="alert">{t.loginDisabled}</div>}
            {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}

            <label className="public-auth-field source-login-field" htmlFor="login-identifier">
              <span className="public-auth-field-label">{t.identifier}</span>
              <input
                id="login-identifier"
                className="public-auth-input ui-input"
                value={identifier}
                onChange={(event) => { setIdentifier(event.target.value); if (errors.identifier) clearFieldError('identifier'); }}
                disabled={disabled}
                autoComplete="username"
                inputMode="tel"
                placeholder={t.identifierPlaceholder}
                aria-invalid={Boolean(errors.identifier)}
              />
            </label>
            {errors.identifier && <span className="public-auth-field-error">{errors.identifier}</span>}

            <label className="public-auth-field source-login-field" htmlFor="login-secret">
              <span className="public-auth-field-label">{t.password}</span>
              <div className="public-auth-input-wrap">
                <input
                  id="login-secret"
                  className="public-auth-input ui-input"
                  value={secret}
                  onChange={(event) => { setSecret(event.target.value); if (errors.secret) clearFieldError('secret'); }}
                  type={showSecret ? 'text' : 'password'}
                  disabled={disabled}
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  aria-invalid={Boolean(errors.secret)}
                />
                <button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye source-login-eye" disabled={disabled} aria-label={showSecret ? t.hidePassword : t.showPassword}>
                  <PasswordVisibilityIcon visible={showSecret} />
                </button>
              </div>
            </label>
            {errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}

            <Link href="/forgot-password" className="public-auth-forgot">{t.forgot}</Link>
            <AntiBotWidget endpoint="member-login" locale={locale} resetKey={captchaResetKey} onToken={handleCaptchaToken} onRequiredChange={handleCaptchaState} />

            <button type="submit" disabled={disabled} className="public-auth-submit source-login-submit">
              <span>{loading ? t.submitting : t.submit}</span>
              <i aria-hidden="true" />
            </button>

            {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}

            <div className="source-login-divider" aria-hidden="true" />
            <div className="source-login-support">
              <span>{t.supportPrompt}</span>
              <Link href="/support">{t.support}</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M1.8 10s2.8-5 8.2-5 8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.1974 15.0672L10.3974 12.3005C10.0085 12.4227 9.61684 12.5144 9.2224 12.5755C8.82795 12.6366 8.41962 12.6672 7.9974 12.6672C6.31962 12.6672 4.82517 12.2033 3.51406 11.2755C2.20295 10.3477 1.25295 9.14497 0.664062 7.66719C0.897396 7.0783 1.19184 6.53108 1.5474 6.02552C1.90295 5.51997 2.30851 5.06719 2.76406 4.66719L0.930729 2.80052L1.86406 1.86719L14.1307 14.1339L13.1974 15.0672ZM7.9974 10.6672C8.11962 10.6672 8.23351 10.6616 8.33906 10.6505C8.44462 10.6394 8.55851 10.6172 8.68073 10.5839L5.08073 6.98385C5.0474 7.10608 5.02517 7.21997 5.01406 7.32552C5.00295 7.43108 4.9974 7.54497 4.9974 7.66719C4.9974 8.50052 5.28906 9.20885 5.8724 9.79219C6.45573 10.3755 7.16406 10.6672 7.9974 10.6672ZM12.8641 10.9672L10.7474 8.86719C10.8252 8.6783 10.8863 8.48663 10.9307 8.29219C10.9752 8.09774 10.9974 7.88941 10.9974 7.66719C10.9974 6.83385 10.7057 6.12552 10.1224 5.54219C9.53906 4.95885 8.83073 4.66719 7.9974 4.66719C7.77517 4.66719 7.56684 4.68941 7.3724 4.73385C7.17795 4.7783 6.98629 4.84497 6.7974 4.93385L5.0974 3.23385C5.55295 3.04497 6.01962 2.9033 6.4974 2.80885C6.97517 2.71441 7.47517 2.66719 7.9974 2.66719C9.67517 2.66719 11.1696 3.13108 12.4807 4.05885C13.7918 4.98663 14.7418 6.18941 15.3307 7.66719C15.0752 8.32274 14.7391 8.93108 14.3224 9.49219C13.9057 10.0533 13.4196 10.545 12.8641 10.9672Z" fill="currentColor" />
    </svg>
  );
}
