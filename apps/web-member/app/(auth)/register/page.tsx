'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AntiBotWidget } from '../anti-bot-widget';
import { API_URL, PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

const REFERRAL_CODE_KEY = 'member_pending_referral_code';
type Locale = 'th' | 'en';
type Step = 1 | 2 | 3;
type RegisterErrors = Partial<Record<'username' | 'phone' | 'email' | 'secret' | 'fullName' | 'bankName' | 'bankAccountNumber' | 'terms', string>>;

const THAI_BANKS = [
  ['BBL', 'ธนาคารกรุงเทพ', 'Bangkok Bank'],
  ['KBANK', 'ธนาคารกสิกรไทย', 'Kasikornbank'],
  ['KTB', 'ธนาคารกรุงไทย', 'Krung Thai Bank'],
  ['SCB', 'ธนาคารไทยพาณิชย์', 'Siam Commercial Bank'],
  ['BAY', 'ธนาคารกรุงศรีอยุธยา', 'Bank of Ayudhya'],
  ['TTB', 'ธนาคารทหารไทยธนชาต', 'TMBThanachart Bank'],
  ['GSB', 'ธนาคารออมสิน', 'Government Savings Bank'],
  ['BAAC', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'Bank for Agriculture and Agricultural Cooperatives'],
  ['GHB', 'ธนาคารอาคารสงเคราะห์', 'Government Housing Bank'],
  ['CIMBT', 'ธนาคารซีไอเอ็มบี ไทย', 'CIMB Thai Bank'],
  ['UOBT', 'ธนาคารยูโอบี', 'United Overseas Bank Thailand'],
  ['KKP', 'ธนาคารเกียรตินาคินภัทร', 'Kiatnakin Phatra Bank'],
  ['TISCO', 'ธนาคารทิสโก้', 'TISCO Bank'],
  ['LHFG', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'Land and Houses Bank'],
  ['ICBCT', 'ธนาคารไอซีบีซี (ไทย)', 'ICBC Thailand'],
  ['SME', 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย', 'SME Development Bank of Thailand'],
  ['EXIM', 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย', 'Export-Import Bank of Thailand'],
  ['ISBT', 'ธนาคารอิสลามแห่งประเทศไทย', 'Islamic Bank of Thailand'],
  ['BOC', 'ธนาคารแห่งประเทศจีน (ไทย)', 'Bank of China Thailand'],
  ['CITI', 'ธนาคารซิตี้แบงก์', 'Citibank'],
  ['HSBC', 'ธนาคารเอชเอสบีซี', 'HSBC Thailand'],
  ['SCBT', 'ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)', 'Standard Chartered Thailand'],
] as const;

const copy = {
  th: {
    title: 'สมัครสมาชิก', subtitle: 'กรอกข้อมูลให้ครบในไม่กี่ขั้นตอน', account: 'ข้อมูลบัญชี', identity: 'ข้อมูลส่วนตัวและธนาคาร', review: 'ตรวจสอบข้อมูล',
    username: 'ชื่อผู้ใช้', phone: 'เบอร์โทรศัพท์', email: 'อีเมล (ไม่บังคับ)', password: 'รหัสผ่าน', referral: 'รหัสแนะนำ (ไม่บังคับ)',
    fullName: 'ชื่อ-นามสกุลจริง', bankName: 'ธนาคาร', bankPlaceholder: 'เลือกธนาคาร', bankAccountNumber: 'เลขบัญชี',
    next: 'ถัดไป', back: 'ย้อนกลับ', submit: 'สมัครสมาชิก', submitting: 'กำลังสมัคร...', show: 'แสดง', hide: 'ซ่อน',
    loginPrompt: 'มีบัญชีแล้ว?', login: 'เข้าสู่ระบบ', terms: 'ฉันยืนยันว่าข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน',
    nameRule: 'ระบบจะใช้ชื่อจริงนี้เป็นชื่อบัญชีธนาคารสำหรับตรวจสอบความตรงกัน', checkFields: 'กรุณาตรวจสอบข้อมูลที่ระบุไว้', captchaRequired: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ', success: 'สมัครสมาชิกสำเร็จ', failed: 'สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง', timeout: 'เชื่อมต่อระบบนานเกินไป กรุณาลองอีกครั้ง',
    registrationDisabled: 'ขณะนี้ปิดรับสมัครสมาชิก', maintenance: 'ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง', step: 'ขั้นตอน', invalidResponse: 'ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง',
  },
  en: {
    title: 'Create account', subtitle: 'Complete a few short steps', account: 'Account details', identity: 'Identity and bank', review: 'Review',
    username: 'Username', phone: 'Phone number', email: 'Email (optional)', password: 'Password', referral: 'Referral code (optional)',
    fullName: 'Legal full name', bankName: 'Bank', bankPlaceholder: 'Select a bank', bankAccountNumber: 'Account number',
    next: 'Continue', back: 'Back', submit: 'Create account', submitting: 'Creating account...', show: 'Show', hide: 'Hide',
    loginPrompt: 'Already have an account?', login: 'Sign in', terms: 'I confirm the information is correct and accept the terms of use',
    nameRule: 'This legal name will also be used as the bank account name for verification', checkFields: 'Check the highlighted fields', captchaRequired: 'Complete the security verification', success: 'Account created successfully', failed: 'Could not create the account. Please try again', timeout: 'The connection took too long. Please try again',
    registrationDisabled: 'Registration is temporarily unavailable', maintenance: 'The service is under maintenance. Please try again later', step: 'Step', invalidResponse: 'The server response was incomplete. Please try again.',
  },
} as const;

export default function MemberRegisterPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [locale, setLocale] = useState<Locale>('th');
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) { window.location.replace('/'); return; }
    const savedLocale = window.localStorage.getItem('member_locale');
    if (savedLocale === 'th' || savedLocale === 'en') setLocale(savedLocale);
    const ref = new URLSearchParams(window.location.search).get('ref') ?? window.localStorage.getItem(REFERRAL_CODE_KEY) ?? '';
    const cleanRef = normalizeReferralCode(ref);
    if (cleanRef) { setReferralCode(cleanRef); window.localStorage.setItem(REFERRAL_CODE_KEY, cleanRef); }
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const t = copy[locale];
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const flags = memberFeatureFlags(settings);
  const maintenanceEnabled = Boolean(settings.maintenance?.enabled || settings.maintenance?.member_enabled || settings.website?.maintenance_mode);
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => { setCaptchaRequired(required); setCaptchaReady(ready); }, []);
  const disabled = !flags.registration || maintenanceEnabled || loading || (captchaRequired && !captchaReady);
  const cssVars = useMemo(() => ({ '--color-brand': primaryColor, '--color-bg': backgroundColor, '--color-card': cardColor, '--color-text': textColor }) as React.CSSProperties, [primaryColor, backgroundColor, cardColor, textColor]);
  const passwordProgress = useMemo(() => Math.min(secret.length / 8, 1), [secret]);

  function changeLocale(next: Locale) { setLocale(next); window.localStorage.setItem('member_locale', next); }
  function clearError(name: keyof RegisterErrors) { if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined })); }
  function selectedBankLabel(value: string) { const bank = THAI_BANKS.find(([code]) => code === value); return bank ? (locale === 'th' ? bank[1] : bank[2]) : value; }

  function validateStep(target: Step) {
    const next: RegisterErrors = {};
    if (target === 1) {
      if (username.trim().length < 3) next.username = locale === 'th' ? 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' : 'Username must be at least 3 characters';
      if (!phone.trim()) next.phone = locale === 'th' ? 'กรุณากรอกเบอร์โทรศัพท์' : 'Enter a phone number';
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) next.email = locale === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Enter a valid email address';
      if (secret.length < 6) next.secret = locale === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters';
    }
    if (target === 2) {
      if (fullName.trim().length < 2) next.fullName = locale === 'th' ? 'กรุณากรอกชื่อ-นามสกุลจริง' : 'Enter your legal full name';
      if (!bankName) next.bankName = locale === 'th' ? 'กรุณาเลือกธนาคาร' : 'Select a bank';
      if (!/^\d{6,20}$/.test(bankAccountNumber.trim())) next.bankAccountNumber = locale === 'th' ? 'เลขบัญชีต้องเป็นตัวเลข 6-20 หลัก' : 'Account number must contain 6-20 digits';
    }
    if (target === 3 && !acceptedTerms) next.terms = locale === 'th' ? 'กรุณายอมรับเงื่อนไขก่อนสมัคร' : 'Accept the terms before continuing';
    setErrors(next);
    if (Object.keys(next).length) { setStatus('error'); setMessage(t.checkFields); return false; }
    setStatus('idle'); setMessage(''); return true;
  }

  function goNext() { if (validateStep(step)) setStep((step + 1) as Step); }
  function goBack() { setStatus('idle'); setMessage(''); setStep((step - 1) as Step); }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) { goNext(); return; }
    if (maintenanceEnabled) { setStatus('error'); setMessage(t.maintenance); return; }
    if (!flags.registration) { setStatus('error'); setMessage(t.registrationDisabled); return; }
    if (!validateStep(3)) return;
    if (captchaRequired && (!captchaReady || !captchaToken)) { setStatus('error'); setMessage(t.captchaRequired); return; }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true); setStatus('info'); setMessage(t.submitting);
    const cleanRef = normalizeReferralCode(referralCode);
    const legalName = fullName.trim();

    try {
      const res = await fetch(`${API_URL}/member/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ username: username.trim(), phone: phone.trim(), email: email.trim() || undefined, secret, fullName: legalName, bankName: selectedBankLabel(bankName), bankAccountNumber: bankAccountNumber.trim(), bankAccountName: legalName, referralCode: cleanRef || undefined, captchaToken: captchaToken || undefined, deviceId: 'web-member' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(mapRegisterError(data?.message, locale, t.failed)); setCaptchaResetKey((value) => value + 1); return; }
      if (!data?.accessToken || !data?.refreshToken) { setStatus('error'); setMessage(t.invalidResponse); setCaptchaResetKey((value) => value + 1); return; }
      window.localStorage.setItem('member_access_token', data.accessToken);
      window.localStorage.setItem('member_refresh_token', data.refreshToken);
      if (cleanRef) await linkReferralAfterRegister(cleanRef, data.accessToken);
      setStatus('success'); setMessage(t.success);
      window.location.replace('/');
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally {
      window.clearTimeout(timeoutId); setLoading(false);
    }
  }

  return <main className="public-auth-page" style={cssVars}>
    <div className="public-auth-ambient" aria-hidden="true"><span /><span /><span /></div>
    <section className="public-auth-shell public-auth-shell--register">
      <aside className="public-auth-brand-panel">
        <div className="public-auth-brand-kicker"><span /> {locale === 'th' ? 'เริ่มต้นใช้งาน' : 'Get started'}</div>
        <div className="public-auth-brand-lockup"><span className="public-auth-brand__mark">{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</span><strong>{siteName}</strong></div>
        <h2>{locale === 'th' ? 'สมัครครั้งเดียว พร้อมใช้ทุกระบบ' : 'One account. Every experience.'}</h2>
        <p>{locale === 'th' ? 'ขั้นตอนสั้น ชัดเจน และตรวจสอบข้อมูลก่อนสร้างบัญชี เพื่อให้ฝากถอนและยืนยันตัวตนได้อย่างราบรื่น' : 'A short, guided setup with a final review so your account and payment details are ready from day one.'}</p>
        <div className="public-auth-steps-preview"><div className={step >= 1 ? 'active' : ''}><span>1</span><p><strong>{t.account}</strong><small>{locale === 'th' ? 'บัญชีและการเข้าสู่ระบบ' : 'Account and sign-in'}</small></p></div><div className={step >= 2 ? 'active' : ''}><span>2</span><p><strong>{t.identity}</strong><small>{locale === 'th' ? 'ชื่อจริงและบัญชีธนาคาร' : 'Identity and banking'}</small></p></div><div className={step >= 3 ? 'active' : ''}><span>3</span><p><strong>{t.review}</strong><small>{locale === 'th' ? 'ยืนยันก่อนสร้างบัญชี' : 'Confirm before creation'}</small></p></div></div>
      </aside>
      <form className="public-auth-card" onSubmit={onSubmit} noValidate>
        <div className="public-auth-card__logo"><span>{logoUrl ? <img src={logoUrl} alt={siteName} /> : brandMark}</span></div>
        <div className="public-auth-heading"><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <div aria-label="Language" className="public-auth-language">
          <button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'} className="public-auth-language__button">ไทย</button>
          <button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'} className="public-auth-language__button">EN</button>
        </div>
        <div className="public-auth-progress">
          <div><span>{t.step} {step}/3</span><span>{step === 1 ? t.account : step === 2 ? t.identity : t.review}</span></div>
          <div><span style={{ width: `${step * 33.333}%` }} /></div>
        </div>
        {(maintenanceEnabled || !flags.registration) && <div className="public-auth-alert public-auth-alert--error" role="alert">{maintenanceEnabled ? t.maintenance : t.registrationDisabled}</div>}
        {status === 'error' && message && <div className="public-auth-alert public-auth-alert--error" role="alert" aria-live="assertive">{message}</div>}

        {step === 1 && <>
          <Field label={t.username} id="register-username" value={username} onChange={(value) => { setUsername(value); clearError('username'); }} error={errors.username} disabled={disabled} autoComplete="username" />
          <Field label={t.phone} id="register-phone" value={phone} onChange={(value) => { setPhone(value); clearError('phone'); }} error={errors.phone} disabled={disabled} autoComplete="tel" inputMode="tel" />
          <Field label={t.email} id="register-email" value={email} onChange={(value) => { setEmail(value); clearError('email'); }} error={errors.email} disabled={disabled} autoComplete="email" type="email" />
          <label className="public-auth-field" htmlFor="register-secret">{t.password}<div className="public-auth-input-wrap"><input id="register-secret" className="public-auth-input" value={secret} onChange={(event) => { setSecret(event.target.value); clearError('secret'); }} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="new-password" style={{ paddingRight: 58 }} aria-invalid={Boolean(errors.secret)} /><button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye" disabled={disabled}>{showSecret ? t.hide : t.show}</button></div></label>
          <div className="public-auth-password-meter" aria-hidden="true"><span style={{ width: `${passwordProgress * 100}%` }} /></div>{errors.secret && <span className="public-auth-field-error">{errors.secret}</span>}
          <Field label={t.referral} id="register-referral" value={referralCode} onChange={(value) => { const clean = normalizeReferralCode(value); setReferralCode(clean); if (clean) window.localStorage.setItem(REFERRAL_CODE_KEY, clean); }} disabled={disabled} autoComplete="off" />
        </>}

        {step === 2 && <>
          <Field label={t.fullName} id="register-full-name" value={fullName} onChange={(value) => { setFullName(value); clearError('fullName'); }} error={errors.fullName} disabled={disabled} autoComplete="name" />
          <label className="public-auth-field" htmlFor="register-bank-name">{t.bankName}
            <select id="register-bank-name" className="public-auth-input" value={bankName} onChange={(event) => { setBankName(event.target.value); clearError('bankName'); }} disabled={disabled} aria-invalid={Boolean(errors.bankName)}>
              <option value="">{t.bankPlaceholder}</option>
              {THAI_BANKS.map(([code, thName, enName]) => <option key={code} value={code}>{locale === 'th' ? thName : enName}</option>)}
            </select>
          </label>
          {errors.bankName && <span className="public-auth-field-error">{errors.bankName}</span>}
          <Field label={t.bankAccountNumber} id="register-bank-account-number" value={bankAccountNumber} onChange={(value) => { setBankAccountNumber(value.replace(/\D/g, '').slice(0, 20)); clearError('bankAccountNumber'); }} error={errors.bankAccountNumber} disabled={disabled} inputMode="numeric" autoComplete="off" />
          <div className="public-auth-field-hint">{t.nameRule}</div>
        </>}

        {step === 3 && <>
          <div className="public-auth-review">
            <ReviewRow label={t.username} value={username} /><ReviewRow label={t.phone} value={phone} /><ReviewRow label={t.fullName} value={fullName} /><ReviewRow label={t.bankName} value={selectedBankLabel(bankName)} /><ReviewRow label={t.bankAccountNumber} value={maskAccount(bankAccountNumber)} />
          </div>
          <label className="public-auth-terms"><input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); clearError('terms'); }} disabled={disabled} /><span>{t.terms}</span></label>
          {errors.terms && <span className="public-auth-field-error">{errors.terms}</span>}
          <AntiBotWidget endpoint="member-register" locale={locale} resetKey={captchaResetKey} onToken={handleCaptchaToken} onRequiredChange={handleCaptchaState} />
        </>}

        <div className={`public-auth-form-actions${step > 1 ? ' has-back' : ''}`}>
          {step > 1 && <button type="button" onClick={goBack} disabled={disabled} className="public-auth-submit public-auth-submit--secondary">{t.back}</button>}
          <button type="submit" disabled={disabled} className="public-auth-submit">{loading ? t.submitting : step < 3 ? t.next : t.submit}</button>
        </div>
        {status !== 'error' && message && <div className={`public-auth-alert public-auth-alert--${status === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">{message}</div>}
        {flags.login && <p className="public-auth-footer">{t.loginPrompt} <a href="/login">{t.login}</a></p>}
      </form>
    </section>
  </main>;
}

function Field({ label, id, value, onChange, error, disabled, type = 'text', autoComplete, inputMode }: { label: string; id: string; value: string; onChange: (value: string) => void; error?: string; disabled: boolean; type?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'search' | 'url' | 'none'; }) {
  return <><label className="public-auth-field" htmlFor={id}>{label}<input id={id} className="public-auth-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} type={type} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} /></label>{error && <span className="public-auth-field-error">{error}</span>}</>;
}
function ReviewRow({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value || '-'}</strong></div>; }
async function linkReferralAfterRegister(referralCode: string, token?: string) { const accessToken = token || window.localStorage.getItem('member_access_token'); if (!accessToken) return; const res = await fetch(`${API_URL}/member/affiliate/link`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ referralCode }) }); if (res.ok) window.localStorage.removeItem(REFERRAL_CODE_KEY); }
function normalizeReferralCode(value: string) { return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24); }
function maskAccount(value: string) { return value.length > 4 ? `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value; }

function mapRegisterError(raw: unknown, locale: Locale, fallback: string) {
  const messages = Array.isArray(raw) ? raw.map(String) : [String(raw ?? '')];
  const joined = messages.join(' ').toLowerCase();
  const th = locale === 'th';
  if (joined.includes('captcha')) return th ? 'การยืนยันความปลอดภัยไม่สำเร็จ กรุณาลองใหม่' : 'Security verification failed. Please try again.';
  if (joined.includes('บัญชีธนาคารนี้ถูกใช้') || joined.includes('bank') && joined.includes('already')) return th ? 'บัญชีธนาคารนี้ถูกใช้กับสมาชิกคนอื่นแล้ว' : 'This bank account is already linked to another member.';
  if (joined.includes('member already exists') || joined.includes('ถูกใช้แล้ว') || joined.includes('already exists')) return th ? 'ชื่อผู้ใช้ เบอร์โทร หรืออีเมลนี้ถูกใช้แล้ว' : 'The username, phone number, or email is already in use.';
  if (joined.includes('bankaccountnumber') || joined.includes('6 to 20 digits')) return th ? 'เลขบัญชีต้องเป็นตัวเลข 6-20 หลัก' : 'The account number must contain 6-20 digits.';
  if (joined.includes('secret is required') || joined.includes('password')) return th ? 'กรุณากำหนดรหัสผ่านให้ถูกต้อง' : 'Enter a valid password.';
  if (joined.includes('full name') || joined.includes('fullname')) return th ? 'กรุณากรอกชื่อ-นามสกุลจริงให้ครบถ้วน' : 'Enter your full legal name.';
  return fallback;
}
