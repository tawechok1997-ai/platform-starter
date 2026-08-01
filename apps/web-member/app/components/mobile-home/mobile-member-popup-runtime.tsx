'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createFinanceIdempotencyKey,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
} from '../../../src/features/finance';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../../src/features/wallet/member-wallet';
import { memberApiFetch } from '../../member-api';
import type { BonusLedger, DepositMethodCode, MemberBankAccount, ReceivingAccount, WalletResponse } from '../../types/member-finance';
import { useMemberLocale } from '../../member-locale-provider';
import { useMemberRuntime } from '../../member-runtime-provider';
import styles from './mobile-member-popup-runtime.module.css';

type MobilePopupKind = 'deposit' | 'withdraw' | 'network-income' | 'commission-income' | 'coupon' | 'language';
type PopupState = MobilePopupKind | null;

type GenericPayload = Record<string, unknown> | null;

const PAGE_LABELS: Array<[string, string]> = [
  ['ระดับสมาชิก', 'vip'],
  ['ถ่ายทอดสด', 'live'],
  ['โปรโมชั่น', 'promotions'],
  ['ข่าวสาร', 'news'],
  ['กิจกรรม', 'activity'],
  ['ประวัติ', 'history'],
  ['แจ้งเตือน', 'notifications'],
  ['วีดีโอแนะนำ', 'video'],
  ['วิดีโอแนะนำ', 'video'],
  ['แนะนำการใช้งาน', 'guide'],
];

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000];
const DAILY_LIMIT = 2_000_000;

export default function MobileMemberPopupRuntime() {
  const { locale, toggleLocale } = useMemberLocale();
  const { summary } = useMemberRuntime();
  const [popup, setPopup] = useState<PopupState>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const root = event.target.closest<HTMLElement>('[data-mobile-home-root="true"]');
      if (!root || root.dataset.mobileAuthenticated !== 'true') return;
      if (!window.matchMedia('(max-width: 900px)').matches) return;

      const action = event.target.closest<HTMLElement>('a,button');
      if (!action || !root.contains(action)) return;
      const explicit = action.dataset.mobileMemberPopup as MobilePopupKind | undefined;
      const text = action.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const href = action instanceof HTMLAnchorElement ? action.getAttribute('href') ?? '' : '';
      const kind = explicit ?? popupFromAction(text, href);

      if (kind) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer(root);
        setPopup(kind);
        return;
      }

      const page = PAGE_LABELS.find(([label]) => text.includes(label))?.[1];
      if (!page) return;
      event.preventDefault();
      event.stopPropagation();
      closeDrawer(root);
      window.location.assign(`/mobile/member/${page}`);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    if (!popup) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopup(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [popup]);

  if (!popup || typeof document === 'undefined') return null;

  const title = popupTitle(popup, locale);
  return createPortal(
    <div className={styles.backdrop} role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) setPopup(null);
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-label={title} data-mobile-popup-owner={popup}>
        <div className={styles.border} aria-hidden="true" />
        <div className={styles.titleCap} aria-hidden="true" />
        <h2 className={styles.title}>{title}</h2>
        <button type="button" className={styles.close} aria-label={locale === 'th' ? 'ปิด' : 'Close'} onClick={() => setPopup(null)}>
          <img src="/images/close.svg" alt="" aria-hidden="true" />
        </button>
        <div className={styles.content}>
          {popup === 'deposit' ? <MobileDepositContent locale={locale} onClose={() => setPopup(null)} /> : null}
          {popup === 'withdraw' ? <MobileWithdrawContent locale={locale} onClose={() => setPopup(null)} /> : null}
          {popup === 'network-income' ? <IncomeContent label={title} value={summary.affiliateBalance || '0.00'} /> : null}
          {popup === 'commission-income' ? <IncomeContent label={title} value={summary.commissionBalance || '0.00'} /> : null}
          {popup === 'coupon' ? <CouponContent locale={locale} /> : null}
          {popup === 'language' ? (
            <div className={styles.languageChoices}>
              <button type="button" className={locale === 'th' ? styles.selected : ''} onClick={() => {
                if (locale !== 'th') toggleLocale();
                setPopup(null);
              }}><img src="/images/flags/th.svg" alt="" />ภาษาไทย</button>
              <button type="button" className={locale === 'en' ? styles.selected : ''} onClick={() => {
                if (locale !== 'en') toggleLocale();
                setPopup(null);
              }}><img src="/images/flags/en.svg" alt="" />English</button>
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function MobileDepositContent({ locale, onClose }: { locale: 'th' | 'en'; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DepositMethodCode>('bank_transfer');
  const [account, setAccount] = useState<ReceivingAccount | null>(null);
  const [slipData, setSlipData] = useState('');
  const [slipName, setSlipName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestKeyRef = useRef('');
  const numericAmount = Number(amount.replace(/,/g, ''));

  const loadAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage(locale === 'th' ? 'กรุณากรอกจำนวนเงิน' : 'Enter an amount');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch(`/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(numericAmount))}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.item) throw new Error(data?.message || 'No receiving account');
      setAccount(data.item as ReceivingAccount);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (locale === 'th' ? 'โหลดบัญชีรับเงินไม่สำเร็จ' : 'Unable to load receiving account'));
    } finally {
      setLoading(false);
    }
  };

  const uploadSlip = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage(locale === 'th' ? 'กรุณาเลือกไฟล์รูปภาพ' : 'Choose an image file');
      return;
    }
    try {
      setSlipData(await fileToDataUrl(file));
      setSlipName(file.name);
      setMessage(locale === 'th' ? 'แนบสลิปแล้ว' : 'Slip attached');
    } catch {
      setMessage(locale === 'th' ? 'อ่านรูปสลิปไม่สำเร็จ' : 'Could not read the slip image');
    }
  };

  const submit = async () => {
    if (!account || !slipData || loading) return;
    setLoading(true);
    setMessage(locale === 'th' ? 'กำลังส่งรายการ...' : 'Submitting...');
    requestKeyRef.current ||= createFinanceIdempotencyKey('deposit');
    const formValues = { amount, method, transactionRef: '', note: '' };
    try {
      const createResponse = await memberApiFetch('/member/topups', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestKeyRef.current },
        body: JSON.stringify(serializeDepositCreateRequest(formValues, account)),
      });
      const created = await createResponse.json().catch(() => null);
      if (!createResponse.ok || !created?.id) throw new Error(created?.message || 'Create deposit failed');
      const evidenceResponse = await memberApiFetch(`/member/topups/${created.id}/slip-evidence`, {
        method: 'POST',
        body: JSON.stringify(serializeDepositEvidenceRequest(formValues, slipData, slipName)),
      });
      const evidence = await evidenceResponse.json().catch(() => null);
      if (!evidenceResponse.ok && !evidence?.duplicate) throw new Error(evidence?.message || 'Upload slip failed');
      requestKeyRef.current = '';
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      setMessage(locale === 'th' ? 'ส่งสลิปแล้ว รอตรวจสอบรายการ' : 'Slip submitted for review');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (locale === 'th' ? 'ส่งรายการไม่สำเร็จ' : 'Submission failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.financeContent}>
      {!account ? (
        <form className={styles.depositForm} onSubmit={loadAccount}>
          <label><span>{locale === 'th' ? 'จำนวนเงินที่ต้องการฝาก' : 'Deposit amount'}</span>
            <input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmount(event.target.value))} placeholder="0.00" /></label>
          <div className={styles.methodGrid}>
            {(['bank_transfer', 'promptpay', 'wallet'] as DepositMethodCode[]).map((value) => (
              <button type="button" key={value} className={method === value ? styles.selected : ''} onClick={() => setMethod(value)}>
                {value === 'bank_transfer' ? (locale === 'th' ? 'ธนาคาร' : 'Bank') : value === 'promptpay' ? 'PromptPay' : 'Wallet'}
              </button>
            ))}
          </div>
          <button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? '…' : (locale === 'th' ? 'ดำเนินการต่อ' : 'Continue')}</button>
        </form>
      ) : (
        <div className={styles.depositTransfer}>
          <div className={styles.bankCard}>
            <img src={bankLogo(account.bankName)} alt="" />
            <div><strong>{account.bankName}</strong><span>{account.accountName}</span><b>{account.accountNumber}</b></div>
          </div>
          <div className={styles.transferAmount}><span>{locale === 'th' ? 'ยอดที่ต้องโอน' : 'Transfer amount'}</span><strong>{formatMoney(numericAmount)}</strong></div>
          <label className={styles.slipInput}><input type="file" accept="image/*" onChange={uploadSlip} /><span>{slipName || (locale === 'th' ? 'แนบสลิปการโอน' : 'Attach transfer slip')}</span></label>
          <div className={styles.actions}><button type="button" onClick={() => setAccount(null)}>{locale === 'th' ? 'ย้อนกลับ' : 'Back'}</button><button type="button" className={styles.primaryButton} disabled={!slipData || loading} onClick={submit}>{loading ? '…' : (locale === 'th' ? 'ยืนยัน' : 'Confirm')}</button></div>
        </div>
      )}
      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <button type="button" className={styles.cancelLink} onClick={onClose}>{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
    </div>
  );
}

function MobileWithdrawContent({ locale, onClose }: { locale: 'th' | 'en'; onClose: () => void }) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [banks, setBanks] = useState<MemberBankAccount[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedger[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const requestKeyRef = useRef('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletResponse, bankResponse, bonusResponse] = await Promise.all([
        memberApiFetch('/member/wallet'), memberApiFetch('/member/bank-accounts'), memberApiFetch('/member/bonus-ledgers'),
      ]);
      const walletData = await walletResponse.json().catch(() => null);
      const bankData = await bankResponse.json().catch(() => null);
      const bonusData = await bonusResponse.json().catch(() => null);
      if (walletResponse.ok) setWallet(walletData as WalletResponse);
      if (bankResponse.ok) {
        const active = ((bankData?.items ?? []) as MemberBankAccount[]).filter((bank) => bank.status === 'ACTIVE');
        setBanks(active);
        setSelectedBankId((current) => active.some((bank) => bank.id === current) ? current : (active.find((bank) => bank.isPrimary) ?? active[0])?.id ?? '');
      }
      if (bonusResponse.ok) setBonusLedgers((bonusData?.items ?? []) as BonusLedger[]);
      if (!walletResponse.ok || !bankResponse.ok) setMessage(walletData?.message ?? bankData?.message ?? (locale === 'th' ? 'โหลดข้อมูลไม่สำเร็จ' : 'Unable to load data'));
    } catch {
      setMessage(locale === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ' : 'Unable to connect');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { void load(); }, [load]);

  const selectedBank = banks.find((bank) => bank.id === selectedBankId) ?? banks[0];
  const available = safeNumber(wallet?.availableBalance);
  const remainingToday = Math.min(available, DAILY_LIMIT);
  const numericAmount = Number(amount.replace(/,/g, ''));
  const bonusRemaining = useMemo(() => bonusLedgers
    .filter((item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(String(item.status)))
    .reduce((sum, item) => sum + Math.max(safeNumber(item.turnoverRequired) - safeNumber(item.turnoverProgress), 0), 0), [bonusLedgers]);
  const valid = Boolean(selectedBank && numericAmount >= 100 && numericAmount <= remainingToday && bonusRemaining <= 0 && !submitting);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !selectedBank) return;
    setSubmitting(true);
    setMessage(locale === 'th' ? 'กำลังส่งคำขอถอน...' : 'Submitting...');
    requestKeyRef.current ||= createFinanceIdempotencyKey('withdrawal');
    try {
      const response = await memberApiFetch('/member/withdrawals', {
        method: 'POST', headers: { 'Idempotency-Key': requestKeyRef.current },
        body: JSON.stringify({ amount: numericAmount, method: 'bank_transfer', accountName: selectedBank.accountName, accountNumber: selectedBank.accountNumber, bankName: selectedBank.bankName, note: '' }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Withdrawal failed');
      requestKeyRef.current = '';
      setAmount('');
      setMessage(locale === 'th' ? 'ส่งคำขอถอนสำเร็จ' : 'Withdrawal request submitted');
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (locale === 'th' ? 'ส่งคำขอถอนไม่สำเร็จ' : 'Withdrawal failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.withdrawContent} onSubmit={submit}>
      <div className={styles.sectionLabel}>{locale === 'th' ? 'บัญชีธนาคารของคุณ' : 'Your bank account'}</div>
      {selectedBank ? <div className={styles.bankCard}>
        <img src={bankLogo(selectedBank.bankName)} alt="" />
        <div><strong>{selectedBank.accountName}</strong><span>{formatAccountNumber(selectedBank.accountNumber)}</span></div>
        {banks.length > 1 ? <select value={selectedBank.id} onChange={(event) => setSelectedBankId(event.target.value)}>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName}</option>)}</select> : null}
      </div> : <div className={styles.empty}>{loading ? (locale === 'th' ? 'กำลังโหลด...' : 'Loading...') : (locale === 'th' ? 'ยังไม่มีบัญชีธนาคารที่พร้อมถอน' : 'No approved bank account')}</div>}
      <div className={styles.withdrawPrompt}>{locale === 'th' ? 'ใส่จำนวนเงินที่ต้องการถอน' : 'Enter withdrawal amount'}</div>
      <input className={styles.amountInput} inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmount(event.target.value))} placeholder="0.00" />
      <div className={styles.minimum}>{locale === 'th' ? 'ถอนขั้นต่ำ 100.00 เครดิต' : 'Minimum withdrawal: 100.00 credits'}</div>
      <div className={styles.remaining}>{locale === 'th' ? 'ยอดถอนคงเหลือวันนี้' : 'Remaining today'} {formatMoney(remainingToday)}</div>
      {bonusRemaining > 0 ? <div className={styles.message}>{locale === 'th' ? `ต้องทำเทิร์นโบนัสคงเหลือ ${formatMoney(bonusRemaining)} ก่อนถอน` : `Complete ${formatMoney(bonusRemaining)} turnover first`}</div> : null}
      <div className={styles.sectionLabel}>{locale === 'th' ? 'เลือกจำนวน' : 'Choose amount'}</div>
      <div className={styles.quickGrid}>{QUICK_AMOUNTS.map((value) => <button type="button" key={value} disabled={!selectedBank || value > remainingToday || bonusRemaining > 0} onClick={() => setAmount(String(value))}>{value.toLocaleString('en-US')}</button>)}</div>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <div className={styles.actions}><button type="button" onClick={onClose}>{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</button><button type="submit" className={styles.primaryButton} disabled={!valid}>{submitting ? '…' : (locale === 'th' ? 'ยืนยัน' : 'Confirm')}</button></div>
    </form>
  );
}

function IncomeContent({ label, value }: { label: string; value: string }) {
  return <div className={styles.incomeContent}><span>{label}</span><strong>{formatMoney(Number(value))}</strong><p>ข้อมูลนี้อ่านจากระบบสมาชิกกลางโดยตรง</p></div>;
}

function CouponContent({ locale }: { locale: 'th' | 'en' }) {
  const [payload, setPayload] = useState<GenericPayload>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    memberApiFetch('/member/coupons').then(async (response) => {
      const data = await response.json().catch(() => null);
      if (response.ok) setPayload(data as GenericPayload);
    }).finally(() => setLoading(false));
  }, []);
  const count = Array.isArray(payload?.items) ? payload.items.length : 0;
  return <div className={styles.incomeContent}><span>{locale === 'th' ? 'คูปองที่ใช้งานได้' : 'Available coupons'}</span><strong>{loading ? '…' : count}</strong><p>{count ? (locale === 'th' ? 'เลือกใช้คูปองในขั้นตอนที่รองรับ' : 'Use a coupon in supported flows') : (locale === 'th' ? 'ยังไม่มีคูปองที่ใช้งานได้' : 'No coupons available')}</p></div>;
}

function popupFromAction(text: string, href: string): MobilePopupKind | null {
  if (href === '/deposit' || text.includes('ฝากเงิน')) return 'deposit';
  if (href === '/withdraw' || text.includes('ถอนเงิน')) return 'withdraw';
  if (text.includes('รายได้จากเครือข่าย')) return 'network-income';
  if (text.includes('รายได้จากคอมมิชชั่น') || text.includes('รายได้คอมมิชชั่น')) return 'commission-income';
  if (text.includes('คูปอง')) return 'coupon';
  if (text.includes('เปลี่ยนภาษา')) return 'language';
  return null;
}

function popupTitle(kind: MobilePopupKind, locale: 'th' | 'en') {
  const copy: Record<MobilePopupKind, [string, string]> = {
    deposit: ['ฝากเงิน', 'Deposit'], withdraw: ['ถอนเงิน', 'Withdraw'],
    'network-income': ['รายได้จากเครือข่าย', 'Network income'],
    'commission-income': ['รายได้จากคอมมิชชั่น', 'Commission income'],
    coupon: ['คูปอง', 'Coupons'], language: ['เปลี่ยนภาษา', 'Language'],
  };
  return copy[kind][locale === 'th' ? 0 : 1];
}

function closeDrawer(root: HTMLElement) {
  root.querySelector<HTMLButtonElement>('button[aria-label="ปิดเมนู"]')?.click();
}

function sanitizeAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...fraction] = normalized.split('.');
  return fraction.length ? `${whole}.${fraction.join('').slice(0, 2)}` : whole;
}

function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return safeNumber(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAccountNumber(value: string) {
  return value.replace(/\s+/g, '').replace(/(.{3})(?=.)/g, '$1 ');
}

function bankLogo(bankName: string) {
  const normalized = bankName.toUpperCase();
  const code = ['SCB', 'KBANK', 'KTB', 'BBL', 'BAY', 'TTB', 'UOBT', 'GSB', 'GHB'].find((item) => normalized.includes(item)) ?? 'SCB';
  return `/images/banks/TH/${code}.webp`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });
}
