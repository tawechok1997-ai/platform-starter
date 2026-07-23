'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  RegisterView,
  type RegisterErrorKey,
  type RegisterErrors,
  type RegisterLocale,
  type RegisterStep,
} from '../../../src/features/auth';
import { createRegisterBrandAdapterFromSettings } from '../../components/auth/register-brand-adapter';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags } from '../../site-settings';
import { memberApiFetch } from '../../member-api';

const REFERRAL_CODE_KEY = 'member_pending_referral_code';

const THAI_BANKS = [
  ['BBL', 'ธนาคารกรุงเทพ', 'Bangkok Bank'], ['KBANK', 'ธนาคารกสิกรไทย', 'Kasikornbank'],
  ['KTB', 'ธนาคารกรุงไทย', 'Krung Thai Bank'], ['SCB', 'ธนาคารไทยพาณิชย์', 'Siam Commercial Bank'],
  ['BAY', 'ธนาคารกรุงศรีอยุธยา', 'Bank of Ayudhya'], ['TTB', 'ธนาคารทหารไทยธนชาต', 'TMBThanachart Bank'],
  ['GSB', 'ธนาคารออมสิน', 'Government Savings Bank'], ['BAAC', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'Bank for Agriculture and Agricultural Cooperatives'],
  ['GHB', 'ธนาคารอาคารสงเคราะห์', 'Government Housing Bank'], ['CIMBT', 'ธนาคารซีไอเอ็มบี ไทย', 'CIMB Thai Bank'],
  ['UOBT', 'ธนาคารยูโอบี', 'United Overseas Bank Thailand'], ['KKP', 'ธนาคารเกียรตินาคินภัทร', 'Kiatnakin Phatra Bank'],
  ['TISCO', 'ธนาคารทิสโก้', 'TISCO Bank'], ['LHFG', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'Land and Houses Bank'],
  ['ICBCT', 'ธนาคารไอซีบีซี (ไทย)', 'ICBC Thailand'], ['SME', 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย', 'SME Development Bank of Thailand'],
  ['EXIM', 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย', 'Export-Import Bank of Thailand'], ['ISBT', 'ธนาคารอิสลามแห่งประเทศไทย', 'Islamic Bank of Thailand'],
  ['BOC', 'ธนาคารแห่งประเทศจีน (ไทย)', 'Bank of China Thailand'], ['CITI', 'ธนาคารซิตี้แบงก์', 'Citibank'],
  ['HSBC', 'ธนาคารเอชเอสบีซี', 'HSBC Thailand'], ['SCBT', 'ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)', 'Standard Chartered Thailand'],
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
  const [locale, setLocale] = useState<RegisterLocale>('th');
  const [step, setStep] = useState<RegisterStep>(1);
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
  const registerBrand = useMemo(() => createRegisterBrandAdapterFromSettings(settings), [settings]);
  const { siteName, logoUrl, brandMark, cssVars } = registerBrand;
  const flags = memberFeatureFlags(settings);
  const maintenanceEnabled = Boolean(settings.maintenance?.enabled || settings.maintenance?.member_enabled || settings.website?.maintenance_mode);
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaState = useCallback((required: boolean, ready: boolean) => { setCaptchaRequired(required); setCaptchaReady(ready); }, []);
  const disabled = !flags.registration || maintenanceEnabled || loading || (captchaRequired && !captchaReady);
  const passwordProgress = useMemo(() => Math.min(secret.length / 8, 1), [secret]);

  function changeLocale(next: RegisterLocale) { setLocale(next); window.localStorage.setItem('member_locale', next); }
  function clearError(name: RegisterErrorKey) { if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined })); }
  function selectedBankLabel(value: string) { const bank = THAI_BANKS.find(([code]) => code === value); return bank ? (locale === 'th' ? bank[1] : bank[2]) : value; }

  function changeField(field: RegisterErrorKey | 'referralCode', value: string) {
    if (field === 'username') setUsername(value);
    else if (field === 'phone') setPhone(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'secret') setSecret(value);
    else if (field === 'fullName') setFullName(value);
    else if (field === 'bankName') setBankName(value);
    else if (field === 'bankAccountNumber') setBankAccountNumber(value.replace(/\D/g, '').slice(0, 20));
    else if (field === 'referralCode') { const clean = normalizeReferralCode(value); setReferralCode(clean); if (clean) window.localStorage.setItem(REFERRAL_CODE_KEY, clean); }
    if (field !== 'referralCode') clearError(field);
  }

  function validateStep(target: RegisterStep) {
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

  function goNext() { if (validateStep(step)) setStep((step + 1) as RegisterStep); }
  function goBack() { setStatus('idle'); setMessage(''); setStep((step - 1) as RegisterStep); }

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
      const res = await memberApiFetch('/member/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ username: username.trim(), phone: phone.trim(), email: email.trim() || undefined, secret, fullName: legalName, bankName: selectedBankLabel(bankName), bankAccountNumber: bankAccountNumber.trim(), bankAccountName: legalName, referralCode: cleanRef || undefined, captchaToken: captchaToken || undefined, deviceId: 'web-member' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setStatus('error'); setMessage(mapRegisterError(data?.message, locale, t.failed)); setCaptchaResetKey((value) => value + 1); return; }
      if (!data?.accessToken || !data?.refreshToken) { setStatus('error'); setMessage(t.invalidResponse); setCaptchaResetKey((value) => value + 1); return; }
      window.localStorage.setItem('member_access_token', data.accessToken);
      window.localStorage.setItem('member_refresh_token', data.refreshToken);
      if (cleanRef) await linkReferralAfterRegister(cleanRef, data.accessToken);
      setStatus('success'); setMessage(t.success); window.location.replace('/');
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setStatus('error'); setMessage(aborted ? t.timeout : t.failed); setCaptchaResetKey((value) => value + 1);
    } finally {
      window.clearTimeout(timeoutId); setLoading(false);
    }
  }

  return <div {...registerBrand.dataAttributes}>
    <RegisterView
      cssVars={cssVars} locale={locale} step={step} t={t} siteName={siteName} logoUrl={logoUrl} brandMark={brandMark}
      banks={THAI_BANKS} username={username} phone={phone} email={email} secret={secret} referralCode={referralCode}
      fullName={fullName} bankName={bankName} bankAccountNumber={bankAccountNumber} acceptedTerms={acceptedTerms}
      errors={errors} message={message} status={status} loading={loading} disabled={disabled} showSecret={showSecret}
      passwordProgress={passwordProgress} registrationEnabled={flags.registration} loginEnabled={flags.login}
      maintenanceEnabled={maintenanceEnabled} captchaResetKey={captchaResetKey} selectedBankLabel={selectedBankLabel(bankName)}
      onSubmit={onSubmit} onLocaleChange={changeLocale} onFieldChange={changeField}
      onAcceptedTermsChange={(value) => { setAcceptedTerms(value); clearError('terms'); }}
      onShowSecretToggle={() => setShowSecret((value) => !value)} onBack={goBack}
      onCaptchaToken={handleCaptchaToken} onCaptchaState={handleCaptchaState}
    />
  </div>;
}

async function linkReferralAfterRegister(referralCode: string, token?: string) { const accessToken = token || window.localStorage.getItem('member_access_token'); if (!accessToken) return; window.localStorage.setItem('member_access_token', accessToken); const res = await memberApiFetch('/member/affiliate/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referralCode }) }); if (res.ok) window.localStorage.removeItem(REFERRAL_CODE_KEY); }
function normalizeReferralCode(value: string) { return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24); }
function mapRegisterError(raw: unknown, locale: RegisterLocale, fallback: string) { const messages = Array.isArray(raw) ? raw.map(String) : [String(raw ?? '')]; const joined = messages.join(' ').toLowerCase(); const th = locale === 'th'; if (joined.includes('captcha')) return th ? 'การยืนยันความปลอดภัยไม่สำเร็จ กรุณาลองใหม่' : 'Security verification failed. Please try again.'; if (joined.includes('บัญชีธนาคารนี้ถูกใช้') || joined.includes('bank') && joined.includes('already')) return th ? 'บัญชีธนาคารนี้ถูกใช้กับสมาชิกคนอื่นแล้ว' : 'This bank account is already linked to another member.'; if (joined.includes('member already exists') || joined.includes('ถูกใช้แล้ว') || joined.includes('already exists')) return th ? 'ชื่อผู้ใช้ เบอร์โทร หรืออีเมลนี้ถูกใช้แล้ว' : 'The username, phone number, or email is already in use.'; if (joined.includes('bankaccountnumber') || joined.includes('6 to 20 digits')) return th ? 'เลขบัญชีต้องเป็นตัวเลข 6-20 หลัก' : 'The account number must contain 6-20 digits.'; if (joined.includes('secret is required') || joined.includes('password')) return th ? 'กรุณากำหนดรหัสผ่านให้ถูกต้อง' : 'Enter a valid password.'; if (joined.includes('full name') || joined.includes('fullname')) return th ? 'กรุณากรอกชื่อ-นามสกุลจริงให้ครบถ้วน' : 'Enter your full legal name.'; return fallback; }
