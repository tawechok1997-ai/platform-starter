'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { useMemberRuntime } from '../../member-runtime-provider';

const LOCAL_IMAGE_ROOT = '/assets/asset-pc/images';
const CATALOG_CATEGORIES = ['slot', 'casino', 'arcade', 'fishing', 'card', 'lottery'] as const;

export type MobileSourceGame = {
  id: string;
  name: string;
  provider: string;
  providerIcon: string;
  image: string;
  badge: 'HOT' | 'NEW' | '';
  players: number;
  category: string;
  popular: boolean;
};

export type MobileSourceTournament = {
  id: string;
  title: string;
  status: string;
  href: string;
  players: Array<{
    name: string;
    score: number;
    stats: [number, number, number, number, number, number];
  }>;
};

export type MobileSourceLeaderboardRow = {
  rank: number;
  user: string;
  game: string;
  provider: string;
  amount: string;
  providerIcon: string;
  gameImage: string;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  providerId?: string | null;
  provider?: string | { code?: string | null; name?: string | null; logoUrl?: string | null } | null;
  providerLogoUrl?: string | null;
  category?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  isPopular?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  status?: string | null;
  rawPayload?: { assetSource?: string | null } | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  data?: CatalogGame[] | null;
};

let catalogRequest: Promise<MobileSourceGame[]> | null = null;

export function useMobileSourceRuntime() {
  const { homeData, home, gameSections, features, icons } = useMemberRuntime();
  const [catalogGames, setCatalogGames] = useState<MobileSourceGame[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getCatalogGames().then((items) => {
      if (!cancelled) setCatalogGames(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tournaments = useMemo<MobileSourceTournament[]>(
    () => homeData.tournaments.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      href: item.href,
      players: item.players.map((player) => ({
        name: player.name,
        score: player.score,
        stats: [...player.stats] as [number, number, number, number, number, number],
      })),
    })),
    [homeData.tournaments],
  );

  const popularGames = useMemo(
    () => [...catalogGames]
      .sort((left, right) => gamePopularityScore(right) - gamePopularityScore(left))
      .slice(0, 10),
    [catalogGames],
  );

  const onlineGames = useMemo(
    () => [...catalogGames].sort((left, right) => right.players - left.players).slice(0, 6),
    [catalogGames],
  );

  const classicGames = useMemo(
    () => catalogGames
      .filter((item) => item.category === 'arcade' || item.category === 'card')
      .sort((left, right) => gamePopularityScore(right) - gamePopularityScore(left))
      .slice(0, 6),
    [catalogGames],
  );

  const leaderboard = useMemo<MobileSourceLeaderboardRow[]>(
    () => homeData.leaderboard.slice(0, 5).map((entry, index) => {
      const match = findLeaderboardGame(catalogGames, entry.name, entry.image);
      return {
        rank: Number.isFinite(entry.rank) ? entry.rank : index + 1,
        user: entry.user,
        game: entry.name,
        provider: match?.provider ?? '',
        amount: entry.amount,
        providerIcon: match?.providerIcon ?? '',
        gameImage: entry.image || match?.image || '',
      };
    }),
    [catalogGames, homeData.leaderboard],
  );

  const section = useMemo(() => {
    const byId = new Map(gameSections.map((item) => [item.id, item] as const));
    return {
      popular: byId.get('popular'),
      online: byId.get('online'),
      live: byId.get('live'),
      classic: byId.get('classic'),
    };
  }, [gameSections]);

  const leaderboardTitle = home.leaderboard.title;

  return {
    tournaments,
    leaderboard,
    popularGames,
    onlineGames,
    classicGames,
    tournament: home.tournament,
    jackpot: home.jackpot,
    leaderboardTitle,
    homeDataTitle: leaderboardTitle,
    guideTitle: home.sectionTitles.guide,
    section,
    icons,
    features,
    catalogConnected: catalogGames.length > 0,
  };
}

async function getCatalogGames() {
  if (!catalogRequest) catalogRequest = loadCatalogGames();
  return catalogRequest;
}

async function loadCatalogGames(): Promise<MobileSourceGame[]> {
  try {
    const payloads = await Promise.all(CATALOG_CATEGORIES.map(async (category) => {
      const params = new URLSearchParams({
        platform: 'mobile',
        category,
        page: '1',
        limit: '100',
      });
      const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
        skipAuth: true,
        suppressSessionExpiryRedirect: true,
      });
      if (!response.ok) return null;
      return await response.json().catch(() => null) as CatalogPayload | null;
    }));

    const mapped = payloads.flatMap((payload) => {
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      return items.map(mapCatalogGame).filter((item): item is MobileSourceGame => Boolean(item));
    });

    return dedupeGames(mapped).slice(0, 120);
  } catch {
    catalogRequest = null;
    return [];
  }
}

function mapCatalogGame(item: CatalogGame): MobileSourceGame | null {
  const id = firstText(item.providerGameCode, item.code, item.id);
  const name = firstText(item.name);
  const sourceImage = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !sourceImage) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || sourceImage.includes('/provider-simulator/icons/')) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const providerCode = normalizeProvider(firstText(
    item.providerId,
    typeof item.provider === 'string' ? item.provider : null,
    providerObject?.code,
    providerObject?.name,
  ));
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const hot = item.isPopular === true || item.isFeatured === true || tags.some((tag) => /hot|popular|ยอดนิยม/.test(tag));
  const fresh = item.isNew === true || tags.some((tag) => /new|ใหม่/.test(tag));

  return {
    id,
    name,
    provider: providerCode.toUpperCase(),
    providerIcon: localProviderLogo(firstText(item.providerLogoUrl, providerObject?.logoUrl), providerCode),
    image: localGameImage(sourceImage),
    badge: hot ? 'HOT' : fresh ? 'NEW' : '',
    players: readPlayers(item, id),
    category: normalizeCategory(item.category),
    popular: hot,
  };
}

function findLeaderboardGame(items: MobileSourceGame[], name: string, image: string) {
  const normalizedName = normalizeSearch(name);
  const imageFile = fileName(image);
  return items.find((item) => {
    if (normalizedName && normalizeSearch(item.name) === normalizedName) return true;
    return Boolean(imageFile && fileName(item.image) === imageFile);
  });
}

function localGameImage(source: string) {
  const name = fileName(source);
  return name ? `${LOCAL_IMAGE_ROOT}/games/${name}` : source;
}

function localProviderLogo(source: string, provider: string) {
  const normalized = source.trim().replace(/\\/g, '/');
  if (normalized.startsWith(`${LOCAL_IMAGE_ROOT}/providers/`)) return normalized;
  const marker = '/providers/';
  const pathname = safePathname(normalized);
  const markerIndex = pathname.toLowerCase().indexOf(marker);
  if (markerIndex >= 0) {
    const relative = pathname.slice(markerIndex + 1).replace(/^\/+/, '');
    if (relative && !relative.includes('..')) return `${LOCAL_IMAGE_ROOT}/${relative}`;
  }
  return provider ? `${LOCAL_IMAGE_ROOT}/providers/set/1_1_badge/${provider}.png` : '';
}

function fileName(value: string) {
  const pathname = safePathname(value);
  return pathname.split('/').filter(Boolean).pop()?.split(/[?#]/, 1)[0] ?? '';
}

function safePathname(value: string) {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!/^https?:\/\//i.test(normalized)) return normalized.split(/[?#]/, 1)[0] ?? '';
  try {
    return new URL(normalized).pathname;
  } catch {
    return '';
  }
}

function readPlayers(item: CatalogGame, seed: string) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : estimatedPlayers(seed);
}

function estimatedPlayers(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return 900 + Math.abs(hash % 4300);
}

function gamePopularityScore(item: MobileSourceGame) {
  return (item.popular ? 100_000 : 0) + (item.badge === 'NEW' ? 10_000 : 0) + item.players;
}

function dedupeGames(items: MobileSourceGame[]) {
  return Array.from(new Map(items.map((item) => [`${item.provider}:${item.id}`.toLowerCase(), item] as const)).values());
}

function normalizeProvider(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '') || 'game';
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? '').trim().toLowerCase();
  if (/arcade|อาเขต/.test(category)) return 'arcade';
  if (/card|table|ไพ่/.test(category)) return 'card';
  if (/casino|live/.test(category)) return 'casino';
  if (/fish/.test(category)) return 'fishing';
  if (/lottery|หวย/.test(category)) return 'lottery';
  return category || 'slot';
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, ' ').trim();
}

function firstText(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof value === 'string' ? value.trim() : '';
}
