'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../../lib/member-document-overlay-lock';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-member-promotions-page.module.css';

type UnknownRecord = Record<string, unknown>;
type PromotionCategory = 'all' | 'new-member' | 'daily' | 'privilege' | 'cashback';

type MobileMemberPromotionsPageProps = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
};

type PromotionItem = {
  id: string;
  title: string;
  image: string;
  category: Exclude<PromotionCategory, 'all'>;
  expiresAt: string;
  details: string[];
};

const CATEGORY_TABS: ReadonlyArray<{ id: PromotionCategory; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'new-member', label: 'สมาชิกใหม่' },
  { id: 'daily', label: 'ประจำวัน' },
  { id: 'privilege', label: 'สิทธิพิเศษ' },
  { id: 'cashback', label: 'คืนยอดเสีย' },
];

const SOURCE_PROMOTIONS: readonly PromotionItem[] = [
  {
    id: 'source-turnover-reward',
    title: 'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    image: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    category: 'privilege',
    expiresAt: '01/06/2030',
    details: [
      'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
      'ตรวจสอบยอดเทิร์นและเงื่อนไขการรับรางวัลจากประกาศของโปรโมชั่นก่อนรับสิทธิ์',
    ],
  },
  {
    id: 'source-refer-friend-300',
    title: 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    image: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    category: 'new-member',
    expiresAt: '30/06/2029',
    details: [
      'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!!',
      'เงื่อนไข',
      '- ผู้แนะนำ ต้องมียอดฝากภายใน 3 วันย้อนหลัง (นับจากวันที่แจ้ง)',
      '- เพื่อนที่แนะนำมา ต้องสมัครตั้งแต่วันที่ 1/6/69 เป็นต้นไป',
      '- เพื่อนที่แนะนำมา ต้องมียอดฝาก และเทิร์น 300 บาทขึ้นไป',
      '- ผู้แนะนำแจ้งเบอร์เพื่อนที่แนะนำมา ให้แอดมินตรวจสอบ',
      'โบนัสที่ได้รับ',
      '- รับโบนัสทันที 300 บาท (ต่อเพื่อนที่แนะนำมา 1 คน)',
      '- ทำเทิร์น 5 เท่า ถอนได้ไม่จำกัด',
      '- เล่นได้เฉพาะค่ายเกมสล็อต',
      '- เกมค่าย KINGMIDAS และเกมโต๊ะทุกประเภทจะไม่เข้าเงื่อนไข',
      '- การตัดสินใจของทีมงานถือเป็นที่สิ้นสุดนะคะ',
    ],
  },
  {
    id: 'source-repeat-deposit-100',
    title: 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    image: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    category: 'daily',
    expiresAt: '01/06/2027',
    details: [
      'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
      'ตรวจสอบยอดฝากขั้นต่ำ รอบเวลารับสิทธิ์ และเงื่อนไขเทิร์นก่อนรับโบนัส',
    ],
  },
] as const;

export default function MobileMemberPromotionsPage({
  payload,
  loading,
  error,
  onBack,
}: MobileMemberPromotionsPageProps) {
  const promotions = useMemo(() => normalizePromotions(payload), [payload]);
  const [category, setCategory] = useState<PromotionCategory>('all');
  const [selected, setSelected] = useState<PromotionItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
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

  function openPromotion(promotion: PromotionItem) {
    setDetailsOpen(true);
    setSelected(promotion);
  }

  return (
    <main className={styles.page} data-mobile-member-page="promotions">
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

      <section className={styles.content} aria-live="polite">
        <div className={styles.cardPanel}>
          {loading ? <PromotionSkeleton /> : null}
          {!loading && error && promotions.length === 0 ? <div className={styles.state}>{error}</div> : null}
          {!loading && visiblePromotions.length === 0 ? (
            <div className={styles.state}>ยังไม่มีโปรโมชั่นในหมวดนี้</div>
          ) : null}
          {!loading ? visiblePromotions.map((promotion) => (
            <article className={styles.card} key={promotion.id}>
              <button
                type="button"
                className={styles.imageButton}
                aria-label={`อ่านเงื่อนไข ${promotion.title}`}
                onClick={() => openPromotion(promotion)}
              >
                <PromotionImage source={promotion.image} alt={promotion.title} />
              </button>
              <div className={styles.cardCopy}>
                <strong>{promotion.title}</strong>
                <span className={styles.divider} aria-hidden="true" />
                <div className={styles.cardMeta}>
                  <span>{promotion.expiresAt ? `หมดเขต ${promotion.expiresAt}` : 'ตรวจสอบระยะเวลากับโปรโมชั่น'}</span>
                  <button type="button" onClick={() => openPromotion(promotion)}>อ่านเงื่อนไข</button>
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
            aria-labelledby="mobile-promotion-dialog-title"
          >
            <span className={styles.modalBorder} aria-hidden="true" />
            <ModalTitlePlate />
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
                <button
                  type="button"
                  className={styles.detailsHeader}
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen((current) => !current)}
                >
                  <h2 id="mobile-promotion-dialog-title">รายละเอียด</h2>
                  <ChevronIcon expanded={detailsOpen} />
                </button>
                {detailsOpen ? (
                  <div className={styles.detailsContent}>
                    {selected.details.map((line, index) => renderDetailLine(line, index))}
                  </div>
                ) : null}
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
  const resolvedSource = resolveLocalAssetOrSource(remoteSource, 'pc');
  const [currentSource, setCurrentSource] = useState(resolvedSource);

  useEffect(() => {
    setCurrentSource(resolveLocalAssetOrSource(remoteSource, 'pc'));
  }, [remoteSource]);

  return (
    <img
      className={modal ? styles.modalImage : styles.cardImage}
      src={currentSource}
      alt={alt}
      loading={modal ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (remoteSource && currentSource !== remoteSource) setCurrentSource(remoteSource);
      }}
    />
  );
}

function normalizePromotions(payload: unknown): PromotionItem[] {
  const root = asRecord(payload);
  const features = asRecord(root.features);
  const rawCampaigns = firstArray(features.promotion_campaigns, features.promotionCampaigns);

  const campaigns = rawCampaigns.flatMap((raw, index) => {
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

    const description = firstString(item.description, item.message, item.details, item.conditions, item.terms);
    const arrayTerms = firstArray(item.terms, item.conditions)
      .map((value) => typeof value === 'string' ? value.trim() : '')
      .filter(Boolean);
    const details = arrayTerms.length ? arrayTerms : splitDescription(description);

    return [{
      id: firstString(item.id, item.code, `promotion-${index + 1}`),
      title,
      image,
      category: inferCategory(item, title),
      expiresAt: formatExpiry(firstString(item.endsAt, item.endDate, item.expiresAt, item.expiredAt)),
      details: details.length ? details : [title],
    } satisfies PromotionItem];
  });

  return campaigns.length ? campaigns : [...SOURCE_PROMOTIONS];
}

function inferCategory(item: UnknownRecord, title: string): Exclude<PromotionCategory, 'all'> {
  const source = [
    item.category,
    item.promotionCategory,
    item.type,
    item.badgeText,
    item.tags,
    title,
  ].map((value) => String(value ?? '').toLowerCase()).join(' ');

  if (/คืนยอด|คืนเงิน|cashback|rebate/.test(source)) return 'cashback';
  if (/สมาชิกใหม่|ต้อนรับ|ฝากแรก|welcome|new.member|ชวนเพื่อน|refer/.test(source)) return 'new-member';
  if (/ประจำวัน|รายวัน|daily|ฝากซ้ำ/.test(source)) return 'daily';
  return 'privilege';
}

function splitDescription(value: string) {
  return decodeBasicEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function renderDetailLine(line: string, index: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^(เงื่อนไข|โบนัสที่ได้รับ|รายละเอียด)$/i.test(trimmed)) {
    return <strong className={styles.detailHeading} key={`${trimmed}-${index}`}>{trimmed}</strong>;
  }
  if (/^[-•]/.test(trimmed)) {
    return <p className={styles.detailBullet} key={`${trimmed}-${index}`}>{trimmed.replace(/^[-•]\s*/, '')}</p>;
  }
  return <p key={`${trimmed}-${index}`}>{trimmed}</p>;
}

function formatExpiry(value: string) {
  if (!value) return '';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('/');
}

function isPublished(item: UnknownRecord) {
  if (item.enabled === false || item.lifecycle === 'draft' || item.lifecycle === 'archived') return false;
  return true;
}

function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) if (Array.isArray(value)) return value;
  return [];
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
}

function ModalTitlePlate() {
  return (
    <div className={styles.modalTitlePlate} aria-hidden="true">
      <svg viewBox="0 0 194 38" fill="none">
        <path
          d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
          fill="url(#promotion-title-fill)"
          stroke="url(#promotion-title-stroke)"
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id="promotion-title-fill" x1="96" y1="38" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#505050" />
            <stop offset=".32" stopColor="#474747" />
            <stop offset=".79" stopColor="#313131" />
          </linearGradient>
          <linearGradient id="promotion-title-stroke" x1="142.5" y1="48.75" x2="142" y2="6.72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f2f2f2" />
            <stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <strong>โปรโมชั่น</strong>
    </div>
  );
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2 2 8 8M10 2 2 10" /></svg>;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return <svg className={expanded ? styles.chevronExpanded : styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>;
}
