'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';

type BonusLedger = {
  id: string;
  campaignId: string;
  campaign?: { title?: string | null } | null;
  amount?: number | string | null;
  currency?: string | null;
  turnoverRequired?: number | string | null;
  turnoverProgress?: number | string | null;
  status?: string | null;
  lifecycleStatus?: string | null;
};

type BonusResponse = {
  items?: BonusLedger[] | null;
  message?: string | null;
};

const SPECIAL_BONUS_SELECTOR = '.public-member-menu-grid:not(.public-member-menu-grid--secondary) a:nth-child(5)';

const COPY = {
  th: {
    title: 'โบนัสพิเศษ',
    close: 'ปิด',
    loading: 'กำลังโหลดโบนัส...',
    empty: 'ไม่มีข้อความใหม่',
    loadFailed: 'โหลดโบนัสไม่สำเร็จ',
    turnover: 'ยอดเทิร์น',
  },
  en: {
    title: 'Special bonus',
    close: 'Close',
    loading: 'Loading bonuses...',
    empty: 'No new messages',
    loadFailed: 'Unable to load bonuses',
    turnover: 'Turnover',
  },
} as const;

export default function MemberMenuSpecialBonusRuntime({ locale }: { locale: MemberLocale }) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<BonusLedger[]>([]);

  const close = useCallback(() => setOpen(false), []);

  const loadBonus = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await memberApiFetch('/member/bonus-ledgers');
      const payload = await response.json().catch(() => null) as BonusResponse | null;
      if (!response.ok) {
        setItems([]);
        setMessage(payload?.message?.trim() || copy.loadFailed);
        return;
      }
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch {
      setItems([]);
      setMessage(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLAnchorElement>(SPECIAL_BONUS_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      void loadBonus();
      window.setTimeout(() => {
        document.querySelector<HTMLButtonElement>('.public-member-profile-trigger[aria-expanded="true"]')?.click();
      }, 0);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [loadBonus]);

  useEffect(() => {
    if (!open) return;

    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="member-special-bonus-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="member-special-bonus-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-special-bonus-title"
      >
        <span className="member-special-bonus-top-line" aria-hidden="true" />
        <header className="member-special-bonus-header">
          <div>
            <span className="member-special-bonus-icon" aria-hidden="true">
              <img src="/assets/asset-pc/images/โบนัสพิเศษ.png" alt="" />
            </span>
            <h2 id="member-special-bonus-title">{copy.title}</h2>
          </div>
          <button type="button" onClick={close} aria-label={copy.close}>
            <CloseIcon />
          </button>
        </header>

        <div className="member-special-bonus-body" aria-live="polite">
          {loading ? (
            <BonusEmptyState label={copy.loading} />
          ) : items.length > 0 ? (
            <div className="member-special-bonus-list">
              {items.map((item) => {
                const required = safeNumber(item.turnoverRequired);
                const progress = safeNumber(item.turnoverProgress);
                const percent = required > 0 ? Math.min(100, Math.round((progress / required) * 100)) : 100;
                return (
                  <article key={item.id}>
                    <div className="member-special-bonus-card-head">
                      <strong>{item.campaign?.title?.trim() || item.campaignId}</strong>
                      <span>{statusLabel(item.status || item.lifecycleStatus || '', locale)}</span>
                    </div>
                    <b>{formatMoney(item.amount, item.currency)}</b>
                    <div className="member-special-bonus-progress-copy">
                      <span>{copy.turnover}</span>
                      <small>{formatNumber(progress)} / {formatNumber(required)}</small>
                    </div>
                    <div className="member-special-bonus-progress" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <BonusEmptyState label={message || copy.empty} />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function BonusEmptyState({ label }: { label: string }) {
  return (
    <div className="member-special-bonus-empty">
      <svg viewBox="0 0 116 81" aria-hidden="true">
        <path d="M87.431 36.608H23.215V72.73a8.027 8.027 0 0 0 8.027 8.027h48.162a8.027 8.027 0 0 0 8.027-8.027V36.608Z" fill="#e0b1f1" />
        <rect x="47.898" y="46.667" width="14.737" height="4.912" rx="2.456" fill="#a800cb" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.754 17.313a8.027 8.027 0 0 0-5.676 9.831l2.077 7.754a8.027 8.027 0 0 0 9.831 5.676l56.86-15.236a8.027 8.027 0 0 0 5.675-9.83l-2.077-7.754a8.027 8.027 0 0 0-9.831-5.676L7.753 17.313Z" fill="#a800cb" />
        <path d="M68.773 35s19.65-5.526 16.58-11.667c-1.665-3.33-6.44-3.1-9.211-.614-3.193 2.864-3.061 10.438 1.228 10.438 3.071 0 10.44.614 15.966-2.456 8.655-4.809 10.439-8.597 12.895-14.123" stroke="#e0b1f1" strokeWidth="1.228" strokeLinecap="round" strokeDasharray="2.46 2.46" />
        <path fillRule="evenodd" clipRule="evenodd" d="M112.255 7.827c.31-1.004-.96-1.731-1.669-.953l-.083.09a3.143 3.143 0 0 1-3.159.766c-1.018-.372-1.786.957-.953 1.652a3.145 3.145 0 0 1 .912 3.132l-.033.105c-.32 1.001.944 1.738 1.659.967l.088-.094a3.144 3.144 0 0 1 3.169-.761c1.021.374 1.79-.958.955-1.655a3.145 3.145 0 0 1-.902-3.202l.016-.047Z" fill="#e0b1f1" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoney(value: number | string | null | undefined, currency: string | null | undefined) {
  const code = currency?.trim() || 'THB';
  return `${code} ${formatNumber(safeNumber(value))}`;
}

function statusLabel(status: string, locale: MemberLocale) {
  const normalized = status.toUpperCase();
  const thai: Record<string, string> = {
    ACTIVE: 'กำลังทำเทิร์น',
    REVIEWING: 'กำลังตรวจ',
    TURNOVER_COMPLETED: 'ผ่านเทิร์นแล้ว',
    RELEASE_READY: 'พร้อมรับโบนัส',
    COMPLETED: 'เสร็จสิ้น',
    EXPIRED: 'หมดอายุ',
    REVOKED: 'ถูกยกเลิก',
  };
  const english: Record<string, string> = {
    ACTIVE: 'Active',
    REVIEWING: 'Reviewing',
    TURNOVER_COMPLETED: 'Turnover completed',
    RELEASE_READY: 'Ready',
    COMPLETED: 'Completed',
    EXPIRED: 'Expired',
    REVOKED: 'Revoked',
  };
  return (locale === 'th' ? thai : english)[normalized] || normalized || '-';
}
