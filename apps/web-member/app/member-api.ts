import { joinApiUrl, mergeHeaders } from '@platform/api-client';
import { buildMemberSessionExpiredHref } from '../src/features/auth/session-navigation';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const MEMBER_SESSION_CHANGED_EVENT = 'platform:member-session-changed';

type ApiOptions = Omit<RequestInit, 'signal'> & {
  signal?: AbortSignal | null | undefined;
  skipAuth?: boolean;
  suppressSessionExpiryRedirect?: boolean;
};

type MemberSessionPayload = {
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresAt?: unknown;
};

type UnknownRecord = Record<string, unknown>;

let refreshRequest: Promise<string> | null = null;
let sessionExpiryRedirected = false;

class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown = null,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function browserStorages() {
  if (typeof window === 'undefined') return [] as Storage[];
  const storages: Storage[] = [];
  try {
    storages.push(window.localStorage);
  } catch {
    // Embedded and privacy-focused browsers can block localStorage.
  }
  try {
    storages.push(window.sessionStorage);
  } catch {
    // Continue with whichever browser storage is available.
  }
  return storages;
}

function readStorage(key: string) {
  for (const storage of browserStorages()) {
    try {
      const value = storage.getItem(key);
      if (value && value !== 'undefined' && value !== 'null') return value;
    } catch {
      // Try the next available storage.
    }
  }
  return null;
}

function writeStorage(key: string, value: string) {
  if (!value || value === 'undefined' || value === 'null') return false;
  for (const storage of browserStorages()) {
    try {
      storage.setItem(key, value);
      if (storage.getItem(key) === value) return true;
    } catch {
      // Try the next available storage.
    }
  }
  return false;
}

function removeStorage(key: string) {
  for (const storage of browserStorages()) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore unavailable browser storage during session cleanup.
    }
  }
}

function announceSessionChanged() {
  if (
    typeof window !== 'undefined'
    && typeof window.dispatchEvent === 'function'
    && typeof Event === 'function'
  ) {
    window.dispatchEvent(new Event(MEMBER_SESSION_CHANGED_EVENT));
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function normalizeMemberSessionPayload(payload: unknown): MemberSessionPayload | null {
  const root = asRecord(payload);
  if (!root) return null;

  const candidates = [
    root,
    asRecord(root.data),
    asRecord(root.session),
    asRecord(root.tokens),
    asRecord(asRecord(root.data)?.session),
    asRecord(asRecord(root.data)?.tokens),
  ].filter((candidate): candidate is UnknownRecord => Boolean(candidate));

  for (const candidate of candidates) {
    const accessToken = typeof candidate.accessToken === 'string' ? candidate.accessToken.trim() : '';
    const refreshToken = typeof candidate.refreshToken === 'string' ? candidate.refreshToken.trim() : '';
    if (!accessToken || !refreshToken) continue;
    return {
      accessToken,
      refreshToken,
      expiresAt: candidate.expiresAt,
    };
  }

  return null;
}

function isSessionCreatingPath(path: string) {
  return path === '/member/auth/login' || path === '/member/auth/register';
}

function resolveApiRequestUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : joinApiUrl(API_URL, path);
}

async function normalizeSessionResponse(path: string, response: Response) {
  if (!response.ok || !isSessionCreatingPath(path)) return response;

  const payload = await response.clone().json().catch(() => null);
  const session = normalizeMemberSessionPayload(payload);
  if (!session || !persistMemberSession(session)) {
    return new Response(JSON.stringify({ message: 'ระบบไม่สามารถบันทึกเซสชันสมาชิกได้ กรุณาลองอีกครั้ง' }), {
      status: 502,
      statusText: 'Invalid member session response',
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const root = asRecord(payload) ?? {};
  return new Response(JSON.stringify({ ...root, ...session }), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function persistMemberSession(payload: MemberSessionPayload | null | undefined) {
  const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
  const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
  if (!accessToken || !refreshToken) return false;

  removeStorage('member_access_token');
  removeStorage('member_refresh_token');

  const accessStored = writeStorage('member_access_token', accessToken);
  const refreshStored = writeStorage('member_refresh_token', refreshToken);
  if (!accessStored || !refreshStored) {
    removeStorage('member_access_token');
    removeStorage('member_refresh_token');
    return false;
  }

  sessionExpiryRedirected = false;
  announceSessionChanged();
  return true;
}

export async function memberApiFetch(path: string, options: ApiOptions = {}) {
  const {
    skipAuth = false,
    suppressSessionExpiryRedirect = false,
    signal,
    ...requestInit
  } = options;
  const token = readStorage('member_access_token');
  const headers = mergeHeaders(requestInit.headers);
  if (!headers.has('Content-Type') && requestInit.body) headers.set('Content-Type', 'application/json');
  if (!skipAuth && token) headers.set('Authorization', `Bearer ${token}`);
  const fetchOptions: RequestInit = {
    ...requestInit,
    headers,
    ...(signal !== undefined ? { signal } : {}),
  };
  const requestUrl = resolveApiRequestUrl(path);

  const res = await fetch(requestUrl, fetchOptions);
  if (res.status !== 401 || skipAuth) return normalizeSessionResponse(path, res);

  const refreshed = await refreshMemberToken();
  if (!refreshed) {
    clearMemberSession();
    if (!suppressSessionExpiryRedirect) expireMemberSession();
    return res;
  }

  headers.set('Authorization', `Bearer ${refreshed}`);
  const retry = await fetch(requestUrl, fetchOptions);
  if (retry.status === 401) {
    clearMemberSession();
    if (!suppressSessionExpiryRedirect) expireMemberSession();
  }
  return retry;
}

export async function requestJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await memberApiFetch(path, options);
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `คำขอล้มเหลว (${response.status})`;
    throw new ApiRequestError(message, response.status, payload);
  }
  return payload as T;
}

export async function refreshMemberToken(): Promise<string> {
  if (refreshRequest) return refreshRequest;
  refreshRequest = performMemberTokenRefresh();
  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

async function performMemberTokenRefresh(): Promise<string> {
  const refreshToken = readStorage('member_refresh_token');
  if (!refreshToken) return '';
  const res = await fetch(joinApiUrl(API_URL, '/member/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, deviceId: 'web-member' }),
  });
  const data = await res.json().catch(() => null);
  const session = normalizeMemberSessionPayload(data);
  if (!res.ok || typeof session?.accessToken !== 'string' || !session.accessToken) return '';
  if (!persistMemberSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken || refreshToken,
    expiresAt: session.expiresAt,
  })) return '';
  return session.accessToken;
}

export function hasMemberSessionTokens() {
  return Boolean(readStorage('member_access_token') || readStorage('member_refresh_token'));
}

export function clearMemberSession() {
  const hadSession = hasMemberSessionTokens();
  removeStorage('member_access_token');
  removeStorage('member_refresh_token');
  if (hadSession) announceSessionChanged();
}

function expireMemberSession() {
  clearMemberSession();
  if (typeof window === 'undefined' || sessionExpiryRedirected) return;
  sessionExpiryRedirected = true;
  window.location.replace(
    buildMemberSessionExpiredHref(window.location.pathname, window.location.search, window.location.hash),
  );
}
