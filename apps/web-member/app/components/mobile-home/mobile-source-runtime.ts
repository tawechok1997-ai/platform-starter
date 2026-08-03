'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMemberGameCatalog, type MemberCatalogGame } from '../../lib/member-game-catalog';
import { randomizeGameCatalog } from '../../lib/randomize-game-catalog';
import { memberApiFetch } from '../../member-api';
import {
  PRESENTATION_LIVE_MATCHES,
  presentationDemoEnabled,
} from '../../member-presentation-defaults';
import { useMemberRuntime } from '../../member-runtime-provider';
import { useSiteSettings } from '../../site-settings-provider';

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
  tags: string[];
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

  const taggedPopular = useMemo(
    () => catalogGames.filter((item) => item.popular || item.tags.includes('hot') || item.tags.includes('popular')),
    [catalogGames],
  );
  const popularGames = useMemo(
    () => (taggedPopular.length > 0 ? taggedPopular : catalogGames).slice(0, 10),
    [catalogGames, taggedPopular],
  );
  const onlineGames = useMemo(
    () => catalogGames.filter((item) => item.players > 0).slice(0, 6),
    [catalogGames],
  );
  const classicGames = useMemo(() => {
    const tagged = catalogGames
      .filter((item) => item.tags.some((tag) => ['arcade', 'classic', 'card', 'table'].includes(tag)));
    return (tagged.length > 0 ? tagged : catalogGames).slice(0, 12);
  }, [catalogGames]);

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
    return {
      popular: byId.get('popular'),
      online: byId.get('online'),
      live: byId.get('live'),
      classic: byId.get('classic'),
    };
  }, [gameSections]);
  const liveMatches = useMemo(() => {
    const featureSettings = typedSettings.features as Record<string, unknown>;
    const configured = normalizeLiveMatches(featureSettings.live_match_items);
    if (configured.length > 0) return configured;
    return presentationDemoEnabled(featureSettings)
      ? normalizeLiveMatches(PRESENTATION_LIVE_MATCHES)
      : [];
  }, [typedSettings.features]);
  const guides = useMemo<MobileSourceGuide[]>(
    () => typedSettings.features.cms_content.faqs
      .filter((item) => item.enabled && item.lifecycle !== 'draft' && item.lifecycle !== 'archived' && item.question.trim())
      .slice(0, 5)
      .map((item, index) => ({
        id: item.id || `faq-${index + 1}`,
        title: item.question.trim(),
        href: `/guide#faq-${encodeURIComponent(item.id || String(index + 1))}`,
      })),
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
  if (!catalogRequest) {
    catalogRequest = getMemberGameCatalog('mobile')
      .then((items) => randomizeGameCatalog(items.map(mapCatalogGame)))
      .catch((error) => {
        catalogRequest = null;
        throw error;
      });
  }
  return catalogRequest;
}

function mapCatalogGame(item: MemberCatalogGame): MobileSourceGame {
  return {
    id: item.id,
    providerGameCode: item.providerGameCode,
    name: item.name,
    provider: item.providerName || item.provider.toUpperCase(),
    providerIcon: item.providerIcon,
    image: item.image,
    badge: item.badge,
    players: item.players,
    category: item.category,
    tags: item.tags,
    popular: item.popular,
  };
}

async function getPublicTournaments() {
  if (!tournamentRequest) {
    tournamentRequest = loadPublicTournaments().catch((error) => {
      tournamentRequest = null;
      throw error;
    });
  }
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
      watchHref: safeHref(item.watchHref ?? item.href) || '/mobile/member/live',
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

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('th').replace(/[^a-z0-9ก-๙]+/g, ' ').trim();
}

function safeHref(value: unknown) {
  const href = text(value, '');
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function finite(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
