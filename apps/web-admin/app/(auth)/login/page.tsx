'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiClientError, createApiClient } from '@platform/api-client';
import { AntiBotWidget } from '../anti-bot-widget';
import { refreshAdminToken, setAdminAccessToken } from '../../admin-api';

const LOGIN_TIMEOUT_MS = 15000;
const loginClient = createApiClient({ baseUrl: '', timeoutMs: LOGIN_TIMEOUT_MS, retry: 0 });

type Locale = 'th' | 'en';
type LoginResponse = { accessToken?: string; requiresTwoFactor?: boolean; challengeId?: string; message?: string };

const copy = {
  th: {
    title: 'เข้าสู่ระบบผู้ดูแล',
    username: 'ชื่อผู้ใช้',
    usernamePlaceholder: 'กรอกชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    passwordPlaceholder: 'กรอกรหัสผ่าน',
    twoFactor: 'รหัสยืนยัน 2FA',
    twoFactorOptional: 'ใช้รหัส 6 หลักหรือ recovery code',
    twoFactorPlaceholder: 'รหัส 2FA หรือ recovery code',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    required: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
    twoFactorRequired: 'กรุณากรอกรหัส 2FA หรือ recovery code',
    captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ',
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
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    twoFactor: '2FA verification code',
    twoFactorOptional: 'Use a 6-digit code or recovery code',
    twoFactorPlaceholder: '2FA or recovery code',
    submit: 'Sign in',
    submitting: 'Signing in...',
    required: 'Enter your username and password',
    twoFactorRequired: 'Enter a 2FA or recovery code',
    captchaRequired: 'Complete the security verification',
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
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [challengeId, setChallengeId] = useState('');

  useEffect(() => {
    void refreshAdminToken().then((token) => {
      if (token) window.location.replace('/dashboard');
    });
    const savedLocale = window.localStorage.getItem('admin_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
  }, []);

  const t = copy[locale];
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => {
    setCaptchaRequired(required);
    setCaptchaReady(ready);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem('admin_locale', next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requiresTwoFactor && (!challengeId || !twoFactorCode.trim())) {
      setStatus('error');
      setMessage(t.twoFactorRequired);
      return;
    }
    if (!requiresTwoFactor && (!username.trim() || !secret.trim())) {
      setStatus('error');
      setMessage(t.required);
      return;
    }
    if (!requiresTwoFactor && captchaRequired && (!captchaReady || !captchaToken)) {
      setStatus('error');
      setMessage(t.captchaRequired);
      return;
    }

    setLoading(true);
    setStatus('info');
    setMessage(t.submitting);
    try {
      const loginPayload: { username: string; secret: string; captchaToken?: string; deviceId: string } = {
        username: username.trim(),
        secret,
        deviceId: 'web-admin',
        ...(captchaToken ? { captchaToken } : {}),
      };
      const data =
        requiresTwoFactor && challengeId
          ? await loginClient.json<LoginResponse, { challengeId: string; code: string }>(
              '/api/admin/auth/2fa/verify',
              { challengeId, code: twoFactorCode.trim() },
              { credentials: 'include', auth: false },
            )
          : await loginClient.json<LoginResponse, typeof loginPayload>(
              '/api/auth/login',
              loginPayload,
              { credentials: 'include', auth: false },
            );
      if (data.requiresTwoFactor && data.challengeId) {
        setRequiresTwoFactor(true);
        setChallengeId(data.challengeId);
        setSecret('');
        setStatus('info');
        setMessage(t.requiresTwoFactor);
        setCaptchaResetKey((value) => value + 1);
        return;
      }
      if (!data.accessToken) {
        setStatus('error');
        setMessage(t.incomplete);
        setCaptchaResetKey((value) => value + 1);
        return;
      }
      setAdminAccessToken(data.accessToken);
      setStatus('success');
      setMessage(t.success);
      window.location.replace('/dashboard');
    } catch (error) {
      const timeout = error instanceof DOMException && error.name === 'AbortError';
      const apiMessage = error instanceof ApiClientError && typeof error.message === 'string' ? error.message : '';
      setStatus('error');
      setMessage(timeout ? t.timeout : apiMessage || t.failed);
      setCaptchaResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  const submitDisabled = loading || (!requiresTwoFactor && captchaRequired && !captchaReady);
  return (
    <main className="admin-auth-page">
      <div className="admin-auth-ambient" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="admin-auth-scene" aria-hidden="true">
        <span className="admin-auth-scene__tower" />
        <span className="admin-auth-scene__tower admin-auth-scene__tower--small" />
        <span className="admin-auth-scene__arc" />
        <span className="admin-auth-scene__light" />
      </div>
      <section className="admin-auth-shell">
        <aside className="admin-auth-brand">
          <div className="admin-auth-brand__mark">A</div>
          <p>Operations workspace</p>
          <h1>{locale === 'th' ? 'ควบคุมระบบชัดเจน ตัดสินใจอย่างมั่นใจ' : 'Clear operations. Confident decisions.'}</h1>
          <span>
            {locale === 'th'
              ? 'จัดการการเงิน ความเสี่ยง สมาชิก ค่ายเกม และความปลอดภัย จากพื้นที่ทำงานเดียว'
              : 'Manage finance, risk, members, providers and security from one focused workspace.'}
          </span>
          <div className="admin-auth-status">
            <i /> {locale === 'th' ? 'สำหรับผู้ดูแลที่ได้รับอนุญาตเท่านั้น' : 'Authorized administrators only'}
          </div>
        </aside>
        <form onSubmit={onSubmit} className="admin-auth-card" noValidate>
          <div className="admin-auth-card-topbar">
            <div className="admin-auth-card-brand">
              <div className="admin-auth-mobile-mark" aria-hidden="true">
                A
              </div>
              <strong>Admin Console</strong>
            </div>
            <div className="admin-auth-language" aria-label="Language">
              <button
                type="button"
                onClick={() => changeLocale('th')}
                aria-pressed={locale === 'th'}
                className="ui-button ui-button--secondary"
              >
                ไทย
              </button>
              <button
                type="button"
                onClick={() => changeLocale('en')}
                aria-pressed={locale === 'en'}
                className="ui-button ui-button--secondary"
              >
                EN
              </button>
            </div>
          </div>
          <div className="admin-auth-heading">
            <p>SECURE ADMIN ACCESS</p>
            <h2>{t.title}</h2>
            <span>
              {locale === 'th'
                ? 'กรอกข้อมูลประจำตัวเพื่อเข้าสู่พื้นที่จัดการ'
                : 'Use your administrator credentials to continue.'}
            </span>
          </div>
          {!requiresTwoFactor && (
            <>
              <label className="admin-auth-field">
                {t.username}
                <input
                  className="ui-input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  placeholder={t.usernamePlaceholder}
                />
              </label>
              <label className="admin-auth-field">
                {t.password}
                <div className="admin-auth-input-wrap">
                  <input
                    className="ui-input"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    type={showSecret ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    placeholder={t.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((value) => !value)}
                    disabled={loading}
                    aria-label={showSecret ? t.hidePassword : t.showPassword}
                    className="ui-button ui-button--secondary"
                  >
                    {showSecret ? (locale === 'th' ? 'ซ่อน' : 'Hide') : locale === 'th' ? 'แสดง' : 'Show'}
                  </button>
                </div>
              </label>
            </>
          )}
          {requiresTwoFactor && (
            <label className="admin-auth-field">
              {t.twoFactor}
              <span>{t.twoFactorOptional}</span>
              <input
                className="ui-input"
                value={twoFactorCode}
                onChange={(event) =>
                  setTwoFactorCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 12),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={loading}
                placeholder={t.twoFactorPlaceholder}
              />
            </label>
          )}
          {!requiresTwoFactor && (
            <AntiBotWidget
              endpoint="admin-login"
              locale={locale}
              resetKey={captchaResetKey}
              onToken={handleCaptchaToken}
              onRequiredChange={handleCaptchaState}
            />
          )}
          <button type="submit" disabled={submitDisabled} className="admin-auth-submit ui-button ui-button--primary">
            {loading ? t.submitting : t.submit}
          </button>
          {message && (
            <div
              className={`admin-auth-alert admin-auth-alert--${status}`}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live={status === 'error' ? 'assertive' : 'polite'}
            >
              {message}
            </div>
          )}
          <div className="admin-auth-legal">
            <span className="admin-auth-legal__dot" />
            {locale === 'th' ? 'การเชื่อมต่อผู้ดูแลที่ปลอดภัย' : 'Secure administrator connection'}
          </div>
        </form>
      </section>
    </main>
  );
}
