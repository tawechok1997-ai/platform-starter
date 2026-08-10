'use client';

import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../member-api';

type Provider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
type Endpoint = 'member-login' | 'member-register' | 'member-password-reset';
type PublicConfig = { enabled: boolean; provider: Provider | null; siteKey: string };

type Props = {
  endpoint: Endpoint;
  locale: 'th' | 'en';
  resetKey: number;
  onToken: (token: string) => void;
  onRequiredChange: (required: boolean, ready: boolean) => void;
};

const scripts: Record<Provider, string> = {
  TURNSTILE: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  RECAPTCHA: 'https://www.google.com/recaptcha/api.js?render=explicit',
  HCAPTCHA: 'https://js.hcaptcha.com/1/api.js?render=explicit',
};

export function AntiBotWidget({ endpoint, locale, resetKey, onToken, onRequiredChange }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const providerRef = useRef<Provider | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState('');
  const [nonBlockingWarning, setNonBlockingWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setError('');
    setNonBlockingWarning(false);

    // Ask the public API directly so adaptive CAPTCHA sees the same client IP
    // that the subsequent login/register POST will see. The old same-origin
    // Next proxy could make the config request look like it came from Railway,
    // while the auth POST came from the real browser IP, producing a false
    // "CAPTCHA not required" result followed by CAPTCHA_REQUIRED on submit.
    const base = API_URL.replace(/\/+$/, '');
    fetch(`${base}/public/anti-bot/${endpoint}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`anti-bot config ${response.status}`);
        return response.json() as Promise<PublicConfig>;
      })
      .then((payload) => {
        if (cancelled) return;
        setConfig(payload);
        const ready = !payload.enabled || Boolean(payload.provider && payload.siteKey);
        onRequiredChange(Boolean(payload.enabled), ready);
        if (payload.enabled && !ready) {
          setNonBlockingWarning(true);
          setError(locale === 'th'
            ? 'ระบบยืนยันความปลอดภัยยังตั้งค่าไม่ครบ ระบบจะตรวจอีกครั้งตอนส่งข้อมูล'
            : 'Security verification is not configured correctly. It will be checked again on submit.');
          onRequiredChange(false, true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Do not freeze the form on a transient config/CORS failure. The auth
        // API remains authoritative and a failed submit increments resetKey,
        // which rechecks this config immediately instead of leaving a stale
        // "not required" decision mounted for the lifetime of the form.
        setConfig({ enabled: false, provider: null, siteKey: '' });
        setNonBlockingWarning(true);
        setError(locale === 'th'
          ? 'ตรวจสอบสถานะระบบยืนยันความปลอดภัยไม่ได้ ระบบจะตรวจอีกครั้งตอนส่งข้อมูล'
          : 'Security verification status is unavailable. It will be checked again on submit.');
        onRequiredChange(false, true);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [endpoint, locale, onRequiredChange, resetKey]);

  useEffect(() => {
    if (!config?.enabled || !config.provider || !config.siteKey || !hostRef.current) return;
    let cancelled = false;
    const provider = config.provider;
    providerRef.current = provider;
    const scriptId = `anti-bot-${provider.toLowerCase()}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const warnWithoutFreezing = (message: string) => {
      onToken('');
      setNonBlockingWarning(true);
      setError(message);
      // Browser extensions, CSP rules, or a temporary provider outage must not
      // leave Login/Register disabled forever. The API remains authoritative.
      onRequiredChange(false, true);
    };

    const render = () => {
      if (cancelled || !hostRef.current) return;
      try {
        const api = provider === 'TURNSTILE'
          ? (window as any).turnstile
          : provider === 'RECAPTCHA'
            ? (window as any).grecaptcha
            : (window as any).hcaptcha;
        if (!api?.render) throw new Error('provider unavailable');
        hostRef.current.innerHTML = '';
        widgetIdRef.current = api.render(hostRef.current, {
          sitekey: config.siteKey,
          theme: 'dark',
          callback: (token: string) => {
            setError('');
            setNonBlockingWarning(false);
            onToken(token);
            onRequiredChange(true, true);
          },
          'expired-callback': () => onToken(''),
          'error-callback': () => warnWithoutFreezing(locale === 'th'
            ? 'การยืนยันมีปัญหา ระบบจะตรวจอีกครั้งตอนส่งข้อมูล'
            : 'Verification failed. It will be checked again on submit.'),
        });
      } catch {
        warnWithoutFreezing(locale === 'th'
          ? 'เปิดระบบยืนยันความปลอดภัยไม่สำเร็จ ระบบจะตรวจอีกครั้งตอนส่งข้อมูล'
          : 'Could not start security verification. It will be checked again on submit.');
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scripts[provider];
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => warnWithoutFreezing(locale === 'th'
        ? 'โหลดผู้ให้บริการ CAPTCHA ไม่สำเร็จ ระบบจะตรวจอีกครั้งตอนส่งข้อมูล'
        : 'Could not load the CAPTCHA provider. It will be checked again on submit.');
      document.head.appendChild(script);
    } else if (provider === 'RECAPTCHA' && (window as any).grecaptcha?.ready) {
      (window as any).grecaptcha.ready(render);
    } else {
      render();
    }
    return () => { cancelled = true; };
  }, [config, locale, onRequiredChange, onToken]);

  useEffect(() => {
    const provider = providerRef.current;
    const id = widgetIdRef.current;
    if (!provider || id === null) return;
    const api = provider === 'TURNSTILE'
      ? (window as any).turnstile
      : provider === 'RECAPTCHA'
        ? (window as any).grecaptcha
        : (window as any).hcaptcha;
    try {
      api?.reset?.(id);
    } catch {
      // Clearing the local token is enough when the provider already removed the widget.
    }
    onToken('');
  }, [resetKey, onToken]);

  if (!config?.enabled && !error) return null;
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center', overflow: 'hidden' }}>
      <div ref={hostRef} style={{ minHeight: config?.enabled ? 65 : 0, maxWidth: '100%' }} />
      {error ? (
        <div
          role={nonBlockingWarning ? 'status' : 'alert'}
          aria-live={nonBlockingWarning ? 'polite' : 'assertive'}
          style={{ color: nonBlockingWarning ? '#facc15' : '#fca5a5', fontSize: 12, textAlign: 'center' }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
