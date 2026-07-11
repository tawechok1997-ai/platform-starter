'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
type Locale = 'th' | 'en';
type Step = 'checking' | 'details' | 'success' | 'invalid';

const copy = {
  th: {
    title: 'เปิดใช้งานบัญชีผู้ดูแล',
    subtitle: 'ตรวจคำเชิญและตั้งค่าบัญชีของคุณ',
    checking: 'กำลังตรวจสอบคำเชิญ...',
    invalid: 'คำเชิญไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว',
    username: 'ชื่อผู้ใช้',
    usernamePlaceholder: 'ตัวอักษร ตัวเลข จุด ขีดล่าง หรือขีดกลาง',
    password: 'รหัสผ่าน',
    passwordPlaceholder: 'อย่างน้อย 12 ตัวอักษร พร้อมตัวอักษรและตัวเลข',
    confirm: 'ยืนยันรหัสผ่าน',
    confirmPlaceholder: 'กรอกรหัสผ่านอีกครั้ง',
    show: 'แสดง',
    hide: 'ซ่อน',
    submit: 'เปิดใช้งานบัญชี',
    submitting: 'กำลังเปิดใช้งาน...',
    mismatch: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    success: 'เปิดใช้งานบัญชีสำเร็จ',
    successDetail: 'เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่เพิ่งตั้งค่า',
    login: 'ไปหน้าเข้าสู่ระบบ',
    genericError: 'ไม่สามารถเปิดใช้งานบัญชีได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่',
    email: 'อีเมล',
    role: 'สิทธิ์ที่ได้รับ',
    expires: 'คำเชิญหมดอายุ',
  },
  en: {
    title: 'Activate admin account',
    subtitle: 'Verify the invitation and set up your account',
    checking: 'Checking the invitation...',
    invalid: 'This invitation is invalid, expired, or already used',
    username: 'Username',
    usernamePlaceholder: 'Letters, numbers, dots, underscores, or hyphens',
    password: 'Password',
    passwordPlaceholder: 'At least 12 characters with letters and numbers',
    confirm: 'Confirm password',
    confirmPlaceholder: 'Enter the password again',
    show: 'Show',
    hide: 'Hide',
    submit: 'Activate account',
    submitting: 'Activating...',
    mismatch: 'The passwords do not match',
    success: 'Account activated',
    successDetail: 'Sign in with the username and password you just created',
    login: 'Go to sign in',
    genericError: 'Could not activate the account. Check the information and try again',
    email: 'Email',
    role: 'Assigned access',
    expires: 'Invitation expires',
  },
} as const;

export default function AcceptInvitationPage() {
  const [locale, setLocale] = useState<Locale>('th');
  const [step, setStep] = useState<Step>('checking');
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState<{ email: string; expiresAt: string; roles: Array<{ id: string; code: string; name: string }> } | null>(null);
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('admin_locale');
    if (saved === 'th' || saved === 'en') setLocale(saved);
    const value = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(value);
    if (!value) {
      setStep('invalid');
      return;
    }
    inspect(value);
  }, []);

  const t = copy[locale];

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem('admin_locale', next);
  }

  async function inspect(rawToken: string) {
    try {
      const response = await fetch(`${API_URL}/admin/invitations/inspect?token=${encodeURIComponent(rawToken)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.email) {
        setStep('invalid');
        return;
      }
      setInvite(data);
      setStep('details');
    } catch {
      setStep('invalid');
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (secret !== confirmSecret) {
      setMessage(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username: username.trim(), secret }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof data?.message === 'string' ? data.message : t.genericError);
        return;
      }
      setStep('success');
    } catch {
      setMessage(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-invitation-page" style={pageStyle}>
      <section className="admin-auth-invitation-card" style={cardStyle}>
        <div className="admin-auth-invitation-topbar">
          <div className="admin-auth-invitation-lockup"><div style={logoStyle}>A</div><strong>Admin Console</strong></div>
          <div className="admin-auth-invitation-language" aria-label="Language">
            <button type="button" onClick={() => changeLocale('th')} style={languageButtonStyle(locale === 'th')}>ไทย</button>
            <button type="button" onClick={() => changeLocale('en')} style={languageButtonStyle(locale === 'en')}>EN</button>
          </div>
        </div>
        <div className="admin-auth-invitation-heading">
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>

        {step === 'checking' && <div style={infoStyle}>{t.checking}</div>}
        {step === 'invalid' && <div role="alert" style={errorStyle}>{t.invalid}</div>}

        {step === 'details' && invite && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }} noValidate>
            <div style={summaryStyle}>
              <div><span>{t.email}</span><strong>{invite.email}</strong></div>
              <div><span>{t.role}</span><strong>{invite.roles.map((role) => role.name).join(', ') || '-'}</strong></div>
              <div><span>{t.expires}</span><strong>{new Date(invite.expiresAt).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}</strong></div>
            </div>

            <label style={labelStyle}>{t.username}
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" style={inputStyle} placeholder={t.usernamePlaceholder} disabled={loading} />
            </label>

            <label style={labelStyle}>{t.password}
              <div style={{ position: 'relative' }}>
                <input value={secret} onChange={(event) => setSecret(event.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="new-password" style={{ ...inputStyle, paddingRight: 72 }} placeholder={t.passwordPlaceholder} disabled={loading} />
                <button type="button" onClick={() => setShowSecret((value) => !value)} style={eyeButtonStyle} disabled={loading}>{showSecret ? t.hide : t.show}</button>
              </div>
            </label>

            <label style={labelStyle}>{t.confirm}
              <input value={confirmSecret} onChange={(event) => setConfirmSecret(event.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="new-password" style={inputStyle} placeholder={t.confirmPlaceholder} disabled={loading} />
            </label>

            {message && <div role="alert" style={errorStyle}>{message}</div>}
            <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.65 : 1 }}>{loading ? t.submitting : t.submit}</button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ display: 'grid', gap: 14, textAlign: 'center' }}>
            <div style={successStyle}><strong>{t.success}</strong><span>{t.successDetail}</span></div>
            <a href="/login" style={loginLinkStyle}>{t.login}</a>
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100dvh', padding: 'max(16px, env(safe-area-inset-top)) 14px max(20px, env(safe-area-inset-bottom))', display: 'grid', placeItems: 'center', background: '#080b10', color: '#fff' } as const;
const cardStyle = { width: '100%', maxWidth: 430, display: 'grid', gap: 16, border: '1px solid rgba(255,255,255,.12)', borderRadius: 22, padding: 20, background: '#101722', boxShadow: '0 20px 56px rgba(0,0,0,.3)' } as const;
const logoStyle = { width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', justifySelf: 'center', background: '#f5c542', color: '#111', fontWeight: 950, fontSize: 22 } as const;
const titleStyle = { margin: 0, fontSize: 24, lineHeight: 1.15 } as const;
const subtitleStyle = { margin: '6px 0 0', color: '#9fb0c3', fontSize: 13 } as const;
const languageRowStyle = { display: 'flex', justifyContent: 'center', gap: 8 } as const;
const languageButtonStyle = (active: boolean) => ({ minWidth: 52, minHeight: 38, borderRadius: 999, border: `1px solid ${active ? '#f5c542' : 'rgba(255,255,255,.14)'}`, background: active ? 'rgba(245,197,66,.14)' : 'transparent', color: active ? '#f5c542' : '#c7d0dc', fontWeight: 800 } as const);
const labelStyle = { display: 'grid', gap: 7, fontWeight: 800, fontSize: 14 } as const;
const inputStyle = { width: '100%', minHeight: 50, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', background: '#172231', color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box' } as const;
const eyeButtonStyle = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', minWidth: 48, height: 32, padding: '0 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.88)', fontSize: 13, fontWeight: 650 } as const;
const submitStyle = { minHeight: 50, border: 0, borderRadius: 14, background: '#f5c542', color: '#111', fontWeight: 900, fontSize: 16 } as const;
const infoStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.05)', textAlign: 'center' } as const;
const errorStyle = { border: '1px solid rgba(248,113,113,.36)', borderRadius: 14, padding: 12, background: 'rgba(248,113,113,.10)', color: '#fecaca', fontSize: 13 } as const;
const successStyle = { display: 'grid', gap: 6, border: '1px solid rgba(74,222,128,.34)', borderRadius: 14, padding: 16, background: 'rgba(74,222,128,.10)', color: '#dcfce7' } as const;
const loginLinkStyle = { minHeight: 50, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111', textDecoration: 'none', fontWeight: 900 } as const;
const summaryStyle = { display: 'grid', gap: 10, border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.04)' } as const;
