'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  loadSourceCategoryCatalog,
  type SourceCategoryCatalog,
} from '../../browse/source-game-catalog';
import type { SourceGameProvider } from '../../browse/source-game-category-page';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './mobile-casino-provider-page.module.css';

export type MobileProviderLauncherCard = {
  code: string;
  name: string;
  source: string;
  layout: 'wide-hero' | 'wide-banner' | 'half';
  isNew?: boolean;
};

type ProviderFilter = 'all' | 'new';

type MobileProviderLauncherPageProps = {
  category: 'casino' | 'sport' | 'lottery';
  title: Readonly<{ th: string; en: string }>;
  providers: readonly MobileProviderLauncherCard[];
  countLabel?: Readonly<{ th: string; en: string }>;
  stacked?: boolean;
  filterable?: boolean;
};

export default function MobileProviderLauncherPage({
  category,
  title,
  providers,
  countLabel,
  stacked = false,
  filterable = false,
}: MobileProviderLauncherPageProps) {
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const [filter, setFilter] = useState<ProviderFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [catalog, setCatalog] = useState<SourceCategoryCatalog | null>(null);

  const sourceProviders = useMemo<SourceGameProvider[]>(
    () => providers.map((provider) => ({
      code: provider.code,
      name: provider.name,
      badge: '',
      card: provider.source,
      background: '',
      title: '',
      avatar: '',
    })),
    [providers],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void loadSourceCategoryCatalog(category, sourceProviders, 'mobile', controller.signal)
      .then((result) => {
        if (!cancelled) setCatalog(result);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category, sourceProviders]);

  const firstGameByProvider = useMemo(() => {
    const result = new Map<string, SourceCategoryCatalog['games'][number]>();
    for (const game of catalog?.games ?? []) {
      const code = normalizeProviderCode(game.provider ?? '');
      if (code && !result.has(code)) result.set(code, game);
    }
    return result;
  }, [catalog?.games]);

  const providerCards = useMemo(() => {
    const apiProviders = new Map(
      (catalog?.providers ?? []).map((provider) => [normalizeProviderCode(provider.code), provider] as const),
    );
    return providers.map((provider) => {
      const apiProvider = apiProviders.get(normalizeProviderCode(provider.code));
      return {
        ...provider,
        name: apiProvider?.name || provider.name,
        source: apiProvider?.card || provider.source,
      };
    });
  }, [catalog?.providers, providers]);

  const visibleProviders = useMemo(
    () => filter === 'new' ? providerCards.filter((provider) => provider.isNew) : providerCards,
    [filter, providerCards],
  );

  return (
    <section
      className={`${styles.root} ${styles.providerLauncherRoot}`}
      data-mobile-provider-launcher-page="true"
      data-provider-category={category}
      data-category-launch-mode="provider-launch"
      aria-label={title[locale]}
    >
      {countLabel || filterable ? (
        <div className={styles.headingRow}>
          <h2 className={styles.heading}>
            {title[locale]}
            {countLabel ? <span> {visibleProviders.length} {countLabel[locale]}</span> : null}
          </h2>
          {filterable ? (
            <div className={styles.filterWrap}>
              <button
                type="button"
                className={styles.filterButton}
                data-mobile-provider-filter-button="true"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((value) => !value)}
              >
                <span>{filter === 'new' ? copy.newOnly : copy.all}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5H7z" /></svg>
              </button>
              {filterOpen ? (
                <div className={styles.filterMenu} role="menu">
                  {(['all', 'new'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="menuitem"
                      data-active={filter === key ? 'true' : 'false'}
                      onClick={() => {
                        setFilter(key);
                        setFilterOpen(false);
                      }}
                    >
                      {key === 'new' ? copy.newOnly : copy.all}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`${styles.grid} ${stacked ? styles.stackedGrid : ''}`}>
        {visibleProviders.map((provider) => {
          const className = [
            styles.card,
            provider.layout !== 'half' ? styles.wide : '',
            provider.layout === 'wide-banner' ? styles.banner : styles.hero,
          ].filter(Boolean).join(' ');
          const firstGame = firstGameByProvider.get(normalizeProviderCode(provider.code));
          const href = firstGame
            ? gameDestination(category, provider.code, firstGame.id)
            : `/browse/games?category=${encodeURIComponent(category)}&provider=${encodeURIComponent(provider.code)}&platform=mobile`;

          return (
            <a
              key={provider.code}
              href={href}
              className={className}
              data-provider-launch="true"
              data-provider-code={provider.code}
              data-game-category={category}
              data-game-id={firstGame?.id}
              data-game-code={firstGame?.id}
              data-game-name={firstGame?.name ?? provider.name}
              data-game-platform="mobile"
              aria-label={`${copy.open} ${provider.name}`}
            >
              {provider.isNew ? <NewBadge label="NEW" /> : null}
              <img
                src={provider.source}
                alt={provider.name}
                loading="lazy"
                data-provider-image-source={provider.source}
                data-provider-image-owner="api"
                onError={(event) => hideProviderCard(event.currentTarget)}
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function gameDestination(category: string, provider: string, game: string) {
  const params = new URLSearchParams({ category, provider, game, platform: 'mobile' });
  return `/games?${params.toString()}`;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function hideProviderCard(image: HTMLImageElement) {
  const card = image.closest<HTMLElement>('[data-provider-launch="true"]');
  if (!card) {
    image.hidden = true;
    return;
  }
  card.hidden = true;
  card.setAttribute('aria-hidden', 'true');
}

function NewBadge({ label }: { label: string }) {
  return (
    <span className={styles.newBadge} aria-label={label}>
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
        <path d="M4.83735.05466c-.0241.04022-.33133.61472-.68072 1.28114-.5.95367-.68073 1.24667-.8494 1.37306-.1988.14937-.33133.17809-1.62651.36193C.22892 3.27187 0 3.32357 0 3.45571c0 .04021.4759.52279 1.06024 1.07431.58434.55152 1.09639 1.07432 1.14458 1.1605.12651.2298.10843.52279-.13253 1.81542-.22892 1.25815-.23494 1.46497-.06627 1.4937.06024.01149.6747-.26427 1.36747-.61472.6988-.3447 1.36145-.64918 1.46988-.67216.29518-.05171.47591.02298 1.83735.70089.66868.33321 1.25904.59748 1.31326.58599.16867-.02873.16265-.2298-.06627-1.48796-.23494-1.26964-.25904-1.6086-.13253-1.83266.04819-.07468.56024-.59173 1.14458-1.149.58434-.55152 1.06024-1.03984 1.06024-1.08006 0-.12639-.24096-.17809-1.68072-.37917-1.29518-.18384-1.42771-.21256-1.62651-.36193-.16867-.12639-.35542-.42513-.87952-1.42477-.53012-1.00537-.68674-1.26964-.79518-1.28113-.06626-.01149-.1506.01149-.18072.0517Z" fill="white" />
      </svg>
      <strong>{label}</strong>
    </span>
  );
}

const COPY = {
  th: { open: 'เข้าเล่น', all: 'ทั้งหมด', newOnly: 'เกมใหม่' },
  en: { open: 'Open', all: 'All', newOnly: 'New' },
} as const;
