'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';
import type { MemberBankAccount } from '../types/member-finance';
import '../member-bank-account-popup.css';

type Props = {
  open: boolean;
  locale: 'th' | 'en';
  accounts: MemberBankAccount[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type Copy = {
  title: string;
  close: string;
  currentAccounts: string;
  addAccount: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  cancel: string;
  save: string;
  saving: string;
  loading: string;
  primary: string;
  setPrimary: string;
  pending: string;
  active: string;
  rejected: string;
  disabled: string;
  saved: string;
  primarySaved: string;
  completeFields: string;
  existingNotice: string;
  support: string;
  contact: string;
};

const COPY: Record<'th' | 'en', Copy> = {
  th: {
    title: 'ตั้งค่าบัญชีธนาคาร',
    close: 'ปิด',
    currentAccounts: 'บัญชีธนาคารของคุณ',
    addAccount: 'เพิ่มบัญชีสำหรับรับเงินถอน',
    bank: 'ธนาคาร',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'เลขบัญชี',
    cancel: 'ยกเลิก',
    save: 'บันทึกบัญชี',
    saving: 'กำลังบันทึก...',
    loading: 'กำลังโหลดข้อมูล...',
    primary: 'บัญชีหลัก',
    setPrimary: 'ตั้งเป็นบัญชีหลัก',
    pending: 'รอตรวจสอบ',
    active: 'ใช้งานได้',
    rejected: 'ไม่อนุมัติ',
    disabled: 'ปิดใช้งาน',
    saved: 'เพิ่มบัญชีแล้ว รอตรวจสอบ',
    primarySaved: 'ตั้งบัญชีหลักแล้ว',
    completeFields: 'กรอกข้อมูลบัญชีให้ครบก่อน',
    existingNotice: 'ข้อมูลบัญชีที่ส่งแล้วจะแก้ไขไม่ได้จนกว่าเจ้าหน้าที่จะตรวจสอบ',
    support: 'พบปัญหาการใช้งาน',
    contact: 'ติดต่อเจ้าหน้าที่',
  },
  en: {
    title: 'Bank account settings',
    close: 'Close',
    currentAccounts: 'Your bank accounts',
    addAccount: 'Add a withdrawal bank account',
    bank: 'Bank',
    accountName: 'Account name',
    accountNumber: 'Account number',
    cancel: 'Cancel',
    save: 'Save account',
    saving: 'Saving...',
    loading: 'Loading...',
    primary: 'Primary',
    setPrimary: 'Set as primary',
    pending: 'Pending review',
    active: 'Active',
    rejected: 'Rejected',
    disabled: 'Disabled',
    saved: 'Account added and pending review',
    primarySaved: 'Primary account updated',
    completeFields: 'Complete all account fields',
    existingNotice: 'Submitted account details cannot be changed until staff review them.',
    support: 'Need help?',
    contact: 'Contact support',
  },
};

const DEFAULT_BANK_NAME = 'ธนาคารกสิกรไทย';
const THAI_BANKS = [
  DEFAULT_BANK_NAME,
  'ธนาคารไทยพาณิชย์',
  'ธนาคารกรุงเทพ',
  'ธนาคารกรุงไทย',
  'ธนาคารกรุงศรีอยุธยา',
  'ธนาคารทหารไทยธนชาต',
  'ธนาคารออมสิน',
  'ธนาคารอาคารสงเคราะห์',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ธนาคารยูโอบี',
  'ธนาคารซีไอเอ็มบีไทย',
  'ธนาคารเกียรตินาคินภัทร',
  'ธนาคารแลนด์ แอนด์ เฮ้าส์',
  'ธนาคารไอซีบีซี ไทย',
  'ธนาคารไทยเครดิต',
];

export default function MemberBankAccountPopup({ open, locale, accounts, onClose, onSaved }: Props) {
  const copy = COPY[locale];
  const [bankName, setBankName] = useState(DEFAULT_BANK_NAME);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const hasAccounts = accounts.length > 0;
  const sortedAccounts = useMemo(
    () => [...accounts].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary)),
    [accounts],
  );

  useEffect(() => {
    if (!open) return;
    setMessage('');
    setBusy(false);
    if (!hasAccounts) {
      setBankName(DEFAULT_BANK_NAME);
      setAccountName('');
      setAccountNumber('');
    }
  }, [hasAccounts, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || busy) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose, open]);

  if (!open) return null;

  const addAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || hasAccounts) return;

    const normalizedBankName = bankName.trim();
    const normalizedAccountName = accountName.trim();
    const normalizedAccountNumber = accountNumber.replace(/\s/g, '');
    if (!normalizedBankName || !normalizedAccountName || !normalizedAccountNumber) {
      setMessage(copy.completeFields);
      return;
    }

    setBusy(true);
    setMessage(copy.saving);
    try {
      const response = await memberApiFetch('/member/bank-accounts', {
        method: 'POST',
        body: JSON.stringify({
          bankName: normalizedBankName,
          accountName: normalizedAccountName,
          accountNumber: normalizedAccountNumber,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.message ?? (locale === 'th' ? 'เพิ่มบัญชีไม่สำเร็จ' : 'Unable to add account'));
        return;
      }

      setMessage(copy.saved);
      await onSaved();
      onClose();
    } catch {
      setMessage(locale === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setMessage(copy.loading);
    try {
      const response = await memberApiFetch(`/member/bank-accounts/${id}/primary`, { method: 'PATCH' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.message ?? (locale === 'th' ? 'ตั้งบัญชีหลักไม่สำเร็จ' : 'Unable to set primary account'));
        return;
      }
      setMessage(copy.primarySaved);
      await onSaved();
    } catch {
      setMessage(locale === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="member-bank-account-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target && !busy) onClose();
      }}
    >
      <section
        className="member-header-finance-dialog member-header-finance-dialog--bank-settings"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
      >
        <span className="member-header-finance-top-line" aria-hidden="true" />
        <header className="member-header-finance-header">
          <div>
            <span><BankSettingsIcon /></span>
            <h2>{copy.title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label={copy.close}>
            <CloseIcon />
          </button>
        </header>

        <div className="member-bank-account-content">
          {hasAccounts ? (
            <section className="member-bank-account-existing">
              <strong>{copy.currentAccounts}</strong>
              <div className="member-bank-account-list">
                {sortedAccounts.map((account) => (
                  <article className="member-bank-account-card" key={account.id}>
                    <BankLogo bankName={account.bankName} />
                    <div className="member-bank-account-card__info">
                      <div className="member-bank-account-card__title">
                        <strong>{account.accountName}</strong>
                        <span className={`member-bank-account-status is-${statusTone(account.status)}`}>
                          {statusLabel(account.status, copy)}
                        </span>
                      </div>
                      <span>{account.bankName}</span>
                      <b>{formatAccountNumber(account.accountNumber)}</b>
                      {account.adminNote ? <small>{account.adminNote}</small> : null}
                    </div>
                    {account.isPrimary ? (
                      <em>{copy.primary}</em>
                    ) : account.status === 'ACTIVE' ? (
                      <button type="button" disabled={busy} onClick={() => void setPrimary(account.id)}>
                        {copy.setPrimary}
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
              <p className="member-bank-account-notice">{copy.existingNotice}</p>
              {message ? <div className="member-header-finance-message" role="status">{message}</div> : null}
              <footer className="member-bank-account-actions is-single">
                <button type="button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
              </footer>
            </section>
          ) : (
            <form className="member-bank-account-form" onSubmit={addAccount}>
              <strong>{copy.addAccount}</strong>
              <label>
                <span>{copy.bank}</span>
                <select value={bankName} onChange={(event) => setBankName(event.target.value)} disabled={busy}>
                  {THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </label>
              <label>
                <span>{copy.accountName}</span>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder={copy.accountName}
                  autoComplete="name"
                  maxLength={150}
                  disabled={busy}
                />
              </label>
              <label>
                <span>{copy.accountNumber}</span>
                <input
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value.replace(/[^0-9]/g, '').slice(0, 20))}
                  placeholder={copy.accountNumber}
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={busy}
                />
              </label>
              {message ? <div className="member-header-finance-message" role="status">{message}</div> : null}
              <footer className="member-bank-account-actions">
                <button type="button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
                <button
                  type="submit"
                  className="is-primary"
                  disabled={busy || !bankName.trim() || !accountName.trim() || !accountNumber.trim()}
                >
                  {busy ? '…' : copy.save}
                </button>
              </footer>
            </form>
          )}

          <div className="member-bank-account-support">
            <span>{copy.support}</span>
            <a href="https://lin.ee/UYkP0OC" target="_blank" rel="noreferrer">{copy.contact}</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'active';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'DISABLED') return 'disabled';
  return 'pending';
}

function statusLabel(status: string, copy: Copy) {
  if (status === 'ACTIVE') return copy.active;
  if (status === 'REJECTED') return copy.rejected;
  if (status === 'DISABLED') return copy.disabled;
  return copy.pending;
}

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, '').replace(/(.{3})(?=.)/g, '$1 ').trim();
}

function BankLogo({ bankName }: { bankName: string }) {
  const code = resolveBankCode(bankName);
  if (!code) return <span className="member-bank-account-logo-fallback">{bankName.slice(0, 2)}</span>;
  return (
    <img
      className="member-bank-account-logo"
      src={`/images/banks/TH/${code}.webp`}
      alt=""
      aria-hidden="true"
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

function BankSettingsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 12.5 16 6l11 6.5" />
      <path d="M7.5 14.5h17M9.5 14.5v8m5-8v8m5-8v8m5 2.5h-17" />
    </svg>
  );
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
