'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  loadSourceCategoryCatalog,
  type SourceCatalogPlatform,
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

export default function MobileProviderGamesCategoryPage({
  category,
  catalogSlug,
  title,
  providers: configuredCards,
  catalogPlatform,
  providerAssetPlatform,
  includeCatalogProviders = false,
}: MobileProviderGamesCategoryPageProps) {
  const { locale } = useMemberLocale();
  const [catalogProviders, setCatalogProviders] = useState<SourceGameProvider[]>([]);

  const sourceProviders = useMemo<SourceGameProvider[]>(
    () => configuredCards.map((provider) => sourceProvider(provider)),
    [configuredCards],
  );

  useEffect(() => {
    if (!includeCatalogProviders) {
      setCatalogProviders([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void loadSourceCategoryCatalog(catalogSlug, sourceProviders, catalogPlatform, controller.signal)
      .then((result) => {
        if (!cancelled) setCatalogProviders(result.providers);
      })
      .catch((error: unknown) => {
        if (!cancelled && !isAbortError(error)) setCatalogProviders([]);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [catalogPlatform, catalogSlug, includeCatalogProviders, sourceProviders]);

  const providerCards = useMemo(
    () => mergeProviderCards(configuredCards, catalogProviders, includeCatalogProviders),
    [catalogProviders, configuredCards, includeCatalogProviders],
  );

  return (
    <section
      className={`${styles.root} ${styles.providerSelectionRoot}`}
      data-mobile-provider-games-page="true"
      data-category-flow="provider-only"
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
            <a
              key={provider.code}
              href={`/browse/games?category=${encodeURIComponent(category)}&provider=${encodeURIComponent(provider.code)}&platform=mobile`}
              className={className}
              data-provider-launch="true"
              data-provider-code={provider.code}
              data-game-category={category}
              data-game-name={provider.name}
              aria-label={locale === 'th' ? `เข้าเล่นค่าย ${provider.name}` : `Open ${provider.name}`}
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
            </a>
          );
        })}
      </div>
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
      merged.set(code, {
        ...existing,
        name: provider.name || existing.name,
      });
      return;
    }

    merged.set(code, {
      code,
      name: provider.name || code.toUpperCase(),
      source: providerCardSource(code),
      iconSource: providerIconSource(code),
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

function fallbackImage(image: HTMLImageElement, resolved: string, remote: string) {
  if (resolved !== remote && image.dataset.remoteFallback !== 'true') {
    image.dataset.remoteFallback = 'true';
    image.src = remote;
    return;
  }

  const card = image.closest<HTMLElement>('[data-provider-launch="true"]');
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
