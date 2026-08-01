'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { useMemberLocale } from '../../member-locale-provider';
import { useMemberRuntime } from '../../member-runtime-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import MobileCasinoProviderPage from './mobile-casino-provider-page';
import MobileSourceContent from './mobile-source-content';
import MobileSportProviderPage from './mobile-sport-provider-page';
import styles from './mobile-highlight-tab-content.module.css';

export type MobileHighlightTab = 'highlights' | 'promotions' | 'activities' | 'news';
type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

type HighlightItem = {
  id: string;
  title: string;
  summary: string;
  image: string;
  href: string;
  endsAt?: string;
};

type PublicPromotionPayload = {
  items?: unknown[];
};

type MobileHighlightTabContentProps = {
  activeTab: MobileHighlightTab;
};

const MOBILE_CATEGORY_IDS = new Set<MobileCategoryId>([
  'home',
  'casino',
  'slot',
  'fishing',
  'sport',
  'card',
  'lottery',
]);

export default function MobileHighlightTabContent({ activeTab }: MobileHighlightTabContentProps) {
  const { locale } = useMemberLocale();
  const { home } = useMemberRuntime();
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');
  const [apiPromotions, setApiPromotions] = useState<HighlightItem[]>([]);
  const [promotionStatus, setPromotionStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    void loadPublicPromotions(controller.signal)
      .then((items) => {
        setApiPromotions(items);
        setPromotionStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setPromotionStatus('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const selectFromClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>('[data-mobile-category-id]');
      const category = trigger?.dataset.mobileCategoryId;
      if (isMobileCategoryId(category)) setActiveCategory(category);
    };

    const selectFromEvent = (event: Event) => {
      const category = (event as CustomEvent<{ category?: unknown }>).detail?.category;
      if (isMobileCategoryId(category)) setActiveCategory(category);
    };

    window.addEventListener('click', selectFromClick, true);
    window.addEventListener('member:mobile-category-select', selectFromEvent);
    return () => {
      window.removeEventListener('click', selectFromClick, true);
      window.removeEventListener('member:mobile-category-select', selectFromEvent);
    };
  }, []);

  const promotions = useMemo(
    () => dedupeItems([
      ...apiPromotions,
      ...home.promotions.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        image: item.image,
        href: `/browse/promotions/${encodeURIComponent(item.id)}`,
        ...(item.endsAt ? { endsAt: item.endsAt } : {}),
      })),
    ]),
    [apiPromotions, home.promotions],
  );
  const activities = useMemo(() => home.activities.map(runtimeItem), [home.activities]);
  const news = useMemo(() => home.news.map(runtimeItem), [home.news]);
  const copy = COPY[locale];

  if (activeCategory === 'casino') {
    return <MobileCasinoProviderPage />;
  }

  if (activeCategory === 'sport') {
    return <MobileSportProviderPage />;
  }

  if (activeCategory !== 'home') {
    return <MobileSourceContent />;
  }

  if (activeTab === 'promotions') {
    return (
      <section className={styles.panel} data-mobile-highlight-panel="promotions" aria-label={copy.promotions}>
        {promotionStatus === 'loading' && promotions.length === 0 ? <ContentState message={copy.loading} /> : null}
        {promotionStatus === 'error' && promotions.length === 0 ? <ContentState message={copy.loadError} /> : null}
        {promotionStatus === 'ready' && promotions.length === 0 ? <ContentState message={copy.noPromotions} /> : null}
        {promotions.length > 0 ? (
          <div className={styles.promotionList}>
            {promotions.map((item) => (
              <Link key={item.id} href={item.href} className={styles.promotionCard} aria-label={item.title}>
                <AssetImage source={item.image} alt={item.title} />
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (activeTab === 'activities') {
    return <ContentList kind="activities" items={activities} emptyMessage={copy.noActivities} actionLabel={copy.join} locale={locale} />;
  }

  if (activeTab === 'news') {
    return <ContentList kind="news" items={news} emptyMessage={copy.noNews} actionLabel={copy.readMore} locale={locale} />;
  }

  return <MobileSourceContent />;
}

function ContentList({
  kind,
  items,
  emptyMessage,
  actionLabel,
  locale,
}: {
  kind: 'activities' | 'news';
  items: HighlightItem[];
  emptyMessage: string;
  actionLabel: string;
  locale: 'th' | 'en';
}) {
  if (items.length === 0) {
    return (
      <section className={`${styles.panel} ${styles.newsPanel}`} data-mobile-highlight-panel={kind}>
        <ContentState message={emptyMessage} />
      </section>
    );
  }

  return (
    <section className={styles.panel} data-mobile-highlight-panel={kind}>
      <div className={styles.activityList}>
        {items.map((item) => (
          <article key={item.id} className={styles.activityCard}>
            <AssetImage source={item.image} alt={item.title} />
            <div className={styles.activityContent}>
              <strong>{item.title}</strong>
              <span>{item.endsAt ? formatDate(item.endsAt, locale) : item.summary}</span>
              <Link href={item.href} className={styles.joinButton}>{actionLabel}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState} role="status">
      <svg viewBox="0 0 64 48" aria-hidden="true">
        <path d="M8 12h48v30H8zM14 6h36v8H14z" fill="#e0b1f1" />
        <path d="M24 25h16M24 32h10" stroke="#a800cb" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <strong>{message}</strong>
    </div>
  );
}

async function loadPublicPromotions(signal: AbortSignal): Promise<HighlightItem[]> {
  const response = await memberApiFetch('/public/promotions', {
    signal,
    cache: 'no-store',
    credentials: 'omit',
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });
  if (!response.ok) throw new Error(`public promotions: ${response.status}`);
  const payload = await response.json().catch(() => null) as PublicPromotionPayload | null;
  if (!Array.isArray(payload?.items)) return [];

  return payload.items.map((raw, index) => {
    const item = record(raw);
    const id = text(item.id, `promotion-${index + 1}`);
    return {
      id,
      title: text(item.title, `Promotion ${index + 1}`),
      summary: text(item.description, ''),
      image: firstText(item.mobileImageUrl, item.imageUrl, item.sourceImageUrl, item.desktopImageUrl),
      href: `/browse/promotions/${encodeURIComponent(id)}`,
      ...(optionalText(item.endsAt) ? { endsAt: optionalText(item.endsAt)! } : {}),
    };
  }).filter((item) => item.title && item.image);
}

function runtimeItem(item: ReturnType<typeof useMemberRuntime>['home']['activities'][number]): HighlightItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.image,
    href: `/browse/promotions/${encodeURIComponent(item.id)}`,
    ...(item.endsAt ? { endsAt: item.endsAt } : {}),
  };
}

function dedupeItems(items: HighlightItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item] as const)).values());
}

function formatDate(value: string, locale: 'th' | 'en') {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function isMobileCategoryId(value: unknown): value is MobileCategoryId {
  return typeof value === 'string' && MOBILE_CATEGORY_IDS.has(value as MobileCategoryId);
}

function AssetImage({ source, alt }: { source: string; alt: string }) {
  const localOrRemote = resolveLocalAssetOrSource(source, 'any');
  return (
    <img
      src={localOrRemote}
      alt={alt}
      loading="lazy"
      data-asset-source="local-first"
      onError={(event) => {
        if (localOrRemote !== source && /^https?:\/\//i.test(source)) {
          event.currentTarget.src = source;
          return;
        }
        event.currentTarget.hidden = true;
      }}
    />
  );
}

const COPY = {
  th: {
    promotions: 'โปรโมชั่นแนะนำ',
    loading: 'กำลังโหลดข้อมูลล่าสุด...',
    loadError: 'โหลดโปรโมชั่นไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    noPromotions: 'ยังไม่มีโปรโมชั่นที่เผยแพร่',
    noActivities: 'ยังไม่มีกิจกรรมที่เผยแพร่',
    noNews: 'คุณยังไม่มีข่าวสารใหม่',
    join: 'เข้าร่วม',
    readMore: 'อ่านเพิ่มเติม',
  },
  en: {
    promotions: 'Recommended promotions',
    loading: 'Loading the latest content...',
    loadError: 'Unable to load promotions. Please try again.',
    noPromotions: 'No published promotions yet',
    noActivities: 'No published activities yet',
    noNews: 'There is no new content',
    join: 'Join',
    readMore: 'Read more',
  },
} as const;
