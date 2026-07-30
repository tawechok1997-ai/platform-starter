'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';

type PopupKind = 'network' | 'commission' | 'referral' | 'coupon' | null;
type IncomeKind = Exclude<PopupKind, 'referral' | 'coupon' | null>;
type Period = 'all' | 'today' | 'lastWeek' | 'lastMonth';

type AffiliateCommission = {
  id?: string | number | null;
  amount?: number | string | null;
  basis?: string | null;
  status?: string | null;
  payoutStatus?: string | null;
  createdAt?: string | null;
  wagerAmount?: number | string | null;
  turnover?: number | string | null;
  type?: string | null;
};

type AffiliatePayload = {
  profile?: { referralCode?: string | null } | null;
  commissions?: AffiliateCommission[] | null;
};

const PRIMARY_MENU_SELECTOR = '.public-member-menu-grid:not(.public-member-menu-grid--secondary) a';
const MENU_SELECTOR = '#public-member-profile-menu';
const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000];

const COPY = {
  th: {
    referralTitle: 'แนะนำเพื่อน',
    networkTitle: 'รายได้เครือข่าย',
    commissionTitle: 'รายได้คอมมิชชั่น',
    networkAvailable: 'รายได้เครือข่ายที่ถอนได้',
    commissionAvailable: 'รายได้คอมมิชชั่นที่ถอนได้',
    availableIncome: 'รายได้ที่ถอนได้',
    withdraw: 'ถอนรายได้',
    withdrawPrompt: 'ใส่จำนวนเงินที่ต้องการถอนมายังกระเป๋าหลัก',
    chooseAmount: 'เลือกจำนวน',
    referralLink: 'ลิงก์แนะนำเพื่อน',
    networkGuide: 'วิธีการสร้างเครือข่าย',
    copied: 'คัดลอกแล้ว',
    noReferral: 'ยังไม่มีลิงก์แนะนำเพื่อน',
    all: 'ทั้งหมด',
    today: 'วันนี้',
    lastWeek: 'สัปดาห์ที่แล้ว',
    lastMonth: 'เดือนที่แล้ว',
    totalNetwork: 'รายได้จากเครือข่ายทั้งหมด',
    comparedWithLastMonth: 'จากเดือนที่แล้ว',
    networkDetail: 'รายละเอียดการทำรายได้',
    search: 'ค้นหา',
    type: 'ประเภท',
    wager: 'ยอดแทง',
    income: 'รายได้',
    noData: 'ไม่พบข้อมูล',
    payoutUnavailable: 'ระบบถอนรายได้ยังไม่เปิดใช้งาน',
    coupon: 'ใส่รหัสคูปอง',
    couponUnavailable: 'ระบบแลกคูปองยังไม่เปิดใช้งาน',
    confirm: 'ยืนยัน',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    refresh: 'รีเฟรชยอด',
  },
  en: {
    referralTitle: 'Refer friends',
    networkTitle: 'Network income',
    commissionTitle: 'Commission income',
    networkAvailable: 'Available network income',
    commissionAvailable: 'Available commission income',
    availableIncome: 'Available income',
    withdraw: 'Withdraw income',
    withdrawPrompt: 'Enter the amount to transfer to your main wallet',
    chooseAmount: 'Choose amount',
    referralLink: 'Referral link',
    networkGuide: 'How to build your network',
    copied: 'Copied',
    noReferral: 'No referral link yet',
    all: 'All',
    today: 'Today',
    lastWeek: 'Last week',
    lastMonth: 'Last month',
    totalNetwork: 'Total network income',
    comparedWithLastMonth: 'Compared with last month',
    networkDetail: 'Income details',
    search: 'Search',
    type: 'Type',
    wager: 'Turnover',
    income: 'Income',
    noData: 'No data',
    payoutUnavailable: 'Income payout is not available yet',
    coupon: 'Enter coupon code',
    couponUnavailable: 'Coupon redemption is not available yet',
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    refresh: 'Refresh balance',
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
      // The member menu remains usable while affiliate data is temporarily unavailable.
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

      const amount = safeNumber(item.amount);
      if (amount <= 0) return total;
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
    menu.querySelector('.public-member-referral-row')?.classList.toggle('is-copied', copied);
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
      const nextPopup: PopupKind = index === 1
        ? 'commission'
        : index === 2
          ? 'referral'
          : index === 3
            ? 'coupon'
            : null;
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

  const networkRecords = (payload?.commissions ?? []).filter((item) => classifyCommission(item) === 'network');

  return createPortal(
    popup === 'coupon' ? (
      <CouponPopup locale={locale} onClose={() => setPopup(null)} />
    ) : popup === 'referral' ? (
      <ReferralDashboardPopup
        locale={locale}
        balance={balances.network}
        records={networkRecords}
        referralUrl={referralUrl}
        copied={copied}
        onCopyReferral={copyReferral}
        onRefresh={loadAffiliate}
        onClose={() => setPopup(null)}
      />
    ) : (
      <IncomeTransferPopup
        locale={locale}
        kind={popup}
        balance={balances[popup]}
        onRefresh={loadAffiliate}
        onClose={() => setPopup(null)}
      />
    ),
    document.body,
  );
}

function ReferralDashboardPopup({
  locale,
  balance,
  records,
  referralUrl,
  copied,
  onCopyReferral,
  onRefresh,
  onClose,
}: {
  locale: MemberLocale;
  balance: number;
  records: AffiliateCommission[];
  referralUrl: string;
  copied: boolean;
  onCopyReferral: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const copy = COPY[locale];
  const [period, setPeriod] = useState<Period>('today');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  usePopupLifecycle(onClose);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      if (!matchesPeriod(record.createdAt, period)) return false;
      if (!normalizedQuery) return true;
      return [record.type, record.basis, record.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [period, query, records]);

  const total = filteredRecords.reduce((sum, record) => sum + safeNumber(record.amount), 0);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="member-income-popup-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className="member-income-popup member-income-popup--dashboard" role="dialog" aria-modal="true" aria-label={copy.referralTitle}>
        <span className="member-income-popup-top-line" aria-hidden="true" />
        <PopupHeader kind="referral" title={copy.referralTitle} closeLabel={copy.close} onClose={onClose} />

        <div className="member-income-dashboard-grid">
          <section className="member-income-dashboard-left">
            <div className="member-income-available-block">
              <h3>{copy.availableIncome}</h3>
              <div className="member-income-available-card">
                <strong>{formatMoney(balance)}</strong>
                <button type="button" onClick={() => void refresh()} aria-label={copy.refresh} data-refreshing={refreshing ? 'true' : 'false'}>
                  <RefreshIcon />
                </button>
              </div>
              <button type="button" className="member-income-withdraw-button" disabled={balance <= 0} onClick={() => setWithdrawOpen(true)}>
                {copy.withdraw}
              </button>
            </div>

            <div className="member-income-referral-tools">
              <button type="button" className={copied ? 'is-copied' : ''} onClick={() => void onCopyReferral()}>
                <strong>{copy.referralLink}</strong>
                <span title={referralUrl}>{copied ? copy.copied : (referralUrl || copy.noReferral)}</span>
                <CopyIcon />
              </button>
              <a href="/guide" onClick={onClose}>
                <strong>{copy.networkGuide}</strong>
                <ArrowCircleIcon />
              </a>
            </div>
          </section>

          <section className="member-income-dashboard-right">
            <div className="member-income-period-tabs" role="tablist" aria-label={copy.referralTitle}>
              {(['all', 'today', 'lastWeek', 'lastMonth'] as Period[]).map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={period === item}
                  className={period === item ? 'is-active' : ''}
                  onClick={() => setPeriod(item)}
                  key={item}
                >
                  {copy[item]}
                </button>
              ))}
            </div>

            <div className="member-income-summary-card">
              <div><strong>{copy.totalNetwork}</strong><b>{formatMoney(total)}</b></div>
              <div><strong>+0%</strong><span>{copy.comparedWithLastMonth}</span></div>
            </div>

            <div className="member-income-detail-head">
              <h3>{copy.networkDetail}</h3>
              <button type="button" onClick={() => setSearchOpen((value) => !value)}>
                {copy.search}<FilterIcon />
              </button>
            </div>

            {searchOpen ? (
              <input
                ref={searchRef}
                className="member-income-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={copy.search}
              />
            ) : null}

            <div className="member-income-table-wrap">
              <table>
                <thead><tr><th>{copy.type}</th><th>{copy.wager}</th><th>{copy.income}</th></tr></thead>
                <tbody>
                  {filteredRecords.length ? filteredRecords.map((record, index) => (
                    <tr key={String(record.id ?? `${record.createdAt ?? 'row'}-${index}`)}>
                      <td>{record.type || record.basis || '-'}</td>
                      <td>{formatMoney(safeNumber(record.wagerAmount ?? record.turnover))}</td>
                      <td>{formatMoney(safeNumber(record.amount))}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3}><EmptyState /><span>{copy.noData}</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      {withdrawOpen ? (
        <IncomeTransferPopup
          locale={locale}
          kind="network"
          balance={balance}
          nested
          onRefresh={onRefresh}
          onClose={() => setWithdrawOpen(false)}
        />
      ) : null}
    </div>
  );
}

function IncomeTransferPopup({
  locale,
  kind,
  balance,
  nested = false,
  onRefresh,
  onClose,
}: {
  locale: MemberLocale;
  kind: IncomeKind;
  balance: number;
  nested?: boolean;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const copy = COPY[locale];
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const title = kind === 'network' ? copy.networkTitle : copy.commissionTitle;
  const availableLabel = kind === 'network' ? copy.networkAvailable : copy.commissionAvailable;
  const numericAmount = Number(amount.replace(/,/g, ''));
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= balance;

  usePopupLifecycle(onClose, nested);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const popup = (
    <section className="member-income-popup member-income-popup--transfer" role="dialog" aria-modal="true" aria-label={title}>
      <span className="member-income-popup-top-line" aria-hidden="true" />
      <PopupHeader kind={kind} title={title} closeLabel={copy.close} onClose={onClose} />
      <div className="member-income-transfer-scroll">
        <div className="member-income-transfer-balance">
          <span>{availableLabel}</span>
          <div>
            <strong>{formatMoney(balance)}</strong>
            <button type="button" onClick={() => void refresh()} data-refreshing={refreshing ? 'true' : 'false'} aria-label={copy.refresh}>
              <RefreshIcon />
            </button>
          </div>
        </div>

        <div className="member-income-transfer-form">
          <h3>{copy.withdrawPrompt}</h3>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(sanitizeAmount(event.target.value));
              setMessage('');
            }}
            placeholder="0.00"
            aria-label={copy.withdrawPrompt}
          />
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
          {message ? <p>{message}</p> : null}
          <footer className="member-income-popup-actions">
            <button type="button" onClick={onClose}>{copy.cancel}</button>
            <button type="button" className="is-primary" disabled={!validAmount} onClick={() => setMessage(copy.payoutUnavailable)}>
              {copy.confirm}
            </button>
          </footer>
        </div>
      </div>
    </section>
  );

  return nested ? (
    <div className="member-income-withdraw-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>{popup}</div>
  ) : (
    <div className="member-income-popup-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>{popup}</div>
  );
}

function CouponPopup({ locale, onClose }: { locale: MemberLocale; onClose: () => void }) {
  const copy = COPY[locale];
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  usePopupLifecycle(onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalizedCode = code.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);

  return (
    <div className="member-income-popup-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className="member-income-popup member-coupon-popup" role="dialog" aria-modal="true" aria-label={copy.coupon}>
        <span className="member-income-popup-top-line" aria-hidden="true" />
        <PopupHeader kind="coupon" title={copy.coupon} closeLabel={copy.close} onClose={onClose} />
        <div className="member-coupon-content">
          <CouponArtwork />
          <label className={normalizedCode ? 'has-value' : ''}>
            <span>{copy.coupon}</span>
            <input
              ref={inputRef}
              value={normalizedCode}
              maxLength={5}
              autoComplete="off"
              onChange={(event) => {
                setCode(event.target.value);
                setMessage('');
              }}
            />
          </label>
          {message ? <p>{message}</p> : null}
          <button type="button" disabled={normalizedCode.length !== 5} onClick={() => setMessage(copy.couponUnavailable)}>
            {copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}

function PopupHeader({
  kind,
  title,
  closeLabel,
  onClose,
}: {
  kind: 'referral' | IncomeKind | 'coupon';
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <header className="member-income-popup-header">
      <div>
        <span className="member-income-popup-title-icon" aria-hidden="true">
          {kind === 'referral' || kind === 'network'
            ? <NetworkIcon />
            : kind === 'commission'
              ? <CommissionIcon />
              : <CouponIcon />}
        </span>
        <h2>{title}</h2>
      </div>
      <button type="button" onClick={onClose} aria-label={closeLabel}>
        <img src="/images/close.svg" alt="" aria-hidden="true" />
      </button>
    </header>
  );
}

function usePopupLifecycle(onClose: () => void, captureEscape = false) {
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (captureEscape) event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape, captureEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape, captureEscape);
    };
  }, [captureEscape, onClose]);
}

function classifyCommission(item: AffiliateCommission): IncomeKind {
  const value = `${item.type ?? ''} ${item.basis ?? ''}`.toLowerCase();
  return /(network|referral|invite|friend|ทีม|เครือข่าย|แนะนำ)/.test(value) ? 'network' : 'commission';
}

function matchesPeriod(createdAt: string | null | undefined, period: Period) {
  if (period === 'all' || !createdAt) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return created >= startToday;
  if (period === 'lastWeek') {
    const start = new Date(startToday);
    start.setDate(start.getDate() - 7);
    return created >= start && created < startToday;
  }
  const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return created >= startLastMonth && created < startCurrentMonth;
}

function sanitizeAmount(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const dotIndex = normalized.indexOf('.');
  if (dotIndex < 0) return normalized;
  const whole = normalized.slice(0, dotIndex);
  const decimal = normalized.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${decimal}`;
}

function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function setTextIfChanged(element: HTMLElement | undefined | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

function RefreshIcon() {
  return <svg viewBox="0 0 16 14" aria-hidden="true"><path d="M13.7 2.9A7 7 0 0 0 1 6.3L.97 6.93l1.33.14.07-.67A5.67 5.67 0 0 1 12.8 4h-2.47v1.33H15V.67h-1.33V2.9Zm0 4.03-.07.67A5.67 5.67 0 0 1 3.2 10h2.47V8.67H1v4.66h1.33V11.1A7 7 0 0 0 15 7.73l.03-.66-1.33-.14Z" /></svg>;
}

function CopyIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 12c-.37 0-.68-.13-.94-.39a1.28 1.28 0 0 1-.39-.94v-8c0-.37.13-.68.39-.94.26-.26.57-.4.94-.4h6c.37 0 .68.14.94.4.26.26.39.57.39.94v8c0 .37-.13.68-.39.94-.26.26-.57.39-.94.39H6Zm0-1.33h6v-8H6v8ZM3.33 14.67c-.36 0-.68-.13-.94-.4A1.28 1.28 0 0 1 2 13.34V4h1.33v9.33h7.34v1.34H3.33Z" /></svg>;
}

function ArrowCircleIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" /><path d="m6 4 4 4-4 4M3 8h7" /></svg>;
}

function FilterIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.33 14v-4h1.34v1.33H14v1.34H8.67V14H7.33ZM2 12.67v-1.34h4v1.34H2ZM4.67 10V8.67H2V7.33h2.67V6H6v4H4.67Zm2.66-1.33V7.33H14v1.34H7.33ZM10 6V2h1.33v1.33H14v1.34h-2.67V6H10ZM2 4.67V3.33h6.67v1.34H2Z" /></svg>;
}

function NetworkIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><path d="M11.6 13.5a4.9 4.9 0 1 0 0-9.8 4.9 4.9 0 0 0 0 9.8ZM2.8 27.3h17.6v-1.1a8.8 8.8 0 0 0-17.6 0v1.1ZM19.4 13.5a4.9 4.9 0 0 0 0-9.8M24.3 27.3h3.9v-1.1a8.8 8.8 0 0 0-6.8-8.5" /></svg>;
}

function CommissionIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><circle cx="20.5" cy="10.5" r="8.2" /><path d="m17.3 13.7 6.4-6.4M18 8.6a.63.63 0 1 0 0-1.26.63.63 0 0 0 0 1.26ZM23 13.7a.63.63 0 1 0 0-1.26.63.63 0 0 0 0 1.26ZM2.5 23.5l4.9 4.1a4 4 0 0 0 2.5.9h12.9a1.7 1.7 0 0 0 1.7-1.7 3.3 3.3 0 0 0-3.3-3.3h-9M8.5 21.5 10 23a2.1 2.1 0 0 0 3-3l-2.3-2.3a4 4 0 0 0-2.9-1.2H2.5" /></svg>;
}

function CouponIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><path d="M2.5 23.5a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-4.1a4.1 4.1 0 0 1 0-7.8V7.5a2 2 0 0 0-2-2h-22a2 2 0 0 0-2 2v4.1a4.1 4.1 0 0 1 0 7.8v4.1ZM10.5 20.5l10-10M11.5 12.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19.5 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>;
}

function CouponArtwork() {
  return (
    <svg className="member-coupon-artwork" viewBox="0 0 130 123" aria-hidden="true">
      <defs>
        <linearGradient id="coupon-ticket-base-safe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#474157" stopOpacity="0.91" /><stop offset="1" stopColor="#a893ae" /></linearGradient>
        <linearGradient id="coupon-ticket-main-safe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#944fe8" /><stop offset="1" stopColor="#7600a8" /></linearGradient>
      </defs>
      <path fill="url(#coupon-ticket-base-safe)" d="M7 94a10.7 10.7 0 0 0 4 .8h78.5c5.9 0 10.7-4.8 10.7-10.7V69.5a3.6 3.6 0 0 0-2.6-3.4 11 11 0 0 1 0-21.2 3.6 3.6 0 0 0 2.6-3.4V27c0-5.9-4.8-10.7-10.7-10.7H10.9C5 16.3.2 21.1.2 27v14.5a3.6 3.6 0 0 0 2.7 3.4 11 11 0 0 1 0 21.2 3.6 3.6 0 0 0-2.7 3.4V84A10.7 10.7 0 0 0 7 94Z" />
      <path fill="url(#coupon-ticket-main-safe)" d="M39.4 109.5a10.7 10.7 0 0 1-13.1-7.6l-3.8-14a3.6 3.6 0 0 1 1.7-4 11 11 0 0 0-5.5-20.5 3.6 3.6 0 0 1-3.4-2.6l-3.8-14a10.7 10.7 0 0 1 7.6-13.1L95 13.3a10.7 10.7 0 0 1 13.1 7.6l3.8 14a3.6 3.6 0 0 1-1.7 4 11 11 0 0 0 5.5 20.5 3.6 3.6 0 0 1 3.4 2.6l3.8 14a10.7 10.7 0 0 1-7.6 13.1l-75.9 20.4Z" />
      <path fill="none" stroke="#373541" strokeWidth="7" strokeLinecap="round" d="m83.8 41.7-25.2 43.8M48 44.4a7.1 7.1 0 1 0 3.7 13.8A7.1 7.1 0 0 0 48 44.4Zm35 20.2a7.1 7.1 0 1 0 3.7 13.8A7.1 7.1 0 0 0 83 64.6Z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <svg className="member-income-empty-icon" viewBox="0 0 116 81" aria-hidden="true">
      <path d="M87.4 36.6H23.2v36.1a8 8 0 0 0 8 8h48.2a8 8 0 0 0 8-8V36.6Z" />
      <path d="M7.8 17.3a8 8 0 0 0-5.7 9.8l2.1 7.8a8 8 0 0 0 9.8 5.7l56.8-15.3a8 8 0 0 0 5.7-9.8l-2.1-7.7A8 8 0 0 0 64.6 2L7.8 17.3Z" />
      <path d="M68.8 35s19.6-5.5 16.6-11.7c-1.7-3.3-6.5-3.1-9.2-.6-3.2 2.9-3.1 10.4 1.2 10.4 11.1 0 23-5 28.9-16.5" />
      <rect x="47.9" y="46.7" width="14.7" height="4.9" rx="2.4" />
    </svg>
  );
}
