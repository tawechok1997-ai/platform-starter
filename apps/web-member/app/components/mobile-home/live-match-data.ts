import { ApiClientError, createApiClient } from '@platform/api-client';
import { API_URL } from '../../member-api';

export type LiveMatch = {
  id: string;
  league: string;
  date: string;
  time: string;
  startAt: string;
  status: string;
  isLive: boolean;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  streamUrl: string;
  betUrl: string;
};

export type LiveMatchResult = {
  items: LiveMatch[];
  timezone: string;
  updatedAt: string;
};

type UnknownRecord = Record<string, unknown>;
type MatchDefaults = { league?: string; date?: string };

const DEFAULT_LIVE_MATCH_PATH = '/games/live-events';

export async function loadCentralLiveMatches(timezone: string, signal?: AbortSignal): Promise<LiveMatchResult> {
  const endpoint = process.env.NEXT_PUBLIC_LIVE_MATCH_API_URL?.trim()
    || process.env.NEXT_PUBLIC_LIVE_MATCH_API_PATH?.trim()
    || DEFAULT_LIVE_MATCH_PATH;
  const url = resolveEndpoint(endpoint);
  url.searchParams.set('timezone', timezone);
  url.searchParams.set('sport', 'football');

  const client = createApiClient({
    baseUrl: url.origin,
    cache: 'no-store',
    retry: 0,
  });

  let payload: unknown;
  try {
    payload = await client.request(`${url.pathname}${url.search}`, {
      auth: false,
      cache: 'no-store',
      credentials: 'include',
      headers: { accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return emptyLiveMatchResult(timezone);
    }
    if (error instanceof ApiClientError) {
      const root = asRecord(error.payload);
      throw new Error(firstString(root?.message, root?.error, error.message, 'โหลดรายการถ่ายทอดสดไม่สำเร็จ'));
    }
    throw error;
  }

  if (payload === null) return emptyLiveMatchResult(timezone);

  const root = asRecord(payload);
  const items = collectMatches(payload)
    .map(({ value, defaults }, index) => normalizeMatch(value, index, defaults, timezone))
    .filter((item): item is LiveMatch => Boolean(item));

  return {
    items: dedupeMatches(items),
    timezone: firstString(root?.timezone, root?.timeZone, timezone),
    updatedAt: firstString(root?.updatedAt, root?.generatedAt, new Date().toISOString()),
  };
}

export function groupLiveMatches(items: LiveMatch[]) {
  const groups = new Map<string, { league: string; date: string; matches: LiveMatch[] }>();

  items.forEach((match) => {
    const key = `${match.league}\u0000${match.date}`;
    const current = groups.get(key);
    if (current) current.matches.push(match);
    else groups.set(key, { league: match.league, date: match.date, matches: [match] });
  });

  return Array.from(groups.values());
}

function emptyLiveMatchResult(timezone: string): LiveMatchResult {
  return { items: [], timezone, updatedAt: new Date().toISOString() };
}

function resolveEndpoint(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) return new URL(endpoint);
  const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
  return new URL(endpoint.replace(/^\/+/, ''), base);
}

function collectMatches(payload: unknown): Array<{ value: unknown; defaults: MatchDefaults }> {
  if (Array.isArray(payload)) return payload.flatMap((value) => collectValue(value, {}));
  const root = asRecord(payload);
  if (!root) return [];

  for (const key of ['items', 'data', 'results', 'events', 'matches', 'fixtures']) {
    const value = root[key];
    if (Array.isArray(value)) return value.flatMap((item) => collectValue(item, {}));
  }

  for (const key of ['leagues', 'competitions', 'groups']) {
    const groups = root[key];
    if (!Array.isArray(groups)) continue;
    return groups.flatMap((group) => {
      const record = asRecord(group);
      if (!record) return [];
      const defaults = {
        league: firstString(record.league, record.name, record.title, record.competitionName),
        date: firstString(record.date, record.matchDate),
      };
      const matches = firstArray(record.matches, record.events, record.items, record.fixtures);
      return matches.flatMap((item) => collectValue(item, defaults));
    });
  }

  return collectValue(root, {});
}

function collectValue(value: unknown, defaults: MatchDefaults): Array<{ value: unknown; defaults: MatchDefaults }> {
  const record = asRecord(value);
  if (!record) return [];
  const nested = firstArray(record.matches, record.events, record.items, record.fixtures);
  if (!nested.length) return [{ value, defaults }];

  const nextDefaults = {
    league: firstString(record.league, record.name, record.title, record.competitionName, defaults.league),
    date: firstString(record.date, record.matchDate, defaults.date),
  };
  return nested.flatMap((item) => collectValue(item, nextDefaults));
}

function normalizeMatch(value: unknown, index: number, defaults: MatchDefaults, timezone: string): LiveMatch | null {
  const item = asRecord(value);
  if (!item) return null;

  const homeRecord = asRecord(item.homeTeam) ?? asRecord(item.home) ?? asRecord(item.teamHome);
  const awayRecord = asRecord(item.awayTeam) ?? asRecord(item.away) ?? asRecord(item.teamAway);
  const leagueRecord = asRecord(item.league) ?? asRecord(item.competition) ?? asRecord(item.tournament);
  const startAt = firstString(
    item.startAt,
    item.kickoffAt,
    item.kickOffAt,
    item.scheduledAt,
    item.eventTime,
    item.startTime,
    item.datetime,
  );
  const status = firstString(item.status, item.state, item.phase);
  const home = firstString(homeRecord?.name, item.homeName, item.homeTeamName, typeof item.home === 'string' ? item.home : '');
  const away = firstString(awayRecord?.name, item.awayName, item.awayTeamName, typeof item.away === 'string' ? item.away : '');
  if (!home || !away) return null;

  const formatted = formatSchedule(startAt, timezone);
  const sourceDate = firstString(item.date, item.matchDate, defaults.date);
  const sourceTime = firstString(item.time, item.kickoffTime);
  const league = firstString(
    leagueRecord?.name,
    item.leagueName,
    item.competitionName,
    item.tournamentName,
    typeof item.league === 'string' ? item.league : '',
    defaults.league,
    'ฟุตบอล',
  );
  const isLive = Boolean(item.isLive)
    || /(^|\s)live($|\s)/i.test(status)
    || ['in_progress', 'in-progress', 'playing'].includes(status.toLowerCase());

  return {
    id: firstString(item.id, item.eventId, item.fixtureId, `${league}-${home}-${away}-${index}`),
    league,
    date: sourceDate || formatted.date,
    time: sourceTime || formatted.time,
    startAt,
    status,
    isLive,
    home,
    away,
    homeLogo: firstString(homeRecord?.logoUrl, homeRecord?.logo, item.homeLogo, item.homeTeamLogo),
    awayLogo: firstString(awayRecord?.logoUrl, awayRecord?.logo, item.awayLogo, item.awayTeamLogo),
    streamUrl: firstString(item.streamUrl, item.watchUrl, item.liveUrl, item.videoUrl),
    betUrl: firstString(item.betUrl, item.sportsbookUrl, item.wagerUrl),
  };
}

function formatSchedule(value: string, timezone: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: '', time: '' };

  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((entry) => entry.type === type)?.value ?? '';
  const displayDate = `${part('day')} - ${part('month')} - ${part('year')}`;
  const displayTime = new Intl.DateTimeFormat('th-TH', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return { date: displayDate, time: displayTime };
}

function dedupeMatches(items: LiveMatch[]) {
  return Array.from(new Map(items.map((item) => [item.id, item] as const)).values());
}

function firstArray(...values: unknown[]) {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? [];
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}
