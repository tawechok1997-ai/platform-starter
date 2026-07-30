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
      data-member-layer-keeps-profile-open="true"
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
  return <div className="member-special-bonus-empty"><span aria-hidden="true">◆</span><strong>{label}</strong></div>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
}

function formatMoney(value: unknown, currency?: string | null) {
  const amount = safeNumber(value);
  const code = String(currency || 'THB').trim().toUpperCase() || 'THB';
  try {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${code} ${formatNumber(amount)}`;
  }
}

function statusLabel(value: string, locale: MemberLocale) {
  const normalized = value.trim().toUpperCase();
  if (locale === 'en') return normalized || 'ACTIVE';
  if (['ACTIVE', 'CLAIMED', 'RELEASED'].includes(normalized)) return 'ใช้งาน';
  if (['LOCKED', 'PENDING', 'WAGERING'].includes(normalized)) return 'กำลังทำเทิร์น';
  if (['EXPIRED', 'CANCELLED', 'VOID'].includes(normalized)) return 'สิ้นสุด';
  return normalized || 'ใช้งาน';
}
