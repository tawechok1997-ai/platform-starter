import { mergeHeaders } from '@platform/api-client';
import { adminNextPath, sessionDecision } from './admin-session-policy';

let inMemoryAccessToken = '';
const ADMIN_SESSION_HINT = 'admin_session_hint';
const ADMIN_ACCESS_TOKEN = 'admin_access_token';

type ApiOptions = RequestInit & { skipAuth?: boolean };

export function proxiedAdminPath(path: string) {
  if (!path.startsWith('/admin/')) throw new Error(`Unsupported admin API path: ${path}`);
  return `/api/admin/${path.slice('/admin/'.length)}`;
}

export async function adminApiFetch(path: string, options: ApiOptions = {}) {
  const token = getAdminAccessToken();
  const headers = mergeHeaders(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  if (!options.skipAuth && token) headers.set('Authorization', `Bearer ${token}`);

  const url = proxiedAdminPath(path);
  const res = await fetch(url, { cache: 'no-store', ...options, headers });
  const handled = await handleAdminResponse(res, options, false);
  if (handled !== 'refresh') return res;

  const refreshed = await refreshAdminToken(true);
  if (!refreshed) {
    redirectToLogin();
    return res;
  }

  headers.set('Authorization', `Bearer ${refreshed}`);
  const retry = await fetch(url, { cache: 'no-store', ...options, headers });
  await handleAdminResponse(retry, options, true);
  return retry;
}

async function handleAdminResponse(response: Response, options: ApiOptions, hasRetried: boolean) {
  let responseCode: string | null = null;
  if (response.status === 403) {
    const payload = await response.clone().json().catch(() => null);
    responseCode = typeof payload?.code === 'string' ? payload.code : null;
  }
  const decision = sessionDecision({
    status: response.status,
    skipAuth: options.skipAuth,
    responseCode,
    pathname: window.location.pathname,
    hasRetried,
  });
  if (decision === 'setup-2fa') {
    const next = adminNextPath(window.location.pathname, window.location.search);
    window.location.replace(`/security/2fa?next=${next}`);
  } else if (decision === 'login') {
    redirectToLogin();
  }
  return decision;
}

function redirectToLogin() {
  clearAdminSession();
  const next = adminNextPath(window.location.pathname, window.location.search);
  window.location.replace(`/login?next=${next}`);
}

export async function refreshAdminToken(force = false) {
  if (!force && window.localStorage.getItem(ADMIN_SESSION_HINT) !== '1') return '';

  const res = await fetch('/api/admin/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) {
    window.localStorage.removeItem(ADMIN_SESSION_HINT);
    window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN);
    inMemoryAccessToken = '';
    return '';
  }
  setAdminAccessToken(data.accessToken);
  window.localStorage.removeItem('admin_refresh_token');
  return data.accessToken as string;
}

function getAdminAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window === 'undefined') return '';
  const stored = window.sessionStorage.getItem(ADMIN_ACCESS_TOKEN) ?? '';
  if (stored) inMemoryAccessToken = stored;
  return inMemoryAccessToken;
}

export function setAdminAccessToken(token: string) {
  inMemoryAccessToken = String(token ?? '');
  if (inMemoryAccessToken) {
    window.sessionStorage.setItem(ADMIN_ACCESS_TOKEN, inMemoryAccessToken);
    window.localStorage.setItem(ADMIN_SESSION_HINT, '1');
  } else {
    window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN);
    window.localStorage.removeItem(ADMIN_SESSION_HINT);
  }
}

export function clearAdminSession() {
  inMemoryAccessToken = '';
  window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN);
  window.localStorage.removeItem(ADMIN_SESSION_HINT);
  window.localStorage.removeItem(ADMIN_ACCESS_TOKEN);
  window.localStorage.removeItem('admin_refresh_token');
}
