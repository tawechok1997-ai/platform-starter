'use client';

import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../../member-api';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import {
  mobileProviderSortIndex,
  resolveMobileProviderCover,
  type MobileProviderCoverBadge,
  type MobileProviderCoverLayout,
} from './mobile-provider-cover-catalog';
import styles from './mobile-category-tab-runtime.module.css';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

type CategoryProviderSeed = {
  code: string;
  name: string;
};

type CategoryProvider = CategoryProviderSeed & {
  cover: string;
  coverLayout: MobileProviderCoverLayout;
  coverAspectRatio: number;
  badge: MobileProviderCoverBadge;
};

type CatalogGame = {
  providerId?: string | null;
  provider?: string | { code?: string | null; name?: string | null } | null;
  status?: string | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  data?: CatalogGame[] | { items?: CatalogGame[] | null } | null;
  pagination?: {
    total?: number | null;
    totalPages?: number | null;
  } | null;
  counts?: { total?: number | null } | null;
};

type ProviderCoverStyle = CSSProperties & {
  '--provider-cover-ratio': string;
};

const CATEGORY_LABELS: Record<'th' | 'en', Record<MobileCategoryId, string>> = {
  th: {
    home: 'หน้าแรก',
    casino: 'คาสิโน',
    slot: 'สล็อต',
    fishing: 'ตกปลา',
    sport: 'กีฬา',
    card: 'ไพ่',
    lottery: 'หวย',
  },
  en: {
    home: 'Home',
    casino: 'Casino',
    slot: 'Slots',
    fishing: 'Fishing',
    sport: 'Sports',
    card: 'Cards',
    lottery: 'Lottery',
  },
};

const API_CATEGORIES: Record<Exclude<MobileCategoryId, 'home'>, readonly string[]> = {
  casino: ['casino'],
  slot: ['slot'],
  fishing: ['fishing'],
  sport: ['sport', 'sports'],
  card: ['card'],
  lottery: ['lottery'],
};

const PAGE_LIMIT = 250;
const MAX_PAGES_PER_CATEGORY = 40;
const PAGE_BATCH_SIZE = 4;
const categoryCache = new Map<
  Exclude<MobileCategoryId, 'home'>,
  Promise<CategoryProviderSeed[]>
>();
const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';

export default function MobileCategoryTabRuntime() {
  const { locale } = useMemberLocale();
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    const slot = root.querySelector<HTMLElement>('[data-mobile-content-slot="after-highlight"]');
    setPortalTarget(slot);

    const switchCategory = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-mobile-category-id]');
      if (!trigger || !root.contains(trigger)) return;

      const category = trigger.dataset.mobileCategoryId;
      if (!isMobileCategoryId(category)) return;

      event.preventDefault();
      event.stopPropagation();
      setActiveCategory(category);
    };

    const selectCategory = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const category = detail && typeof detail === 'object'
        ? (detail as { category?: string }).category
        : undefined;
      if (isMobileCategoryId(category)) setActiveCategory(category);
    };

    root.addEventListener('click', switchCategory, true);
    window.addEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
    return () => {
      root.removeEventListener('click', switchCategory, true);
      window.removeEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileActiveCategory = activeCategory;
    root.querySelectorAll<HTMLElement>('[data-mobile-category-id]').forEach((item) => {
      const active = item.dataset.mobileCategoryId === activeCategory;
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    const bottomStructure = root.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
    if (bottomStructure) {
      bottomStructure.hidden = activeCategory !== 'home';
      if (activeCategory === 'home') {
        bottomStructure.removeAttribute('aria-hidden');
        bottomStructure.style.removeProperty('display');
      } else {
        bottomStructure.setAttribute('aria-hidden', 'true');
        bottomStructure.style.setProperty('display', 'none', 'important');
      }
    }

    return () => {
      if (root.dataset.mobileActiveCategory === activeCategory) {
        delete root.dataset.mobileActiveCategory;
      }
      if (bottomStructure) {
        bottomStructure.hidden = false;
        bottomStructure.removeAttribute('aria-hidden');
        bottomStructure.style.removeProperty('display');
      }
    };
  }, [activeCategory]);

  if (!portalTarget || activeCategory === 'home') return null;

  return createPortal(
    <CategoryProviderPanel
      key={activeCategory}
      category={activeCategory}
      label={CATEGORY_LABELS[locale][activeCategory]}
      locale={locale}
    />,
    portalTarget,
  );
}

function CategoryProviderPanel({
  category,
  label,
  locale,
}: {
  category: Exclude<MobileCategoryId, 'home'>;
  label: string;
  locale: 'th' | 'en';
}) {
  const [providerSeeds, setProviderSeeds] = useState<CategoryProviderSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    void getCategoryProviders(category)
      .then((items) => {
        if (!cancelled) setProviderSeeds(items);
      })
      .catch(() => {
        if (!cancelled) {
          setProviderSeeds([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const providers = useMemo(
    () => buildCategoryProviders(category, providerSeeds),
    [category, providerSeeds],
  );

  return (
    <section
      className={styles.panel}
      data-mobile-section-owner="category-content"
      data-mobile-category-content={category}
      data-mobile-provider-artwork-only="true"
      data-category-flow="provider-only"
      aria-label={label}
      aria-live="polite"
    >
      {!loading && providers.length > 0 ? (
        <div
          className={styles.providerCoverGrid}
          aria-label={locale === 'th' ? `ค่ายเกม${label}` : `${label} providers`}
        >
          {providers.map((provider) => {
            const coverStyle: ProviderCoverStyle = {
              '--provider-cover-ratio': `${provider.coverAspectRatio}%`,
            };
            const href = `/browse/games?category=${encodeURIComponent(category)}&provider=${encodeURIComponent(provider.code)}&platform=mobile`;

            return (
              <a
                key={provider.code}
                href={href}
                className={`${styles.providerCoverCard} ${provider.coverLayout === 'full' ? styles.providerCoverFull : styles.providerCoverHalf}`}
                style={coverStyle}
                data-provider-launch="true"
                data-provider-code={provider.code}
                data-provider-category={category}
                aria-label={provider.name}
              >
                <span className={styles.providerCoverMedia}>
                  <img src={provider.cover} alt={provider.name} loading="lazy" />
                  {provider.badge ? <b data-badge={provider.badge}>{provider.badge}</b> : null}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loadingGrid} aria-label={locale === 'th' ? 'กำลังโหลดค่ายเกม' : 'Loading providers'}>
          {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
        </div>
      ) : null}

      {!loading && failed ? (
        <div className={styles.stateCard} role="status">
          <strong>{locale === 'th' ? 'โหลดข้อมูลค่ายเกมไม่สำเร็จ' : 'Unable to load providers'}</strong>
        </div>
      ) : null}

      {!loading && !failed && providers.length === 0 ? (
        <div className={styles.stateCard} role="status">
          <strong>{locale === 'th' ? 'ยังไม่มีค่ายเกมในหมวดนี้' : 'No providers in this category yet'}</strong>
        </div>
      ) : null}
    </section>
  );
}

function buildCategoryProviders(
  category: Exclude<MobileCategoryId, 'home'>,
  providerSeeds: CategoryProviderSeed[],
): CategoryProvider[] {
  return providerSeeds
    .map((provider) => {
      const cover = resolveMobileProviderCover(category, provider.code);
      return {
        ...provider,
        cover: resolveLocalAssetByBasename(cover.sourceUrl, 'pc') || cover.sourceUrl,
        coverLayout: cover.layout,
        coverAspectRatio: cover.aspectRatio,
        badge: cover.badge,
      };
    })
    .sort((left, right) => {
      const order = mobileProviderSortIndex(category, left.code) - mobileProviderSortIndex(category, right.code);
      return order || left.name.localeCompare(right.name);
    });
}

async function getCategoryProviders(category: Exclude<MobileCategoryId, 'home'>) {
  let request = categoryCache.get(category);
  if (!request) {
    request = loadCategoryProviders(category).catch((error) => {
      categoryCache.delete(category);
      throw error;
    });
    categoryCache.set(category, request);
  }
  return request;
}

async function loadCategoryProviders(
  category: Exclude<MobileCategoryId, 'home'>,
): Promise<CategoryProviderSeed[]> {
  const outcomes = await Promise.allSettled(
    API_CATEGORIES[category].map((apiCategory) => loadCatalogCategory(apiCategory)),
  );
  const successful = outcomes.filter(
    (outcome): outcome is PromiseFulfilledResult<CatalogGame[]> => outcome.status === 'fulfilled',
  );
  if (successful.length === 0) throw new Error(`Unable to load mobile providers for ${category}`);

  const providers = successful
    .flatMap((outcome) => outcome.value)
    .map(mapCatalogProvider)
    .filter((item): item is CategoryProviderSeed => Boolean(item));

  return dedupeProviders(providers);
}

async function loadCatalogCategory(category: string): Promise<CatalogGame[]> {
  const first = await fetchCatalogPage(category, 1);
  const items = [...extractCatalogItems(first)];
  const totalPages = Math.min(MAX_PAGES_PER_CATEGORY, readTotalPages(first, items.length));

  for (let start = 2; start <= totalPages; start += PAGE_BATCH_SIZE) {
    const pages = Array.from(
      { length: Math.min(PAGE_BATCH_SIZE, totalPages - start + 1) },
      (_, index) => start + index,
    );
    const results = await Promise.allSettled(pages.map((page) => fetchCatalogPage(category, page)));
    results.forEach((result) => {
      if (result.status === 'fulfilled') items.push(...extractCatalogItems(result.value));
    });
  }

  return items;
}

async function fetchCatalogPage(category: string, page: number): Promise<CatalogPayload | null> {
  const params = new URLSearchParams({
    platform: 'mobile',
    category,
    page: String(page),
    limit: String(PAGE_LIMIT),
  });
  const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });
  if (!response.ok) throw new Error(`catalog ${category} page ${page}: ${response.status}`);
  return response.json().catch(() => null) as Promise<CatalogPayload | null>;
}

function extractCatalogItems(payload: CatalogPayload | null): CatalogGame[] {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.items)) {
    return payload.data.items;
  }
  return [];
}

function readTotalPages(payload: CatalogPayload | null, fallbackItemCount: number) {
  const direct = Number(payload?.pagination?.totalPages);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const total = Number(payload?.pagination?.total ?? payload?.counts?.total ?? fallbackItemCount);
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / PAGE_LIMIT));
}

function mapCatalogProvider(item: CatalogGame): CategoryProviderSeed | null {
  if (item.status && /disabled|maintenance|inactive/i.test(item.status)) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const providerCode = normalizeProviderCode(firstText(
    providerObject?.code,
    item.providerId,
    typeof item.provider === 'string' ? item.provider : null,
    providerObject?.name,
  ));
  if (!providerCode) return null;

  const providerName = firstText(
    providerObject?.name,
    providerObject?.code,
    item.providerId,
    typeof item.provider === 'string' ? item.provider : null,
  );

  return {
    code: providerCode,
    name: providerName || providerCode.toUpperCase(),
  };
}

function dedupeProviders(items: CategoryProviderSeed[]) {
  return Array.from(
    new Map(items.map((item) => [item.code.toLowerCase(), item] as const)).values(),
  );
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function firstText(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof value === 'string' ? value.trim() : '';
}

function isMobileCategoryId(value: string | undefined): value is MobileCategoryId {
  return value === 'home'
    || value === 'casino'
    || value === 'slot'
    || value === 'fishing'
    || value === 'sport'
    || value === 'card'
    || value === 'lottery';
}
