'use client';

import type { CSSProperties, FormEvent } from 'react';
import { AntiBotWidget } from '../../../app/(auth)/anti-bot-widget';

export type RegisterLocale = 'th' | 'en';
export type RegisterStep = 1 | 2 | 3;
export type RegisterErrorKey = 'username' | 'phone' | 'email' | 'secret' | 'fullName' | 'bankName' | 'bankAccountNumber' | 'terms';
export type RegisterErrors = Partial<Record<RegisterErrorKey, string>>;
export type RegisterStatus = 'idle' | 'success' | 'error' | 'info';

export type RegisterCopy = {
  title: string; subtitle: string; account: string; identity: string; review: string;
  username: string; phone: string; email: string; password: string; referral: string;
  fullName: string; bankName: string; bankPlaceholder: string; bankAccountNumber: string;
  next: string; back: string; submit: string; submitting: string; show: string; hide: string;
  loginPrompt: string; login: string; terms: string; nameRule: string; step: string;
  registrationDisabled: string; maintenance: string;
};

type BankOption = readonly [string, string, string];

export type RegisterViewProps = {
  cssVars: CSSProperties;
  locale: RegisterLocale;
  step: RegisterStep;
  t: RegisterCopy;
  siteName: string;
  logoUrl: string;
  brandMark: string;
  banks: readonly BankOption[];
  username: string;
  phone: string;
  email: string;
  secret: string;
  referralCode: string;
  fullName: string;
  bankName: string;
  bankAccountNumber: string;
  acceptedTerms: boolean;
  errors: RegisterErrors;
  message: string;
  status: RegisterStatus;
  loading: boolean;
  disabled: boolean;
  showSecret: boolean;
  passwordProgress: number;
  registrationEnabled: boolean;
  loginEnabled: boolean;
  maintenanceEnabled: boolean;
  captchaResetKey: number;
  selectedBankLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLocaleChange: (locale: RegisterLocale) => void;
  onFieldChange: (field: RegisterErrorKey | 'referralCode', value: string) => void;
  onAcceptedTermsChange: (value: boolean) => void;
  onShowSecretToggle: () => void;
  onBack: () => void;
  onCaptchaToken: (token: string) => void;
  onCaptchaState: (required: boolean, ready: boolean) => void;
};

export function RegisterView(props: RegisterViewProps) {
  const {
    cssVars, locale, step, t, siteName, logoUrl, brandMark, banks, username, phone, email, secret,
    referralCode, fullName, bankName, bankAccountNumber, acceptedTerms, errors, message, status,
    loading, disabled, showSecret, passwordProgress, registrationEnabled, loginEnabled,
    maintenanceEnabled, captchaResetKey, selectedBankLabel, onSubmit, onLocaleChange, onFieldChange,
    onAcceptedTermsChange, onShowSecretToggle, onBack, onCaptchaToken, onCaptchaState,
  } = props;

  return <main className="public-auth-page" style={cssVars}>
    <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="public-auth-scene" aria-hidden="true"><span className="public-auth-scene__tower" /><span className="public-auth-scene__tower public-auth-scene__tower--small" /><span className="public-auth-scene__arc" /><span className="public-auth-scene__light" /></div>
    <section className="public-auth-shell public-auth-shell--register">
      <aside className="public-auth-brand-panel">
        <div className="public-auth-brand-kicker"><span /> {locale === 'th' ? 'เริ่มต้นใช้งาน' : 'Get started'}</div>
        <div className="public-auth-brand-lockup"><span className="public-auth-brand__mark">{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</span><strong>{siteName}</strong></div>
        <h2>{locale === 'th' ? 'สมัครครั้งเดียว พร้อมใช้ทุกระบบ' : 'One account. Every experience.'}</h2>
        <p>{locale === 'th' ? 'ขั้นตอนสั้น ชัดเจน และตรวจสอบข้อมูลก่อนสร้างบัญชี เพื่อให้ฝากถอนและยืนยันตัวตนได้อย่างราบรื่น' : 'A short, guided setup with a final review so your account and payment details are ready from day one.'}</p>
        <div className="public-auth-steps-preview"><div className={step >= 1 ? 'active' : ''}><span>1</span><p><strong>{t.account}</strong><small>{locale === 'th' ? 'บัญชีและการเข้าสู่ระบบ' : 'Account and sign-in'}</small></p></div><div className={step >= 2 ? 'active' : ''}><span>2</span><p><strong>{t.identity}</strong><small>{locale === 'th' ? 'ชื่อจริงและบัญชีธนาคาร' : 'Identity and banking'}</small></p></div><div className={step >= 3 ? 'active' : ''}><span>3</span><p><strong>{t.review}</strong><small>{locale === 'th' ? 'ยืนยันก่อนสร้างบัญชี' : 'Confirm before creation'}</small></p></div></div>
        <div className="public-auth-security-card"><span className="public-auth-security-card__icon">◇</span><div><strong>{locale === 'th' ? 'ข้อมูลสมัครสมาชิกถูกเข้ารหัส' : 'Registration data is encrypted'}</strong><small>{locale === 'th' ? 'ตรวจสอบข้อมูลอย่างปลอดภัยทุกขั้นตอน' : 'Secure verification at every step'}</small></div></div>
      </aside>
      <form className="public-auth-card" onSubmit={onSubmit} noValidate>
        <div className="public-auth-card-topbar"><div className="public-auth-card__logo"><span>{logoUrl ? <img src={logoUrl} alt={siteName} /> : brandMark}</span><strong style={{ maxWidth: 'min(170px, 44vw)' }}>{siteName}</strong></div><div aria-label="Language" className="public-auth-language"><button type="button" onClick={() => onLocaleChange('th')} aria-pressed={locale === 'th'} className="public-auth-language__button">ไทย</button><button type="button" onClick={() => onLocaleChange('en')} aria-pressed={locale === 'en'} className="public-auth-language__button">EN</button></div></div>
        <div className="public-auth-heading"><span className="public-auth-heading__eyebrow">{locale === 'th' ? 'สร้างบัญชีสมาชิก' : 'CREATE MEMBER ACCOUNT'}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <div className="public-auth-progress"><div><span>{t.step} {step}/3</span><span>{step === 1 ? t.account : step === 2 ? t.identity : t.review}</span></div><div><span style={{ width: `${step * 33.333}%` }} /></div></div>
        {(maintenanceEnabled || !registrationEnabled) && <div className="public-auth-alert public-auth-alert--error" role="alert">{maintenanceEnabled ? t.maintenance : t.registrationDisabled}</div>}
        {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}

        {step === 1 && <>
          <Field label={t.username} id="register-username" value={username} onChange={(value) => onFieldChange('username', value)} error={errors.username} disabled={disabled} autoComplete="username" />
          <Field label={t.phone} id="register-phone" value={phone} onChange={(value) => onFieldChange('phone', value)} error={errors.phone} disabled={disabled} autoComplete="tel" inputMode="tel" />
          <Field label={t.email} id="register-email" value={email} onChange={(value) => onFieldChange('email', value)} error={errors.email} disabled={disabled} autoComplete="email" type="email" />
          <label className="public-auth-field" htmlFor="register-secret">{t.password}<div className="public-auth-input-wrap"><input id="register-secret" className="public-auth-input" value={secret} onChange={(event) => onFieldChange('secret', event.target.value)} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="new-password" style={{ paddingRight: 58 }} aria-invalid={Boolean(errors.secret)} /><button type="button" onClick={onShowSecretToggle} className="public-auth-eye" disabled={disabled}>{showSecret ? t.hide : t.show}</button></div></label>
          <div className="public-auth-password-meter" aria-hidden="true"><span style={{ width: `${passwordProgress * 100}%` }} /></div>{errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}
          <Field label={t.referral} id="register-referral" value={referralCode} onChange={(value) => onFieldChange('referralCode', value)} disabled={disabled} autoComplete="off" />
        </>}

        {step === 2 && <>
          <Field label={t.fullName} id="register-full-name" value={fullName} onChange={(value) => onFieldChange('fullName', value)} error={errors.fullName} disabled={disabled} autoComplete="name" />
          <label className="public-auth-field" htmlFor="register-bank-name">{t.bankName}<select id="register-bank-name" className="public-auth-input" value={bankName} onChange={(event) => onFieldChange('bankName', event.target.value)} disabled={disabled} aria-invalid={Boolean(errors.bankName)}><option value="">{t.bankPlaceholder}</option>{banks.map(([code, thName, enName]) => <option key={code} value={code}>{locale === 'th' ? thName : enName}</option>)}</select></label>
          {errors.bankName && <span className="public-auth-field-error">{errors.bankName}</span>}
          <Field label={t.bankAccountNumber} id="register-bank-account-number" value={bankAccountNumber} onChange={(value) => onFieldChange('bankAccountNumber', value)} error={errors.bankAccountNumber} disabled={disabled} inputMode="numeric" autoComplete="off" />
          <div className="public-auth-field-hint">{t.nameRule}</div>
        </>}

        {step === 3 && <>
          <div className="public-auth-review"><ReviewRow label={t.username} value={username} /><ReviewRow label={t.phone} value={phone} /><ReviewRow label={t.fullName} value={fullName} /><ReviewRow label={t.bankName} value={selectedBankLabel} /><ReviewRow label={t.bankAccountNumber} value={maskAccount(bankAccountNumber)} /></div>
          <label className="public-auth-terms"><input type="checkbox" checked={acceptedTerms} onChange={(event) => onAcceptedTermsChange(event.target.checked)} disabled={disabled} /><span>{t.terms}</span></label>
          {errors.terms && <span className="public-auth-field-error">{errors.terms}</span>}
          <AntiBotWidget endpoint="member-register" locale={locale} resetKey={captchaResetKey} onToken={onCaptchaToken} onRequiredChange={onCaptchaState} />
        </>}

        <div className={`public-auth-form-actions${step > 1 ? ' has-back' : ''}`}>{step > 1 && <button type="button" onClick={onBack} disabled={disabled} className="public-auth-submit public-auth-submit--secondary">{t.back}</button>}<button type="submit" disabled={disabled} className="public-auth-submit">{loading ? t.submitting : step < 3 ? t.next : t.submit}</button></div>
        {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
        {loginEnabled && <p className="public-auth-footer">{t.loginPrompt} <a href="/login">{t.login}</a></p>}
        <div className="public-auth-legal"><span>{locale === 'th' ? 'การสมัครที่ปลอดภัย' : 'Secure registration'}</span><a href="/legal/privacy">{locale === 'th' ? 'ความเป็นส่วนตัว' : 'Privacy'}</a><a href="/legal/terms">{locale === 'th' ? 'เงื่อนไข' : 'Terms'}</a></div>
      </form>
    </section>
  </main>;
}

function Field({ label, id, value, onChange, error, disabled, type = 'text', autoComplete, inputMode }: { label: string; id: string; value: string; onChange: (value: string) => void; error?: string | undefined; disabled: boolean; type?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'search' | 'url' | 'none'; }) {
  return <><label className="public-auth-field" htmlFor={id}>{label}<input id={id} className="public-auth-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} type={type} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} /></label>{error && <span className="public-auth-field-error">{error}</span>}</>;
}
function ReviewRow({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || '-'}</strong></div>; }
function maskAccount(value: string) { return value.length > 4 ? `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value; }
