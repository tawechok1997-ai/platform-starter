'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  resolveLocalAssetByBasename,
  resolveLocalAssetOrSource,
} from '../lib/local-asset-by-basename';
import {
  loadSourceCategoryCatalog,
  type SourceCategoryCatalog,
} from './source-game-catalog';
import SourceGameCategoryPage, {
  type SourceGameCategoryConfig,
  type SourceGameItem,
  type SourceGameProvider,
} from './source-game-category-page';

const PROVIDER_ROOT = 'https://cdn.zabbet.com/providers/set';
const TRANSPARENT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';

export default function SourceProviderCategoryPage({
  config,
}: {
  config: SourceGameCategoryConfig;
}) {
  const [catalog, setCatalog] = useState<SourceCategoryCatalog | null>(null);

  const configuredProviders = useMemo(
    () => config.providers.map(localizeConfiguredProvider),
    [config.providers],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void loadSourceCategoryCatalog(config.slug, configuredProviders, controller.signal)
      .then((result) => {
        if (!cancelled) setCatalog(result);
      })
      .catch((error) => {
        if (!cancelled && !isAbortError(error)) setCatalog(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [config.slug, configuredProviders]);

  const resolvedConfig = useMemo(() => {
    const configuredByCode = new Map(
      configuredProviders.map((provider) => [normalizeProviderCode(provider.code), provider] as const),
    );
    const catalogByCode = new Map(
      (catalog?.providers ?? []).map((provider) => [normalizeProviderCode(provider.code), provider] as const),
    );
    const firstCatalogGameByProvider = new Map<string, SourceGameItem>();

    for (const game of catalog?.games ?? []) {
      if (game.provider && !firstCatalogGameByProvider.has(game.provider)) {
        firstCatalogGameByProvider.set(game.provider, game);
      }
    }

    const configuredCodes = configuredProviders.map((provider) => normalizeProviderCode(provider.code));
    const catalogCodes = (catalog?.providers ?? []).map((provider) => normalizeProviderCode(provider.code));
    const hasCompleteCatalog = Boolean(catalog && !catalog.incomplete && catalogCodes.length);
    const orderedCodes = Array.from(new Set((hasCompleteCatalog
      ? [...configuredCodes.filter((code) => catalogByCode.has(code)), ...catalogCodes]
      : [...configuredCodes, ...catalogCodes]
    ).filter(Boolean)));

    const providers = orderedCodes.map((code) => {
      const configured = configuredByCode.get(code);
      const catalogProvider = catalogByCode.get(code);
      const firstGame = firstCatalogGameByProvider.get(code);
      return buildSafeProvider(code, configured, catalogProvider, firstGame);
    });

    const sourceGameByProvider = new Map(
      config.games
        .filter((game) => game.provider)
        .map((game) => [normalizeProviderCode(game.provider ?? ''), game] as const),
    );

    const games = providers.map((provider): SourceGameItem => {
      const code = normalizeProviderCode(provider.code);
      const sourceGame = sourceGameByProvider.get(code);
      return {
        id: sourceGame?.id ?? `provider-${code}`,
        name: provider.name,
        image: provider.card || provider.badge,
        provider: code,
        ...(provider.badge ? { providerBadge: provider.badge } : {}),
        isNew: sourceGame?.isNew ?? false,
        isHot: sourceGame?.isHot ?? false,
        tags: sourceGame?.tags ?? [],
        origin: catalogByCode.has(code) ? 'catalog' : 'source',
      };
    });

    const filters = config.filters.map((filter) => ({
      ...filter,
      count: games.filter((game) => game.tags.includes(filter.key)).length,
    }));

    return {
      ...config,
      total: providers.length,
      providers,
      games,
      filters,
      mode: 'provider-cards' as const,
    };
  }, [catalog, config, configuredProviders]);

  return <SourceGameCategoryPage config={resolvedConfig} />;
}

function buildSafeProvider(
  code: string,
  configured?: SourceGameProvider,
  catalogProvider?: SourceGameProvider,
  firstGame?: SourceGameItem,
): SourceGameProvider {
  const badge = firstText(
    catalogProvider?.badge,
    configured?.badge,
    firstGame?.providerBadge,
    resolveExpectedLocalProviderAsset('badge', code),
  );
  const card = firstText(
    configured?.card,
    resolveExpectedLocalProviderAsset('card', code),
    firstGame?.image,
    badge,
  );
  const maintenance = catalogProvider?.maintenance ?? configured?.maintenance;

  return {
    code,
    name: firstText(catalogProvider?.name, configured?.name, code.toUpperCase()),
    badge: badge || TRANSPARENT_IMAGE,
    card: card || TRANSPARENT_IMAGE,
    background: firstText(
      configured?.background,
      resolveExpectedLocalProviderAsset('bg', code),
      TRANSPARENT_IMAGE,
    ),
    title: firstText(
      configured?.title,
      resolveExpectedLocalProviderAsset('title', code),
      TRANSPARENT_IMAGE,
    ),
    avatar: firstText(
      configured?.avatar,
      resolveExpectedLocalProviderAsset('avatar', code),
      TRANSPARENT_IMAGE,
    ),
    ...(typeof maintenance === 'boolean' ? { maintenance } : {}),
  };
}

function localizeConfiguredProvider(provider: SourceGameProvider): SourceGameProvider {
  return {
    ...provider,
    badge: resolveLocalAssetOrSource(provider.badge, 'pc'),
    card: resolveLocalAssetOrSource(provider.card, 'pc'),
    background: resolveLocalAssetOrSource(provider.background, 'pc'),
    title: resolveLocalAssetOrSource(provider.title, 'pc'),
    avatar: resolveLocalAssetOrSource(provider.avatar, 'pc'),
  };
}

function resolveExpectedLocalProviderAsset(
  kind: 'badge' | 'card' | 'bg' | 'title' | 'avatar',
  code: string,
) {
  const set = kind === 'card' ? '1_1_v' : `1_1_${kind}`;
  return resolveLocalAssetByBasename(`${PROVIDER_ROOT}/${set}/${code}.png`, 'pc');
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
