'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  loadSourceCategoryCatalog,
  type SourceCatalogPlatform,
  type SourceCategoryCatalog,
} from '../../browse/source-game-catalog';
import type {
  SourceGameItem,
  SourceGameProvider,
} from '../../browse/source-game-category-page';
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

const INITIAL_GAME_COUNT = 120;
const GAME_PAGE_STEP = 120;

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
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<SourceCategoryCatalog | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [visibleCount, setVisibleCount] = useState(INITIAL_GAME_COUNT);

  const sourceProviders = useMemo<SourceGameProvider[]>(
    () => configuredCards.map(sourceProvider),
    [configuredCards],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setCatalog(null);
    setStatus('loading');

    void loadSourceCategoryCatalog(catalogSlug, sourceProviders, catalogPlatform, controller.signal)
      .then((result) => {
        if (!cancelled) {
          setCatalog(result);
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && !isAbortError(error)) {
          setCatalog(null);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [catalogPlatform, catalogSlug, sourceProviders]);

  useEffect(() => {
    setSelectedCode(null);
    setVisibleCount(INITIAL_GAME_COUNT);
  }, [category]);

  const providerCards = useMemo(() => {
    const merged = mergeProviderCards(
      configuredCards,
      catalog?.providers ?? [],
      includeCatalogProviders,
    );
    if (status !== 'ready') return merged;

    const availableCodes = new Set(
      (catalog?.games ?? [])
        .map((game) => normalizeProviderCode(game.provider ?? ''))
        .filter(Boolean),
    );
    return merged.filter((provider) => availableCodes.has(normalizeProviderCode(provider.code)));
  }, [catalog?.games, catalog?.providers, configuredCards, includeCatalogProviders, status]);

  const selectedProvider = selectedCode
    ? providerCards.find((provider) => normalizeProviderCode(provider.code) === selectedCode) ?? null
    : null;

  const selectedGames = useMemo(() => {
    if (!selectedCode) return [];
    return (catalog?.games ?? []).filter(
      (game) => normalizeProviderCode(game.provider ?? '') === selectedCode,
    );
  }, [catalog?.games, selectedCode]);

  const visibleGames = useMemo(
    () => selectedGames.slice(0, visibleCount),
    [selectedGames, visibleCount],
  );

  const selectProvider = (provider: MobileProviderGamesCard) => {
    setSelectedCode(normalizeProviderCode(provider.code));
    setVisibleCount(INITIAL_GAME_COUNT);
  };

  if (!selectedProvider) {
    return (
      <ProviderSelection
        category={category}
        title={title[locale]}
        providers={providerCards}
        providerAssetPlatform={providerAssetPlatform}
        locale={locale}
        loading={status === 'loading'}
        onSelect={selectProvider}
      />
    );
  }

  const copy = COPY[locale];

  return (
    <section
      className={`${styles.root} ${styles.slotGamesRoot}`}
      data-mobile-provider-games-page="true"
      data-category-flow="provider-games"
      data-provider-games-category={category}
      data-provider-games-stage="games"
      data-selected-provider={selectedProvider.code}
      data-game-asset-platform={gameAssetPlatform}
      aria-labelledby={`mobile-${category}-games-heading`}
    >
      <div className={styles.slotGamesToolbar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => setSelectedCode(null)}
          aria-label={copy.backToProviders}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h2 id={`mobile-${category}-games-heading`}>
          {title[locale]} | {selectedProvider.name}
          <span>{status === 'ready' ? `(${selectedGames.length} ${copy.games})` : ''}</span>
        </h2>
      </div>

      {status === 'loading' ? <GameState message={copy.loading} /> : null}
      {status === 'error' ? <GameState message={copy.error} /> : null}

      {visibleGames.length > 0 ? (
        <div className={styles.slotGameGrid}>
          {visibleGames.map((game) => (
            <GameCard
              key={`${game.provider ?? selectedProvider.code}:${game.id}`}
              game={game}
              provider={selectedProvider}
              category={category}
              gameAssetPlatform={gameAssetPlatform}
              locale={locale}
            />
          ))}
        </div>
      ) : null}

      {visibleCount < selectedGames.length ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          onClick={() => setVisibleCount((current) => Math.min(selectedGames.length, current + GAME_PAGE_STEP))}
        >
          {copy.loadMore}
        </button>
      ) : null}
    </section>
  );
}

function ProviderSelection({
  category,
  title,
  providers,
  providerAssetPlatform,
  locale,
  loading,
  onSelect,
}: {
  category: 'slot' | 'fishing' | 'card';
  title: string;
  providers: readonly MobileProviderGamesCard[];
  providerAssetPlatform: SourceCatalogPlatform;
  locale: 'th' | 'en';
  loading: boolean;
  onSelect: (provider: MobileProviderGamesCard) => void;
}) {
  return (
    <section
      className={`${styles.root} ${styles.providerSelectionRoot}`}
      data-mobile-provider-games-page="true"
      data-category-flow="provider-games"
      data-provider-games-category={category}
      data-provider-games-stage="providers"
      aria-labelledby={`mobile-${category}-provider-heading`}
    >
      <div className={styles.headingRow}>
        <h2 id={`mobile-${category}-provider-heading`} className={styles.heading}>
          {title} <span>({providers.length} {locale === 'th' ? 'ค่ายเกม' : 'providers'})</span>
        </h2>
      </div>

      {loading && providers.length === 0 ? <GameState message={locale === 'th' ? 'กำลังโหลดค่ายเกม...' : 'Loading providers...'} /> : null}

      <div className={styles.grid}>
        {providers.map((provider) => {
          const resolvedSource = resolveLocalAssetOrSource(provider.source, providerAssetPlatform);
          const className = [
            styles.card,
            styles.providerSelectButton,
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
              data-provider-category={category}
              data-next-step="games"
              aria-label={locale === 'th' ? `ดูเกมค่าย ${provider.name}` : `View ${provider.name} games`}
              onClick={() => onSelect(provider)}
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

function GameCard({
  game,
  provider,
  category,
  gameAssetPlatform,
  locale,
}: {
  game: SourceGameItem;
  provider: MobileProviderGamesCard;
  category: 'slot' | 'fishing' | 'card';
  gameAssetPlatform: SourceCatalogPlatform;
  locale: 'th' | 'en';
}) {
  const source = game.image;
  const resolvedSource = resolveLocalAssetOrSource(source, gameAssetPlatform);
  const providerCode = normalizeProviderCode(game.provider ?? provider.code);
  const destination = new URLSearchParams({
    category,
    provider: providerCode,
    game: game.id,
    platform: 'mobile',
  });

  return (
    <a
      href={`/games?${destination.toString()}`}
      className={styles.slotGameCard}
      data-game-id={game.id}
      data-game-code={game.id}
      data-game-name={game.name}
      data-provider-code={providerCode}
      data-game-category={category}
      data-game-platform="mobile"
      aria-label={`${locale === 'th' ? 'เข้าเล่น' : 'Play'} ${game.name}`}
    >
      <span className={styles.slotGameImage}>
        <img
          src={resolvedSource}
          alt={game.name}
          loading="lazy"
          onError={(event) => fallbackImage(event.currentTarget, resolvedSource, source)}
        />
        <span className={styles.slotGameBadges} aria-hidden="true">
          {game.isHot ? <b className={styles.slotHotBadge}>HOT</b> : null}
          {game.isNew ? <b className={styles.slotNewBadge}>NEW</b> : null}
        </span>
      </span>
      <strong>{game.name}</strong>
      <small>{provider.name}</small>
    </a>
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

    if (!provider.card) return;
    merged.set(code, {
      code,
      name: provider.name || code.toUpperCase(),
      source: provider.card,
      iconSource: provider.badge,
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

function fallbackImage(image: HTMLImageElement, resolved: string, remote: string) {
  if (resolved !== remote && image.dataset.remoteFallback !== 'true') {
    image.dataset.remoteFallback = 'true';
    image.src = remote;
    return;
  }

  const card = image.closest<HTMLElement>('[data-provider-select="true"], [data-game-id]');
  if (!card) {
    image.hidden = true;
    return;
  }
  card.hidden = true;
  card.setAttribute('aria-hidden', 'true');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function GameState({ message }: { message: string }) {
  return <div className={styles.slotState} role="status">{message}</div>;
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

const COPY = {
  th: {
    games: 'เกม',
    loading: 'กำลังโหลดเกมของค่าย...',
    error: 'โหลดรายการเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    loadMore: 'โหลดเกมเพิ่มเติม',
    backToProviders: 'กลับไปเลือกค่ายเกม',
  },
  en: {
    games: 'games',
    loading: 'Loading provider games...',
    error: 'Unable to load games. Please try again.',
    loadMore: 'Load more games',
    backToProviders: 'Back to providers',
  },
} as const;
