'use client';

import { useEffect, useRef, useState } from 'react';
import { createApiClient } from '@platform/api-client';

type Provider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
type Endpoint = 'member-login' | 'member-register';
type PublicConfig = { enabled: boolean; provider: Provider | null; siteKey: string };

type Props = {
  endpoint: Endpoint;
  locale: 'th' | 'en';
  resetKey: number;
  onToken: (token: string) => void;
  onRequiredChange: (required: boolean, ready: boolean) => void;
};

const client = createApiClient({ baseUrl: '', timeoutMs: 10000, retry: 1 });
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

  useEffect(() => {
    let cancelled = false;
    client.request<PublicConfig>(`/api/anti-bot/${endpoint}`, { auth: false, cache: 'no-store' })
      .then((payload) => {
        if (cancelled) return;
        setConfig(payload);
        const ready = !payload.enabled || Boolean(payload.provider && payload.siteKey);
        onRequiredChange(Boolean(payload.enabled), ready);
        if (payload.enabled && !ready) setError(locale === 'th' ? 'ระบบยืนยันความปลอดภัยยังตั้งค่าไม่ครบ' : 'Security verification is not configured correctly');
      })
      .catch(() => {
        if (cancelled) return;
        setError(locale === 'th' ? 'โหลดระบบยืนยันความปลอดภัยไม่สำเร็จ' : 'Could not load security verification');
        onRequiredChange(true, false);
      });
    return () => { cancelled = true; };
  }, [endpoint, locale, onRequiredChange]);

  useEffect(() => {
    if (!config?.enabled || !config.provider || !config.siteKey || !hostRef.current) return;
    let cancelled = false;
    const provider = config.provider;
    providerRef.current = provider;
    const scriptId = `anti-bot-${provider.toLowerCase()}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const render = () => {
      if (cancelled || !hostRef.current) return;
      try {
        const api = provider === 'TURNSTILE' ? (window as any).turnstile : provider === 'RECAPTCHA' ? (window as any).grecaptcha : (window as any).hcaptcha;
        if (!api?.render) throw new Error('provider unavailable');
        hostRef.current.innerHTML = '';
        widgetIdRef.current = api.render(hostRef.current, {
          sitekey: config.siteKey,
          theme: 'dark',
          callback: (token: string) => { setError(''); onToken(token); onRequiredChange(true, true); },
          'expired-callback': () => onToken(''),
          'error-callback': () => { onToken(''); setError(locale === 'th' ? 'การยืนยันมีปัญหา กรุณาลองใหม่' : 'Verification failed. Please try again'); },
        });
      } catch {
        setError(locale === 'th' ? 'เปิดระบบยืนยันความปลอดภัยไม่สำเร็จ' : 'Could not start security verification');
        onRequiredChange(true, false);
      }
    };
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scripts[provider];
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => { setError(locale === 'th' ? 'โหลดผู้ให้บริการ CAPTCHA ไม่สำเร็จ' : 'Could not load the CAPTCHA provider'); onRequiredChange(true, false); };
      document.head.appendChild(script);
    } else if (provider === 'RECAPTCHA' && (window as any).grecaptcha?.ready) {
      (window as any).grecaptcha.ready(render);
    } else render();
    return () => { cancelled = true; };
  }, [config, locale, onRequiredChange, onToken]);

  useEffect(() => {
    const provider = providerRef.current;
    const id = widgetIdRef.current;
    if (!provider || id === null) return;
    const api = provider === 'TURNSTILE' ? (window as any).turnstile : provider === 'RECAPTCHA' ? (window as any).grecaptcha : (window as any).hcaptcha;
    try { api?.reset?.(id); } catch { }
    onToken('');
  }, [resetKey, onToken]);

  if (!config?.enabled && !error) return null;
  return <div style={{ display: 'grid', gap: 8, justifyItems: 'center', overflow: 'hidden' }}>
    <div ref={hostRef} style={{ minHeight: config?.enabled ? 65 : 0, maxWidth: '100%' }} />
    {error && <div role="alert" style={{ color: '#fca5a5', fontSize: 12, textAlign: 'center' }}>{error}</div>}
  </div>;
}
