'use client';

import type { CSSProperties, FormEvent } from 'react';
import Link from 'next/link';
import { AntiBotWidget } from '../../../app/(auth)/anti-bot-widget';

export type RegisterLocale = 'th' | 'en';
export type RegisterStep = 1 | 2 | 3;
export type RegisterErrorKey = 'username' | 'phone' | 'email' | 'secret' | 'confirmSecret' | 'fullName' | 'bankName' | 'bankAccountNumber' | 'gender' | 'terms';
export type RegisterErrors = Partial<Record<RegisterErrorKey, string>>;
export type RegisterStatus = 'idle' | 'success' | 'error' | 'info';

export type RegisterCopy = {
  title: string; subtitle: string; account: string; identity: string; review: string;
  username: string; phone: string; email: string; password: string; confirmPassword: string; referral: string;
  fullName: string; bankName: string; bankPlaceholder: string; bankAccountNumber: string;
  gender: string; male: string; female: string; next: string; back: string; submit: string; submitting: string; show: string; hide: string;
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
  confirmSecret: string;
  referralCode: string;
  fullName: string;
  bankName: string;
  bankAccountNumber: string;
  gender: string;
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
  embedded?: boolean;
  onClose?: () => void;
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
    cssVars, locale, step, t, siteName, banks, phone, secret, confirmSecret,
    fullName, bankName, bankAccountNumber, gender, acceptedTerms, errors, message, status,
    loading, disabled, showSecret, passwordProgress, registrationEnabled, loginEnabled,
    maintenanceEnabled, captchaResetKey, selectedBankLabel, embedded = false, onClose, onSubmit,
    onFieldChange, onAcceptedTermsChange, onShowSecretToggle, onBack,
    onCaptchaToken, onCaptchaState,
  } = props;

  const closeLabel = locale === 'th' ? 'ปิดหน้าต่าง' : 'Close window';
  const registerLabel = locale === 'th' ? 'สมัครสมาชิก' : 'Register';
  const supportPrompt = locale === 'th' ? 'พบปัญหาการใช้งาน' : 'Having trouble?';
  const supportLabel = locale === 'th' ? 'ติดต่อเจ้าหน้าที่' : 'Contact support';
  const registerHref = embedded ? '/register?embed=1' : '/register';
  const loginHref = embedded ? '/login?embed=1' : '/login';

  return <main className="public-auth-page source-login-page source-register-page" style={cssVars} data-embedded={embedded ? 'true' : 'false'} data-site-name={siteName}>
    <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="public-auth-backdrop" aria-hidden="true" />
    <section className="public-auth-shell public-auth-shell--register public-auth-modal source-login-modal source-register-modal" data-auth-mode="register" role="dialog" aria-modal="true" aria-labelledby="member-register-title">
      <button type="button" className="public-auth-close source-login-close" aria-label={closeLabel} onClick={onClose}>
        <span>{closeLabel}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10.8837 10L15 5.88375L14.1163 5L10 9.11625L5.88375 5L5 5.88375L9.11625 10L5 14.1163L5.88375 15L10 10.8837L14.1163 15L15 14.1163L10.8837 10Z" fill="currentColor" /></svg>
      </button>

      <div className="source-login-visual" aria-hidden="true">
        <img src="/assets/asset-pc/images/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </div>

      <div className="source-login-form-shell">
        <nav className="public-auth-tabs source-login-tabs source-register-tabs" aria-label={locale === 'th' ? 'บัญชีสมาชิก' : 'Member account'}>
          <Link href={registerHref} aria-current="page">{registerLabel}</Link>
          {loginEnabled && <Link href={loginHref}>{t.login}</Link>}
        </nav>

        <form className="public-auth-card source-login-card source-register-card" onSubmit={onSubmit} noValidate>
          <div className="public-auth-heading source-login-heading source-register-heading">
            <h1 id="member-register-title">{t.title}</h1>
          </div>

          <div className="public-auth-progress source-register-progress">
            <div><span>{t.step} {step}/3</span><span>{step === 1 ? t.account : step === 2 ? t.identity : t.review}</span></div>
            <div><span style={{ width: `${step * 33.333}%` }} /></div>
          </div>

          {(maintenanceEnabled || !registrationEnabled) && <div className="public-auth-alert public-auth-alert--error" role="alert">{maintenanceEnabled ? t.maintenance : t.registrationDisabled}</div>}
          {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}

          {step === 1 && <div className="source-register-step source-register-step--phone">
            <Field label={t.phone} id="register-phone" value={phone} onChange={(value) => onFieldChange('phone', value)} error={errors.phone} disabled={disabled} autoComplete="tel" inputMode="tel" />
          </div>}

          {step === 2 && <div className="source-register-step source-register-step--details">
            <Field label={t.phone} id="register-phone-confirmed" value={phone} onChange={() => undefined} disabled readOnly verified />
            <label className="public-auth-field source-login-field" htmlFor="register-secret"><span className="public-auth-field-label">{t.password}</span><div className="public-auth-input-wrap"><input id="register-secret" className="public-auth-input ui-input" value={secret} onChange={(event) => onFieldChange('secret', event.target.value)} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="new-password" aria-invalid={Boolean(errors.secret)} /><button type="button" onClick={onShowSecretToggle} className="public-auth-eye source-login-eye" disabled={disabled} aria-label={showSecret ? t.hide : t.show}><PasswordVisibilityIcon visible={showSecret} /></button></div></label>
            {errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}
            <Field label={t.confirmPassword} id="register-confirm-secret" value={confirmSecret} onChange={(value) => onFieldChange('confirmSecret', value)} error={errors.confirmSecret} disabled={disabled} type={showSecret ? 'text' : 'password'} autoComplete="new-password" />
            <div className="public-auth-password-meter source-register-password-meter" aria-hidden="true"><span style={{ width: `${passwordProgress * 100}%` }} /></div>
            <Field label={t.fullName} id="register-full-name" value={fullName} onChange={(value) => onFieldChange('fullName', value)} error={errors.fullName} disabled={disabled} autoComplete="name" />
            <label className="public-auth-field source-login-field" htmlFor="register-bank-name"><span className="public-auth-field-label">{t.bankName}</span><select id="register-bank-name" className="public-auth-input ui-input" value={bankName} onChange={(event) => onFieldChange('bankName', event.target.value)} disabled={disabled} aria-invalid={Boolean(errors.bankName)}><option value="">{t.bankPlaceholder}</option>{banks.map(([code, thName, enName]) => <option key={code} value={code}>{locale === 'th' ? thName : enName}</option>)}</select></label>
            {errors.bankName && <span className="public-auth-field-error">{errors.bankName}</span>}
            <Field label={t.bankAccountNumber} id="register-bank-account-number" value={bankAccountNumber} onChange={(value) => onFieldChange('bankAccountNumber', value)} error={errors.bankAccountNumber} disabled={disabled} inputMode="numeric" autoComplete="off" />
          </div>}

          {step === 3 && <div className="source-register-step source-register-step--review">
            <fieldset className="source-register-gender"><legend>{t.gender}</legend><label><input type="radio" name="register-gender" value="male" checked={gender === 'male'} onChange={() => onFieldChange('gender', 'male')} disabled={disabled} /><span>{t.male}</span></label><label><input type="radio" name="register-gender" value="female" checked={gender === 'female'} onChange={() => onFieldChange('gender', 'female')} disabled={disabled} /><span>{t.female}</span></label></fieldset>
            {errors.gender && <span className="public-auth-field-error">{errors.gender}</span>}
            <div className="public-auth-review source-register-review"><ReviewRow label={t.phone} value={phone} /><ReviewRow label={t.fullName} value={fullName} /><ReviewRow label={t.bankName} value={selectedBankLabel} /><ReviewRow label={t.bankAccountNumber} value={maskAccount(bankAccountNumber)} /></div>
            <label className="public-auth-terms source-register-terms"><input type="checkbox" checked={acceptedTerms} onChange={(event) => onAcceptedTermsChange(event.target.checked)} disabled={disabled} /><span>{t.terms}</span></label>
            {errors.terms && <span className="public-auth-field-error">{errors.terms}</span>}
            <AntiBotWidget endpoint="member-register" locale={locale} resetKey={captchaResetKey} onToken={onCaptchaToken} onRequiredChange={onCaptchaState} />
          </div>}

          <div className={`public-auth-form-actions source-register-actions${step > 1 ? ' has-back' : ''}`}>
            {step > 1 && <button type="button" onClick={onBack} disabled={disabled} className="public-auth-submit public-auth-submit--secondary source-register-back"><span>{t.back}</span></button>}
            <button type="submit" disabled={disabled} className="public-auth-submit source-login-submit source-register-submit ui-button ui-button--primary"><span>{loading ? t.submitting : step < 3 ? t.next : t.submit}</span><i aria-hidden="true" /></button>
          </div>

          {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
          <div className="source-login-divider" aria-hidden="true" />
          <div className="source-login-support"><span>{supportPrompt}</span><Link href="/support">{supportLabel}</Link></div>
        </form>
      </div>
    </section>
  </main>;
}

function Field({ label, id, value, onChange, error, disabled, readOnly = false, verified = false, type = 'text', autoComplete, inputMode }: { label: string; id: string; value: string; onChange: (value: string) => void; error?: string | undefined; disabled: boolean; readOnly?: boolean; verified?: boolean; type?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'search' | 'url' | 'none'; }) {
  return <><label className={`public-auth-field source-login-field${verified ? ' is-verified' : ''}`} htmlFor={id}><span className="public-auth-field-label">{label}</span><span className="source-register-input-status">{verified ? '✓' : ''}</span><input id={id} className="public-auth-input ui-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled && !readOnly} readOnly={readOnly} type={type} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} /></label>{error && <span className="public-auth-field-error">{error}</span>}</>;
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M1.8 10s2.8-5 8.2-5 8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" /></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 3l14 14M8.1 5.3A8.9 8.9 0 0 1 10 5c5.4 0 8.2 5 8.2 5a13 13 0 0 1-2.1 2.8M12.2 14.7A8.8 8.8 0 0 1 10 15c-5.4 0-8.2-5-8.2-5a13 13 0 0 1 2.3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M7.9 7.9A3 3 0 0 0 12.1 12.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || '-'}</strong></div>; }
function maskAccount(value: string) { return value.length > 4 ? `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value; }
