'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { useMemberRuntime } from '../../member-runtime-provider';
import { useSiteSettings } from '../../site-settings-provider';

const CATALOG_CATEGORIES = ['slot', 'casino', 'arcade', 'fishing', 'card', 'lottery'] as const;

export type MobileSourceGame = {
  id: string;
  providerGameCode: string;
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

export type MobileSourceLiveMatch = {
  id: string;
  league: string;
  time: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  watchHref: string;
  playHref: string;
};

export type MobileSourceGuide = {
  id: string;
  title: string;
  href: string;
};

type LoadStatus = 'loading' | 'ready' | 'error';

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
  rawPayload?: { assetSource?: string | null } | null;
};

type CatalogPayload = { items?: CatalogGame[] | null; data?: CatalogGame[] | null };

type PublicTournamentPayload = {
  items?: Array<{
    id?: unknown;
    name?: unknown;
    status?: unknown;
    leaderboard?: {
      metric?: unknown;
      entries?: Array<{ rank?: unknown; alias?: unknown; score?: unknown }>;
    } | null;
  }>;
};

let catalogRequest: Promise<MobileSourceGame[]> | null = null;
let tournamentRequest: Promise<MobileSourceTournament[]> | null = null;

export function useMobileSourceRuntime() {
  const { homeData, home, gameSections, features, icons } = useMemberRuntime();
  const { typedSettings } = useSiteSettings();
  const [catalogGames, setCatalogGames] = useState<MobileSourceGame[]>([]);
  const [apiTournaments, setApiTournaments] = useState<MobileSourceTournament[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>('loading');
  const [tournamentStatus, setTournamentStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    void getCatalogGames()
      .then((items) => {
        if (!cancelled) {
          setCatalogGames(items);
          setCatalogStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPublicTournaments()
      .then((items) => {
        if (!cancelled) {
          setApiTournaments(items);
          setTournamentStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setTournamentStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  const cmsTournaments = useMemo<MobileSourceTournament[]>(
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
  const tournaments = apiTournaments.length > 0 ? apiTournaments : cmsTournaments;

  const popularGames = useMemo(
    () => [...catalogGames].sort((left, right) => gamePopularityScore(right) - gamePopularityScore(left)).slice(0, 10),
    [catalogGames],
  );
  const onlineGames = useMemo(
    () => [...catalogGames].filter((item) => item.players > 0).sort((left, right) => right.players - left.players).slice(0, 6),
    [catalogGames],
  );
  const classicGames = useMemo(
    () => catalogGames.filter((item) => item.category === 'arcade' || item.category === 'card')
      .sort((left, right) => gamePopularityScore(right) - gamePopularityScore(left)).slice(0, 6),
    [catalogGames],
  );

  const leaderboard = useMemo<MobileSourceLeaderboardRow[]>(() => {
    if (homeData.leaderboard.length > 0) {
      return homeData.leaderboard.slice(0, 5).map((entry, index) => {
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
      });
    }

    const tournament = tournaments.find((item) => item.players.length > 0);
    return tournament?.players.slice(0, 5).map((entry, index) => ({
      rank: index + 1,
      user: entry.name,
      game: tournament.title,
      provider: 'TOURNAMENT',
      amount: String(entry.score),
      providerIcon: '',
      gameImage: '',
    })) ?? [];
  }, [catalogGames, homeData.leaderboard, tournaments]);

  const section = useMemo(() => {
    const byId = new Map(gameSections.map((item) => [item.id, item] as const));
    return { popular: byId.get('popular'), online: byId.get('online'), live: byId.get('live'), classic: byId.get('classic') };
  }, [gameSections]);
  const liveMatches = useMemo(
    () => normalizeLiveMatches((typedSettings.features as Record<string, unknown>).live_match_items),
    [typedSettings.features],
  );
  const guides = useMemo<MobileSourceGuide[]>(
    () => typedSettings.features.cms_content.faqs
      .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && item.question.trim())
      .slice(0, 5)
      .map((item, index) => ({ id: item.id || `faq-${index + 1}`, title: item.question.trim(), href: `/guide#faq-${encodeURIComponent(item.id || String(index + 1))}` })),
    [typedSettings.features.cms_content.faqs],
  );

  return {
    tournaments,
    leaderboard,
    popularGames,
    onlineGames,
    classicGames,
    liveMatches,
    guides,
    tournament: home.tournament,
    jackpot: home.jackpot,
    leaderboardTitle: home.leaderboard.title,
    guideTitle: home.sectionTitles.guide,
    section,
    icons,
    features,
    catalogStatus,
    tournamentStatus,
    catalogConnected: catalogStatus === 'ready',
  };
}

async function getCatalogGames() {
  if (!catalogRequest) catalogRequest = loadCatalogGames().catch((error) => { catalogRequest = null; throw error; });
  return catalogRequest;
}

async function loadCatalogGames(): Promise<MobileSourceGame[]> {
  const payloads = await Promise.allSettled(CATALOG_CATEGORIES.map(async (category) => {
    const params = new URLSearchParams({ platform: 'mobile', category, page: '1', limit: '100' });
    const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    });
    if (!response.ok) throw new Error(`catalog ${category}: ${response.status}`);
    return await response.json().catch(() => null) as CatalogPayload | null;
  }));
  const successful = payloads.filter((item): item is PromiseFulfilledResult<CatalogPayload | null> => item.status === 'fulfilled');
  if (successful.length === 0) throw new Error('mobile catalog unavailable');

  const mapped = successful.flatMap(({ value }) => {
    const items = Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];
    return items.map(mapCatalogGame).filter((item): item is MobileSourceGame => Boolean(item));
  });
  return dedupeGames(mapped).slice(0, 120);
}

async function getPublicTournaments() {
  if (!tournamentRequest) tournamentRequest = loadPublicTournaments().catch((error) => { tournamentRequest = null; throw error; });
  return tournamentRequest;
}

async function loadPublicTournaments(): Promise<MobileSourceTournament[]> {
  const response = await memberApiFetch('/games/tournaments', {
    cache: 'no-store',
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });
  if (!response.ok) throw new Error(`public tournaments: ${response.status}`);
  const payload = await response.json().catch(() => null) as PublicTournamentPayload | null;
  if (!Array.isArray(payload?.items)) return [];

  return payload.items.map((raw, index) => {
    const id = text(raw.id, `tournament-${index + 1}`);
    const entries = Array.isArray(raw.leaderboard?.entries) ? raw.leaderboard.entries : [];
    return {
      id,
      title: text(raw.name, ''),
      status: text(raw.status, ''),
      href: `/browse/tournaments#${encodeURIComponent(id)}`,
      players: entries.map((entry) => {
        const score = finite(entry.score, 0);
        return {
          name: text(entry.alias, '-'),
          score,
          stats: [score, 0, 0, 0, 0, 0] as [number, number, number, number, number, number],
        };
      }).filter((entry) => entry.name !== '-'),
    };
  }).filter((item) => item.title);
}

function mapCatalogGame(item: CatalogGame): MobileSourceGame | null {
  const id = firstText(item.id, item.providerGameCode, item.code);
  const providerGameCode = firstText(item.providerGameCode, item.code);
  const name = firstText(item.name);
  const image = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !image) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || image.includes('/provider-simulator/icons/')) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = firstText(providerObject?.name, providerObject?.code, item.providerId, typeof item.provider === 'string' ? item.provider : null);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const hot = item.isPopular === true || item.isFeatured === true || tags.some((tag) => /hot|popular|ยอดนิยม/.test(tag));
  const fresh = item.isNew === true || tags.some((tag) => /new|ใหม่/.test(tag));
  return {
    id,
    providerGameCode,
    name,
    provider: provider.toUpperCase(),
    providerIcon: firstText(item.providerLogoUrl, providerObject?.logoUrl),
    image,
    badge: hot ? 'HOT' : fresh ? 'NEW' : '',
    players: readPlayers(item),
    category: normalizeCategory(item.category),
    popular: hot,
  };
}

function normalizeLiveMatches(value: unknown): MobileSourceLiveMatch[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw, index) => {
    const item = record(raw);
    return {
      id: text(item.id, `live-${index + 1}`),
      league: text(item.league, ''),
      time: text(item.time ?? item.startsAt, ''),
      home: text(item.home ?? item.homeTeam, ''),
      away: text(item.away ?? item.awayTeam, ''),
      homeLogo: text(item.homeLogo ?? item.homeLogoUrl, ''),
      awayLogo: text(item.awayLogo ?? item.awayLogoUrl, ''),
      watchHref: safeHref(item.watchHref ?? item.href) || '/live',
      playHref: safeHref(item.playHref ?? item.betHref) || '/browse/games?category=sport',
    };
  }).filter((item) => item.league && item.home && item.away);
}

function findLeaderboardGame(items: MobileSourceGame[], name: string, image: string) {
  const normalizedName = normalizeSearch(name);
  const imageFile = fileName(image);
  return items.find((item) => (
    Boolean(normalizedName && normalizeSearch(item.name) === normalizedName)
    || Boolean(imageFile && fileName(item.image) === imageFile)
  ));
}

function fileName(value: string) {
  const pathname = safePathname(value);
  return pathname.split('/').filter(Boolean).pop()?.split(/[?#]/, 1)[0] ?? '';
}

function safePathname(value: string) {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!/^https?:\/\//i.test(normalized)) return normalized.split(/[?#]/, 1)[0] ?? '';
  try { return new URL(normalized).pathname; } catch { return ''; }
}

function readPlayers(item: CatalogGame) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function gamePopularityScore(item: MobileSourceGame) {
  return (item.popular ? 100_000 : 0) + (item.badge === 'NEW' ? 10_000 : 0) + item.players;
}

function dedupeGames(items: MobileSourceGame[]) {
  return Array.from(new Map(items.map((item) => [`${item.provider}:${item.id}`.toLowerCase(), item] as const)).values());
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

function safeHref(value: unknown) {
  const href = text(value, '');
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finite(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}
