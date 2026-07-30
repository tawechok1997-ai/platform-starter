'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';

type IncomeKind = 'network' | 'commission' | null;

type AffiliateCommission = {
  amount?: number | string | null;
  basis?: string | null;
  status?: string | null;
  payoutStatus?: string | null;
};

type AffiliatePayload = {
  profile?: { referralCode?: string | null } | null;
  commissions?: AffiliateCommission[] | null;
};

const COPY = {
  th: {
    networkTitle: 'รายได้เครือข่าย',
    commissionTitle: 'รายได้คอมมิชชั่น',
    networkAvailable: 'รายได้เครือข่ายที่ถอนได้',
    commissionAvailable: 'รายได้คอมมิชชั่นที่ถอนได้',
    amountPrompt: 'ใส่จำนวนเงินที่ต้องการถอนมายังกระเป๋าหลัก',
    chooseAmount: 'เลือกจำนวน',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    close: 'ปิด',
    copied: 'คัดลอกลิงก์แล้ว',
    noReferral: 'ยังไม่มีลิงก์แนะนำเพื่อน',
  },
  en: {
    networkTitle: 'Network income',
    commissionTitle: 'Commission income',
    networkAvailable: 'Available network income',
    commissionAvailable: 'Available commission income',
    amountPrompt: 'Enter the amount to transfer to your main wallet',
    chooseAmount: 'Choose amount',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    copied: 'Referral link copied',
    noReferral: 'No referral link yet',
  },
} as const;

const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000];

export default function MemberMenuIncomeRuntime({ locale }: { locale: MemberLocale }) {
  const copy = COPY[locale];
  const [payload, setPayload] = useState<AffiliatePayload | null>(null);
  const [incomeKind, setIncomeKind] = useState<IncomeKind>(null);
  const [copied, setCopied] = useState(false);

  const loadAffiliate = useCallback(async () => {
    try {
      const response = await memberApiFetch('/member/affiliate/profile');
      const data = await response.json().catch(() => null);
      if (response.ok && data) setPayload(data as AffiliatePayload);
    } catch {
      // Keep the menu usable when the affiliate service is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void loadAffiliate();
  }, [loadAffiliate]);

  const balances = useMemo(() => {
    const available = (payload?.commissions ?? []).filter((item) => {
      const status = String(item.status ?? '').toUpperCase();
      const payout = String(item.payoutStatus ?? '').toUpperCase();
      return !['REJECTED', 'CANCELLED', 'VOID'].includes(status)
        && !['PAID', 'SETTLED', 'COMPLETED'].includes(payout);
    });

    return available.reduce((totals, item) => {
      const value = Number(item.amount ?? 0);
      if (!Number.isFinite(value) || value <= 0) return totals;
      const basis = String(item.basis ?? '');
      if (/network|downline|referral|ทีม|เครือข่าย/i.test(basis)) totals.network += value;
      else totals.commission += value;
      return totals;
    }, { network: 0, commission: 0 });
  }, [payload]);

  const referralUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const code = payload?.profile?.referralCode?.trim();
    return code ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : '';
  }, [payload]);

  const copyReferral = useCallback(async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      const input = document.createElement('textarea');
      input.value = referralUrl;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [referralUrl]);

  useEffect(() => {
    const syncMenuContent = () => {
      const incomeValues = document.querySelectorAll<HTMLElement>('.public-member-income-row strong');
      if (incomeValues[0]) incomeValues[0].textContent = formatMoney(balances.network);
      if (incomeValues[1]) incomeValues[1].textContent = formatMoney(balances.commission);

      const referralText = document.querySelector<HTMLElement>('.public-member-referral-row small');
      if (referralText) referralText.textContent = copied ? copy.copied : (referralUrl || copy.noReferral);
    };

    syncMenuContent();
    const observer = new MutationObserver(syncMenuContent);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [balances.commission, balances.network, copied, copy.copied, copy.noReferral, referralUrl]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const incomeLink = event.target.closest<HTMLAnchorElement>('.public-member-income-row a');
      if (incomeLink) {
        event.preventDefault();
        event.stopPropagation();
        const items = Array.from(incomeLink.parentElement?.querySelectorAll('a') ?? []);
        setIncomeKind(items.indexOf(incomeLink) === 0 ? 'network' : 'commission');
        window.setTimeout(() => {
          document.querySelector<HTMLButtonElement>('.public-member-profile-trigger[aria-expanded="true"]')?.click();
        }, 0);
        return;
      }

      const referralRow = event.target.closest<HTMLAnchorElement>('.public-member-referral-row');
      if (referralRow) {
        event.preventDefault();
        event.stopPropagation();
        void copyReferral();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [copyReferral]);

  return incomeKind && typeof document !== 'undefined'
    ? createPortal(
      <IncomePopup
        kind={incomeKind}
        locale={locale}
        balance={balances[incomeKind]}
        onClose={() => setIncomeKind(null)}
        onRefresh={loadAffiliate}
      />,
      document.body,
    )
    : null;
}

function IncomePopup({
  kind,
  locale,
  balance,
  onClose,
  onRefresh,
}: {
  kind: Exclude<IncomeKind, null>;
  locale: MemberLocale;
  balance: number;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const copy = COPY[locale];
  const [amount, setAmount] = useState('');
  const numericAmount = Number(amount.replace(/,/g, ''));
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= balance;
  const title = kind === 'network' ? copy.networkTitle : copy.commissionTitle;
  const balanceLabel = kind === 'network' ? copy.networkAvailable : copy.commissionAvailable;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="member-income-popup-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="member-income-popup" role="dialog" aria-modal="true" aria-label={title}>
        <span className="member-income-popup-top-line" aria-hidden="true" />
        <header className="member-income-popup-header">
          <div>
            <span className="member-income-popup-title-icon" aria-hidden="true">฿</span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>

        <div className="member-income-popup-scroll">
          <div className="member-income-balance-card">
            <strong>{balanceLabel}</strong>
            <div>
              <b>{formatMoney(balance)}</b>
              <button type="button" onClick={() => void onRefresh()} aria-label="refresh">↻</button>
            </div>
          </div>

          <div className="member-income-entry">
            <h3>{copy.amountPrompt}</h3>
            <label>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
                placeholder="0.00"
              />
            </label>

            <div className="member-income-quick-section">
              <h4>{copy.chooseAmount}</h4>
              <div>
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    disabled={quickAmount > balance}
                    onClick={() => setAmount(String(quickAmount))}
                  >
                    {quickAmount.toLocaleString('en-US')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="member-income-popup-actions">
            <button type="button" onClick={onClose}>{copy.cancel}</button>
            <button type="button" className="is-primary" disabled={!validAmount}>{copy.confirm}</button>
          </footer>
        </div>
      </section>
    </div>
  );
}

function sanitizeAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const [whole, ...decimal] = normalized.split('.');
  return decimal.length ? `${whole}.${decimal.join('').slice(0, 2)}` : whole;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
