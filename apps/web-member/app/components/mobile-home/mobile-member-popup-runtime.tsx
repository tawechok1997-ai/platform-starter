'use client';

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  createFinanceIdempotencyKey,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
} from '../../../src/features/finance';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../../src/features/wallet/member-wallet';
import { memberApiFetch } from '../../member-api';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { useMemberLocale } from '../../member-locale-provider';
import { useMemberRuntime } from '../../member-runtime-provider';
import type {
  BonusLedger,
  DepositMethodCode,
  MemberBankAccount,
  ReceivingAccount,
  WalletResponse,
} from '../../types/member-finance';
import styles from './mobile-member-popup-runtime.module.css';

export type MobilePopupKind =
  | 'menu'
  | 'contact'
  | 'password'
  | 'deposit'
  | 'withdraw'
  | 'network-income'
  | 'commission-income'
  | 'coupon'
  | 'language'
  | 'video';

type MobilePopupEventDetail = { kind: MobilePopupKind };
type IncomeKind = 'network-income' | 'commission-income';

const MOBILE_MEMBER_POPUP_EVENT = 'member:mobile-popup-open';
const MOBILE_QUERY = '(max-width: 900px)';
const QUICK_AMOUNTS = [100, 300, 500, 1000, 5000, 10000] as const;
const DAILY_LIMIT = 2_000_000;
const CONTACT_LINE_ID = '@774uinsb';
const CONTACT_LINE_URL = 'https://line.me/R/ti/p/@774uinsb';
const GUIDE_VIDEO_SOURCE = 'https://cdn.zabbet.com/videos/tutorial_640.webm';

const PAGE_LABELS: Array<[string, string]> = [
  ['ระดับสมาชิก', 'vip'],
  ['รายได้คอมมิชชั่น', 'commission'],
  ['แนะนำเพื่อน', 'affiliate'],
  ['โบนัสพิเศษ', 'bonus'],
  ['ถ่ายทอดสด', 'live'],
  ['โปรโมชั่น', 'promotions'],
  ['ข่าวสาร', 'news'],
  ['กิจกรรม', 'activity'],
  ['ประวัติ', 'history'],
  ['แจ้งเตือน', 'notifications'],
  ['แนะนำการใช้งาน', 'guide'],
];

const MENU_ITEMS: ReadonlyArray<{
  label: string;
  icon: string;
  fallback: string;
  page?: string;
  popup?: MobilePopupKind;
}> = [
  {
    label: 'แนะนำเพื่อน',
    icon: '/assets/asset-pc/images/เเนะนำเพื่อน.png',
    fallback: '👥',
    page: 'affiliate',
  },
  {
    label: 'รายได้คอมมิชชั่น',
    icon: '/assets/asset-pc/images/รายได่คอมมิชชั่น.png',
    fallback: '💸',
    page: 'commission',
  },
  {
    label: 'ประวัติ',
    icon: '/assets/asset-pc/images/ประวัติ.png',
    fallback: '🕘',
    page: 'history',
  },
  {
    label: 'โปรโมชั่น',
    icon: '/assets/asset-pc/images/โปรโมชั้น.png',
    fallback: '🎁',
    page: 'promotions',
  },
  {
    label: 'กิจกรรม',
    icon: '/assets/asset-pc/images/กิจกรรม.png',
    fallback: '🎯',
    page: 'activity',
  },
  {
    label: 'คูปอง',
    icon: '/assets/asset-pc/images/คูปอง.png',
    fallback: '🎟️',
    popup: 'coupon',
  },
  {
    label: 'ถ่ายทอดสด',
    icon: '/assets/asset-pc/images/ถ่ายถอดสด.png',
    fallback: 'LIVE',
    page: 'live',
  },
];

const DEPOSIT_METHODS: ReadonlyArray<{
  code: DepositMethodCode | null;
  label: string;
  icon: string;
  enabled: boolean;
}> = [
  {
    code: 'promptpay',
    label: 'QR Payment',
    icon: '/images/deposit/method/prompt_pay.svg',
    enabled: true,
  },
  {
    code: 'bank_transfer',
    label: 'โอนเงินผ่านธนาคาร',
    icon: '/images/deposit/method/normal.svg',
    enabled: false,
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

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', icon: '/images/flags/en.svg' },
  { code: 'th', label: 'ภาษาไทย', icon: '/images/flags/th.svg' },
  { code: 'ph', label: 'Tagalog', icon: '/images/flags/ph.svg' },
  { code: 'vi', label: 'Tiếng Việt', icon: '/images/flags/vi.svg' },
  { code: 'km', label: 'ភាសាខ្មែរ', icon: '/images/flags/km.svg' },
  { code: 'lo', label: 'ພາສາລາວ', icon: '/images/flags/lo.svg' },
  { code: 'id', label: 'Bahasa Indonesia', icon: '/images/flags/id.svg' },
  { code: 'mm', label: 'Myanmar', icon: '/images/flags/mm.svg' },
] as const;

export function openMobileMemberPopup(kind: MobilePopupKind) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<MobilePopupEventDetail>(MOBILE_MEMBER_POPUP_EVENT, {
    detail: { kind },
  }));
}

export default function MobileMemberPopupRuntime() {
  const { locale, toggleLocale } = useMemberLocale();
  const { summary } = useMemberRuntime();
  const [isMobile, setIsMobile] = useState(false);
  const [popup, setPopup] = useState<MobilePopupKind | null>(null);

  const affiliateIncome = runtimeText(summary, 'affiliateBalance') || '0.00';
  const commissionIncome = runtimeText(summary, 'commissionBalance') || '0.00';

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!isMobile || !summary.isLoggedIn) {
      setPopup(null);
      return;
    }

    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<MobilePopupEventDetail>).detail;
      if (detail && isMobilePopupKind(detail.kind)) setPopup(detail.kind);
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>('a,button,[role="button"]');
      if (!action) return;

      const href = action instanceof HTMLAnchorElement ? action.getAttribute('href') ?? '' : '';
      if (
        action.getAttribute('aria-label') === 'แก้ไขโปรไฟล์'
        || href === '/mobile/member/profile'
      ) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
        window.location.assign('/profile/avatar');
        return;
      }

      const explicit = action.dataset.mobileMemberPopup;
      if (explicit && isMobilePopupKind(explicit)) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
        setPopup(explicit);
        return;
      }

      const text = action.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const inferredPopup = popupFromAction(text, href, action);
      if (inferredPopup) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
        setPopup(inferredPopup);
        return;
      }

      const page = pageFromAction(text, href);
      if (!page) return;
      event.preventDefault();
      event.stopPropagation();
      closeDrawer();
      window.location.assign(`/mobile/member/${page}`);
    };

    window.addEventListener(MOBILE_MEMBER_POPUP_EVENT, handleOpen);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener(MOBILE_MEMBER_POPUP_EVENT, handleOpen);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isMobile, summary.isLoggedIn]);

  useEffect(() => {
    const enabled = isMobile && summary.isLoggedIn;
    document.documentElement.dataset.mobileMemberNav = enabled ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.mobileMemberNav;
    };
  }, [isMobile, summary.isLoggedIn]);

  useEffect(() => {
    if (!popup) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopup(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [popup]);

  if (!isMobile || !summary.isLoggedIn || typeof document === 'undefined') return null;

  const close = () => setPopup(null);
  const open = (kind: MobilePopupKind) => setPopup(kind);
  const navigate = (page: string) => {
    setPopup(null);
    window.location.assign(`/mobile/member/${page}`);
  };

  return (
    <>
      {createPortal(
        <MobileMemberBottomNavigation onOpen={open} />,
        document.body,
      )}

      {popup ? createPortal(
        popup === 'video' ? (
          <MobileVideoPopup onClose={close} />
        ) : (
          <SourcePopupShell
            kind={popup}
            title={popupTitle(popup, locale)}
            onClose={close}
            compact={popup === 'coupon' || popup === 'language'}
            showClose={!['deposit', 'network-income', 'commission-income'].includes(popup)}
          >
            {popup === 'menu' ? <MenuContent onOpen={open} onNavigate={navigate} /> : null}
            {popup === 'contact' ? <ContactContent /> : null}
            {popup === 'password' ? <PasswordContent locale={locale} onContact={() => open('contact')} /> : null}
            {popup === 'deposit' ? <MobileDepositContent locale={locale} onClose={close} /> : null}
            {popup === 'withdraw' ? <MobileWithdrawContent locale={locale} onClose={close} /> : null}
            {popup === 'network-income' ? (
              <IncomeTransferContent
                kind="network-income"
                locale={locale}
                value={affiliateIncome}
                onClose={close}
                onContact={() => open('contact')}
              />
            ) : null}
            {popup === 'commission-income' ? (
              <IncomeTransferContent
                kind="commission-income"
                locale={locale}
                value={commissionIncome}
                onClose={close}
                onContact={() => open('contact')}
              />
            ) : null}
            {popup === 'coupon' ? <CouponContent locale={locale} /> : null}
            {popup === 'language' ? (
              <LanguageContent
                locale={locale}
                onChoose={(code) => {
                  if (code === 'th' && locale !== 'th') toggleLocale();
                  if (code === 'en' && locale !== 'en') toggleLocale();
                  if (code === 'th' || code === 'en') close();
                }}
              />
            ) : null}
          </SourcePopupShell>
        ),
        document.body,
      ) : null}
    </>
  );
}

function SourcePopupShell({
  kind,
  title,
  onClose,
  compact = false,
  showClose = true,
  children,
}: {
  kind: MobilePopupKind;
  title: string;
  onClose: () => void;
  compact?: boolean;
  showClose?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.backdrop}
      data-ui-owner="mobile-popup"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className={`${styles.dialog} ${compact ? styles.dialogCompact : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-mobile-popup-owner={kind}
      >
        <div className={styles.border} aria-hidden="true" />
        <div className={styles.titleChrome} aria-hidden="true">
          <TitleFill />
          <TitleStroke />
        </div>
        <h2 className={styles.title}>{title}</h2>
        {showClose ? (
          <button type="button" className={styles.close} aria-label="ปิด" onClick={onClose}>
            <img src="/images/close.svg" alt="" aria-hidden="true" />
          </button>
        ) : null}
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
}

function MenuContent({
  onOpen,
  onNavigate,
}: {
  onOpen: (kind: MobilePopupKind) => void;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className={styles.menuGrid}>
      {MENU_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={styles.menuItem}
          onClick={() => {
            if (item.popup) onOpen(item.popup);
            else if (item.page) onNavigate(item.page);
          }}
        >
          <span className={styles.menuIcon}>
            <span aria-hidden="true">{item.fallback}</span>
            <img src={item.icon} alt="" aria-hidden="true" onError={(event) => {
              event.currentTarget.style.display = 'none';
            }} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ContactContent() {
  return (
    <div className={styles.contactList}>
      <div className={styles.contactCard}>
        <img src="/images/line.png" alt="" aria-hidden="true" />
        <div>
          <strong>Line</strong>
          <span>{CONTACT_LINE_ID}</span>
        </div>
        <a href={CONTACT_LINE_URL} target="_blank" rel="noreferrer">คลิก</a>
      </div>
    </div>
  );
}

function PasswordContent({
  locale,
  onContact,
}: {
  locale: 'th' | 'en';
  onContact: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const checks = [
    { label: 'ตั้งรหัสผ่าน 8 ตัวขึ้นไป', passed: newPassword.length >= 8 },
    { label: 'มีตัวอักษร a-z และ A-Z', passed: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: 'มีตัวเลขอย่างน้อย 1 ตัว', passed: /\d/.test(newPassword) },
  ];
  const valid = Boolean(currentPassword)
    && checks.every((item) => item.passed)
    && Boolean(confirmPassword)
    && newPassword === confirmPassword;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(locale === 'th' ? 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' : 'Password changed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.passwordForm} onSubmit={submit}>
      <SourceField
        label={locale === 'th' ? 'รหัสผ่านเดิม' : 'Current password'}
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />
      <SourceField
        label={locale === 'th' ? 'รหัสผ่านใหม่' : 'New password'}
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />
      <div className={styles.passwordRules}>
        {checks.map((item) => (
          <div key={item.label} data-passed={item.passed ? 'true' : 'false'}>
            <span aria-hidden="true">{item.passed ? '✓' : '•'}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <SourceField
        label={locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm password'}
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        invalid={Boolean(confirmPassword) && newPassword !== confirmPassword}
      />
      <button type="submit" className={styles.fullSubmit} disabled={!valid || busy}>
        {busy ? '…' : (locale === 'th' ? 'ยืนยัน' : 'Confirm')}
      </button>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <SupportFooter onContact={onContact} />
    </form>
  );
}

function SourceField({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  invalid?: boolean;
}) {
  return (
    <label className={styles.sourceField} data-invalid={invalid ? 'true' : 'false'}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
      />
    </label>
  );
}

function MobileDepositContent({
  locale,
  onClose,
}: {
  locale: 'th' | 'en';
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DepositMethodCode | null>(null);
  const [account, setAccount] = useState<ReceivingAccount | null>(null);
  const [slipData, setSlipData] = useState('');
  const [slipName, setSlipName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestKeyRef = useRef('');

  const numericAmount = Number(amount.replace(/,/g, ''));
  const amountValid = Boolean(
    method
    && Number.isFinite(numericAmount)
    && numericAmount >= 50
    && numericAmount <= 100_000,
  );

  const loadAccount = async () => {
    if (!method || !amountValid || loading) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch(
        `/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(numericAmount))}`,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.item) throw new Error(data?.message || 'ไม่พบบัญชีรับเงิน');
      setAccount(data.item as ReceivingAccount);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลดบัญชีรับเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const uploadSlip = async (event: ChangeEvent<HTMLInputElement>) => {
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
  };

  const submit = async () => {
    if (!account || !method || !slipData || loading) return;
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
  };

  if (account) {
    return (
      <div className={styles.depositTransfer}>
        <div className={styles.bankCard}>
          <img src={bankLogo(account.bankName)} alt="" />
          <div>
            <strong>{account.bankName}</strong>
            <span>{account.accountName}</span>
            <b>{account.accountNumber}</b>
          </div>
        </div>
        <div className={styles.transferAmount}>
          <span>{locale === 'th' ? 'ยอดที่ต้องโอน' : 'Transfer amount'}</span>
          <strong>{formatMoney(numericAmount)}</strong>
        </div>
        <label className={styles.slipInput}>
          <input type="file" accept="image/*" onChange={uploadSlip} />
          <span>{slipName || (locale === 'th' ? 'แนบสลิปการโอน' : 'Attach transfer slip')}</span>
        </label>
        {message ? <div className={styles.message} role="status">{message}</div> : null}
        <div className={styles.actionRow}>
          <button type="button" onClick={() => setAccount(null)}>ย้อนกลับ</button>
          <button type="button" className={styles.confirmButton} disabled={!slipData || loading} onClick={submit}>
            {loading ? '…' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.depositContent}>
      <button type="button" className={styles.promotionSelector}>
        <span aria-hidden="true">🎁</span>
        <strong>เลือกโปรโมชั่น</strong>
        <span aria-hidden="true">›</span>
      </button>

      <section className={styles.methodSection}>
        <h3>เลือกวิธีฝากเงิน</h3>
        <div className={styles.methodList}>
          {DEPOSIT_METHODS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={method === option.code && option.enabled ? styles.methodSelected : ''}
              disabled={!option.enabled}
              onClick={() => {
                if (option.enabled && option.code) setMethod(option.code);
              }}
            >
              <span>
                <img src={option.icon} alt="" aria-hidden="true" />
                <strong>{option.label}</strong>
              </span>
              {!option.enabled ? <small>งดให้บริการ</small> : <b aria-hidden="true">›</b>}
            </button>
          ))}
        </div>
      </section>

      {method ? (
        <section className={styles.amountSection}>
          <h3>ใส่จำนวนเงินที่ต้องการฝาก</h3>
          <input
            className={styles.amountInput}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
            placeholder="0.00"
          />
          <p>ขั้นต่ำ: 50.00 / สูงสุด: 100,000.00</p>
          <h4>เลือกจำนวน</h4>
          <QuickAmountGrid
            available={100_000}
            onChoose={(value) => setAmount(String(value))}
          />
        </section>
      ) : null}

      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <div className={styles.actionRow}>
        <button type="button" onClick={onClose}>ยกเลิก</button>
        <button type="button" className={styles.confirmButton} disabled={!amountValid || loading} onClick={loadAccount}>
          {loading ? '…' : 'ยืนยัน'}
        </button>
      </div>
    </div>
  );
}

function MobileWithdrawContent({
  locale,
  onClose,
}: {
  locale: 'th' | 'en';
  onClose: () => void;
}) {
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
        memberApiFetch('/member/wallet'),
        memberApiFetch('/member/bank-accounts'),
        memberApiFetch('/member/bonus-ledgers'),
      ]);
      const walletData = await walletResponse.json().catch(() => null);
      const bankData = await bankResponse.json().catch(() => null);
      const bonusData = await bonusResponse.json().catch(() => null);

      if (walletResponse.ok) setWallet(walletData as WalletResponse);
      if (bankResponse.ok) {
        const active = ((bankData?.items ?? []) as MemberBankAccount[])
          .filter((bank) => bank.status === 'ACTIVE');
        setBanks(active);
        setSelectedBankId((current) => (
          active.some((bank) => bank.id === current)
            ? current
            : (active.find((bank) => bank.isPrimary) ?? active[0])?.id ?? ''
        ));
      }
      if (bonusResponse.ok) setBonusLedgers((bonusData?.items ?? []) as BonusLedger[]);
      if (!walletResponse.ok || !bankResponse.ok) {
        setMessage(walletData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
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
  const available = safeNumber(wallet?.availableBalance);
  const remainingToday = Math.min(available, DAILY_LIMIT);
  const numericAmount = Number(amount.replace(/,/g, ''));
  const bonusRemaining = useMemo(
    () => bonusLedgers
      .filter((item) => !item.turnoverCompleted && ['ACTIVE', 'REVIEWING', 'PENDING'].includes(String(item.status)))
      .reduce(
        (sum, item) => sum + Math.max(
          safeNumber(item.turnoverRequired) - safeNumber(item.turnoverProgress),
          0,
        ),
        0,
      ),
    [bonusLedgers],
  );
  const valid = Boolean(
    selectedBank
    && numericAmount >= 100
    && numericAmount <= remainingToday
    && bonusRemaining <= 0
    && !submitting,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || !selectedBank) return;
    setSubmitting(true);
    setMessage(locale === 'th' ? 'กำลังส่งคำขอถอน...' : 'Submitting...');
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
      if (!response.ok) throw new Error(data?.message || 'ส่งคำขอถอนไม่สำเร็จ');

      requestKeyRef.current = '';
      setAmount('');
      setMessage(locale === 'th' ? 'ส่งคำขอถอนสำเร็จ' : 'Withdrawal request submitted');
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ส่งคำขอถอนไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.withdrawContent} onSubmit={submit}>
      <section className={styles.bankSection}>
        <h3>{locale === 'th' ? 'บัญชีธนาคารของคุณ' : 'Your bank account'}</h3>
        {selectedBank ? (
          <div className={styles.bankCard}>
            <img src={bankLogo(selectedBank.bankName)} alt="" />
            <div>
              <strong>{selectedBank.accountName}</strong>
              <span>{formatAccountNumber(selectedBank.accountNumber)}</span>
            </div>
            {banks.length > 1 ? (
              <select value={selectedBank.id} onChange={(event) => setSelectedBankId(event.target.value)}>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.bankName}</option>
                ))}
              </select>
            ) : null}
          </div>
        ) : (
          <div className={styles.empty}>
            {loading ? 'กำลังโหลด...' : 'ยังไม่มีบัญชีธนาคารที่พร้อมถอน'}
          </div>
        )}
      </section>

      <section className={styles.amountSection}>
        <h3>{locale === 'th' ? 'ใส่จำนวนเงินที่ต้องการถอน' : 'Enter withdrawal amount'}</h3>
        <input
          className={styles.amountInput}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
          placeholder="0.00"
        />
        <p>ถอนขั้นต่ำ 100.00 เครดิต</p>
        <p>ยอดถอนคงเหลือวันนี้ {formatMoney(remainingToday)} เครดิต</p>
        {bonusRemaining > 0 ? (
          <div className={styles.message}>
            ต้องทำเทิร์นโบนัสคงเหลือ {formatMoney(bonusRemaining)} ก่อนถอน
          </div>
        ) : null}
        <h4>เลือกจำนวน</h4>
        <QuickAmountGrid
          available={remainingToday}
          disabled={!selectedBank || bonusRemaining > 0}
          onChoose={(value) => setAmount(String(value))}
        />
      </section>

      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <div className={styles.actionRow}>
        <button type="button" onClick={onClose}>ยกเลิก</button>
        <button type="submit" className={styles.confirmButton} disabled={!valid}>
          {submitting ? '…' : 'ยืนยัน'}
        </button>
      </div>
    </form>
  );
}

function IncomeTransferContent({
  kind,
  locale,
  value,
  onClose,
  onContact,
}: {
  kind: IncomeKind;
  locale: 'th' | 'en';
  value: string;
  onClose: () => void;
  onContact: () => void;
}) {
  const available = safeNumber(value);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const numericAmount = safeNumber(amount);
  const valid = numericAmount > 0 && numericAmount <= available;
  const label = kind === 'network-income' ? 'รายได้เครือข่าย' : 'รายได้คอมมิชชั่น';

  return (
    <div className={styles.incomeContent}>
      <div className={styles.incomeBalance}>
        <span>{label}ที่ถอนได้</span>
        <strong>{formatMoney(available)}</strong>
      </div>
      <section className={styles.amountSection}>
        <h3>ใส่จำนวนเงินที่ต้องการถอนมายังกระเป๋าหลัก</h3>
        <input
          className={styles.amountInput}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
          placeholder="0.00"
        />
        <h4>เลือกจำนวน</h4>
        <QuickAmountGrid
          available={available}
          onChoose={(next) => setAmount(String(next))}
        />
      </section>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
      <div className={styles.actionRow}>
        <button type="button" onClick={onClose}>ยกเลิก</button>
        <button
          type="button"
          className={styles.confirmButton}
          disabled={!valid}
          onClick={() => setMessage(
            locale === 'th'
              ? 'ระบบถอนรายได้จะเปิดใช้เมื่อ API รายได้พร้อม'
              : 'Income transfer API is not available yet',
          )}
        >
          ยืนยัน
        </button>
      </div>
      <SupportFooter onContact={onContact} />
    </div>
  );
}

function QuickAmountGrid({
  available,
  disabled = false,
  onChoose,
}: {
  available: number;
  disabled?: boolean;
  onChoose: (value: number) => void;
}) {
  return (
    <div className={styles.quickGrid}>
      {QUICK_AMOUNTS.map((value) => (
        <button
          type="button"
          key={value}
          disabled={disabled || value > available}
          onClick={() => onChoose(value)}
        >
          {value.toLocaleString('en-US')}
        </button>
      ))}
    </div>
  );
}

function CouponContent({ locale }: { locale: 'th' | 'en' }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className={styles.couponContent}>
      <SourceField
        label={locale === 'th' ? 'คูปอง' : 'Coupon'}
        value={code}
        onChange={setCode}
      />
      <button
        type="button"
        className={styles.fullSubmit}
        disabled={!code.trim()}
        onClick={() => setMessage(
          locale === 'th'
            ? 'ระบบใช้คูปองยังไม่เปิดใช้งาน'
            : 'Coupon redemption is not available yet',
        )}
      >
        {locale === 'th' ? 'ยืนยัน' : 'Confirm'}
      </button>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
    </div>
  );
}

function LanguageContent({
  locale,
  onChoose,
}: {
  locale: 'th' | 'en';
  onChoose: (code: string) => void;
}) {
  const [message, setMessage] = useState('');

  return (
    <div>
      <div className={styles.languageGrid}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = option.code === locale;
          return (
            <button
              type="button"
              key={option.code}
              className={selected ? styles.languageSelected : ''}
              onClick={() => {
                if (option.code === 'th' || option.code === 'en') {
                  onChoose(option.code);
                } else {
                  setMessage('ภาษานี้ยังไม่เปิดใช้งาน');
                }
              }}
            >
              <img src={option.icon} alt="" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {message ? <div className={styles.languageMessage}>{message}</div> : null}
    </div>
  );
}

function MobileVideoPopup({ onClose }: { onClose: () => void }) {
  const source = resolveLocalAssetOrSource(GUIDE_VIDEO_SOURCE, 'mobile');
  return (
    <div className={styles.videoBackdrop} data-ui-owner="mobile-video-popup" role="dialog" aria-modal="true" aria-label="วีดีโอแนะนำการใช้งาน">
      <div className={styles.videoFrameGlow} aria-hidden="true" />
      <div className={styles.videoFrame}>
        <div className={styles.videoLoading}>Loading...</div>
        <video autoPlay loop playsInline controls>
          <source src={source} type="video/webm" />
        </video>
      </div>
      <div className={styles.videoFooter}>
        <strong>คู่มือการใช้งาน</strong>
        <button type="button" onClick={onClose}>ปิด</button>
      </div>
    </div>
  );
}

type BottomNavigationKind = 'menu' | 'deposit' | 'withdraw' | 'contact';

const BOTTOM_NAV_CANVAS_SIZE = 160;

function drawBottomNavigationFallback(
  context: CanvasRenderingContext2D,
  kind: BottomNavigationKind,
) {
  const scale = BOTTOM_NAV_CANVAS_SIZE / 32;
  context.clearRect(0, 0, BOTTOM_NAV_CANVAS_SIZE, BOTTOM_NAV_CANVAS_SIZE);
  context.save();
  context.scale(scale, scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 2;
  context.strokeStyle = '#f3d9ff';
  context.fillStyle = '#a82bce';
  context.shadowColor = '#d45bff';
  context.shadowBlur = 3;

  if (kind === 'menu') {
    context.beginPath();
    context.roundRect(7, 7, 8, 8, 2);
    context.roundRect(17, 7, 8, 8, 2);
    context.roundRect(7, 17, 8, 8, 2);
    context.roundRect(17, 17, 8, 8, 2);
    context.fill();
    context.stroke();
  } else if (kind === 'contact') {
    context.beginPath();
    context.arc(16, 16, 9, Math.PI, 0);
    context.stroke();
    context.beginPath();
    context.roundRect(5, 15, 5, 9, 2);
    context.roundRect(22, 15, 5, 9, 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(24, 24);
    context.quadraticCurveTo(23, 28, 18, 27);
    context.stroke();
  } else {
    context.beginPath();
    context.roundRect(5, 9, 22, 16, 3);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(9, 14);
    context.lineTo(23, 14);
    context.stroke();

    context.shadowBlur = 0;
    context.lineWidth = 2.4;
    context.strokeStyle = '#fff';
    context.beginPath();
    context.moveTo(16, 17);
    context.lineTo(16, 23);
    context.moveTo(13, kind === 'deposit' ? 20 : 17);
    context.lineTo(16, kind === 'deposit' ? 23 : 20);
    context.lineTo(19, kind === 'deposit' ? 20 : 17);
    context.stroke();
  }

  context.restore();
}

function BottomNavigationCanvasIcon({
  src,
  kind,
}: {
  src: string;
  kind: BottomNavigationKind;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    drawBottomNavigationFallback(context, kind);

    const image = new Image();
    let disposed = false;
    image.decoding = 'async';
    image.onload = () => {
      if (disposed) return;

      const inset = 12;
      const available = BOTTOM_NAV_CANVAS_SIZE - (inset * 2);
      const ratio = Math.min(available / image.naturalWidth, available / image.naturalHeight);
      const width = image.naturalWidth * ratio;
      const height = image.naturalHeight * ratio;
      const x = (BOTTOM_NAV_CANVAS_SIZE - width) / 2;
      const y = (BOTTOM_NAV_CANVAS_SIZE - height) / 2;

      context.clearRect(0, 0, BOTTOM_NAV_CANVAS_SIZE, BOTTOM_NAV_CANVAS_SIZE);
      context.save();
      context.shadowColor = 'rgb(207 82 255 / 72%)';
      context.shadowBlur = 14;
      context.drawImage(image, x, y, width, height);
      context.restore();
      context.drawImage(image, x, y, width, height);
    };
    image.onerror = () => {
      if (!disposed) drawBottomNavigationFallback(context, kind);
    };
    image.src = src;

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [kind, src]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.bottomNavCanvas}
      width={BOTTOM_NAV_CANVAS_SIZE}
      height={BOTTOM_NAV_CANVAS_SIZE}
      data-bottom-navigation-canvas={kind}
      aria-hidden="true"
    />
  );
}

function MobileMemberBottomNavigation({
  onOpen,
}: {
  onOpen: (kind: MobilePopupKind) => void;
}) {
  const items: Array<{ label: string; kind: BottomNavigationKind; icon: string }> = [
    { label: 'เมนู', kind: 'menu', icon: '/assets/asset-pc/images/เมนู.png' },
    { label: 'ฝาก', kind: 'deposit', icon: '/images/ฝาก.png' },
    { label: 'ถอน', kind: 'withdraw', icon: '/images/ถอน.png' },
    { label: 'ติดต่อ', kind: 'contact', icon: '/images/line.png' },
  ];

  return (
    <nav
      className={styles.bottomNav}
      data-ui-owner="mobile-navigation"
      data-mobile-member-bottom-navigation="true"
      aria-label="เมนูสมาชิกด้านล่าง"
    >
      <div className={styles.bottomNavInner}>
        <BottomNavShape />
        <div className={styles.bottomNavGrid}>
          {items.map((item) => (
            <button type="button" key={item.kind} onClick={() => onOpen(item.kind)}>
              <span className={styles.bottomNavIcon}>
                <BottomNavigationCanvasIcon src={item.icon} kind={item.kind} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function SupportFooter({ onContact }: { onContact: () => void }) {
  return (
    <>
      <div className={styles.supportDivider} aria-hidden="true" />
      <div className={styles.supportFooter}>
        <span>พบปัญหาในการใช้งาน?</span>
        <button type="button" onClick={onContact}>ติดต่อเรา</button>
      </div>
    </>
  );
}

function popupFromAction(
  text: string,
  href: string,
  action: HTMLElement,
): MobilePopupKind | null {
  if (href === '/deposit' || text.includes('ฝากเงิน') || text === 'ฝาก') return 'deposit';
  if (href === '/withdraw' || text.includes('ถอนเงิน') || text === 'ถอน') return 'withdraw';
  if (text.includes('รายได้จากเครือข่าย')) return 'network-income';
  if (action.dataset.mobileIncomePopup === 'commission') return 'commission-income';
  if (text.includes('คูปอง')) return 'coupon';
  if (text.includes('เปลี่ยนภาษา')) return 'language';
  if (text.includes('วีดีโอแนะนำ') || text.includes('วิดีโอแนะนำ')) return 'video';
  if (text.includes('แก้ไข บัญชี') || text.includes('แก้ไขบัญชี') || text.includes('เบอร์ติดต่อ')) return 'contact';
  if (text.includes('แก้ไขรหัสผ่าน') || text.includes('เปลี่ยนรหัสผ่าน')) return 'password';
  return null;
}

function pageFromAction(text: string, href: string) {
  const mobileMatch = href.match(/^\/mobile\/member\/([^/?#]+)/);
  if (mobileMatch?.[1]) return mobileMatch[1];
  return PAGE_LABELS.find(([label]) => text.includes(label))?.[1] ?? null;
}

function popupTitle(kind: Exclude<MobilePopupKind, 'video'>, locale: 'th' | 'en') {
  const copy: Record<Exclude<MobilePopupKind, 'video'>, [string, string]> = {
    menu: ['เมนู', 'Menu'],
    contact: ['ติดต่อเรา', 'Contact us'],
    password: ['เปลี่ยนรหัสผ่าน', 'Change password'],
    deposit: ['ฝากเงิน', 'Deposit'],
    withdraw: ['ถอนเงิน', 'Withdraw'],
    'network-income': ['รายได้จากเครือข่าย', 'Network income'],
    'commission-income': ['รายได้จากคอมมิชชั่น', 'Commission income'],
    coupon: ['คูปอง', 'Coupon'],
    language: ['เปลี่ยนภาษา', 'Language'],
  };
  return copy[kind][locale === 'th' ? 0 : 1];
}

function isMobilePopupKind(value: string): value is MobilePopupKind {
  return [
    'menu',
    'contact',
    'password',
    'deposit',
    'withdraw',
    'network-income',
    'commission-income',
    'coupon',
    'language',
    'video',
  ].includes(value);
}

function closeDrawer() {
  document.querySelector<HTMLButtonElement>('#mobile-home-drawer button[aria-label="ปิดเมนู"]')?.click();
}

function runtimeText(summary: unknown, key: string) {
  if (!summary || typeof summary !== 'object') return '';
  const value = (summary as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
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
  return safeNumber(value).toLocaleString('th-TH', {
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

function TitleFill() {
  return (
    <svg viewBox="0 0 192 36" fill="none" aria-hidden="true">
      <path
        d="M0 0H192L186.5 17.9997C186.5 17.9997 182.916 27.4412 176 31.8135C169.319 36.037 159.562 35.9994 159.562 35.9994H138.125H95.25H52.375H30.9375C30.9375 35.9994 21.5831 36.1436 15 31.8135C8.23851 27.366 4.75 17.9997 4.75 17.9997L0 0Z"
        fill="url(#mobile-source-title-fill)"
      />
      <defs>
        <linearGradient id="mobile-source-title-fill" x1="95.9977" y1="36" x2="95.9977" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#505050" />
          <stop offset="0.32" stopColor="#474747" />
          <stop offset="0.79" stopColor="#313131" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TitleStroke() {
  return (
    <svg viewBox="0 0 194 38" fill="none" aria-hidden="true">
      <path
        d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
        stroke="url(#mobile-source-title-stroke)"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <defs>
        <linearGradient id="mobile-source-title-stroke" x1="142.531" y1="48.75" x2="142.076" y2="6.722" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f2f2f2" />
          <stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BottomNavShape() {
  return (
    <svg className={styles.bottomNavShape} viewBox="0 0 640 60" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 6.68S197.5.383 320 .013C442.5-.356 640 6.68 640 6.68V60H0V6.68Z"
        fill="url(#mobile-member-bottom-nav-fill)"
      />
      <defs>
        <linearGradient id="mobile-member-bottom-nav-fill" x1="320" y1="0" x2="320" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bea7c5" />
          <stop offset="0.049" stopColor="#504867" />
          <stop offset="1" stopColor="#373147" />
        </linearGradient>
      </defs>
    </svg>
  );
}
