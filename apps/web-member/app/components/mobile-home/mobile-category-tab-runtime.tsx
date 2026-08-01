'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
type GameBadge = 'HOT' | 'NEW' | '';

type CategoryGame = {
  id: string;
  providerGameCode: string;
  name: string;
  category: string;
  providerCode: string;
  providerName: string;
  providerIcon: string;
  image: string;
  badge: GameBadge;
  players: number;
};

type CategoryProvider = {
  code: string;
  name: string;
  icon: string;
  cover: string;
  coverLayout: MobileProviderCoverLayout;
  coverAspectRatio: number;
  badge: MobileProviderCoverBadge;
  games: CategoryGame[];
};

type CatalogMedia = {
  sourceUrl?: string | null;
  cachedUrl?: string | null;
  status?: string | null;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  providerId?: string | null;
  provider?: string | { code?: string | null; name?: string | null; logoUrl?: string | null } | null;
  providerLogoUrl?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  iconUrl?: string | null;
  media?: CatalogMedia[] | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  isPopular?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  tags?: string[] | null;
  metadata?: { tags?: unknown } | null;
  status?: string | null;
  rawPayload?: { assetSource?: string | null } | null;
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
    fishing: 'ยิงปลา',
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
const categoryCache = new Map<Exclude<MobileCategoryId, 'home'>, Promise<CategoryGame[]>>();
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

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileActiveCategory = activeCategory;
    root.querySelectorAll<HTMLElement>('[data-mobile-category-id]').forEach((item) => {
      const active = item.dataset.mobileCategoryId === activeCategory;
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    return () => {
      if (root.dataset.mobileActiveCategory === activeCategory) {
        delete root.dataset.mobileActiveCategory;
      }
    };
  }, [activeCategory]);

  if (!portalTarget || activeCategory === 'home') return null;

  return createPortal(
    <CategoryPanel
      key={activeCategory}
      category={activeCategory}
      label={CATEGORY_LABELS[locale][activeCategory]}
      locale={locale}
    />,
    portalTarget,
  );
}

function CategoryPanel({
  category,
  label,
  locale,
}: {
  category: Exclude<MobileCategoryId, 'home'>;
  label: string;
  locale: 'th' | 'en';
}) {
  const [games, setGames] = useState<CategoryGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeProvider, setActiveProvider] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setActiveProvider('all');

    void getCategoryGames(category)
      .then((items) => {
        if (!cancelled) setGames(items);
      })
      .catch(() => {
        if (!cancelled) {
          setGames([]);
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

  const providers = useMemo(() => buildCategoryProviders(category, games), [category, games]);
  const visibleProviders = useMemo(() => {
    if (activeProvider === 'all') return providers;
    return providers.filter((provider) => provider.code === activeProvider);
  }, [activeProvider, providers]);
  const visibleGameCount = visibleProviders.reduce((total, provider) => total + provider.games.length, 0);

  return (
    <section
      className={styles.panel}
      data-mobile-section-owner="category-content"
      data-mobile-category-content={category}
      aria-labelledby="mobile-category-content-title"
      aria-live="polite"
    >
      <header className={styles.heading}>
        <div>
          <span>{locale === 'th' ? 'หมวดเกม' : 'Game category'}</span>
          <h2 id="mobile-category-content-title">{label}</h2>
        </div>
        {!loading ? <strong>{visibleGameCount}</strong> : null}
      </header>

      {!loading && providers.length > 0 ? (
        <section className={styles.providerPicker} aria-label={locale === 'th' ? 'เลือกค่ายเกม' : 'Choose provider'}>
          <div className={styles.providerPickerHeading}>
            <strong>{locale === 'th' ? 'ค่ายเกม' : 'Providers'}</strong>
            <button
              type="button"
              className={activeProvider === 'all' ? styles.providerAllActive : ''}
              onClick={() => setActiveProvider('all')}
              aria-pressed={activeProvider === 'all'}
            >
              {locale === 'th' ? 'ทั้งหมด' : 'All'}
            </button>
          </div>
          <div className={styles.providerCoverGrid}>
            {providers.map((provider) => {
              const active = activeProvider === provider.code;
              const coverStyle: ProviderCoverStyle = {
                '--provider-cover-ratio': `${provider.coverAspectRatio}%`,
              };
              return (
                <button
                  key={provider.code}
                  type="button"
                  className={`${styles.providerCoverCard} ${provider.coverLayout === 'full' ? styles.providerCoverFull : styles.providerCoverHalf}${active ? ` ${styles.providerCoverActive}` : ''}`}
                  style={coverStyle}
                  onClick={() => setActiveProvider((current) => current === provider.code ? 'all' : provider.code)}
                  aria-pressed={active}
                  aria-label={`${provider.name} ${provider.games.length} ${locale === 'th' ? 'เกม' : 'games'}`}
                >
                  <span className={styles.providerCoverMedia}>
                    <img src={provider.cover} alt={provider.name} loading="lazy" />
                    {provider.badge ? <b data-badge={provider.badge}>{provider.badge}</b> : null}
                    <small>{provider.games.length}</small>
                  </span>
                  <span className={styles.providerCoverName}>{provider.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className={styles.loadingGrid} aria-label={locale === 'th' ? 'กำลังโหลดเกม' : 'Loading games'}>
          {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
        </div>
      ) : null}

      {!loading && failed ? (
        <div className={styles.stateCard} role="status">
          <strong>{locale === 'th' ? 'โหลดข้อมูลไม่สำเร็จ' : 'Unable to load games'}</strong>
          <span>{locale === 'th' ? 'ระบบจะลองใหม่เมื่อเปิดหมวดนี้อีกครั้ง' : 'The catalog will retry when this category is opened again.'}</span>
        </div>
      ) : null}

      {!loading && !failed && providers.length === 0 ? (
        <div className={styles.stateCard} role="status">
          <strong>{locale === 'th' ? 'ยังไม่มีเกมในหมวดนี้' : 'No games in this category yet'}</strong>
          <span>{locale === 'th' ? 'ไม่มีการนำข้อมูลจำลองมาแสดงแทนข้อมูลกลาง' : 'No mock records are shown in place of central data.'}</span>
        </div>
      ) : null}

      {!loading && visibleProviders.length > 0 ? (
        <div className={styles.providerGameGroups}>
          {visibleProviders.map((provider) => (
            <section key={provider.code} className={styles.providerGameGroup} aria-label={provider.name}>
              <header className={styles.providerGameHeading}>
                {provider.icon ? <img src={provider.icon} alt="" loading="lazy" /> : <span aria-hidden="true" />}
                <div>
                  <strong>{provider.name}</strong>
                  <small>{provider.games.length} {locale === 'th' ? 'เกม' : 'games'}</small>
                </div>
              </header>
              <div className={styles.gameGrid}>
                {provider.games.map((game) => (
                  <button
                    key={`${game.providerCode}:${game.id}`}
                    type="button"
                    className={styles.gameCard}
                    data-game-id={game.id}
                    data-game-code={game.providerGameCode}
                    data-game-name={game.name}
                    data-provider-code={game.providerCode}
                    data-game-category={game.category}
                    aria-label={`${locale === 'th' ? 'เล่น' : 'Play'} ${game.name}`}
                  >
                    <div className={styles.poster}>
                      <img src={game.image} alt={game.name} loading="lazy" />
                      {game.badge ? <span data-badge={game.badge}>{game.badge}</span> : null}
                      {game.players > 0 ? <small>{game.players.toLocaleString('en-US')} {locale === 'th' ? 'ออนไลน์' : 'online'}</small> : null}
                    </div>
                    <div className={styles.meta}>
                      {game.providerIcon ? <img src={game.providerIcon} alt="" loading="lazy" /> : <span aria-hidden="true" />}
                      <div>
                        <strong>{game.name}</strong>
                        <small>{game.providerName || '-'}</small>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildCategoryProviders(
  category: Exclude<MobileCategoryId, 'home'>,
  games: CategoryGame[],
): CategoryProvider[] {
  const groups = new Map<string, CategoryGame[]>();
  games.forEach((game) => {
    const current = groups.get(game.providerCode) ?? [];
    current.push(game);
    groups.set(game.providerCode, current);
  });

  return Array.from(groups.entries())
    .map(([code, providerGames]) => {
      const first = providerGames[0]!;
      const cover = resolveMobileProviderCover(category, code);
      return {
        code,
        name: first.providerName || code.toUpperCase(),
        icon: first.providerIcon,
        cover: resolveLocalAssetByBasename(cover.sourceUrl, 'pc') || cover.sourceUrl,
        coverLayout: cover.layout,
        coverAspectRatio: cover.aspectRatio,
        badge: cover.badge,
        games: providerGames,
      };
    })
    .sort((left, right) => {
      const order = mobileProviderSortIndex(category, left.code) - mobileProviderSortIndex(category, right.code);
      return order || left.name.localeCompare(right.name);
    });
}

async function getCategoryGames(category: Exclude<MobileCategoryId, 'home'>) {
  let request = categoryCache.get(category);
  if (!request) {
    request = loadCategoryGames(category).catch((error) => {
      categoryCache.delete(category);
      throw error;
    });
    categoryCache.set(category, request);
  }
  return request;
}

async function loadCategoryGames(category: Exclude<MobileCategoryId, 'home'>): Promise<CategoryGame[]> {
  const outcomes = await Promise.allSettled(
    API_CATEGORIES[category].map((apiCategory) => loadCatalogCategory(apiCategory)),
  );
  const successful = outcomes.filter((outcome): outcome is PromiseFulfilledResult<CatalogGame[]> => outcome.status === 'fulfilled');
  if (successful.length === 0) throw new Error(`Unable to load mobile catalog for ${category}`);

  const items = successful.flatMap((outcome) => outcome.value)
    .map(mapCatalogGame)
    .filter((item): item is CategoryGame => Boolean(item));
  return dedupeGames(items);
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
  if (payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.items)) return payload.data.items;
  return [];
}

function readTotalPages(payload: CatalogPayload | null, fallbackItemCount: number) {
  const direct = Number(payload?.pagination?.totalPages);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const total = Number(payload?.pagination?.total ?? payload?.counts?.total ?? fallbackItemCount);
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / PAGE_LIMIT));
}

function mapCatalogGame(item: CatalogGame): CategoryGame | null {
  const id = firstText(item.id, item.providerGameCode, item.code);
  const providerGameCode = firstText(item.providerGameCode, item.code);
  const name = firstText(item.name);
  const readyMedia = item.media?.find((media) => media.status === 'READY');
  const sourceImage = firstText(
    item.mobileImageUrl,
    item.imageUrl,
    item.iconUrl,
    readyMedia?.cachedUrl,
    readyMedia?.sourceUrl,
    item.media?.[0]?.cachedUrl,
    item.media?.[0]?.sourceUrl,
  );
  if (!id || !name || !sourceImage) return null;
  if (item.status && /disabled|maintenance|inactive/i.test(item.status)) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || sourceImage.includes('/provider-simulator/icons/')) return null;

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
  const sourceProviderIcon = firstText(item.providerLogoUrl, providerObject?.logoUrl);
  const tags = readTags(item);
  const hot = item.isPopular === true || item.isFeatured === true || tags.some((tag) => /hot|popular|ยอดนิยม/.test(tag));
  const fresh = item.isNew === true || tags.some((tag) => /new|ใหม่/.test(tag));

  return {
    id,
    providerGameCode,
    name,
    category: normalizeCategory(item.category),
    providerCode,
    providerName: providerName || providerCode.toUpperCase(),
    image: resolveLocalAssetByBasename(sourceImage, 'any') || sourceImage,
    providerIcon: resolveLocalAssetByBasename(sourceProviderIcon, 'any') || sourceProviderIcon,
    badge: hot ? 'HOT' : fresh ? 'NEW' : '',
    players: positiveInteger(item.onlinePlayers ?? item.playerCount),
  };
}

function readTags(item: CatalogGame) {
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const metadataTags = item.metadata && Array.isArray(item.metadata.tags)
    ? item.metadata.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.toLowerCase())
    : [];
  return [...tags, ...metadataTags];
}

function dedupeGames(items: CategoryGame[]) {
  return Array.from(new Map(items.map((item) => [`${item.providerCode}:${item.id}`.toLowerCase(), item] as const)).values());
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'sports') return 'sport';
  if (category === 'fish') return 'fishing';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  return category;
}

function positiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
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
