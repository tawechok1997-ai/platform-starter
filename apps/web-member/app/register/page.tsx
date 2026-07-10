'use client';

import { FormEvent, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { API_URL, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

type Locale = 'th' | 'en';
type Step = 1 | 2 | 3;
const TIMEOUT = 15000;
const REF_KEY = 'member_pending_referral_code';
const LANG_KEY = 'member_locale';

const text = {
  th: { title: 'สมัครสมาชิก', account: 'ข้อมูลบัญชี', bank: 'ข้อมูลส่วนตัวและธนาคาร', review: 'ตรวจสอบข้อมูล', next: 'ถัดไป', back: 'ย้อนกลับ', submit: 'สมัครสมาชิก', loading: 'กำลังสมัคร...', username: 'ชื่อผู้ใช้', phone: 'เบอร์โทรศัพท์', email: 'อีเมล (ไม่บังคับ)', password: 'รหัสผ่าน', referral: 'รหัสแนะนำ (ไม่บังคับ)', fullName: 'ชื่อ-นามสกุลจริง', bankName: 'ธนาคาร', number: 'เลขบัญชี', accountName: 'ชื่อบัญชีธนาคาร', hint: 'ชื่อบัญชีธนาคารต้องตรงกับชื่อจริงที่ใช้สมัคร', consent: 'ฉันยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว', login: 'มีบัญชีแล้ว? เข้าสู่ระบบ', error: 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล', timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองใหม่' },
  en: { title: 'Create account', account: 'Account', bank: 'Identity and bank', review: 'Review', next: 'Continue', back: 'Back', submit: 'Create account', loading: 'Creating account...', username: 'Username', phone: 'Phone number', email: 'Email (optional)', password: 'Password', referral: 'Referral code (optional)', fullName: 'Full legal name', bankName: 'Bank', number: 'Account number', accountName: 'Bank account name', hint: 'The bank account name must match the full legal name used for registration.', consent: 'I accept the Terms of Use and Privacy Policy', login: 'Already have an account? Sign in', error: 'We could not create your account. Please check the details.', timeout: 'The connection took too long. Please try again.' },
} as const;

export default function RegisterPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [locale, setLocale] = useState<Locale>('th');
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ username: '', phone: '', email: '', secret: '', referralCode: '', fullName: '', bankName: '', bankAccountNumber: '', bankAccountName: '' });
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('member_access_token')) { location.replace('/'); return; }
    const saved = localStorage.getItem(LANG_KEY); if (saved === 'th' || saved === 'en') setLocale(saved);
    const ref = new URLSearchParams(location.search).get('ref') || localStorage.getItem(REF_KEY) || '';
    if (ref) setForm((v) => ({ ...v, referralCode: cleanRef(ref) }));
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const t = text[locale];
  const flags = memberFeatureFlags(settings);
  const maintenance = Boolean(settings.maintenance?.enabled || settings.maintenance?.member_enabled || settings.website?.maintenance_mode);
  const disabled = loading || maintenance || !flags.registration;
  const logo = textSetting(settings, 'branding', 'logo_url', '');
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const brand = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const cssVars = { '--color-brand': textSetting(settings, 'branding', 'primary_color', '#f5c542'), '--color-bg': textSetting(settings, 'branding', 'background_color', '#080808'), '--color-card': textSetting(settings, 'branding', 'card_color', '#181818'), '--color-text': textSetting(settings, 'branding', 'text_color', '#ffffff') } as CSSProperties;

  function update(key: keyof typeof form, value: string) { setForm((v) => ({ ...v, [key]: value })); setMessage(''); }
  function toggleLocale() { const next = locale === 'th' ? 'en' : 'th'; setLocale(next); localStorage.setItem(LANG_KEY, next); }

  function validate(target: Step) {
    if (target === 1) {
      if (form.username.trim().length < 3) return locale === 'th' ? 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' : 'Username must have at least 3 characters.';
      if (!form.phone.trim()) return locale === 'th' ? 'กรุณากรอกเบอร์โทรศัพท์' : 'Enter your phone number.';
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return locale === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Enter a valid email address.';
      if (form.secret.length < 6) return locale === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must have at least 6 characters.';
    }
    if (target === 2) {
      if (form.fullName.trim().length < 2) return locale === 'th' ? 'กรุณากรอกชื่อ-นามสกุลจริง' : 'Enter your full legal name.';
      if (form.bankName.trim().length < 2) return locale === 'th' ? 'กรุณาระบุธนาคาร' : 'Enter your bank.';
      if (!/^\d{6,20}$/.test(form.bankAccountNumber)) return locale === 'th' ? 'เลขบัญชีต้องเป็นตัวเลข 6-20 หลัก' : 'Account number must contain 6-20 digits.';
      if (normalizeName(form.fullName) !== normalizeName(form.bankAccountName)) return t.hint;
    }
    if (target === 3 && !consent) return locale === 'th' ? 'กรุณายอมรับข้อกำหนดก่อนสมัคร' : 'Accept the terms before continuing.';
    return '';
  }

  function next() { const error = validate(step); if (error) { setMessage(error); return; } setStep((Math.min(3, step + 1)) as Step); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) { next(); return; }
    const error = validate(3); if (error) { setMessage(error); return; }
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT);
    setLoading(true); setMessage('');
    try {
      const res = await fetch(`${API_URL}/member/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ ...form, email: form.email || undefined, referralCode: form.referralCode || undefined, deviceId: 'web-member' }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(Array.isArray(data?.message) ? data.message[0] : data?.message || t.error); return; }
      if (!data?.accessToken || !data?.refreshToken) { setMessage(t.error); return; }
      localStorage.setItem('member_access_token', data.accessToken); localStorage.setItem('member_refresh_token', data.refreshToken); localStorage.removeItem(REF_KEY); location.replace('/');
    } catch (error) { setMessage(error instanceof DOMException && error.name === 'AbortError' ? t.timeout : t.error); }
    finally { clearTimeout(timer); setLoading(false); }
  }

  const labels = [t.account, t.bank, t.review];
  return <main className="public-auth-page" style={cssVars}><section className="public-auth-shell" style={{ maxWidth: 520 }}><form className="public-auth-card" onSubmit={submit} noValidate>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" className="public-auth-language" onClick={toggleLocale}>{locale === 'th' ? 'EN' : 'ไทย'}</button></div>
    <div className="public-auth-card__logo"><span>{logo ? <img src={logo} alt={siteName} /> : brand}</span></div>
    <div className="public-auth-heading"><h2>{t.title}</h2><p>{step} / 3 · {labels[step - 1]}</p></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>{labels.map((x, i) => <span key={x} style={{ height: 4, borderRadius: 99, background: i < step ? 'var(--color-brand)' : 'rgba(255,255,255,.12)' }} />)}</div>
    {message && <div className="public-auth-alert public-auth-alert--error" role="alert">{message}</div>}

    {step === 1 && <>
      <Field label={t.username}><input className="public-auth-input" value={form.username} onChange={(e) => update('username', e.target.value)} disabled={disabled} autoComplete="username" /></Field>
      <Field label={t.phone}><input className="public-auth-input" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/[^0-9+]/g, ''))} disabled={disabled} inputMode="tel" autoComplete="tel" /></Field>
      <Field label={t.email}><input className="public-auth-input" value={form.email} onChange={(e) => update('email', e.target.value)} disabled={disabled} type="email" autoComplete="email" /></Field>
      <Field label={t.password}><input className="public-auth-input" value={form.secret} onChange={(e) => update('secret', e.target.value)} disabled={disabled} type="password" autoComplete="new-password" /></Field>
      <Field label={t.referral}><input className="public-auth-input" value={form.referralCode} onChange={(e) => update('referralCode', cleanRef(e.target.value))} disabled={disabled} /></Field>
    </>}

    {step === 2 && <>
      <Field label={t.fullName}><input className="public-auth-input" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} disabled={disabled} autoComplete="name" /></Field>
      <Field label={t.bankName}><input className="public-auth-input" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} disabled={disabled} /></Field>
      <Field label={t.number}><input className="public-auth-input" value={form.bankAccountNumber} onChange={(e) => update('bankAccountNumber', e.target.value.replace(/\D/g, '').slice(0, 20))} disabled={disabled} inputMode="numeric" /></Field>
      <Field label={t.accountName}><input className="public-auth-input" value={form.bankAccountName} onChange={(e) => update('bankAccountName', e.target.value)} disabled={disabled} autoComplete="name" /></Field>
      <div className="public-auth-alert public-auth-alert--info">{t.hint}</div>
    </>}

    {step === 3 && <>
      <Review label={t.username} value={form.username} /><Review label={t.phone} value={form.phone} /><Review label={t.fullName} value={form.fullName} /><Review label={t.bankName} value={form.bankName} /><Review label={t.number} value={mask(form.bankAccountNumber)} /><Review label={t.accountName} value={form.bankAccountName} />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={disabled} /><span>{t.consent}</span></label>
    </>}

    <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1fr' : '.6fr 1fr', gap: 10 }}>
      {step > 1 && <button type="button" className="public-auth-submit" style={{ background: 'rgba(255,255,255,.1)', color: 'var(--color-text)' }} onClick={() => { setStep((step - 1) as Step); setMessage(''); }} disabled={disabled}>{t.back}</button>}
      <button type="submit" className="public-auth-submit" disabled={disabled}>{loading ? t.loading : step < 3 ? t.next : t.submit}</button>
    </div>
    {flags.login && <p className="public-auth-footer"><a href="/login">{t.login}</a></p>}
  </form></section></main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="public-auth-field"><span>{label}</span>{children}</label>; }
function Review({ label, value }: { label: string; value: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}><span style={{ opacity: .68 }}>{label}</span><strong style={{ textAlign: 'right' }}>{value || '-'}</strong></div>; }
function cleanRef(value: string) { return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24); }
function normalizeName(value: string) { return value.normalize('NFKC').toLocaleLowerCase('th-TH').replace(/[\s.\-_'’]/g, ''); }
function mask(value: string) { return value.length > 4 ? `${'•'.repeat(value.length - 4)}${value.slice(-4)}` : value; }
