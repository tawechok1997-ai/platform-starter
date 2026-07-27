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
  th: {
    eyebrow: 'เข้าสู่ระบบสมาชิก',
    title: 'เข้าสู่ระบบ',
    identifier: 'เบอร์โทรศัพท์',
    identifierPlaceholder: '',
    password: 'รหัสผ่าน',
    passwordPlaceholder: '',
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    register: 'สมัครสมาชิก',
    loginDisabled: 'ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว',
    identifierRequired: 'กรุณากรอกเบอร์โทรศัพท์',
    passwordRequired: 'กรุณากรอกรหัสผ่าน',
    captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ',
    checkFields: 'กรุณาตรวจสอบข้อมูลที่ระบุไว้ด้านล่าง',
    failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง',
    success: 'เข้าสู่ระบบสำเร็จ',
    timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองอีกครั้ง',
    supportPrompt: 'พบปัญหาการใช้งาน',
    support: 'ติดต่อเจ้าหน้าที่',
    forgot: 'ลืมรหัสผ่าน?',
    close: 'ปิดหน้าต่าง',
    secureConnection: 'การเชื่อมต่อปลอดภัย',
    privacy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดการใช้งาน',
  },
  en: {
    eyebrow: 'MEMBER ACCESS',
    title: 'Sign in',
    identifier: 'Phone number',
    identifierPlaceholder: '',
    password: 'Password',
    passwordPlaceholder: '',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Sign in',
    submitting: 'Signing in...',
    register: 'Register',
    loginDisabled: 'Sign-in is temporarily unavailable',
    identifierRequired: 'Enter your phone number',
    passwordRequired: 'Enter your password',
    captchaRequired: 'Complete the security verification',
    checkFields: 'Check the highlighted fields',
    failed: 'Could not sign in. Please try again',
    success: 'Signed in successfully',
    timeout: 'The connection took too long. Please try again',
    supportPrompt: 'Having trouble?',
    support: 'Contact support',
    forgot: 'Forgot password?',
    close: 'Close window',
    secureConnection: 'Secure connection',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
  },
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
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isEmbedded = params.get('embed') === '1' && window.parent !== window;
    setEmbedded(isEmbedded);

    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) {
      if (isEmbedded) window.parent.postMessage({ type: 'member-auth-success' }, window.location.origin);
      else window.location.replace(resolveMemberLoginDestination(window.location.search));
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

  function closePopup() {
    if (embedded) {
      window.parent.postMessage({ type: 'member-auth-close' }, window.location.origin);
      return;
    }
    window.location.assign('/');
  }

  function completeLogin() {
    if (embedded) {
      window.parent.postMessage({ type: 'member-auth-success' }, window.location.origin);
      return;
    }
    window.location.replace(resolveMemberLoginDestination(window.location.search));
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
      completeLogin();
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  const registerHref = embedded ? '/register?embed=1' : '/register';
  const loginHref = embedded ? '/login?embed=1' : '/login';

  return (
    <main className="public-auth-page source-login-page" style={authBrand.style} data-brand-code={String((settings.website as Record<string, unknown> | undefined)?.brand_code ?? 'default')} data-embedded={embedded ? 'true' : 'false'}>
      <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
      <div className="public-auth-backdrop" aria-hidden="true" />

      <section className="public-auth-shell public-auth-modal source-login-modal" data-auth-mode="login" role="dialog" aria-modal="true" aria-labelledby="member-login-title">
        <button type="button" className="public-auth-close source-login-close" aria-label={t.close} onClick={closePopup}>
          <span>{t.close}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10.8837 10L15 5.88375L14.1163 5L10 9.11625L5.88375 5L5 5.88375L9.11625 10L5 14.1163L5.88375 15L10 10.8837L14.1163 15L15 14.1163L10.8837 10Z" fill="currentColor" />
          </svg>
        </button>

        <div className="source-login-visual" aria-hidden="true">
          <img src="/assets/asset-pc/images/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        </div>

        <div className="source-login-form-shell">
          <nav className="public-auth-tabs source-login-tabs" aria-label={locale === 'th' ? 'บัญชีสมาชิก' : 'Member account'}>
            <Link href={registerHref}>{t.register}</Link>
            <Link href={loginHref} aria-current="page">{t.title}</Link>
          </nav>

          <form className="public-auth-card source-login-card" onSubmit={onSubmit} noValidate>
            <div className="public-auth-heading source-login-heading"><span>{t.eyebrow}</span><h1 id="member-login-title">{t.title}</h1></div>
            {!flags.login && <div className="public-auth-alert public-auth-alert--error" role="alert">{t.loginDisabled}</div>}
            {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}

            <label className="public-auth-field source-login-field" htmlFor="login-identifier">
              <span className="public-auth-field-label">{t.identifier}</span>
              <input id="login-identifier" className="public-auth-input ui-input" value={identifier} onChange={(event) => { setIdentifier(event.target.value); if (errors.identifier) clearFieldError('identifier'); }} disabled={disabled} autoComplete="username" inputMode="tel" placeholder={t.identifierPlaceholder} aria-invalid={Boolean(errors.identifier)} />
            </label>
            {errors.identifier && <span className="public-auth-field-error">{errors.identifier}</span>}

            <label className="public-auth-field source-login-field" htmlFor="login-secret">
              <span className="public-auth-field-label">{t.password}</span>
              <div className="public-auth-input-wrap">
                <input id="login-secret" className="public-auth-input ui-input" value={secret} onChange={(event) => { setSecret(event.target.value); if (errors.secret) clearFieldError('secret'); }} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="current-password" placeholder={t.passwordPlaceholder} aria-invalid={Boolean(errors.secret)} />
                <button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye source-login-eye" disabled={disabled} aria-label={showSecret ? t.hidePassword : t.showPassword}><PasswordVisibilityIcon visible={showSecret} /></button>
              </div>
            </label>
            {errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}

            <Link href="/forgot-password" className="public-auth-forgot">{t.forgot}</Link>
            <AntiBotWidget endpoint="member-login" locale={locale} resetKey={captchaResetKey} onToken={handleCaptchaToken} onRequiredChange={handleCaptchaState} />
            <button type="submit" disabled={disabled} className="public-auth-submit source-login-submit"><span>{loading ? t.submitting : t.submit}</span><i aria-hidden="true" /></button>
            {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
            <div className="source-login-divider" aria-hidden="true" />
            <div className="source-login-support"><span>{t.supportPrompt}</span><Link href="/support">{t.support}</Link></div>
            <footer className="public-auth-legal"><span>{t.secureConnection}</span><Link href="/legal/privacy">{t.privacy}</Link><Link href="/legal/terms">{t.terms}</Link></footer>
          </form>
        </div>
      </section>
    </main>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M1.8 10s2.8-5 8.2-5 8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" /></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 3l14 14M8.1 5.3A8.9 8.9 0 0 1 10 5c5.4 0 8.2 5 8.2 5a13 13 0 0 1-2.1 2.8M12.2 14.7A8.8 8.8 0 0 1 10 15c-5.4 0-8.2-5-8.2-5a13 13 0 0 1 2.3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M7.9 7.9A3 3 0 0 0 12.1 12.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  );
}
