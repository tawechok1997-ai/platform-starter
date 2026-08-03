'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMemberGameCatalog, type MemberCatalogGame } from '../lib/member-game-catalog';
import { selectHomeGameSection } from '../lib/home-game-selection';
import { randomizeGameCatalog } from '../lib/randomize-game-catalog';
import { requestJson } from '../member-api';
import { useSiteSettings } from '../site-settings-provider';
import type { Game, GameLobbyPayload, LedgerItem, MoneyRequest } from '../types/member-api';

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const EMPTY_MONEY_REQUESTS: MoneyRequest[] = [];
const EMPTY_LEDGERS: LedgerItem[] = [];

export function useMemberHomeData(gamesEnabled: boolean) {
  const { typedSettings } = useSiteSettings();
  const featureSettings = typedSettings.features as Record<string, unknown>;
  const [lobby, setLobby] = useState<GameLobbyPayload>({});
  const [classicGames, setClassicGames] = useState<Game[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [gamesMessage, setGamesMessage] = useState('');
  const [isGamesLoading, setIsGamesLoading] = useState(gamesEnabled);

  const loadGames = useCallback(async () => {
    if (!gamesEnabled) {
      setLobby({});
      setClassicGames([]);
      setIsGamesLoading(false);
      return;
    }

    setIsGamesLoading(true);
    setGamesMessage('');
    try {
      const catalog = await getMemberGameCatalog('pc');
      const randomizedCatalog = randomizeGameCatalog(catalog);
      const items = randomizedCatalog.map(toGame);
      const featured = selectHomeGameSection(catalog, 'featured', 'pc', featureSettings, 8).map(toGame);
      const popular = selectHomeGameSection(catalog, 'popular', 'pc', featureSettings, 10).map(toGame);
      const classic = selectHomeGameSection(catalog, 'classic', 'pc', featureSettings, 6).map(toGame);
      const newestCandidates = randomizedCatalog
        .filter((game) => game.tags.includes('new') || game.fresh);
      const newest = randomizeGameCatalog(newestCandidates.length ? newestCandidates : randomizedCatalog)
        .map(toGame);
      const categories = Array.from(new Set(randomizedCatalog.flatMap((game) => [game.category, ...game.tags])));

      setClassicGames(classic);
      setLobby({
        items,
        featured,
        popular,
        newest,
        categories,
        providers: Array.from(new Map(randomizedCatalog
          .filter((game) => game.provider)
          .map((game) => [game.provider, {
            code: game.provider,
            name: game.providerName,
            logoUrl: game.providerIcon,
          }] as const)).values()),
      });
    } catch (catalogError) {
      try {
        const payload = await requestJson<GameLobbyPayload>('/public/games', {
          skipAuth: true,
          suppressSessionExpiryRedirect: true,
        });
        const nextLobby = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
        const fallbackGames = Array.isArray(nextLobby.items) ? nextLobby.items.filter(Boolean) as Game[] : [];
        setClassicGames(fallbackGames.slice(0, 6));
        setLobby((currentLobby) => sameLobbyPayload(currentLobby, nextLobby) ? currentLobby : nextLobby);
      } catch {
        setGamesMessage(catalogError instanceof Error ? catalogError.message : 'โหลดเกมไม่สำเร็จ');
      }
    } finally {
      setIsGamesLoading(false);
    }
  }, [featureSettings, gamesEnabled]);

  useEffect(() => {
    const storedFavorites = readIds(FAVORITES_KEY);
    const storedRecent = readIds(RECENT_KEY);
    if (storedFavorites.length) setFavoriteIds(storedFavorites);
    if (storedRecent.length) setRecentIds(storedRecent);
    void loadGames();
  }, [loadGames]);

  const games = Array.isArray(lobby.items) ? lobby.items : [];
  const featuredSource = Array.isArray(lobby.featured) && lobby.featured.length
    ? lobby.featured
    : games.filter((game) => game?.isFeatured);
  const popularSource = Array.isArray(lobby.popular) && lobby.popular.length
    ? lobby.popular
    : games.filter((game) => game?.isPopular);
  const featured = featuredSource.slice(0, 8);
  const popular = popularSource.slice(0, 10);
  const recentGames = recentIds.map((id) => games.find((game) => game?.id === id)).filter(Boolean) as Game[];
  const favoriteGames = favoriteIds.map((id) => games.find((game) => game?.id === id)).filter(Boolean) as Game[];
  const categories = Array.isArray(lobby.categories) ? lobby.categories : [];

  return {
    pendingTopups: EMPTY_MONEY_REQUESTS,
    pendingWithdrawals: EMPTY_MONEY_REQUESTS,
    ledgers: EMPTY_LEDGERS,
    categories,
    featured,
    popular,
    classicGames,
    recentGames,
    favoriteGames,
    activityMessage: '',
    isActivityLoading: false,
    reloadActivity: async () => undefined,
    gamesMessage,
    isGamesLoading,
    reloadGames: loadGames,
  };
}

function toGame(item: MemberCatalogGame): Game {
  return {
    id: item.id,
    providerGameCode: item.providerGameCode,
    name: item.name,
    category: item.category,
    platform: item.platform,
    imageUrl: item.image,
    iconUrl: item.image,
    isFeatured: item.popular || item.tags.includes('hot'),
    isNew: item.fresh || item.tags.includes('new'),
    isPopular: item.popular || item.tags.includes('popular'),
    provider: {
      code: item.provider,
      name: item.providerName,
      logoUrl: item.providerIcon,
    },
  };
}

function readIds(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function sameLobbyPayload(current: GameLobbyPayload, next: GameLobbyPayload) {
  return current.items === next.items
    && current.featured === next.featured
    && current.popular === next.popular
    && current.categories === next.categories;
}
