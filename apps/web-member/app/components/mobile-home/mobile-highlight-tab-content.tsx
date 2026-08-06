'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import MobileCardProviderPage from './mobile-card-provider-page';
import MobileCasinoProviderPage from './mobile-casino-provider-page';
import MobileFishingProviderPage from './mobile-fishing-provider-page';
import MobileLotteryProviderPage from './mobile-lottery-provider-page';
import MobileSlotProviderPage from './mobile-slot-provider-page';
import MobileSourceContent from './mobile-source-content';
import MobileSportProviderPage from './mobile-sport-provider-page';
import {
  useMobileActivitiesSource,
  useMobileNewsSource,
  useMobilePromotionsSource,
  type MobileMemberContentItem,
} from './use-mobile-member-content-sources';
import styles from './mobile-highlight-tab-content.module.css';

export type MobileHighlightTab = 'highlights' | 'promotions' | 'activities' | 'news';
type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

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

const MOBILE_INLINE_MEMBER_TABS: Readonly<Record<string, Exclude<MobileHighlightTab, 'highlights'>>> = {
  '/mobile/member/promotions': 'promotions',
  '/mobile/member/activity': 'activities',
  '/mobile/member/news': 'news',
};

const MOBILE_HIGHLIGHT_TAB_INDEX: Readonly<Record<Exclude<MobileHighlightTab, 'highlights'>, number>> = {
  promotions: 1,
  activities: 2,
  news: 3,
};

const TOP_CHROME_SELECTOR = [
  '[data-mobile-section-owner="header"]',
  '[data-mobile-section-owner="hero"]',
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-section-owner="announcement"]',
  '[data-mobile-section-owner="highlight-tabs"]',
].join(', ');

export default function MobileHighlightTabContent({ activeTab }: MobileHighlightTabContentProps) {
  const { locale } = useMemberLocale();
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');
  const promotionSource = useMobilePromotionsSource();
  const activitySource = useMobileActivitiesSource();
  const newsSource = useMobileNewsSource();
  const copy = COPY[locale];

  useEffect(() => {
    let scrollFrame = 0;
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');

    const applyCategory = (category: MobileCategoryId) => {
      setActiveCategory((current) => current === category ? current : category);
      if (root) {
        root.dataset.mobileActiveCategory = category;
        restoreTopChrome(root);
      }

      if (category !== 'home') {
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        scrollFrame = window.requestAnimationFrame(() => {
          const scrollOwner = document.scrollingElement;
          if (scrollOwner) scrollOwner.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          else window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        });
      }
    };

    const selectFromEvent = (event: Event) => {
      const category = (event as CustomEvent<{ category?: unknown }>).detail?.category;
      if (isMobileCategoryId(category)) applyCategory(category);
    };

    applyCategory('home');
    window.addEventListener('member:mobile-category-select', selectFromEvent);
    return () => {
      window.removeEventListener('member:mobile-category-select', selectFromEvent);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (root) delete root.dataset.mobileActiveCategory;
    };
  }, []);

  useEffect(() => {
    const keepMemberContentInline = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!document.querySelector('[data-mobile-home-root="true"]')) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.download || (anchor.target && anchor.target !== '_self')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const normalizedPath = destination.pathname.replace(/\/+$/, '') || '/';
      const inlineTab = MOBILE_INLINE_MEMBER_TABS[normalizedPath];
      if (!inlineTab) return;

      const tabButton = document.getElementById(`mobile-highlight-tab-${MOBILE_HIGHLIGHT_TAB_INDEX[inlineTab]}`);
      if (!(tabButton instanceof HTMLButtonElement)) return;

      event.preventDefault();
      tabButton.click();
      tabButton.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-mobile-section-owner="highlight-tabs"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    window.addEventListener('click', keepMemberContentInline, true);
    return () => window.removeEventListener('click', keepMemberContentInline, true);
  }, []);

  if (activeCategory === 'casino') return <MobileCasinoProviderPage />;
  if (activeCategory === 'slot') return <MobileSlotProviderPage />;
  if (activeCategory === 'fishing') return <MobileFishingProviderPage />;
  if (activeCategory === 'sport') return <MobileSportProviderPage />;
  if (activeCategory === 'card') return <MobileCardProviderPage />;
  if (activeCategory === 'lottery') return <MobileLotteryProviderPage />;
  if (activeCategory !== 'home') return <MobileSourceContent />;

  if (activeTab === 'promotions') {
    return (
      <section className={styles.panel} data-mobile-highlight-panel="promotions" data-content-source="shared-promotions" aria-label={copy.promotions}>
        {promotionSource.loading && promotionSource.items.length === 0 ? <ContentState message={copy.loading} /> : null}
        {promotionSource.status === 'error' && promotionSource.items.length === 0 ? <ContentState message={copy.loadError} /> : null}
        {promotionSource.status === 'ready' && promotionSource.items.length === 0 ? <ContentState message={copy.noPromotions} /> : null}
        {promotionSource.items.length > 0 ? (
          <div className={styles.promotionList}>
            {promotionSource.items.map((item) => (
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
    return (
      <ContentList
        kind="activities"
        items={activitySource.summaries}
        loading={activitySource.loading}
        error={activitySource.error}
        emptyMessage={copy.noActivities}
        actionLabel={copy.join}
        locale={locale}
      />
    );
  }

  if (activeTab === 'news') {
    return (
      <ContentList
        kind="news"
        items={newsSource.items}
        loading={newsSource.loading}
        error={newsSource.error}
        emptyMessage={copy.noNews}
        actionLabel={copy.readMore}
        locale={locale}
      />
    );
  }

  return <MobileSourceContent />;
}

function restoreTopChrome(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(TOP_CHROME_SELECTOR).forEach((section) => {
    section.hidden = false;
    section.removeAttribute('aria-hidden');
    section.style.removeProperty('display');
    section.style.removeProperty('visibility');
    section.style.removeProperty('opacity');
  });
}

function ContentList({
  kind,
  items,
  loading,
  error,
  emptyMessage,
  actionLabel,
  locale,
}: {
  kind: 'activities' | 'news';
  items: MobileMemberContentItem[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  actionLabel: string;
  locale: 'th' | 'en';
}) {
  if (loading && items.length === 0) {
    return <section className={styles.panel} data-mobile-highlight-panel={kind}><ContentState message={COPY[locale].loading} /></section>;
  }
  if (error && items.length === 0) {
    return <section className={styles.panel} data-mobile-highlight-panel={kind}><ContentState message={error} /></section>;
  }
  if (items.length === 0) {
    return (
      <section className={`${styles.panel} ${styles.newsPanel}`} data-mobile-highlight-panel={kind}>
        <ContentState message={emptyMessage} />
      </section>
    );
  }

  return (
    <section className={styles.panel} data-mobile-highlight-panel={kind} data-content-source="shared-content">
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

function formatDate(value: string, locale: 'th' | 'en') {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
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
