export const GAME_TOURNAMENT_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
export type GameTournamentStatus = (typeof GAME_TOURNAMENT_STATUSES)[number];

export type GameTournament = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: GameTournamentStatus;
  startsAt: string;
  endsAt: string;
  gameIds: string[];
  leaderboardSize: number;
  radarEnabled: boolean;
  radarIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type GameTournamentLeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  score: number;
};

export type GameTournamentLeaderboardCache = {
  tournamentId: string;
  metric: 'GAME_LAUNCHES';
  calculatedAt: string;
  windowStart: string;
  windowEnd: string;
  entries: GameTournamentLeaderboardEntry[];
};

export type TournamentWriteInput = {
  name?: string;
  slug?: string;
  description?: string;
  status?: GameTournamentStatus;
  startsAt?: string;
  endsAt?: string;
  gameIds?: string[];
  leaderboardSize?: number;
  radarEnabled?: boolean;
  radarIntervalMinutes?: number;
};

export function normalizeTournamentWrite(
  input: TournamentWriteInput,
  current: GameTournament | null,
  id: string,
  now = new Date(),
): GameTournament {
  const createdAt = current?.createdAt ?? now.toISOString();
  const startsAt = normalizeIso(input.startsAt ?? current?.startsAt ?? now.toISOString(), 'startsAt');
  const endsAt = normalizeIso(input.endsAt ?? current?.endsAt ?? new Date(now.getTime() + 86_400_000).toISOString(), 'endsAt');
  if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('Tournament end time must be after start time');

  const name = String(input.name ?? current?.name ?? '').trim();
  if (name.length < 3 || name.length > 120) throw new Error('Tournament name must contain 3 to 120 characters');

  const slug = String(input.slug ?? current?.slug ?? '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) throw new Error('Tournament slug is invalid');

  const gameIds = Array.from(new Set((input.gameIds ?? current?.gameIds ?? []).map((value) => String(value).trim()).filter(Boolean)));
  if (!gameIds.length) throw new Error('Tournament must include at least one game');

  const leaderboardSize = boundedInteger(input.leaderboardSize ?? current?.leaderboardSize ?? 50, 5, 200, 'leaderboardSize');
  const radarIntervalMinutes = boundedInteger(input.radarIntervalMinutes ?? current?.radarIntervalMinutes ?? 15, 1, 1_440, 'radarIntervalMinutes');
  const status = input.status ?? current?.status ?? 'DRAFT';
  if (!GAME_TOURNAMENT_STATUSES.includes(status)) throw new Error('Tournament status is invalid');

  return {
    id,
    name,
    slug,
    description: String(input.description ?? current?.description ?? '').trim().slice(0, 1_000),
    status,
    startsAt,
    endsAt,
    gameIds,
    leaderboardSize,
    radarEnabled: input.radarEnabled ?? current?.radarEnabled ?? false,
    radarIntervalMinutes,
    createdAt,
    updatedAt: now.toISOString(),
  };
}

export function isTournamentVisible(tournament: GameTournament) {
  return tournament.status === 'SCHEDULED' || tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED';
}

export function isTournamentRadarDue(
  tournament: GameTournament,
  cache: GameTournamentLeaderboardCache | null,
  now = new Date(),
) {
  if (!tournament.radarEnabled || tournament.status !== 'ACTIVE') return false;
  const currentTime = now.getTime();
  if (currentTime < Date.parse(tournament.startsAt) || currentTime > Date.parse(tournament.endsAt)) return false;
  if (!cache) return true;
  return currentTime - Date.parse(cache.calculatedAt) >= tournament.radarIntervalMinutes * 60_000;
}

export function publicLeaderboardAlias(entry: Pick<GameTournamentLeaderboardEntry, 'displayName' | 'username'>) {
  const displayName = entry.displayName?.trim();
  if (displayName) return displayName.slice(0, 80);
  const username = entry.username.trim();
  if (username.length <= 2) return `${username.slice(0, 1)}*`;
  return `${username.slice(0, 2)}${'*'.repeat(Math.min(6, Math.max(2, username.length - 2)))}`;
}

function normalizeIso(value: string, field: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO date`);
  return new Date(timestamp).toISOString();
}

function boundedInteger(value: number, minimum: number, maximum: number, field: string) {
  const normalized = Math.floor(Number(value));
  if (!Number.isFinite(normalized) || normalized < minimum || normalized > maximum) throw new Error(`${field} is outside the allowed range`);
  return normalized;
}
