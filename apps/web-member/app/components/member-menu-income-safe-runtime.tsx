'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';

type PopupKind = 'network' | 'commission' | 'coupon' | null;
type AffiliateCommission = {
  amount?: number | string | null;
  basis?: string | null;
  status?: string | null;
  payoutStatus?: string | null;
  type?: string | null;
};
type AffiliatePayload = {
  profile?: { referralCode?: string | null } | null;
  commissions?: AffiliateCommission[] | null;
};

const PRIMARY_MENU_SELECTOR = '.public-member-menu-grid:not(.public-member-menu-grid--secondary) a';
const MENU_SELECTOR = '#public-member-profile-menu';

const COPY = {
  th: {
    network: 'รายได้จากเครือข่าย',
    commission: 'รายได้คอมมิชชั่น',
    coupon: 'ใส่รหัสคูปอง',
    available: 'รายได้ที่ถอนได้',
    noData: 'ยังไม่มีรายการ',
    payoutUnavailable: 'ระบบถอนรายได้ยังไม่เปิดใช้งาน',
    couponUnavailable: 'ระบบแลกคูปองยังไม่เปิดใช้งาน',
    confirm: 'ยืนยัน',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    copied: 'คัดลอกลิงก์แล้ว',
    noReferral: 'ยังไม่มีลิงก์แนะนำเพื่อน',
  },
  en: {
    network: 'Network income',
    commission: 'Commission income',
    coupon: 'Enter coupon code',
    available: 'Available income',
    noData: 'No records yet',
    payoutUnavailable: 'Income payout is not available yet',
    couponUnavailable: 'Coupon redemption is not available yet',
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    copied: 'Referral link copied',
    noReferral: 'No referral link yet',
  },
} as const;

export default function MemberMenuIncomeSafeRuntime({ locale }: { locale: MemberLocale }) {
  const copy = COPY[locale];
  const [payload, setPayload] = useState<AffiliatePayload | null>(null);
  const [popup, setPopup] = useState<PopupKind>(null);
  const [copied, setCopied] = useState(false);

  const loadAffiliate = useCallback(async () => {
    try {
      const response = await memberApiFetch('/member/affiliate/profile');
      const data = await response.json().catch(() => null);
      if (response.ok && data) setPayload(data as AffiliatePayload);
    } catch {
      // Opening the member menu must never depend on the affiliate service.
    }
  }, []);

  useEffect(() => {
    void loadAffiliate();
  }, [loadAffiliate]);

  const balances = useMemo(() => {
    return (payload?.commissions ?? []).reduce((total, item) => {
      const status = String(item.status ?? '').toUpperCase();
      const payoutStatus = String(item.payoutStatus ?? '').toUpperCase();
      if (['REJECTED', 'CANCELLED', 'VOID'].includes(status)) return total;
      if (['PAID', 'SETTLED', 'COMPLETED'].includes(payoutStatus)) return total;

      const amount = Number(item.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return total;
      total[classifyCommission(item)] += amount;
      return total;
    }, { network: 0, commission: 0 });
  }, [payload]);

  const referralUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const code = payload?.profile?.referralCode?.trim();
    return code ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : '';
  }, [payload]);

  const syncMenuContent = useCallback(() => {
    const menu = document.querySelector<HTMLElement>(MENU_SELECTOR);
    if (!menu) return;

    const incomeValues = menu.querySelectorAll<HTMLElement>('.public-member-income-row strong');
    setTextIfChanged(incomeValues[0], formatMoney(balances.network));
    setTextIfChanged(incomeValues[1], formatMoney(balances.commission));

    const referralText = menu.querySelector<HTMLElement>('.public-member-referral-row small');
    setTextIfChanged(referralText, copied ? copy.copied : (referralUrl || copy.noReferral));

    const referralRow = menu.querySelector<HTMLElement>('.public-member-referral-row');
    if (referralRow && referralRow.classList.contains('is-copied') !== copied) {
      referralRow.classList.toggle('is-copied', copied);
    }
  }, [balances.commission, balances.network, copied, copy.copied, copy.noReferral, referralUrl]);

  useEffect(() => {
    syncMenuContent();
  }, [syncMenuContent]);

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

  const closeMemberMenu = useCallback(() => {
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.public-member-profile-trigger[aria-expanded="true"]')?.click();
    }, 0);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      if (event.target.closest('.public-member-profile-trigger')) {
        window.requestAnimationFrame(syncMenuContent);
        return;
      }

      const incomeLink = event.target.closest<HTMLAnchorElement>('.public-member-income-row a');
      if (incomeLink) {
        event.preventDefault();
        event.stopPropagation();
        const links = Array.from(incomeLink.parentElement?.querySelectorAll('a') ?? []);
        setPopup(links.indexOf(incomeLink) === 0 ? 'network' : 'commission');
        closeMemberMenu();
        return;
      }

      const referralRow = event.target.closest<HTMLAnchorElement>('.public-member-referral-row');
      if (referralRow) {
        event.preventDefault();
        event.stopPropagation();
        void copyReferral();
        return;
      }

      const primaryItem = event.target.closest<HTMLAnchorElement>(PRIMARY_MENU_SELECTOR);
      if (!primaryItem) return;
      const items = Array.from(document.querySelectorAll<HTMLAnchorElement>(PRIMARY_MENU_SELECTOR));
      const index = items.indexOf(primaryItem);
      const nextPopup = index === 1 ? 'commission' : index === 2 ? 'network' : index === 3 ? 'coupon' : null;
      if (!nextPopup) return;

      event.preventDefault();
      event.stopPropagation();
      setPopup(nextPopup);
      closeMemberMenu();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [closeMemberMenu, copyReferral, syncMenuContent]);

  if (!popup || typeof document === 'undefined') return null;

  const balance = popup === 'network' ? balances.network : balances.commission;
  return createPortal(
    popup === 'coupon' ? (
      <CouponPopup locale={locale} onClose={() => setPopup(null)} />
    ) : (
      <IncomePopup
        locale={locale}
        kind={popup}
        balance={balance}
        records={(payload?.commissions ?? []).filter((item) => classifyCommission(item) === popup)}
        onClose={() => setPopup(null)}
      />
    ),
    document.body,
  );
}

function IncomePopup({ locale, kind, balance, records, onClose }: {
  locale: MemberLocale;
  kind: 'network' | 'commission';
  balance: number;
  records: AffiliateCommission[];
  onClose: () => void;
}) {
  const copy = COPY[locale];
  usePopupLifecycle(onClose);
  const title = kind === 'network' ? copy.network : copy.commission;

  return (
    <div className="member-income-safe-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="member-income-safe-popup" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div><span aria-hidden="true">{kind === 'network' ? '↗' : '฿'}</span><h2>{title}</h2></div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>
        <div className="member-income-safe-balance">
          <span>{copy.available}</span>
          <strong>{formatMoney(balance)}</strong>
        </div>
        <div className="member-income-safe-list">
          {records.length > 0 ? records.slice(0, 20).map((record, index) => (
            <article key={`${record.type ?? record.basis ?? 'income'}-${index}`}>
              <span>{String(record.type ?? record.basis ?? title)}</span>
              <strong>{formatMoney(Number(record.amount ?? 0))}</strong>
            </article>
          )) : <p>{copy.noData}</p>}
        </div>
        <footer>
          <span>{copy.payoutUnavailable}</span>
          <button type="button" onClick={onClose}>{copy.close}</button>
        </footer>
      </section>
    </div>
  );
}

function CouponPopup({ locale, onClose }: { locale: MemberLocale; onClose: () => void }) {
  const copy = COPY[locale];
  const [code, setCode] = useState('');
  usePopupLifecycle(onClose);

  return (
    <div className="member-income-safe-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="member-income-safe-popup member-income-safe-popup--coupon" role="dialog" aria-modal="true" aria-label={copy.coupon}>
        <header>
          <div><span aria-hidden="true">%</span><h2>{copy.coupon}</h2></div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>
        <input
          value={code}
          maxLength={5}
          autoFocus
          placeholder={copy.coupon}
          onChange={(event) => setCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())}
        />
        <p>{copy.couponUnavailable}</p>
        <footer>
          <button type="button" onClick={onClose}>{copy.cancel}</button>
          <button type="button" disabled={code.length !== 5}>{copy.confirm}</button>
        </footer>
      </section>
    </div>
  );
}

function usePopupLifecycle(onClose: () => void) {
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);
}

function classifyCommission(item: AffiliateCommission): 'network' | 'commission' {
  const value = `${item.type ?? ''} ${item.basis ?? ''}`.toLowerCase();
  return /(network|referral|invite|friend|ทีม|เครือข่าย|แนะนำ)/.test(value) ? 'network' : 'commission';
}

function formatMoney(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

function setTextIfChanged(element: HTMLElement | undefined | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}
