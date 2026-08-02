import type { TypedPublicSiteSettings } from './site-settings-types';
import type {
  MemberHomeContentRuntime,
  MemberLeaderboardEntry,
  MemberMiniGameRuntime,
} from './member-runtime-contract';
import {
  PRESENTATION_LEADERBOARD,
  PRESENTATION_MINI_GAMES,
  PRESENTATION_TOURNAMENTS,
  presentationDemoEnabled,
} from './member-presentation-defaults';

export type MemberTournamentPlayerRuntime = {
  rank: number;
  name: string;
  score: number;
  stats: [number, number, number, number, number, number];
};

export type MemberTournamentRuntime = {
  id: string;
  title: string;
  status: string;
  href: string;
  startsAt?: string;
  endsAt?: string;
  players: MemberTournamentPlayerRuntime[];
};

export type MemberHomeDataRuntime = {
  tournaments: MemberTournamentRuntime[];
  leaderboard: MemberLeaderboardEntry[];
  miniGames: MemberMiniGameRuntime[];
};

export function buildMemberHomeDataRuntime(
  settings: TypedPublicSiteSettings,
  home: MemberHomeContentRuntime,
): MemberHomeDataRuntime {
  const features = settings.features as Record<string, unknown>;
  const demoEnabled = presentationDemoEnabled(features);
  const tournaments = normalizeTournaments(
    firstStructured(features.tournament_items, features.tournament_items_json),
  );
  const leaderboard = normalizeLeaderboard(
    firstStructured(features.leaderboard_items, features.leaderboard_items_json),
  );
  const miniGames = normalizeMiniGames(
    firstStructured(features.mini_games, features.mini_games_json),
    home.miniGames,
  );

  return {
    tournaments: tournaments.length > 0
      ? tournaments
      : demoEnabled ? cloneTournaments(PRESENTATION_TOURNAMENTS) : [],
    leaderboard: leaderboard.length > 0
      ? leaderboard
      : demoEnabled ? PRESENTATION_LEADERBOARD.map((item) => ({ ...item })) : [],
    miniGames: miniGames.length > 0
      ? miniGames
      : demoEnabled ? PRESENTATION_MINI_GAMES.map((item) => ({ ...item })) : [],
  };
}

function normalizeTournaments(value: unknown): MemberTournamentRuntime[] {
  if (!Array.isArray(value)) return [];

  return value.map((raw, index) => {
    const item = record(raw);
    const startsAt = optionalText(item.startsAt ?? item.startAt);
    const endsAt = optionalText(item.endsAt ?? item.endAt);
    return {
      id: text(item.id, `tournament-${index + 1}`),
      title: text(item.title, ''),
      status: text(item.status, ''),
      href: safeHref(item.href) || '/browse/tournaments',
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
      players: normalizePlayers(item.players),
    };
  }).filter((item) => item.title);
}

function normalizePlayers(value: unknown): MemberTournamentPlayerRuntime[] {
  if (!Array.isArray(value)) return [];

  return value.map((raw, index) => {
    const item = record(raw);
    const stats = Array.isArray(item.stats) ? item.stats : [];
    return {
      rank: finite(item.rank, index + 1),
      name: text(item.name ?? item.username, ''),
      score: finite(item.score, 0),
      stats: Array.from(
        { length: 6 },
        (_, statIndex) => finite(stats[statIndex], 0),
      ) as MemberTournamentPlayerRuntime['stats'],
    };
  }).filter((item) => item.name);
}

function normalizeLeaderboard(value: unknown): MemberLeaderboardEntry[] {
  if (!Array.isArray(value)) return [];

  return value.map((raw, index) => {
    const item = record(raw);
    return {
      rank: finite(item.rank, index + 1),
      name: text(item.name, ''),
      user: text(item.user ?? item.username, '-'),
      amount: text(item.amount ?? item.wins, '0'),
      image: text(item.image ?? item.imageUrl, ''),
    };
  }).filter((item) => item.name);
}

function normalizeMiniGames(value: unknown, fallback: MemberMiniGameRuntime[]) {
  if (Array.isArray(value)) {
    const items = value.map((raw, index) => {
      const item = record(raw);
      return {
        id: text(item.id, `mini-game-${index + 1}`),
        title: text(item.title, `Mini Game ${index + 1}`),
        subtitle: text(item.subtitle, ''),
        href: safeHref(item.href) || '/?auth=login',
        image: text(item.image ?? item.imageUrl, ''),
        enabled: item.enabled !== false,
      };
    });
    if (items.length) return items;
  }
  return fallback;
}

function cloneTournaments(items: readonly MemberTournamentRuntime[]) {
  return items.map((item) => ({
    ...item,
    players: item.players.map((player) => ({
      ...player,
      stats: [...player.stats] as MemberTournamentPlayerRuntime['stats'],
    })),
  }));
}

function firstStructured(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Invalid CMS JSON is ignored; configured or presentation fallbacks are used.
      }
    }
  }
  return undefined;
}

function safeHref(value: unknown) {
  const href = text(value, '');
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function optionalText(value: unknown) {
  const normalized = text(value, '');
  return normalized || undefined;
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function finite(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
