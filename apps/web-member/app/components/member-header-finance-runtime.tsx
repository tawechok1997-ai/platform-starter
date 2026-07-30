'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createFinanceIdempotencyKey } from '../../src/features/finance';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../src/features/wallet/member-wallet';
import { memberApiFetch } from '../member-api';
import type { BonusLedger, MemberBankAccount, WalletResponse } from '../types/member-finance';

const DepositClient = dynamic(() => import('../deposit/deposit-client'), { ssr: false });

type FinancePopup = 'deposit' | 'withdraw' | null;

type Copy = {
  deposit: string;
  withdraw: string;
  close: string;
  bankAccount: string;
  amountPrompt: string;
  minimum: string;
  remainingToday: string;
  chooseAmount: string;
  cancel: string;
  confirm: string;
  loading: string;
  noBank: string;
  manageBank: string;
  success: string;
  credits: string;
};

const COPY: Record<'th' | 'en', Copy> = {
  th: {
    deposit: 'ฝากเงิน',
    withdraw: 'ถอนเงิน',
    close: 'ปิด',
    bankAccount: 'บัญชีธนาคารของคุณ',
    amountPrompt: 'ใส่จำนวนเงินที่ต้องการถอน',
    minimum: 'ถอนขั้นต่ำ 100.00 เครดิต',
    remainingToday: 'ยอดถอนคงเหลือวันนี้',
    chooseAmount: 'เลือกจำนวน',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    loading: 'กำลังโหลดข้อมูล...',
    noBank: 'ยังไม่มีบัญชีธนาคารที่อนุมัติสำหรับถอนเงิน',
    manageBank: 'จัดการบัญชีธนาคาร',
    success: 'ส่งคำขอถอนสำเร็จ',
    credits: 'เครดิต',
  },
  en: {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    close: 'Close',
    bankAccount: 'Your bank account',
    amountPrompt: 'Enter the amount to withdraw',
    minimum: 'Minimum withdrawal: 100.00 credits',
    remainingToday: 'Remaining withdrawal today',
    chooseAmount: 'Choose amount',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    noBank: 'No approved bank account is available',
    manageBank: 'Manage bank accounts',
    success: 'Withdrawal request submitted',
    credits: 'credits',
  },
};

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000];
const DAILY_LIMIT = 2_000_000;

export default function MemberHeaderFinanceRuntime({ locale }: { locale: 'th' | 'en' }) {
  const [popup, setPopup] = useState<FinancePopup>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLAnchorElement>('.public-member-wallet-action');
      if (!action) return;
      const href = action.getAttribute('href');
      const nextPopup = href === '/deposit' ? 'deposit' : href === '/withdraw' ? 'withdraw' : null;
      if (!nextPopup) return;
      event.preventDefault();
      event.stopPropagation();
      setPopup(nextPopup);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!popup || typeof document === 'undefined') return null;

  return createPortal(
    popup === 'deposit' ? (
      <DepositPopup locale={locale} onClose={() => setPopup(null)} />
    ) : (
      <WithdrawPopup locale={locale} onClose={() => setPopup(null)} />
    ),
    document.body,
  );
}

function DepositPopup({ locale, onClose }: { locale: 'th' | 'en'; onClose: () => void }) {
  const copy = COPY[locale];
  usePopupLifecycle(onClose);

  return (
    <div
      className="member-header-finance-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="member-header-finance-dialog member-header-finance-dialog--deposit"
        role="dialog"
        aria-modal="true"
        aria-label={copy.deposit}
      >
        <span className="member-header-finance-top-line" aria-hidden="true" />
        <FinancePopupHeader title={copy.deposit} closeLabel={copy.close} onClose={onClose} icon={<DepositIcon />} />
        <div className="member-header-deposit-content">
          <DepositClient variant="headerPopup" locale={locale} onCancel={onClose} />
        </div>
      </section>
    </div>
  );
}

function WithdrawPopup({ locale, onClose }: { locale: 'th' | 'en'; onClose: () => void }) {
  const copy = COPY[locale];
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [banks, setBanks] = useState<MemberBankAccount[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedger[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const requestKeyRef = useRef('');
  const submittingRef = useRef(false);

  usePopupLifecycle(onClose);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, bankRes, bonusRes] = await Promise.all([
        memberApiFetch('/member/wallet'),
        memberApiFetch('/member/bank-accounts'),
        memberApiFetch('/member/bonus-ledgers'),
      ]);
      const walletData = await walletRes.json().catch(() => null);
      const bankData = await bankRes.json().catch(() => null);
      const bonusData = await bonusRes.json().catch(() => null);

      if (walletRes.ok) setWallet(walletData as WalletResponse);
      if (bankRes.ok) {
        const nextBanks = ((bankData?.items ?? []) as MemberBankAccount[]).filter((bank) => bank.status === 'ACTIVE');
        setBanks(nextBanks);
        const primary = nextBanks.find((bank) => bank.isPrimary) ?? nextBanks[0];
        if (primary) setSelectedBankId((current) => current || primary.id);
      }
      if (bonusRes.ok) setBonusLedgers((bonusData?.items ?? []) as BonusLedger[]);
      if (!walletRes.ok || !bankRes.ok) {
        setMessage(walletData?.message ?? bankData?.message ?? (locale === 'th' ? 'โหลดข้อมูลไม่สำเร็จ' : 'Unable to load data'));
      }
    } catch {
      setMessage(locale === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ' : 'Unable to connect');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBank = banks.find((bank) => bank.id === selectedBankId) ?? banks[0];
  const availableBalance = safeNumber(wallet?.availableBalance);
  const remainingToday = Math.min(availableBalance, DAILY_LIMIT);
  const numericAmount = Number(amount.replace(/,/g, ''));
  const bonusRemaining = useMemo(
    () => bonusLedgers
      .filter((item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(String(item.status)))
      .reduce((sum, item) => sum + Math.max(safeNumber(item.turnoverRequired) - safeNumber(item.turnoverProgress), 0), 0),
    [bonusLedgers],
  );
  const validAmount = Boolean(
    selectedBank
      && Number.isFinite(numericAmount)
      && numericAmount >= 100
      && numericAmount <= remainingToday
      && bonusRemaining <= 0
      && !submitting,
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validAmount || !selectedBank || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(locale === 'th' ? 'กำลังส่งคำขอถอน...' : 'Submitting withdrawal...');
    requestKeyRef.current ||= createFinanceIdempotencyKey('withdrawal');

    try {
      const response = await memberApiFetch('/member/withdrawals', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestKeyRef.current },
        body: JSON.stringify({
          amount: numericAmount,
          method: 'bank_transfer',
          accountName: selectedBank.accountName,
          accountNumber: selectedBank.accountNumber,
          bankName: selectedBank.bankName,
          note: '',
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.message ?? (locale === 'th' ? 'ส่งคำขอถอนไม่สำเร็จ' : 'Withdrawal failed'));
        return;
      }

      requestKeyRef.current = '';
      setAmount('');
      setMessage(copy.success);
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch {
      setMessage(locale === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Unable to connect. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="member-header-finance-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target && !submitting) onClose();
      }}
    >
      <section
        className="member-header-finance-dialog member-header-finance-dialog--withdraw"
        role="dialog"
        aria-modal="true"
        aria-label={copy.withdraw}
      >
        <span className="member-header-finance-top-line" aria-hidden="true" />
        <FinancePopupHeader
          title={copy.withdraw}
          closeLabel={copy.close}
          onClose={onClose}
          icon={<WithdrawIcon />}
          disabled={submitting}
        />

        <form className="member-header-withdraw-content" onSubmit={submit}>
          {loading ? <div className="member-header-finance-message">{copy.loading}</div> : null}

          <section className="member-header-withdraw-bank-section">
            <strong>{copy.bankAccount}</strong>
            {selectedBank ? (
              <div className="member-header-withdraw-bank-card">
                <BankLogo bankName={selectedBank.bankName} />
                <div>
                  <strong>{selectedBank.accountName}</strong>
                  <span>{formatAccountNumber(selectedBank.accountNumber)}</span>
                </div>
                {banks.length > 1 ? (
                  <select
                    value={selectedBank.id}
                    onChange={(event) => setSelectedBankId(event.target.value)}
                    aria-label={copy.bankAccount}
                  >
                    {banks.map((bank) => (
                      <option value={bank.id} key={bank.id}>
                        {bank.bankName} / {formatAccountNumber(bank.accountNumber)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : !loading ? (
              <div className="member-header-withdraw-no-bank">
                <span>{copy.noBank}</span>
                <a href="/bank-accounts" onClick={onClose}>{copy.manageBank}</a>
              </div>
            ) : null}
          </section>

          <section className="member-header-withdraw-amount-section">
            <h3>{copy.amountPrompt}</h3>
            <label>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  requestKeyRef.current = '';
                  setAmount(sanitizeAmount(event.target.value));
                  setMessage('');
                }}
                placeholder="0.00"
                autoComplete="off"
                aria-label={copy.amountPrompt}
              />
            </label>
            <strong className="member-header-withdraw-minimum">{copy.minimum}</strong>
            <span className="member-header-withdraw-remaining">
              {copy.remainingToday} {formatMoney(remainingToday)} {copy.credits}
            </span>
            {bonusRemaining > 0 ? (
              <div className="member-header-finance-message is-warning">
                {locale === 'th'
                  ? `ต้องทำเทิร์นโบนัสคงเหลือ ${formatMoney(bonusRemaining)} ก่อนถอน`
                  : `Complete ${formatMoney(bonusRemaining)} turnover before withdrawing`}
              </div>
            ) : null}

            <div className="member-header-withdraw-quick">
              <h4>{copy.chooseAmount}</h4>
              <div>
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <button
                    type="button"
                    key={quickAmount}
                    disabled={!selectedBank || quickAmount > remainingToday || bonusRemaining > 0}
                    onClick={() => {
                      requestKeyRef.current = '';
                      setAmount(String(quickAmount));
                      setMessage('');
                    }}
                  >
                    {quickAmount.toLocaleString('en-US')}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {message ? <div className="member-header-finance-message" role="status">{message}</div> : null}

          <footer className="member-header-withdraw-actions">
            <button type="button" onClick={onClose} disabled={submitting}>{copy.cancel}</button>
            <button type="submit" className="is-primary" disabled={!validAmount}>
              {submitting ? '…' : copy.confirm}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function FinancePopupHeader({
  title,
  closeLabel,
  onClose,
  icon,
  disabled = false,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <header className="member-header-finance-header">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <button type="button" onClick={onClose} disabled={disabled} aria-label={closeLabel}>
        <CloseIcon />
      </button>
    </header>
  );
}

function usePopupLifecycle(onClose: () => void) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.finance-dialog-backdrop')) return;
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);
}

function BankLogo({ bankName }: { bankName: string }) {
  const code = resolveBankCode(bankName);
  if (!code) return <span className="member-header-withdraw-bank-fallback">{bankName.slice(0, 2)}</span>;
  return (
    <img
      src={`/images/banks/TH/${code}.webp`}
      alt={bankName}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}

function resolveBankCode(bankName: string) {
  const value = bankName.toLowerCase();
  if (/scb|ไทยพาณิชย์/.test(value)) return 'SCB';
  if (/kbank|กสิกร/.test(value)) return 'KBANK';
  if (/ktb|กรุงไทย/.test(value)) return 'KTB';
  if (/bbl|กรุงเทพ/.test(value)) return 'BBL';
  if (/bay|กรุงศรี/.test(value)) return 'BAY';
  if (/ttb|ทหารไทย|ธนชาต/.test(value)) return 'TTB';
  if (/gsb|ออมสิน/.test(value)) return 'GSB';
  if (/baac|ธ\.ก\.ส/.test(value)) return 'BAAC';
  if (/cimb/.test(value)) return 'CIMB';
  if (/uob/.test(value)) return 'UOB';
  if (/kkp|เกียรตินาคิน/.test(value)) return 'KKP';
  return '';
}

function sanitizeAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const [whole, ...decimal] = normalized.split('.');
  return decimal.length ? `${whole}.${decimal.join('').slice(0, 2)}` : whole;
}

function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return safeNumber(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, '').replace(/(.{3})(?=.)/g, '$1 ').trim();
}

function DepositIcon() {
  return <img src="/images/ฝาก.png" alt="" aria-hidden="true" />;
}

function WithdrawIcon() {
  return <img src="/images/ถอน.png" alt="" aria-hidden="true" />;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
