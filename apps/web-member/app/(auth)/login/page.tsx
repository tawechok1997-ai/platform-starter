'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { MemberRuntimeImage } from '../../components/member-runtime-image';
import { createAuthBrandRuntime } from '../../components/auth/auth-brand-runtime';
import { AntiBotWidget } from '../anti-bot-widget';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags } from '../../site-settings';
import { memberApiFetch } from '../../member-api';
import { resolveMemberLoginDestination } from '../../../src/features/auth/auth-redirect';

type Locale = 'th' | 'en';
type LoginErrors = { identifier?: string; secret?: string };

const copy = {
  th: { title: 'ยินดีต้อนรับกลับ', subtitle: 'เข้าสู่บัญชีของคุณอย่างปลอดภัย', identifier: 'ชื่อผู้ใช้ เบอร์โทร หรืออีเมล', identifierPlaceholder: 'กรอกข้อมูลบัญชี', password: 'รหัสผ่าน', passwordPlaceholder: 'กรอกรหัสผ่าน', showPassword: 'แสดงรหัสผ่าน', hidePassword: 'ซ่อนรหัสผ่าน', submit: 'เข้าสู่ระบบ', submitting: 'กำลังเข้าสู่ระบบ...', registerPrompt: 'ยังไม่มีบัญชี?', register: 'สมัครสมาชิก', loginDisabled: 'ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว', identifierRequired: 'กรุณากรอกชื่อผู้ใช้ เบอร์โทร หรืออีเมล', passwordRequired: 'กรุณากรอกรหัสผ่าน', captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ', checkFields: 'กรุณาตรวจสอบข้อมูลที่ระบุไว้ด้านล่าง', failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง', success: 'เข้าสู่ระบบสำเร็จ', timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองอีกครั้ง' },
  en: { title: 'Welcome back', subtitle: 'Sign in securely to your account', identifier: 'Username, phone, or email', identifierPlaceholder: 'Enter your account details', password: 'Password', passwordPlaceholder: 'Enter your password', showPassword: 'Show password', hidePassword: 'Hide password', submit: 'Sign in', submitting: 'Signing in...', registerPrompt: 'New here?', register: 'Create account', loginDisabled: 'Sign-in is temporarily unavailable', identifierRequired: 'Enter your username, phone number, or email', passwordRequired: 'Enter your password', captchaRequired: 'Complete the security verification', checkFields: 'Check the highlighted fields', failed: 'Could not sign in. Please try again', success: 'Signed in successfully', timeout: 'The connection took too long. Please try again' },
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
  const siteName = authBrand.model.siteName;
  const logoUrl = authBrand.model.logoUrl;
  const brandMark = authBrand.brandMark;
  const flags = memberFeatureFlags(settings);
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => { setCaptchaRequired(required); setCaptchaReady(ready); }, []);
  const disabled = loading || !flags.login || (captchaRequired && !captchaReady);

  function changeLocale(next: Locale) { setLocale(next); window.localStorage.setItem('member_locale', next); }
  function validate() { const next: LoginErrors = {}; if (!identifier.trim()) next.identifier = t.identifierRequired; if (!secret.trim()) next.secret = t.passwordRequired; setErrors(next); return Object.keys(next).length === 0; }
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
      const res = await memberApiFetch('/member/auth/login', { method: 'POST', skipAuth: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: identifier.trim(), secret, captchaToken: captchaToken || undefined, deviceId: 'web-member' }), signal: controller.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(typeof data?.message === 'string' ? data.message : t.failed); setCaptchaResetKey((value) => value + 1); return; }
      window.localStorage.setItem('member_access_token', data.accessToken);
      window.localStorage.setItem('member_refresh_token', data.refreshToken);
      setStatus('success'); setMessage(t.success); window.location.replace(resolveMemberLoginDestination(window.location.search));
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally { window.clearTimeout(timeoutId); setLoading(false); }
  }

  return <main className="public-auth-page" style={authBrand.style} {...{ 'data-brand-code': String((settings.website as Record<string, unknown> | undefined)?.brand_code ?? 'default') }}>
    <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="public-auth-scene" aria-hidden="true"><span className="public-auth-scene__tower" /><span className="public-auth-scene__tower public-auth-scene__tower--small" /><span className="public-auth-scene__arc" /><span className="public-auth-scene__light" /></div>
    <section className="public-auth-shell" data-auth-mode="login">
      <aside className="public-auth-brand-panel">
        <div className="public-auth-brand-kicker"><span /> {locale === 'th' ? 'ประสบการณ์สมาชิกระดับพรีเมียม' : 'Premium member experience'}</div>
        <div className="public-auth-brand-lockup"><span className="public-auth-brand__mark">{logoUrl ? <MemberRuntimeImage src={logoUrl} alt="" /> : brandMark}</span><strong>{siteName}</strong></div>
        <h2>{locale === 'th' ? 'ความปลอดภัย คือสิ่งสำคัญที่สุด' : 'Your security comes first.'}</h2>
        <p>{locale === 'th' ? 'การปกป้องระดับระบบ ตรวจสอบความเสี่ยง และดูแลเซสชัน เพื่อให้ทุกการใช้งานมั่นใจได้' : 'System-level protection, risk monitoring and secure sessions for complete peace of mind.'}</p>
        <div className="public-auth-benefits"><div><span>01</span><strong>{locale === 'th' ? 'ปลอดภัยทุกขั้นตอน' : 'Secure by design'}</strong></div><div><span>02</span><strong>{locale === 'th' ? 'ตรวจสอบสถานะได้ทันที' : 'Live status tracking'}</strong></div><div><span>03</span><strong>{locale === 'th' ? 'รองรับทุกอุปกรณ์' : 'Built for every screen'}</strong></div></div>
        <div className="public-auth-security-card"><span className="public-auth-security-card__icon">◇</span><div><strong>{locale === 'th' ? 'ข้อมูลของคุณได้รับการปกป้อง' : 'Your data stays protected'}</strong><small>{locale === 'th' ? 'การเชื่อมต่อเข้ารหัสและตรวจสอบเซสชัน' : 'Encrypted connection and session monitoring'}</small></div></div>
      </aside>
      <form className="public-auth-card" onSubmit={onSubmit} noValidate>
        <div className="public-auth-card-topbar"><div className="public-auth-card__logo"><span>{logoUrl ? <MemberRuntimeImage src={logoUrl} alt={siteName} /> : brandMark}</span><strong>{siteName}</strong></div><div aria-label="Language" className="public-auth-language"><button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'} className="public-auth-language__button ui-button ui-button--secondary">ไทย</button><button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'} className="public-auth-language__button ui-button ui-button--secondary">EN</button></div></div>
        <div className="public-auth-heading"><span className="public-auth-heading__eyebrow">{authBrand.model.eyebrow}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        {!flags.login && <div className="public-auth-alert public-auth-alert--error" role="alert">{t.loginDisabled}</div>}
        {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}
        <label className="public-auth-field" htmlFor="login-identifier">{t.identifier}<input id="login-identifier" className="public-auth-input ui-input" value={identifier} onChange={(event) => { setIdentifier(event.target.value); if (errors.identifier) clearFieldError('identifier'); }} disabled={disabled} autoComplete="username" placeholder={t.identifierPlaceholder} aria-invalid={Boolean(errors.identifier)} /></label>
        {errors.identifier && <span className="public-auth-field-error">{errors.identifier}</span>}
        <label className="public-auth-field" htmlFor="login-secret">{t.password}<div className="public-auth-input-wrap"><input id="login-secret" className="public-auth-input ui-input" value={secret} onChange={(event) => { setSecret(event.target.value); if (errors.secret) clearFieldError('secret'); }} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="current-password" placeholder={t.passwordPlaceholder} aria-invalid={Boolean(errors.secret)} /><button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye ui-button ui-button--secondary" disabled={disabled} aria-label={showSecret ? t.hidePassword : t.showPassword}>{showSecret ? (locale === 'th' ? 'ซ่อน' : 'Hide') : (locale === 'th' ? 'แสดง' : 'Show')}</button></div></label>
        {errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}
        <AntiBotWidget endpoint="member-login" locale={locale} resetKey={captchaResetKey} onToken={handleCaptchaToken} onRequiredChange={handleCaptchaState} />
        <button type="submit" disabled={disabled} className="public-auth-submit ui-button ui-button--primary">{loading ? t.submitting : t.submit}</button>
        {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
        {flags.registration && <p className="public-auth-footer">{t.registerPrompt} <Link href="/register">{t.register}</Link></p>}
        <div className="public-auth-legal"><span>Secure connection</span><Link href="/legal/privacy">{locale === 'th' ? 'ความเป็นส่วนตัว' : 'Privacy'}</Link><Link href="/legal/terms">{locale === 'th' ? 'เงื่อนไข' : 'Terms'}</Link></div>
      </form>
    </section>
  </main>;
}
