'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import {
  createFinanceIdempotencyKey,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
} from '../../../src/features/finance';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../../src/features/wallet/member-wallet';
import { memberApiFetch } from '../../member-api';
import type { DepositMethodCode, ReceivingAccount } from '../../types/member-finance';
import styles from './mobile-deposit-source-content.module.css';

type DepositStep = 'method' | 'amount' | 'slip';

type DepositMethodOption = {
  code: DepositMethodCode | null;
  label: string;
  icon: string;
  enabled: boolean;
};

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000] as const;
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 100_000;

const DEPOSIT_METHODS: readonly DepositMethodOption[] = [
  {
    code: 'bank_transfer',
    label: 'โอนเงินผ่านธนาคาร',
    icon: '/images/deposit/method/normal.svg',
    enabled: true,
  },
  {
    code: 'promptpay',
    label: 'QR Payment',
    icon: '/images/deposit/method/prompt_pay.svg',
    enabled: true,
  },
  {
    code: null,
    label: 'ฝากจุดทศนิยม',
    icon: '/images/deposit/method/decimal.svg',
    enabled: false,
  },
  {
    code: 'wallet',
    label: 'ทรู มันนี่ วอลเล็ท',
    icon: '/images/deposit/method/true_wallet.svg',
    enabled: false,
  },
  {
    code: null,
    label: 'ฝากคริปโต',
    icon: '/images/deposit/method/crypto_payment.svg',
    enabled: false,
  },
];

export default function MobileDepositSourceContent({
  locale,
  onClose,
}: {
  locale: 'th' | 'en';
  onClose: () => void;
}) {
  const [step, setStep] = useState<DepositStep>('method');
  const [method, setMethod] = useState<DepositMethodCode | null>(null);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<ReceivingAccount | null>(null);
  const [slipData, setSlipData] = useState('');
  const [slipName, setSlipName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestKeyRef = useRef('');

  const numericAmount = Number(amount.replace(/,/g, ''));
  const amountValid = Number.isFinite(numericAmount)
    && numericAmount >= MIN_AMOUNT
    && numericAmount <= MAX_AMOUNT;
  const selectedMethod = DEPOSIT_METHODS.find((option) => option.code === method) ?? null;

  async function requestAccount(requestedAmount: number) {
    if (!method) {
      throw new Error(locale === 'th' ? 'กรุณาเลือกวิธีฝากเงิน' : 'Choose a deposit method');
    }
    const response = await memberApiFetch(
      `/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(requestedAmount))}`,
    );
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.item) {
      throw new Error(data?.message || (locale === 'th' ? 'ไม่พบบัญชีรับเงิน' : 'Receiving account unavailable'));
    }
    return data.item as ReceivingAccount;
  }

  async function continueFromAmount() {
    if (!amountValid || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const verifiedAccount = await requestAccount(numericAmount);
      setAccount(verifiedAccount);
      setStep('slip');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ตรวจสอบบัญชีรับเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage(locale === 'th' ? `คัดลอก${label}แล้ว` : `${label} copied`);
    } catch {
      setMessage(locale === 'th' ? 'คัดลอกไม่สำเร็จ' : 'Could not copy');
    }
  }

  async function uploadSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage(locale === 'th' ? 'กรุณาเลือกไฟล์รูปภาพ' : 'Choose an image');
      return;
    }
    try {
      setSlipData(await fileToDataUrl(file));
      setSlipName(file.name);
      setMessage(locale === 'th' ? 'แนบสลิปแล้ว' : 'Slip attached');
    } catch {
      setMessage(locale === 'th' ? 'อ่านรูปสลิปไม่สำเร็จ' : 'Could not read slip');
    }
  }

  async function submit() {
    if (!account || !method || !amountValid || !slipData || loading) return;
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
      if (!createResponse.ok || !created?.id) {
        throw new Error(created?.message || 'สร้างรายการฝากไม่สำเร็จ');
      }

      const evidenceResponse = await memberApiFetch(`/member/topups/${created.id}/slip-evidence`, {
        method: 'POST',
        body: JSON.stringify(serializeDepositEvidenceRequest(formValues, slipData, slipName)),
      });
      const evidence = await evidenceResponse.json().catch(() => null);
      if (!evidenceResponse.ok && !evidence?.duplicate) {
        throw new Error(evidence?.message || 'อัปโหลดสลิปไม่สำเร็จ');
      }

      requestKeyRef.current = '';
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      setMessage(locale === 'th' ? 'ส่งสลิปแล้ว รอตรวจสอบรายการ' : 'Slip submitted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ส่งรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'method') {
    return (
      <div key="method" className={styles.root} data-deposit-step="method">
        <button type="button" className={styles.promotionSelector}>
          <GiftIcon />
          <span>เลือกโปรโมชั่น</span>
          <ChevronIcon />
        </button>

        <section className={styles.methodSection}>
          <h3>เลือกวิธีฝากเงิน</h3>
          <div className={styles.methodList}>
            {DEPOSIT_METHODS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={styles.methodOption}
                disabled={!option.enabled}
                aria-pressed="false"
                onClick={() => {
                  if (!option.enabled || !option.code) return;
                  setMethod(option.code);
                  setAmount('');
                  setAccount(null);
                  setMessage('');
                  setStep('amount');
                }}
              >
                <span className={styles.methodIdentity}>
                  <img src={option.icon} alt="" aria-hidden="true" />
                  <strong>{option.label}</strong>
                </span>
                {option.enabled ? (
                  <span className={styles.radio} data-selected="false" aria-hidden="true">
                    <i />
                  </span>
                ) : (
                  <small>งดให้บริการ</small>
                )}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.actionRow}>
          <button type="button" onClick={onClose}>ยกเลิก</button>
          <button type="button" className={styles.confirmButton} disabled>
            ยืนยัน
          </button>
        </div>
      </div>
    );
  }

  if (step === 'amount' && selectedMethod) {
    return (
      <div key="amount" className={styles.root} data-deposit-step="amount">
        <button type="button" className={styles.promotionSelector}>
          <GiftIcon />
          <span>เลือกโปรโมชั่น</span>
          <ChevronIcon />
        </button>

        <section className={styles.methodSection}>
          <div className={styles.methodHeading}>
            <h3>เลือกวิธีฝากเงิน</h3>
            <button
              type="button"
              className={styles.changeMethod}
              onClick={() => {
                setMethod(null);
                setAmount('');
                setAccount(null);
                setMessage('');
                setStep('method');
              }}
            >
              <ChangeMethodIcon />
              <span>เปลี่ยนวิธีการฝากเงิน</span>
            </button>
          </div>

          <div className={styles.methodOption + ' ' + styles.methodSelected}>
            <span className={styles.methodIdentity}>
              <img src={selectedMethod.icon} alt="" aria-hidden="true" />
              <strong>{selectedMethod.label}</strong>
            </span>
            <span className={styles.radio} data-selected="true" aria-hidden="true">
              <i />
            </span>
          </div>
        </section>

        <section className={styles.amountSection}>
          <h3>ใส่จำนวนเงินที่ต้องการฝาก</h3>
          <input
            className={styles.amountInput}
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(sanitizeAmount(event.target.value));
              setMessage('');
            }}
            placeholder="0.00"
          />
          <p className={styles.limit}>ขั้นต่ำ: 50.00 / สูงสุด: 100,000.00</p>
          <h4>เลือกจำนวน</h4>
          <div className={styles.quickGrid}>
            {QUICK_AMOUNTS.map((value) => (
              <button type="button" key={value} onClick={() => setAmount(String(value))}>
                {value.toLocaleString('en-US')}
              </button>
            ))}
          </div>
        </section>

        {message ? <div className={styles.message} role="status">{message}</div> : null}
        <div className={styles.actionRow}>
          <button type="button" onClick={onClose}>ยกเลิก</button>
          <button type="button" className={styles.confirmButton} disabled={!amountValid || loading} onClick={continueFromAmount}>
            {loading ? '…' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key="slip" className={styles.root} data-deposit-step="slip">
      {account ? <ReceivingAccountCard account={account} onCopy={copyText} /> : null}
      <div className={styles.transferAmount}>
        <span>{locale === 'th' ? 'ยอดที่ต้องโอน' : 'Transfer amount'}</span>
        <strong>{formatMoney(numericAmount)}</strong>
      </div>
      {method === 'promptpay' && account?.qrImageUrl ? (
        <img className={styles.qrImage} src={account.qrImageUrl} alt="QR Payment" />
      ) : null}
      <label className={styles.slipInput}>
        <input type="file" accept="image/*" onChange={uploadSlip} />
        <span>{slipName || (locale === 'th' ? 'แนบสลิปการโอน' : 'Attach transfer slip')}</span>
      </label>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <div className={styles.actionRow}>
        <button type="button" onClick={() => setStep('amount')}>ย้อนกลับ</button>
        <button type="button" className={styles.confirmButton} disabled={!slipData || loading} onClick={submit}>
          {loading ? '…' : 'ยืนยัน'}
        </button>
      </div>
    </div>
  );
}

function ReceivingAccountCard({
  account,
  onCopy,
}: {
  account: ReceivingAccount;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <section className={styles.accountCard} aria-label="บัญชีรับเงิน">
      <img src={bankLogo(account.bankName)} alt="" aria-hidden="true" />
      <div className={styles.accountRows}>
        <div>
          <span>ธนาคาร</span>
          <strong>{account.bankName}</strong>
          <b>{formatAccountNumber(account.accountNumber)}</b>
          <button type="button" onClick={() => void onCopy(account.accountNumber, 'เลขบัญชี')}>คัดลอก</button>
        </div>
        <div>
          <span>ชื่อบัญชี</span>
          <strong>{account.accountName}</strong>
          <button type="button" onClick={() => void onCopy(account.accountName, 'ชื่อบัญชี')}>คัดลอก</button>
        </div>
      </div>
    </section>
  );
}

function GiftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.8 17.21v1.895h14.4V17.21H4.8Zm0-10.42h1.98a2.2 2.2 0 0 1-.18-.947C6.6 5.053 6.863 4.382 7.388 3.83A2.55 2.55 0 0 1 9.3 3c.45 0 .866.122 1.249.367.382.245.716.549 1.001.912l.45.616.45-.616c.27-.379.6-.687.99-.924.39-.237.81-.355 1.26-.355.75 0 1.388.276 1.913.829.525.553.787 1.224.787 2.013 0 .174-.011.34-.034.498a1.92 1.92 0 0 1-.146.45h1.98c.495 0 .919.185 1.271.556.353.371.529.817.529 1.338v10.421c0 .521-.176.967-.529 1.338A1.71 1.71 0 0 1 19.2 21H4.8a1.71 1.71 0 0 1-1.271-.557A1.89 1.89 0 0 1 3 19.105V8.684c0-.521.176-.967.529-1.338A1.71 1.71 0 0 1 4.8 6.789Zm0 7.58h14.4V8.683h-4.59l1.89 2.7-1.44 1.09L12 8.116l-3.06 4.358-1.44-1.09 1.845-2.7H4.8v5.684ZM9.3 6.789a.87.87 0 0 0 .641-.272.94.94 0 0 0 .259-.675.94.94 0 0 0-.259-.675A.87.87 0 0 0 9.3 4.895a.87.87 0 0 0-.641.272.94.94 0 0 0-.259.675c0 .268.086.493.259.675a.87.87 0 0 0 .641.272Zm5.4 0a.87.87 0 0 0 .641-.272.94.94 0 0 0 .259-.675.94.94 0 0 0-.259-.675.87.87 0 0 0-.641-.272.87.87 0 0 0-.641.272.94.94 0 0 0-.259.675c0 .268.086.493.259.675a.87.87 0 0 0 .641.272Z" fill="currentColor" />
    </svg>
  );
}

function ChangeMethodIcon() {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" aria-hidden="true">
      <path d="M7.817 5.565v.704c0 .223.045.411.133.557.122.202.321.317.548.317.222 0 .442-.108.655-.321l2.325-2.325a1.31 1.31 0 0 0 0-1.851L9.153.321C8.94.108 8.72 0 8.498 0c-.339 0-.681.27-.681.874v.64C4.517 1.708 1.784 4.242 1.378 7.558a.41.41 0 0 0 .256.431.412.412 0 0 0 .482-.139 5.787 5.787 0 0 1 4.678-2.377c.341 0 .684.031 1.023.092Z" fill="url(#deposit-change-a)" />
      <path d="M13.358 6.011a.411.411 0 0 0-.482.139 5.786 5.786 0 0 1-4.678 2.377c-.341 0-.684-.031-1.023-.092v-.704c0-.604-.341-.874-.68-.874-.222 0-.443.108-.656.321L3.515 9.503a1.31 1.31 0 0 0 0 1.851l2.324 2.325c.213.213.434.321.656.321.338 0 .68-.27.68-.874v-.64c3.301-.195 6.034-2.728 6.44-6.044a.41.41 0 0 0-.257-.431Z" fill="url(#deposit-change-b)" />
      <defs>
        <linearGradient id="deposit-change-a" x1="3.123" y1="-2.085" x2="5.234" y2="8.47" gradientUnits="userSpaceOnUse">
          <stop stopColor="#944fe8" />
          <stop offset="1" stopColor="#7600a8" />
        </linearGradient>
        <linearGradient id="deposit-change-b" x1="4.879" y1="3.896" x2="6.991" y2="14.452" gradientUnits="userSpaceOnUse">
          <stop stopColor="#944fe8" />
          <stop offset="1" stopColor="#7600a8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m15.406 12-5.98 6-1.395-1.4 4.585-4.6-4.585-4.6L9.427 6l5.98 6Z" fill="currentColor" />
    </svg>
  );
}

function sanitizeAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...fraction] = normalized.split('.');
  return fraction.length ? `${whole}.${fraction.join('').slice(0, 2)}` : whole;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAccountNumber(value: string) {
  return value.replace(/\s+/g, '').replace(/(.{3})(?=.)/g, '$1 ');
}

function bankLogo(bankName: string) {
  const normalized = bankName.toUpperCase();
  const code = ['SCB', 'KBANK', 'KTB', 'BBL', 'BAY', 'TTB', 'UOBT', 'GSB', 'GHB']
    .find((item) => normalized.includes(item)) ?? 'SCB';
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
