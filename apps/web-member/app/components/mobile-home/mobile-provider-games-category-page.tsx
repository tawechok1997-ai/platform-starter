'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  loadSourceCategoryCatalog,
  type SourceCatalogPlatform,
  type SourceCategoryCatalog,
} from '../../browse/source-game-catalog';
import type { SourceGameProvider } from '../../browse/source-game-category-page';
import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-casino-provider-page.module.css';

export type MobileProviderGamesBadge = 'hot' | 'new';

export type MobileProviderGamesCard = {
  code: string;
  name: string;
  source: string;
  iconSource?: string;
  layout: 'wide-hero' | 'wide-banner' | 'half';
  badge?: MobileProviderGamesBadge;
};

type MobileProviderGamesCategoryPageProps = {
  category: 'slot' | 'fishing' | 'card';
  catalogSlug: 'slot' | 'fishing' | 'card';
  title: Readonly<{ th: string; en: string }>;
  providers: readonly MobileProviderGamesCard[];
  catalogPlatform: SourceCatalogPlatform;
  providerAssetPlatform: SourceCatalogPlatform;
  gameAssetPlatform: SourceCatalogPlatform;
  includeCatalogProviders?: boolean;
};

type GameFilter = 'all' | 'hot' | 'new';

const INITIAL_GAME_COUNT = 60;
const GAME_PAGE_STEP = 60;

export default function MobileProviderGamesCategoryPage({
  category,
  catalogSlug,
  title,
  providers: configuredCards,
  catalogPlatform,
  providerAssetPlatform,
  gameAssetPlatform,
  includeCatalogProviders = false,
}: MobileProviderGamesCategoryPageProps) {
  const { locale } = useMemberLocale();
  const [catalog, setCatalog] = useState<SourceCategoryCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState('');
  const [filter, setFilter] = useState<GameFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_GAME_COUNT);

  const sourceProviders = useMemo<SourceGameProvider[]>(
    () => configuredCards.map((provider) => sourceProvider(provider)),
    [configuredCards],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setCatalogLoading(true);

    void loadSourceCategoryCatalog(catalogSlug, sourceProviders, catalogPlatform, controller.signal)
      .then((result) => {
        if (!cancelled) setCatalog(result);
      })
      .catch((error: unknown) => {
        if (!cancelled && !isAbortError(error)) setCatalog(null);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [catalogPlatform, catalogSlug, sourceProviders]);

  const providerCards = useMemo(
    () => mergeProviderCards(configuredCards, catalog?.providers ?? [], includeCatalogProviders),
    [catalog?.providers, configuredCards, includeCatalogProviders],
  );

  const selectedProvider = useMemo(
    () => providerCards.find((provider) => normalizeProviderCode(provider.code) === selectedCode) ?? null,
    [providerCards, selectedCode],
  );

  const filteredGames = useMemo(() => {
    if (!selectedCode) return [];
    return (catalog?.games ?? []).filter((game) => {
      if (normalizeProviderCode(game.provider ?? '') !== selectedCode) return false;
      if (filter === 'hot') return game.isHot;
      if (filter === 'new') return game.isNew;
      return true;
    });
  }, [catalog?.games, filter, selectedCode]);

  useEffect(() => {
    setVisibleCount(INITIAL_GAME_COUNT);
    setFilterOpen(false);
  }, [filter, selectedCode]);

  function backToProviders() {
    setSelectedCode('');
    setFilter('all');
    setFilterOpen(false);
    setVisibleCount(INITIAL_GAME_COUNT);
  }

  if (!selectedCode) {
    return (
      <section
        className={`${styles.root} ${styles.providerSelectionRoot}`}
        data-mobile-provider-games-page="true"
        data-category-flow="provider-games"
        data-provider-games-category={category}
        data-provider-games-stage="providers"
        aria-label={title[locale]}
      >
        <div className={styles.grid}>
          {providerCards.map((provider) => {
            const resolvedSource = resolveLocalAssetOrSource(provider.source, providerAssetPlatform);
            const className = [
              styles.card,
              provider.layout !== 'half' ? styles.wide : '',
              provider.layout === 'wide-banner' ? styles.banner : styles.hero,
            ].filter(Boolean).join(' ');

            return (
              <button
                key={provider.code}
                type="button"
                className={className}
                data-provider-select="true"
                data-provider-code={provider.code}
                data-game-category={category}
                data-next-step="games"
                onClick={() => setSelectedCode(normalizeProviderCode(provider.code))}
                aria-label={locale === 'th' ? `เลือกค่าย ${provider.name}` : `Select ${provider.name}`}
              >
                {provider.badge === 'hot' ? <HotBadge /> : null}
                {provider.badge === 'new' ? <NewBadge /> : null}
                <img
                  src={resolvedSource}
                  alt={provider.name}
                  loading="lazy"
                  data-provider-image-source={provider.source}
                  onError={(event) => fallbackImage(event.currentTarget, resolvedSource, provider.source)}
                />
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const providerName = selectedProvider?.name ?? selectedCode.toUpperCase();
  const providerCode = selectedProvider?.code ?? selectedCode;
  const games = filteredGames.slice(0, visibleCount);

  return (
    <section
      className={`${styles.root} ${styles.slotGamesRoot}`}
      data-mobile-provider-games-page="true"
      data-category-flow="provider-games"
      data-provider-games-category={category}
      data-provider-games-stage="games"
      data-selected-provider={selectedCode}
      aria-label={`${title[locale]} ${providerName}`}
    >
      <div className={styles.providerRail} aria-label={locale === 'th' ? 'เลือกค่ายเกม' : 'Choose provider'}>
        {providerCards.map((provider) => {
          const code = normalizeProviderCode(provider.code);
          const iconSource = provider.iconSource || providerIconSource(provider.code);
          const resolvedIcon = resolveLocalAssetOrSource(iconSource, providerAssetPlatform);
          return (
            <button
              key={provider.code}
              type="button"
              data-active={code === selectedCode ? 'true' : 'false'}
              data-provider-code={provider.code}
              onClick={() => setSelectedCode(code)}
              aria-label={provider.name}
            >
              <img
                src={resolvedIcon}
                alt=""
                aria-hidden="true"
                onError={(event) => fallbackImage(event.currentTarget, resolvedIcon, iconSource)}
              />
            </button>
          );
        })}
      </div>

      <div className={styles.slotGamesToolbar}>
        <button type="button" className={styles.backButton} onClick={backToProviders} aria-label={locale === 'th' ? 'กลับไปเลือกค่าย' : 'Back to providers'}>
          <span aria-hidden="true">‹</span>
        </button>
        <h2>
          {providerName}
          <span>{filteredGames.length.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')} {locale === 'th' ? 'เกม' : 'games'}</span>
        </h2>
        <div className={styles.filterWrap}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={() => setFilterOpen((value) => !value)}
            aria-expanded={filterOpen}
          >
            <span>{filterLabel(filter, locale)}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5H7z" /></svg>
          </button>
          {filterOpen ? (
            <div className={styles.filterMenu} role="menu">
              {(['all', 'hot', 'new'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="menuitem"
                  data-active={filter === key ? 'true' : 'false'}
                  onClick={() => setFilter(key)}
                >
                  {filterLabel(key, locale)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {catalogLoading ? (
        <div className={styles.slotState}>{locale === 'th' ? 'กำลังโหลดเกม...' : 'Loading games...'}</div>
      ) : filteredGames.length === 0 ? (
        <div className={styles.slotState}>{locale === 'th' ? 'ยังไม่มีเกมในค่ายนี้' : 'No games are available for this provider.'}</div>
      ) : (
        <>
          <div className={styles.slotGameGrid}>
            {games.map((game) => {
              const normalizedProvider = normalizeProviderCode(game.provider ?? '') || normalizeProviderCode(providerCode);
              const destination = new URLSearchParams({
                category,
                provider: normalizedProvider,
                game: game.id,
                platform: 'mobile',
              });
              const resolvedImage = resolveLocalAssetOrSource(game.image, gameAssetPlatform);
              return (
                <a
                  key={`${normalizedProvider}:${game.id}`}
                  href={`/games?${destination.toString()}`}
                  className={styles.slotGameCard}
                  data-game-id={game.id}
                  data-game-code={game.id}
                  data-game-name={game.name}
                  data-provider-code={normalizedProvider}
                  data-game-category={category}
                  data-game-icon-platform={gameAssetPlatform}
                >
                  <span className={styles.slotGameImage}>
                    <img
                      src={resolvedImage}
                      alt={game.name}
                      loading="lazy"
                      onError={(event) => fallbackImage(event.currentTarget, resolvedImage, game.image)}
                    />
                    <span className={styles.slotGameBadges}>
                      {game.isHot ? <span className={styles.slotHotBadge}>HOT</span> : null}
                      {game.isNew ? <span className={styles.slotNewBadge}>NEW</span> : null}
                    </span>
                  </span>
                  <strong>{game.name}</strong>
                  <small>{providerName}</small>
                </a>
              );
            })}
          </div>
          {visibleCount < filteredGames.length ? (
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={() => setVisibleCount((value) => value + GAME_PAGE_STEP)}
            >
              {locale === 'th' ? 'โหลดเกมเพิ่มเติม' : 'Load more games'}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function mergeProviderCards(
  configured: readonly MobileProviderGamesCard[],
  catalogProviders: readonly SourceGameProvider[],
  includeCatalogProviders: boolean,
) {
  const merged = new Map<string, MobileProviderGamesCard>();
  configured.forEach((provider) => {
    merged.set(normalizeProviderCode(provider.code), provider);
  });

  if (!includeCatalogProviders) return Array.from(merged.values());

  catalogProviders.forEach((provider) => {
    const code = normalizeProviderCode(provider.code);
    if (!code) return;
    const existing = merged.get(code);
    if (existing) {
      merged.set(code, { ...existing, name: provider.name || existing.name });
      return;
    }

    merged.set(code, {
      code,
      name: provider.name || code.toUpperCase(),
      source: provider.card || providerCardSource(code),
      iconSource: provider.badge || providerIconSource(code),
      layout: 'half',
    });
  });

  return Array.from(merged.values());
}

function sourceProvider(provider: MobileProviderGamesCard): SourceGameProvider {
  return {
    code: provider.code,
    name: provider.name,
    badge: provider.iconSource || providerIconSource(provider.code),
    card: provider.source,
    background: providerAssetSource('bg', provider.code),
    title: providerAssetSource('title', provider.code),
    avatar: providerAssetSource('avatar', provider.code),
  };
}

function providerCardSource(code: string) {
  return `https://cdn.zabbet.com/providers/set/1_1_h/${code}.png`;
}

function providerIconSource(code: string) {
  return `https://cdn.zabbet.com/providers/icon/${code}.png`;
}

function providerAssetSource(kind: 'bg' | 'title' | 'avatar', code: string) {
  return `https://cdn.zabbet.com/providers/set/1_1_${kind}/${code}.png`;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function filterLabel(filter: GameFilter, locale: 'th' | 'en') {
  if (filter === 'hot') return locale === 'th' ? 'เกมยอดนิยม' : 'Popular';
  if (filter === 'new') return locale === 'th' ? 'เกมใหม่' : 'New';
  return locale === 'th' ? 'ทั้งหมด' : 'All';
}

function fallbackImage(image: HTMLImageElement, resolved: string, remote: string) {
  if (resolved !== remote && image.dataset.remoteFallback !== 'true') {
    image.dataset.remoteFallback = 'true';
    image.src = remote;
    return;
  }
  image.hidden = true;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function HotBadge() {
  return (
    <span className={styles.hotProviderBadge} aria-label="HOT">
      <img src="/images/game/fire.webp" alt="" aria-hidden="true" />
      <strong>HOT</strong>
    </span>
  );
}

function NewBadge() {
  return (
    <span className={styles.newBadge} aria-label="NEW">
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
        <path d="M4.83735.05466c-.0241.04022-.33133.61472-.68072 1.28114-.5.95367-.68073 1.24667-.8494 1.37306-.1988.14937-.33133.17809-1.62651.36193C.22892 3.27187 0 3.32357 0 3.45571c0 .04021.4759.52279 1.06024 1.07431.58434.55152 1.09639 1.07432 1.14458 1.1605.12651.2298.10843.52279-.13253 1.81542-.22892 1.25815-.23494 1.46497-.06627 1.4937.06024.01149.6747-.26427 1.36747-.61472.6988-.3447 1.36145-.64918 1.46988-.67216.29518-.05171.47591.02298 1.83735.70089.66868.33321 1.25904.59748 1.31326.58599.16867-.02873.16265-.2298-.06627-1.48796-.23494-1.26964-.25904-1.6086-.13253-1.83266.04819-.07468.56024-.59173 1.14458-1.149.58434-.55152 1.06024-1.03984 1.06024-1.08006 0-.12639-.24096-.17809-1.68072-.37917-1.29518-.18384-1.42771-.21256-1.62651-.36193-.16867-.12639-.35542-.42513-.87952-1.42477-.53012-1.00537-.68674-1.26964-.79518-1.28113-.06626-.01149-.1506.01149-.18072.0517Z" fill="white" />
      </svg>
      <strong>NEW</strong>
    </span>
  );
}
