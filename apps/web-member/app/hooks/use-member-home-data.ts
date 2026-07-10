'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { requestJson } from '../member-api';
import type { Game, GameLobbyPayload, LedgerItem, MoneyRequest, PaginatedItems } from '../types/member-api';

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';

export function useMemberHomeData(gamesEnabled: boolean) {
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [lobby, setLobby] = useState<GameLobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [activityMessage, setActivityMessage] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const loadGames = useCallback(async () => {
    if (!gamesEnabled) { setLobby({}); return; }
    try { setLobby(await requestJson<GameLobbyPayload>('/member/games')); }
    catch { setLobby({}); }
  }, [gamesEnabled]);

  const loadActivity = useCallback(async () => {
    setIsActivityLoading(true);
    setActivityMessage('');
    try {
      const [topupData, withdrawalData, ledgerData] = await Promise.all([
        requestJson<PaginatedItems<MoneyRequest>>('/member/topups'),
        requestJson<PaginatedItems<MoneyRequest>>('/member/withdrawals'),
        requestJson<PaginatedItems<LedgerItem>>('/member/wallet/ledger?limit=5'),
      ]);
      setTopups(Array.isArray(topupData.items) ? topupData.items : []);
      setWithdrawals(Array.isArray(withdrawalData.items) ? withdrawalData.items : []);
      setLedgers(Array.isArray(ledgerData.items) ? ledgerData.items : []);
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    loadGames();
    loadActivity();
  }, [loadGames, loadActivity]);

  const pendingTopups = useMemo(() => topups.filter((item) => item.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item.status === 'PENDING').slice(0, 3), [withdrawals]);
  const games = lobby.items ?? [];
  const featured = (lobby.featured?.length ? lobby.featured : games.filter((game) => game.isFeatured)).slice(0, 8);
  const popular = (lobby.popular?.length ? lobby.popular : games.filter((game) => game.isPopular)).slice(0, 8);
  const recentGames = recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];
  const favoriteGames = favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];

  return { pendingTopups, pendingWithdrawals, ledgers, categories: lobby.categories ?? [], featured, popular, recentGames, favoriteGames, activityMessage, isActivityLoading, reloadActivity: loadActivity };
}

function readIds(key: string) {
  try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; }
  catch { return []; }
}
