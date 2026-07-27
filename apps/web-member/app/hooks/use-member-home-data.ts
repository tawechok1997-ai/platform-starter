'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { requestJson } from '../member-api';
import type { Game, GameLobbyPayload, LedgerItem, MoneyRequest } from '../types/member-api';

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const USE_GAME_API = process.env.NEXT_PUBLIC_MEMBER_GAME_SOURCE === 'api';

export function useMemberHomeData(gamesEnabled: boolean) {
  const [topups] = useState<MoneyRequest[]>([]);
  const [withdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers] = useState<LedgerItem[]>([]);
  const [lobby, setLobby] = useState<GameLobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [gamesMessage, setGamesMessage] = useState('');
  const [isGamesLoading, setIsGamesLoading] = useState(false);

  const loadGames = useCallback(async () => {
    if (!gamesEnabled || !USE_GAME_API) {
      setLobby({});
      setGamesMessage('');
      setIsGamesLoading(false);
      return;
    }

    setIsGamesLoading(true);
    setGamesMessage('');
    try {
      const payload = await requestJson<GameLobbyPayload>('/public/games', {
        skipAuth: true,
        suppressSessionExpiryRedirect: true,
      });
      setLobby(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {});
    } catch (error) {
      setLobby({});
      setGamesMessage(error instanceof Error ? error.message : 'โหลดเกมไม่สำเร็จ');
    } finally {
      setIsGamesLoading(false);
    }
  }, [gamesEnabled]);

  useEffect(() => {
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    void loadGames();
  }, [loadGames]);

  const pendingTopups = useMemo(() => topups.filter((item) => item?.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item?.status === 'PENDING').slice(0, 3), [withdrawals]);
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
    pendingTopups,
    pendingWithdrawals,
    ledgers,
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
