import type { TypedPublicSiteSettings } from './site-settings-types';
import type {
  MemberHomeContentRuntime,
  MemberLeaderboardEntry,
  MemberMiniGameRuntime,
} from './member-runtime-contract';

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
  return {
    tournaments: normalizeTournaments(firstStructured(features.tournament_items, features.tournament_items_json)),
    leaderboard: normalizeLeaderboard(
      firstStructured(features.leaderboard_items, features.leaderboard_items_json),
      home.leaderboard.entries,
    ),
    miniGames: normalizeMiniGames(
      firstStructured(features.mini_games, features.mini_games_json),
      home.miniGames,
    ),
  };
}

function normalizeTournaments(value: unknown): MemberTournamentRuntime[] {
  if (Array.isArray(value)) {
    const tournaments = value.map((raw, index) => {
      const item = record(raw);
      const startsAt = optionalText(item.startsAt ?? item.startAt);
      const endsAt = optionalText(item.endsAt ?? item.endAt);
      return {
        id: text(item.id, `tournament-${index + 1}`),
        title: text(item.title, `Tournament ${index + 1}`),
        status: text(item.status, 'เปิดรับสมัคร'),
        href: safeHref(item.href) || '/browse/tournaments',
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {}),
        players: normalizePlayers(item.players),
      };
    }).filter((item) => item.title);
    if (tournaments.length) return tournaments;
  }
  return DEFAULT_TOURNAMENTS;
}

function normalizePlayers(value: unknown): MemberTournamentPlayerRuntime[] {
  if (!Array.isArray(value)) return emptyPlayers();
  const players = value.map((raw, index) => {
    const item = record(raw);
    const stats = Array.isArray(item.stats) ? item.stats : [];
    return {
      rank: finite(item.rank, index + 1),
      name: text(item.name ?? item.username, '-'),
      score: finite(item.score, 0),
      stats: Array.from({ length: 6 }, (_, statIndex) => finite(stats[statIndex], 0)) as MemberTournamentPlayerRuntime['stats'],
    };
  });
  return players.length ? players : emptyPlayers();
}

function normalizeLeaderboard(value: unknown, fallback: MemberLeaderboardEntry[]) {
  if (Array.isArray(value)) {
    const entries = value.map((raw, index) => {
      const item = record(raw);
      return {
        rank: finite(item.rank, index + 1),
        name: text(item.name, `Player ${index + 1}`),
        user: text(item.user ?? item.username, '-'),
        amount: text(item.amount ?? item.wins, '0'),
        image: text(item.image ?? item.imageUrl, ''),
      };
    }).filter((item) => item.name);
    if (entries.length) return entries;
  }
  return fallback;
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

function firstStructured(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Invalid JSON is ignored and the safe defaults remain active.
      }
    }
  }
  return undefined;
}

function emptyPlayers(): MemberTournamentPlayerRuntime[] {
  return Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    name: '-',
    score: 0,
    stats: [0, 0, 0, 0, 0, 0],
  }));
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

const DEFAULT_TOURNAMENTS: MemberTournamentRuntime[] = [
  tournament('football-royale-2', 'No1. Tournament Football Royale ครั้งที่ 2', [
    player(1, 'ZAXXXU709740', 20, [17, 0, 0, 0, 7, 0]),
    player(2, 'ZAXXXM664100', 17, [13, 3, 0, 4, 4, 0]),
    player(3, 'ZAXXXR440174', 13, [13, 2, 0, 3, 5, 1]),
    player(4, 'ZAXXXU410005', 11, [13, 2, 0, 1, 7, 1]),
    player(5, 'ZAXXXO539314', 9, [11, 3, 0, 4, 3, 3]),
    player(6, 'ZAXXXU746289', 8, [14, 0, 0, 0, 10, 0]),
    player(7, 'ZAXXXY111105', 6, [10, 4, 0, 2, 6, 2]),
  ]),
  tournament('football-classic-2', 'No1. Tournament Football Classic ครั้งที่ 2', [
    player(1, 'ZAXXXU164013', 12, [14, 1, 0, 1, 7, 1]),
    player(2, 'ZAXXXX399733', 10, [9, 6, 0, 4, 5, 0]),
    player(3, 'ZAXXXW621805', 9, [11, 4, 0, 1, 4, 4]),
    player(4, 'ZAXXXO227775', 8, [13, 0, 0, 4, 6, 1]),
    player(5, 'ZAXXXR646987', 6, [11, 3, 0, 1, 9, 0]),
  ]),
  tournament('football-royale-1', 'No1. Tournament Football Royale ครั้งที่ 1', [
    player(1, 'ZAXXXM651112', 13, [15, 2, 0, 1, 8, 1]),
    player(2, 'ZAXXX1360752', 12, [13, 3, 2, 1, 6, 2]),
    player(3, 'ZAXXX0319280', 10, [14, 1, 2, 1, 7, 2]),
  ]),
  tournament('football-classic-1', 'No1. Tournament Football Classic ครั้งที่ 1', [
    player(1, 'ZAXXXX231972', 20, [16, 1, 0, 3, 3, 2]),
    player(2, 'ZAXXXO536010', 15, [13, 4, 0, 1, 6, 1]),
    player(3, 'ZAXXXR648845', 11, [13, 3, 0, 0, 6, 3]),
  ]),
];

function tournament(id: string, title: string, players: MemberTournamentPlayerRuntime[]): MemberTournamentRuntime {
  const padded = [...players, ...emptyPlayers()].slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 }));
  return { id, title, status: 'สิ้นสุดแล้ว', href: '/browse/tournaments', players: padded };
}

function player(
  rank: number,
  name: string,
  score: number,
  stats: MemberTournamentPlayerRuntime['stats'],
): MemberTournamentPlayerRuntime {
  return { rank, name, score, stats };
}
