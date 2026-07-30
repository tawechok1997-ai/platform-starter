'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MemberRuntimeImage } from './member-runtime-image';
import {
  FinanceConfirmDialog,
  FinanceInfoRow,
  FinanceStatusBadge,
} from '../../src/features/finance';
import type { DepositViewProps } from '../../src/features/finance/deposit-view';
import {
  topUpStatusLabel,
  type DepositMethodCode,
  type ReceivingAccount,
} from '../types/member-finance';

type HeaderDepositViewProps = DepositViewProps & {
  locale: 'th' | 'en';
  onCancel?: () => void;
};

type MethodOption = {
  code: DepositMethodCode | 'crypto';
  labelTh: string;
  labelEn: string;
  icon: 'bank' | 'qr' | 'counter' | 'wallet' | 'crypto';
  serviceOnly?: boolean;
};

type MobileStage = 'method' | 'amount';

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000];
const METHOD_OPTIONS: MethodOption[] = [
  { code: 'bank_transfer', labelTh: 'โอนเงินผ่านธนาคาร', labelEn: 'Bank transfer', icon: 'bank' },
  { code: 'promptpay', labelTh: 'QR Payment', labelEn: 'QR Payment', icon: 'qr' },
  { code: 'other', labelTh: 'ฝากจุดเคาน์เตอร์', labelEn: 'Counter deposit', icon: 'counter' },
  { code: 'wallet', labelTh: 'ทรู มันนี่ วอลเล็ท', labelEn: 'TrueMoney Wallet', icon: 'wallet' },
  { code: 'crypto', labelTh: 'ฝากคริปโต', labelEn: 'Crypto deposit', icon: 'crypto', serviceOnly: true },
];

const COPY = {
  th: {
    choosePromotion: 'เลือกโปรโมชั่น',
    chooseDepositMethod: 'เลือกวิธีฝากเงิน',
    changeMethod: 'เปลี่ยนวิธีการฝากเงิน',
    serviceRequest: 'ขอใช้บริการ',
    enterAmount: 'ใส่จำนวนเงินที่ต้องการฝาก',
    minimum: 'ขั้นต่ำ',
    maximum: 'สูงสุด',
    chooseAmount: 'เลือกจำนวน',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    noMethod: 'ยังไม่มีช่องทางฝากที่รองรับยอดนี้',
    problem: 'พบปัญหาการใช้งาน',
    support: 'ติดต่อเจ้าหน้าที่',
    transferTitle: 'โอนเงินและแนบสลิป',
    transferDescription: 'โอนยอดให้ตรงกับรายการ แล้วแนบสลิปก่อนส่งตรวจสอบ',
    depositAmount: 'ยอดฝาก',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'เลขบัญชี',
    copy: 'คัดลอก',
    reference: 'เลขอ้างอิงธุรกรรม',
    referencePlaceholder: 'กรอกเลขอ้างอิงจากสลิป',
    slip: 'แนบสลิป',
    note: 'หมายเหตุ',
    notePlaceholder: 'รายละเอียดเพิ่มเติม ถ้ามี',
    back: 'ย้อนกลับ',
    review: 'ตรวจสอบก่อนส่ง',
    retry: 'ลองส่งสลิปอีกครั้ง',
    waiting: 'รอตรวจสอบ',
    rejected: 'ไม่รับรายการ',
    createAnother: 'สร้างรายการใหม่',
    history: 'ดูประวัติฝากเงิน',
  },
  en: {
    choosePromotion: 'Choose promotion',
    chooseDepositMethod: 'Choose deposit method',
    changeMethod: 'Change deposit method',
    serviceRequest: 'Request service',
    enterAmount: 'Enter deposit amount',
    minimum: 'Minimum',
    maximum: 'Maximum',
    chooseAmount: 'Choose amount',
    cancel: 'Cancel',
    confirm: 'Confirm',
    noMethod: 'No deposit method supports this amount',
    problem: 'Need help?',
    support: 'Contact support',
    transferTitle: 'Transfer and upload slip',
    transferDescription: 'Transfer the exact amount, then upload the slip for review.',
    depositAmount: 'Deposit amount',
    accountName: 'Account name',
    accountNumber: 'Account number',
    copy: 'Copy',
    reference: 'Transaction reference',
    referencePlaceholder: 'Enter the reference shown on the slip',
    slip: 'Upload slip',
    note: 'Note',
    notePlaceholder: 'Additional details, if any',
    back: 'Back',
    review: 'Review submission',
    retry: 'Retry slip upload',
    waiting: 'Under review',
    rejected: 'Deposit rejected',
    createAnother: 'Create another deposit',
    history: 'View deposit history',
  },
} as const;

export default function MemberHeaderDepositView(props: HeaderDepositViewProps) {
  const copy = COPY[props.locale];
  const [methodsExpanded, setMethodsExpanded] = useState(false);
  const [mobileStage, setMobileStage] = useState<MobileStage>('method');
  const limits = useMemo(
    () => resolveLimits(props.accounts, props.method),
    [props.accounts, props.method],
  );
  const methodAvailable = props.availableMethods.includes(props.method);
  const canContinue = methodAvailable && props.parsedAmount > 0 && !props.loading;

  return (
    <div className="member-header-deposit-source" data-step={props.step}>
      {props.message ? <div className="member-header-finance-message" role="status">{props.message}</div> : null}

      {props.step === 'select' ? (
        <form className="member-header-deposit-select" onSubmit={props.onNextStep}>
          <div className="member-header-deposit-columns" data-mobile-stage={mobileStage}>
            <section className="member-header-deposit-method-panel">
              <button type="button" className="member-header-deposit-promotion">
                <span className="member-header-deposit-promotion-icon" aria-hidden="true"><PromotionIcon /></span>
                <strong>{copy.choosePromotion}</strong>
                <span>{copy.choosePromotion}</span>
                <ChevronIcon />
              </button>

              <div className="member-header-deposit-method-heading">
                <strong>{copy.chooseDepositMethod}</strong>
                <button
                  type="button"
                  aria-expanded={methodsExpanded}
                  onClick={() => setMethodsExpanded((current) => !current)}
                >
                  <RefreshIcon />
                  {copy.changeMethod}
                </button>
              </div>

              <div className={`member-header-deposit-method-list${methodsExpanded ? ' is-expanded' : ''}`}>
                {METHOD_OPTIONS.map((option) => {
                  const isRealMethod = isDepositMethod(option.code);
                  const isAvailable = isRealMethod && props.availableMethods.includes(option.code);
                  const isSelected = isRealMethod && props.method === option.code;
                  const disabled = option.serviceOnly || !isAvailable;
                  const label = props.locale === 'th' ? option.labelTh : option.labelEn;

                  return (
                    <button
                      type="button"
                      key={option.code}
                      className={`member-header-deposit-method-card${isSelected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                      disabled={disabled}
                      onClick={() => {
                        if (!isRealMethod) return;
                        props.onMethodChange(option.code);
                        setMethodsExpanded(false);
                      }}
                    >
                      <span className={`member-header-deposit-method-icon is-${option.icon}`} aria-hidden="true">
                        <MethodIcon type={option.icon} />
                      </span>
                      <strong>{label}</strong>
                      {disabled ? (
                        <em>{copy.serviceRequest}</em>
                      ) : (
                        <span className={`member-header-deposit-radio${isSelected ? ' is-selected' : ''}`} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="member-header-deposit-amount-panel">
              <label htmlFor="member-header-deposit-amount">{copy.enterAmount}</label>
              <div className="member-header-deposit-amount-input">
                <input
                  id="member-header-deposit-amount"
                  inputMode="decimal"
                  value={props.amount}
                  onChange={(event) => props.onAmountChange(event.target.value)}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
              <p>
                {copy.minimum}: {formatCompactMoney(limits.min)} / {copy.maximum}: {formatCompactMoney(limits.max)}
              </p>

              <h3>{copy.chooseAmount}</h3>
              <div className="member-header-deposit-quick-grid">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={Number(props.amount) === value ? 'is-selected' : ''}
                    onClick={() => props.onAmountChange(String(value))}
                  >
                    {value.toLocaleString('en-US')}
                  </button>
                ))}
              </div>

              {!props.initialLoading && !methodAvailable ? (
                <div className="member-header-deposit-inline-empty">{copy.noMethod}</div>
              ) : null}

              <footer className="member-header-deposit-actions member-header-deposit-desktop-actions">
                <button type="button" onClick={props.onCancel}>{copy.cancel}</button>
                <button type="submit" className="is-primary" disabled={!canContinue}>
                  {props.loading ? '…' : copy.confirm}
                </button>
              </footer>
            </section>
          </div>

          <footer className="member-header-deposit-actions member-header-deposit-mobile-actions">
            {mobileStage === 'method' ? (
              <>
                <button type="button" onClick={props.onCancel}>{copy.cancel}</button>
                <button
                  type="button"
                  className="is-primary"
                  disabled={!methodAvailable}
                  onClick={() => setMobileStage('amount')}
                >
                  {copy.confirm}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMobileStage('method')}>{copy.back}</button>
                <button type="submit" className="is-primary" disabled={!canContinue}>
                  {props.loading ? '…' : copy.confirm}
                </button>
              </>
            )}
          </footer>
          <SupportFooter locale={props.locale} />
        </form>
      ) : null}

      {props.step === 'transfer' && props.selected ? (
        <section className="member-header-deposit-transfer">
          <header>
            <div>
              <strong>{copy.transferTitle}</strong>
              <span>{copy.transferDescription}</span>
            </div>
            {props.remainingLabel ? <em>{props.transferExpired ? 'หมดเวลาแล้ว' : props.remainingLabel}</em> : null}
          </header>

          <div className="member-header-deposit-transfer-grid">
            <section className="member-header-deposit-recipient">
              <div className="member-header-deposit-highlight">
                <span>{copy.depositAmount}</span>
                <strong>฿{props.parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
              </div>
              <FinanceInfoRow label={copy.accountName} value={props.selected.accountName} />
              <FinanceInfoRow
                label={copy.accountNumber}
                value={props.selected.accountNumber}
                action={(
                  <button type="button" className="finance-copy-button" onClick={() => props.onCopyText(props.selected!.accountNumber, copy.accountNumber)}>
                    {copy.copy}
                  </button>
                )}
              />
              {props.selected.promptPay ? (
                <FinanceInfoRow
                  label="PromptPay"
                  value={props.selected.promptPay}
                  action={(
                    <button type="button" className="finance-copy-button" onClick={() => props.onCopyText(props.selected?.promptPay ?? '', 'PromptPay')}>
                      {copy.copy}
                    </button>
                  )}
                />
              ) : null}
              {props.selected.qrImageUrl ? (
                <MemberRuntimeImage
                  src={props.selected.qrImageUrl}
                  alt="QR Payment"
                  className="member-header-deposit-qr"
                  width={280}
                  height={280}
                  sizes="(max-width: 720px) 70vw, 280px"
                />
              ) : null}
            </section>

            <section className="member-header-deposit-evidence">
              <label>
                <span>{copy.reference}</span>
                <input
                  value={props.transactionRef}
                  onChange={(event) => props.onTransactionRefChange(event.target.value)}
                  placeholder={copy.referencePlaceholder}
                />
              </label>
              <label className="member-header-deposit-slip-field">
                <span>{copy.slip}</span>
                <input type="file" accept="image/*" onChange={props.onUploadSlip} />
                <strong>{props.slipImageName || copy.slip}</strong>
              </label>
              {props.slipImageData ? (
                <MemberRuntimeImage
                  src={props.slipImageData}
                  alt={copy.slip}
                  className="member-header-deposit-slip-preview"
                  width={360}
                  height={480}
                  sizes="(max-width: 720px) 80vw, 360px"
                />
              ) : null}
              <label>
                <span>{copy.note}</span>
                <textarea
                  value={props.note}
                  onChange={(event) => props.onNoteChange(event.target.value)}
                  placeholder={copy.notePlaceholder}
                />
              </label>
            </section>
          </div>

          <footer className="member-header-deposit-actions">
            <button type="button" onClick={props.onBackToSelect} disabled={props.loading || props.hasPendingRequest}>{copy.back}</button>
            <button
              type="button"
              className="is-primary"
              onClick={props.onOpenConfirm}
              disabled={props.loading || !props.slipImageData || (props.transferExpired && !props.hasPendingRequest)}
            >
              {props.hasPendingRequest ? copy.retry : copy.review}
            </button>
          </footer>
          <SupportFooter locale={props.locale} />
        </section>
      ) : null}

      {props.step === 'waiting' ? (
        <section className="member-header-deposit-waiting">
          <span className="member-header-deposit-waiting-icon" aria-hidden="true">✓</span>
          <h3>{props.lastRequest?.status === 'DUPLICATE' ? copy.rejected : copy.waiting}</h3>
          <FinanceInfoRow
            label={props.locale === 'th' ? 'สถานะ' : 'Status'}
            value={props.lastRequest ? topUpStatusLabel(props.lastRequest.status) : copy.waiting}
            action={<FinanceStatusBadge status={props.lastRequest?.status ?? 'PENDING_SLIP_REVIEW'} />}
          />
          {props.lastRequest?.adminNote ? <FinanceInfoRow label={props.locale === 'th' ? 'รายละเอียด' : 'Details'} value={props.lastRequest.adminNote} /> : null}
          <div className="member-header-deposit-actions">
            <Link href="/transactions" onClick={props.onCancel}>{copy.history}</Link>
            <button type="button" className="is-primary" onClick={props.onCreateAnother}>{copy.createAnother}</button>
          </div>
          <SupportFooter locale={props.locale} />
        </section>
      ) : null}

      <FinanceConfirmDialog
        open={props.confirmOpen && Boolean(props.selected)}
        title={props.hasPendingRequest ? copy.retry : copy.review}
        description={props.locale === 'th' ? 'ตรวจข้อมูลให้ถูกต้องก่อนส่งรายการ' : 'Review the information before submitting.'}
        onClose={props.onCloseConfirm}
        onConfirm={props.onSubmit}
        loading={props.loading}
        confirmLabel={props.hasPendingRequest ? copy.retry : copy.confirm}
      >
        <FinanceInfoRow
          label={copy.depositAmount}
          value={`THB ${props.parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
        />
        <FinanceInfoRow label={copy.chooseDepositMethod} value={methodLabel(props.method, props.locale)} />
        {props.selected ? <FinanceInfoRow label={copy.accountName} value={`${props.selected.accountName} / ${props.selected.accountNumber}`} /> : null}
        {props.transactionRef ? <FinanceInfoRow label={copy.reference} value={props.transactionRef} /> : null}
        {props.slipImageName ? <FinanceInfoRow label={copy.slip} value={props.slipImageName} /> : null}
      </FinanceConfirmDialog>
    </div>
  );
}

function SupportFooter({ locale }: { locale: 'th' | 'en' }) {
  const copy = COPY[locale];
  return (
    <div className="member-header-deposit-support">
      <span>{copy.problem}</span>
      <a href="https://lin.ee/UYkP0OC" target="_blank" rel="noreferrer">{copy.support}</a>
    </div>
  );
}

function resolveLimits(accounts: ReceivingAccount[], method: DepositMethodCode) {
  const related = accounts.filter((account) => resolveAccountMethod(account) === method);
  const minimums = related.map((account) => Number(account.minAmount ?? 0)).filter((value) => Number.isFinite(value) && value > 0);
  const maximums = related.map((account) => Number(account.maxAmount ?? 0)).filter((value) => Number.isFinite(value) && value > 0);
  return {
    min: minimums.length ? Math.min(...minimums) : 50,
    max: maximums.length ? Math.max(...maximums) : 100000,
  };
}

function resolveAccountMethod(account: ReceivingAccount): DepositMethodCode {
  if (account.bankName === 'พร้อมเพย์') return 'promptpay';
  if (account.bankName === 'วอเลต') return 'wallet';
  if (account.bankName === 'อื่น ๆ') return 'other';
  return 'bank_transfer';
}

function isDepositMethod(code: MethodOption['code']): code is DepositMethodCode {
  return code === 'bank_transfer' || code === 'promptpay' || code === 'wallet' || code === 'other';
}

function methodLabel(method: DepositMethodCode, locale: 'th' | 'en') {
  const option = METHOD_OPTIONS.find((item) => item.code === method);
  if (!option) return method;
  return locale === 'th' ? option.labelTh : option.labelEn;
}

function formatCompactMoney(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PromotionIcon() {
  return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h3v3H8z" /></svg>;
}

function RefreshIcon() {
  return <svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5M6.1 8.1A7 7 0 0 1 18.7 7M17.9 15.9A7 7 0 0 1 5.3 17" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>;
}

function MethodIcon({ type }: { type: MethodOption['icon'] }) {
  if (type === 'bank') return <svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M8 7V4h8v3M8 12h8M8 16h5" /></svg>;
  if (type === 'qr') return <svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM18 14h2v6h-6v-2M14 17h2" /></svg>;
  if (type === 'counter') return <svg viewBox="0 0 24 24"><path d="M4 8h16M6 8l1-4h10l1 4v12H6zM9 12h6M9 16h4" /></svg>;
  if (type === 'wallet') return <svg viewBox="0 0 24 24"><path d="M4 7h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3M16 12h5v4h-5a2 2 0 0 1 0-4Z" /></svg>;
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M14.5 8.5c-.7-.7-1.7-1-2.7-1-1.5 0-2.8.8-2.8 2s1.2 1.8 3 2.1 3 .9 3 2.2-1.3 2.2-3 2.2c-1.2 0-2.3-.4-3-1.2M12 5v14" /></svg>;
}
