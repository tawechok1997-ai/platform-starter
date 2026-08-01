'use client';

import { useMemo } from 'react';
import { resolveLocalAssetOrSource } from '../lib/local-asset-by-basename';
import SourceGameCategoryPage, {
  type SourceGameCategoryConfig,
  type SourceGameItem,
  type SourceGameProvider,
} from './source-game-category-page';

const TRANSPARENT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';

export default function SourceProviderCategoryPage({
  config,
}: {
  config: SourceGameCategoryConfig;
}) {
  const resolvedConfig = useMemo(() => {
    const providers = Array.from(
      new Map(
        config.providers
          .map(localizeConfiguredProvider)
          .map((provider) => [normalizeProviderCode(provider.code), provider] as const),
      ).values(),
    );
    const providerByCode = new Map(
      providers.map((provider) => [normalizeProviderCode(provider.code), provider] as const),
    );

    const games = config.games.map((game, index): SourceGameItem => {
      const code = normalizeProviderCode(game.provider ?? game.id);
      const provider = providerByCode.get(code);
      const image = firstText(
        provider?.card,
        resolveLocalAssetOrSource(game.image, 'pc'),
        provider?.badge,
        TRANSPARENT_IMAGE,
      );

      return {
        ...game,
        id: game.id || `provider-${code || index}`,
        name: provider?.name || game.name,
        image,
        provider: code || game.provider,
        ...(provider?.badge ? { providerBadge: provider.badge } : {}),
        origin: 'source',
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
  }, [config]);

  return <SourceGameCategoryPage config={resolvedConfig} />;
}

function localizeConfiguredProvider(provider: SourceGameProvider): SourceGameProvider {
  return {
    ...provider,
    badge: resolveLocalAssetOrSource(provider.badge, 'pc') || TRANSPARENT_IMAGE,
    card: resolveLocalAssetOrSource(provider.card, 'pc') || TRANSPARENT_IMAGE,
    background: resolveLocalAssetOrSource(provider.background, 'pc') || TRANSPARENT_IMAGE,
    title: resolveLocalAssetOrSource(provider.title, 'pc') || TRANSPARENT_IMAGE,
    avatar: resolveLocalAssetOrSource(provider.avatar, 'pc') || TRANSPARENT_IMAGE,
  };
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
