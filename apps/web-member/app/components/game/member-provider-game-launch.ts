'use client';

import { memberApiFetch } from '../../member-api';

export type MemberGameLaunchCandidate = {
  id?: string | null;
  providerGameCode?: string | null;
  name?: string | null;
  providerCode?: string | null;
  category?: string | null;
};

export type MemberGameLaunchOptions = {
  signal?: AbortSignal;
  locale?: 'th' | 'en';
};

type NormalizedMemberGameLaunchCandidate = {
  id: string;
  providerGameCode: string;
  name: string;
  providerCode: string;
  category: string;
};

type MemberGameRecord = {
  id: string;
  providerGameCode: string;
  name: string;
  category: string;
  providerCode: string;
};

type LaunchAttempt = {
  ok: boolean;
  status: number;
  launchUrl: string;
  message: string;
};

const resolutionCache = new Map<string, string | null>();

export async function openMemberProviderGame(
  candidate: MemberGameLaunchCandidate,
  options: MemberGameLaunchOptions = {},
): Promise<void> {
  const normalized = normalizeCandidate(candidate);
  const directIds = uniqueText([
    usableDirectId(normalized.id),
    usableDirectId(normalized.providerGameCode),
  ]);

  let lastMessage = '';
  for (const id of directIds) {
    const attempt = await requestLaunch(id, options.signal, options.locale);
    if (attempt.ok) {
      navigateToProvider(attempt.launchUrl, options.locale);
      return;
    }
    lastMessage = attempt.message;
    if (!canResolveAfter(attempt.status)) throw new Error(attempt.message);
  }

  const resolvedId = await resolveMemberGameId(normalized, options.signal);
  if (!resolvedId) {
    throw new Error(lastMessage || launchCopy(options.locale).notConnected);
  }

  const resolvedAttempt = await requestLaunch(resolvedId, options.signal, options.locale);
  if (!resolvedAttempt.ok) throw new Error(resolvedAttempt.message);
  navigateToProvider(resolvedAttempt.launchUrl, options.locale);
}

async function requestLaunch(gameId: string, signal?: AbortSignal, locale?: 'th' | 'en'): Promise<LaunchAttempt> {
  const response = await memberApiFetch(
    `/member/games/${encodeURIComponent(gameId)}/launch`,
    signal ? { method: 'POST', signal } : { method: 'POST' },
  );
  const payload = await response.json().catch(() => null);
  const source = unwrapRecord(payload);
  const launchUrl = firstText(source.launchUrl, source.url, source.gameUrl);
  const copy = launchCopy(locale);
  const providerMessage = firstText(source.message, source.errorMessage, source.error);
  const message = locale === 'en' && /[ก-๙]/.test(providerMessage)
    ? (response.ok ? copy.missingUrl : copy.failed)
    : firstText(providerMessage, response.ok ? copy.missingUrl : copy.failed);

  return {
    ok: response.ok && Boolean(launchUrl),
    status: response.status,
    launchUrl,
    message,
  };
}

async function resolveMemberGameId(
  candidate: NormalizedMemberGameLaunchCandidate,
  signal?: AbortSignal,
): Promise<string | null> {
  const key = [candidate.providerCode, candidate.providerGameCode, candidate.id, candidate.name, candidate.category]
    .map(compactText)
    .join('|');
  if (resolutionCache.has(key)) return resolutionCache.get(key) ?? null;

  const resolved = await findMemberGameId(candidate, signal);
  resolutionCache.set(key, resolved);
  return resolved;
}

async function findMemberGameId(
  candidate: NormalizedMemberGameLaunchCandidate,
  signal?: AbortSignal,
): Promise<string | null> {
  const queries = uniqueText([candidate.providerGameCode, stripCatalogPrefix(candidate.id), candidate.name]);
  const discovered = new Map<string, MemberGameRecord>();

  for (const query of queries) {
    const params = new URLSearchParams({ query, page: '1', limit: '100' });
    if (candidate.providerCode) params.set('provider', candidate.providerCode);
    if (candidate.category) params.set('category', candidate.category);
    const response = await memberApiFetch(
      `/member/games?${params.toString()}`,
      signal ? { signal } : {},
    );
    if (!response.ok) continue;
    const payload = await response.json().catch(() => null);
    for (const game of readMemberGames(payload)) discovered.set(game.id, game);
  }

  if (!discovered.size && candidate.providerCode) {
    const params = new URLSearchParams({ provider: candidate.providerCode, page: '1', limit: '100' });
    if (candidate.category) params.set('category', candidate.category);
    const response = await memberApiFetch(
      `/member/games?${params.toString()}`,
      signal ? { signal } : {},
    );
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      for (const game of readMemberGames(payload)) discovered.set(game.id, game);
    }
  }

  const ranked = Array.from(discovered.values())
    .map((game) => ({ game, score: scoreGame(game, candidate) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.game.id ?? null;
}

function readMemberGames(payload: unknown): MemberGameRecord[] {
  const root = asRecord(payload);
  const nested = asRecord(root.data);
  const source = Object.keys(nested).length ? nested : root;
  const items = Array.isArray(source.items) ? source.items : Array.isArray(source.data) ? source.data : [];

  return items
    .map((value) => {
      const game = asRecord(value);
      const provider = asRecord(game.provider);
      const id = firstText(game.id);
      if (!id) return null;
      return {
        id,
        providerGameCode: firstText(game.providerGameCode, game.code),
        name: firstText(game.name),
        category: firstText(game.category),
        providerCode: firstText(provider.code, game.providerCode, typeof game.provider === 'string' ? game.provider : ''),
      };
    })
    .filter((value): value is MemberGameRecord => value !== null);
}

function scoreGame(game: MemberGameRecord, candidate: NormalizedMemberGameLaunchCandidate) {
  const gameId = compactText(game.id);
  const gameCode = compactText(game.providerGameCode);
  const gameName = compactText(game.name);
  const candidateId = compactText(stripCatalogPrefix(candidate.id));
  const candidateCode = compactText(candidate.providerGameCode);
  const candidateName = compactText(candidate.name);
  let score = 0;

  if (candidateId && gameId === candidateId) score += 120;
  if (candidateId && gameCode === candidateId) score += 110;
  if (candidateCode && gameCode === candidateCode) score += 120;
  if (candidateCode && gameId === candidateCode) score += 105;
  if (candidateName && gameName === candidateName) score += 95;
  else if (candidateName && gameName.includes(candidateName)) score += 55;

  if (candidate.providerCode && compactText(game.providerCode) === compactText(candidate.providerCode)) score += 30;
  if (candidate.category && compactText(game.category) === compactText(candidate.category)) score += 10;
  return score;
}

function normalizeCandidate(candidate: MemberGameLaunchCandidate): NormalizedMemberGameLaunchCandidate {
  return {
    id: firstText(candidate.id),
    providerGameCode: firstText(candidate.providerGameCode),
    name: firstText(candidate.name),
    providerCode: firstText(candidate.providerCode).toLowerCase(),
    category: firstText(candidate.category).toLowerCase(),
  };
}

function usableDirectId(value: string) {
  const id = firstText(value);
  return id && !id.toLowerCase().startsWith('catalog:') ? id : '';
}

function stripCatalogPrefix(value: string) {
  return value.replace(/^catalog:/i, '');
}

function canResolveAfter(status: number) {
  return status === 400 || status === 404 || status === 409 || status === 422;
}

function navigateToProvider(rawUrl: string, locale?: 'th' | 'en') {
  const target = new URL(rawUrl, window.location.origin);
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error(locale === 'en' ? 'The game provider returned an unsafe launch URL.' : 'ลิงก์เข้าเกมจากค่ายไม่ปลอดภัย');
  }
  window.location.assign(target.toString());
}

function unwrapRecord(value: unknown): Record<string, unknown> {
  const root = asRecord(value);
  const nested = asRecord(root.data);
  return Object.keys(nested).length ? nested : root;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function compactText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '');
}

function uniqueText(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function launchCopy(locale: 'th' | 'en' = 'th') {
  return locale === 'en'
    ? {
      notConnected: 'This game is not connected to a live provider launch yet.',
      missingUrl: 'The game provider did not return a launch URL.',
      failed: 'Unable to launch the game.',
    }
    : {
      notConnected: 'เกมนี้ยังไม่ได้เชื่อมกับระบบเปิดเกมจริงของค่าย',
      missingUrl: 'ค่ายเกมไม่ได้ส่งลิงก์เข้าเกมกลับมา',
      failed: 'เปิดเกมไม่สำเร็จ',
    };
}
