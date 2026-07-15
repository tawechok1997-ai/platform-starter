import { joinApiUrl, mergeHeaders } from '@platform/api-client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiOptions = RequestInit & { skipAuth?: boolean };

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

function readStorage(key: string) {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // Safari and embedded browsers can block localStorage. Keep the app usable.
  }
}

function removeStorage(key: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable browser storage during session cleanup.
  }
}

export async function memberApiFetch(path: string, options: ApiOptions = {}) {
  const token = readStorage('member_access_token');
  const headers = mergeHeaders(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (!options.skipAuth && token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(joinApiUrl(API_URL, path), { ...options, headers });
  if (res.status !== 401 || options.skipAuth) return res;

  const refreshed = await refreshMemberToken();
  if (!refreshed) {
    clearMemberSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
    return res;
  }

  headers.set('Authorization', `Bearer ${refreshed}`);
  const retry = await fetch(joinApiUrl(API_URL, path), { ...options, headers });
  if (retry.status === 401) {
    clearMemberSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
  }
  return retry;
}

export async function requestJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await memberApiFetch(path, options);
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : `คำขอล้มเหลว (${response.status})`;
    throw new ApiRequestError(message, response.status, payload);
  }
  return payload as T;
}

export async function refreshMemberToken() {
  const refreshToken = readStorage('member_refresh_token');
  if (!refreshToken) return '';
  const res = await fetch(joinApiUrl(API_URL, '/member/auth/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken, deviceId: 'web-member' }) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) return '';
  writeStorage('member_access_token', data.accessToken);
  if (data.refreshToken) writeStorage('member_refresh_token', data.refreshToken);
  return data.accessToken as string;
}

export function clearMemberSession() {
  removeStorage('member_access_token');
  removeStorage('member_refresh_token');
}
