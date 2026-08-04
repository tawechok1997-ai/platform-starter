'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../../lib/member-document-overlay-lock';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-member-promotions-page.module.css';

type UnknownRecord = Record<string, unknown>;
type PromotionCategory = 'all' | 'new-member' | 'daily' | 'privilege' | 'cashback';

type PromotionItem = {
  id: string;
  title: string;
  image: string;
  category: Exclude<PromotionCategory, 'all'>;
  expiresAt: string;
  details: string[];
};

type MobileMemberPromotionsLivePageProps = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
};

const CATEGORY_TABS: ReadonlyArray<{ id: PromotionCategory; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'new-member', label: 'สมาชิกใหม่' },
  { id: 'daily', label: 'ประจำวัน' },
  { id: 'privilege', label: 'สิทธิพิเศษ' },
  { id: 'cashback', label: 'คืนยอดเสีย' },
];
const PROMOTION_PLACEHOLDER = '/assets/asset-pc/images/โปรโมชั้น.png';

export default function MobileMemberPromotionsLivePage({
  payload,
  loading,
  error,
  onBack,
}: MobileMemberPromotionsLivePageProps) {
  const promotions = useMemo(() => normalizePromotions(payload), [payload]);
  const [category, setCategory] = useState<PromotionCategory>('all');
  const [selected, setSelected] = useState<PromotionItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visiblePromotions = category === 'all'
    ? promotions
    : promotions.filter((promotion) => promotion.category === category);

  useEffect(() => {
    if (!selected) return;
    const releaseLock = acquireMemberDocumentOverlayLock();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      releaseLock();
    };
  }, [selected]);

  return (
    <main className={styles.page} data-mobile-member-page="promotions" data-content-source="api">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>โปรโมชั่น</h1>
        <span aria-hidden="true" />
      </header>

      <nav className={styles.categoryBar} aria-label="หมวดโปรโมชั่น">
        <div className={styles.categoryScroller}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={category === tab.id ? styles.categoryActive : styles.categoryButton}
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <section className={styles.content} aria-live="polite" aria-busy={loading}>
        <div className={styles.cardPanel}>
          {loading ? <PromotionSkeleton /> : null}
          {!loading && error ? <div className={styles.state}>{error}</div> : null}
          {!loading && !error && visiblePromotions.length === 0 ? (
            <div className={styles.state}>ยังไม่มีโปรโมชั่นที่เผยแพร่</div>
          ) : null}
          {!loading && !error ? visiblePromotions.map((promotion) => (
            <article className={styles.card} key={promotion.id}>
              <button
                type="button"
                className={styles.imageButton}
                aria-label={`อ่านเงื่อนไข ${promotion.title}`}
                onClick={() => setSelected(promotion)}
              >
                <PromotionImage source={promotion.image} alt={promotion.title} />
              </button>
              <div className={styles.cardCopy}>
                <strong>{promotion.title}</strong>
                <span className={styles.divider} aria-hidden="true" />
                <div className={styles.cardMeta}>
                  <span>{promotion.expiresAt ? `หมดเขต ${promotion.expiresAt}` : 'ไม่ระบุวันหมดเขต'}</span>
                  <button type="button" onClick={() => setSelected(promotion)}>อ่านเงื่อนไข</button>
                </div>
              </div>
            </article>
          )) : null}
        </div>
      </section>

      {selected && typeof document !== 'undefined' ? createPortal(
        <div className={styles.modalRoot} role="presentation">
          <button
            type="button"
            className={styles.modalBackdrop}
            aria-label="ปิดรายละเอียดโปรโมชั่น"
            onClick={() => setSelected(null)}
          />
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-p8-promotion-title"
            data-mobile-popup-owner="promotion-detail"
          >
            <span className={styles.modalBorder} aria-hidden="true" />
            <div className={styles.modalTitlePlate} aria-hidden="true">
              <svg viewBox="0 0 194 38"><path d="M3 1h188l-5.3 19.2C182 30.5 173 36 160.5 36h-129C19 36 10 30.5 6.3 20.2L1 1h2Z" fill="#3f3b4b" /></svg>
              <strong>รายละเอียด</strong>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.modalClose}
              aria-label="ปิด"
              onClick={() => setSelected(null)}
            >
              <CloseIcon />
            </button>
            <div className={styles.modalScroller}>
              <PromotionImage source={selected.image} alt={selected.title} modal />
              <div className={styles.detailsBlock}>
                <div className={styles.detailsContent}>
                  <p id="mobile-p8-promotion-title">{selected.title}</p>
                  {selected.details.map((line, index) => <p key={`${line}:${index}`}>{line}</p>)}
                </div>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}

function PromotionSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="กำลังโหลดโปรโมชั่น">
      {[0, 1, 2].map((index) => (
        <div className={styles.skeletonCard} key={index}>
          <span className={styles.skeletonImage} />
          <span className={styles.skeletonTitle} />
          <span className={styles.skeletonMeta} />
        </div>
      ))}
    </div>
  );
}

function PromotionImage({ source, alt, modal = false }: { source: string; alt: string; modal?: boolean }) {
  const remoteSource = source.trim();
  const [currentSource, setCurrentSource] = useState(() => resolveLocalAssetOrSource(remoteSource, 'mobile') || remoteSource);

  useEffect(() => {
    setCurrentSource(resolveLocalAssetOrSource(remoteSource, 'mobile') || remoteSource);
  }, [remoteSource]);

  return (
    <img
      className={modal ? styles.modalImage : styles.cardImage}
      src={currentSource || PROMOTION_PLACEHOLDER}
      alt={alt}
      loading={modal ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (remoteSource && currentSource !== remoteSource) setCurrentSource(remoteSource);
        else if (currentSource !== PROMOTION_PLACEHOLDER) setCurrentSource(PROMOTION_PLACEHOLDER);
      }}
    />
  );
}

function normalizePromotions(payload: unknown): PromotionItem[] {
  const root = asRecord(payload);
  const features = asRecord(root.features);
  const rawCampaigns = firstArray(features.promotion_campaigns, features.promotionCampaigns);

  return rawCampaigns.flatMap((raw, index) => {
    const item = asRecord(raw);
    if (!isPublished(item)) return [];
    const title = firstString(item.title, item.name, `โปรโมชั่น ${index + 1}`);
    const image = firstString(
      item.mobileImageUrl,
      item.mobile_image_url,
      item.desktopImageUrl,
      item.desktop_image_url,
      item.imageUrl,
      item.image,
      item.bannerUrl,
    );
    if (!image) return [];
    const arrayTerms = firstArray(item.terms, item.conditions)
      .map((value) => typeof value === 'string' ? value.trim() : '')
      .filter(Boolean);
    const description = firstString(item.description, item.message, item.details);
    const details = arrayTerms.length > 0 ? arrayTerms : splitDescription(description);

    return [{
      id: firstString(item.id, item.code, `promotion-${index + 1}`),
      title,
      image,
      category: inferCategory(item, title),
      expiresAt: formatExpiry(firstString(item.endsAt, item.endDate, item.expiresAt, item.expiredAt)),
      details: details.length > 0 ? details : [title],
    } satisfies PromotionItem];
  });
}

function inferCategory(item: UnknownRecord, title: string): Exclude<PromotionCategory, 'all'> {
  const source = [item.category, item.promotionCategory, item.type, item.badgeText, item.tags, title]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');
  if (/คืนยอด|คืนเงิน|cashback|rebate/.test(source)) return 'cashback';
  if (/สมาชิกใหม่|ต้อนรับ|ฝากแรก|welcome|new.member|ชวนเพื่อน|refer/.test(source)) return 'new-member';
  if (/ประจำวัน|รายวัน|daily|ฝากซ้ำ/.test(source)) return 'daily';
  return 'privilege';
}

function splitDescription(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatExpiry(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function isPublished(item: UnknownRecord) {
  const lifecycle = firstString(item.lifecycle, item.status).toLowerCase();
  return item.enabled !== false
    && lifecycle !== 'draft'
    && lifecycle !== 'archived'
    && lifecycle !== 'disabled';
}

function firstArray(...values: unknown[]) {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? [];
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="m1 1 10 10M11 1 1 11" />
    </svg>
  );
}
