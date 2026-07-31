'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../../member-api';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import styles from './mobile-category-tab-runtime.module.css';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';
type GameBadge = 'HOT' | 'NEW' | '';

type CategoryGame = {
  id: string;
  name: string;
  provider: string;
  providerIcon: string;
  image: string;
  badge: GameBadge;
  players: number;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  providerId?: string | null;
  provider?: string | { code?: string | null; name?: string | null; logoUrl?: string | null } | null;
  providerLogoUrl?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  isPopular?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  tags?: string[] | null;
  status?: string | null;
  rawPayload?: { assetSource?: string | null } | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  data?: CatalogGame[] | { items?: CatalogGame[] | null } | null;
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

const categoryCache = new Map<Exclude<MobileCategoryId, 'home'>, Promise<CategoryGame[]>>();

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

    root.addEventListener('click', switchCategory, true);
    return () => root.removeEventListener('click', switchCategory, true);
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileActiveCategory = activeCategory;
    root.querySelectorAll<HTMLElement>('[data-mobile-category-id]').forEach((item) => {
      const active = item.dataset.mobileCategoryId === activeCategory;
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

  const providers = useMemo(() => {
    return Array.from(new Set(games.map((game) => game.provider).filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }, [games]);

  const visibleGames = useMemo(() => {
    if (activeProvider === 'all') return games;
    return games.filter((game) => game.provider === activeProvider);
  }, [activeProvider, games]);

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
        {!loading ? <strong>{visibleGames.length}</strong> : null}
      </header>

      {!loading && providers.length > 1 ? (
        <div className={styles.providerRail} aria-label={locale === 'th' ? 'เลือกค่ายเกม' : 'Choose provider'}>
          <button
            type="button"
            className={activeProvider === 'all' ? styles.providerActive : ''}
            onClick={() => setActiveProvider('all')}
          >
            {locale === 'th' ? 'ทั้งหมด' : 'All'}
          </button>
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              className={activeProvider === provider ? styles.providerActive : ''}
              onClick={() => setActiveProvider(provider)}
            >
              {provider}
            </button>
          ))}
        </div>
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

      {!loading && !failed && visibleGames.length === 0 ? (
        <div className={styles.stateCard} role="status">
          <strong>{locale === 'th' ? 'ยังไม่มีเกมในหมวดนี้' : 'No games in this category yet'}</strong>
          <span>{locale === 'th' ? 'ไม่มีการนำข้อมูลจำลองมาแสดงแทนข้อมูลกลาง' : 'No mock records are shown in place of central data.'}</span>
        </div>
      ) : null}

      {!loading && visibleGames.length > 0 ? (
        <div className={styles.gameGrid}>
          {visibleGames.map((game) => (
            <article key={`${game.provider}:${game.id}`} className={styles.gameCard}>
              <div className={styles.poster}>
                <img src={game.image} alt={game.name} loading="lazy" />
                {game.badge ? <span data-badge={game.badge}>{game.badge}</span> : null}
                {game.players > 0 ? <small>{game.players.toLocaleString('en-US')} online</small> : null}
              </div>
              <div className={styles.meta}>
                {game.providerIcon ? <img src={game.providerIcon} alt="" loading="lazy" /> : <span aria-hidden="true" />}
                <div>
                  <strong>{game.name}</strong>
                  <small>{game.provider || '-'}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
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
  for (const apiCategory of API_CATEGORIES[category]) {
    const params = new URLSearchParams({
      platform: 'mobile',
      category: apiCategory,
      page: '1',
      limit: '100',
    });

    const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    });

    if (!response.ok) continue;
    const payload = await response.json().catch(() => null) as CatalogPayload | null;
    const items = extractCatalogItems(payload)
      .map(mapCatalogGame)
      .filter((item): item is CategoryGame => Boolean(item));
    const deduped = dedupeGames(items);
    if (deduped.length > 0) return deduped;
  }

  return [];
}

function extractCatalogItems(payload: CatalogPayload | null): CatalogGame[] {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.items)) return payload.data.items;
  return [];
}

function mapCatalogGame(item: CatalogGame): CategoryGame | null {
  const id = firstText(item.providerGameCode, item.code, item.id);
  const name = firstText(item.name);
  const sourceImage = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !sourceImage) return null;
  if (item.status && /disabled|maintenance|inactive/i.test(item.status)) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || sourceImage.includes('/provider-simulator/icons/')) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = firstText(
    providerObject?.name,
    providerObject?.code,
    item.providerId,
    typeof item.provider === 'string' ? item.provider : null,
  ).toUpperCase();
  const sourceProviderIcon = firstText(item.providerLogoUrl, providerObject?.logoUrl);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const hot = item.isPopular === true || item.isFeatured === true || tags.some((tag) => /hot|popular|ยอดนิยม/.test(tag));
  const fresh = item.isNew === true || tags.some((tag) => /new|ใหม่/.test(tag));

  return {
    id,
    name,
    provider,
    image: resolveLocalAssetByBasename(sourceImage, 'mobile') || sourceImage,
    providerIcon: resolveLocalAssetByBasename(sourceProviderIcon, 'mobile') || sourceProviderIcon,
    badge: hot ? 'HOT' : fresh ? 'NEW' : '',
    players: positiveInteger(item.onlinePlayers ?? item.playerCount),
  };
}

function dedupeGames(items: CategoryGame[]) {
  return Array.from(new Map(items.map((item) => [`${item.provider}:${item.id}`.toLowerCase(), item] as const)).values());
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
