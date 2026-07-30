'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestJson } from '../member-api';
import type { Game, GameLobbyPayload, LedgerItem, MoneyRequest } from '../types/member-api';

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const USE_GAME_API = process.env.NEXT_PUBLIC_MEMBER_GAME_SOURCE === 'api';
const EMPTY_MONEY_REQUESTS: MoneyRequest[] = [];
const EMPTY_LEDGERS: LedgerItem[] = [];

export function useMemberHomeData(gamesEnabled: boolean) {
  const [lobby, setLobby] = useState<GameLobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [gamesMessage, setGamesMessage] = useState('');
  const [isGamesLoading, setIsGamesLoading] = useState(gamesEnabled && USE_GAME_API);

  const loadGames = useCallback(async () => {
    if (!gamesEnabled || !USE_GAME_API) return;

    setIsGamesLoading(true);
    setGamesMessage('');
    try {
      const payload = await requestJson<GameLobbyPayload>('/public/games', {
        skipAuth: true,
        suppressSessionExpiryRedirect: true,
      });
      const nextLobby = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
      setLobby((currentLobby) => sameLobbyPayload(currentLobby, nextLobby) ? currentLobby : nextLobby);
    } catch (error) {
      setGamesMessage(error instanceof Error ? error.message : 'โหลดเกมไม่สำเร็จ');
    } finally {
      setIsGamesLoading(false);
    }
  }, [gamesEnabled]);

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
  const featured = featuredSource.slice(0, 10);
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
