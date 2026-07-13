let inMemoryAccessToken = '';

type ApiOptions = RequestInit & { skipAuth?: boolean };

function proxiedPath(path: string) {
  if (!path.startsWith('/admin/')) throw new Error(`Unsupported admin API path: ${path}`);
  return `/api/admin/${path.slice('/admin/'.length)}`;
}

export async function adminApiFetch(path: string, options: ApiOptions = {}) {
  const token = inMemoryAccessToken;
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  if (!options.skipAuth && token) headers.set('Authorization', `Bearer ${token}`);

  const url = proxiedPath(path);
  const res = await fetch(url, { cache: 'no-store', ...options, headers });
  if (await redirectToTwoFactorSetup(res, options)) return res;
  if (await redirectAfterPrivilegeReduction(res, options)) return res;
  if (res.status !== 401 || options.skipAuth) return res;

  const refreshed = await refreshAdminToken();
  if (!refreshed) {
    clearAdminSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
    return res;
  }

  headers.set('Authorization', `Bearer ${refreshed}`);
  const retry = await fetch(url, { cache: 'no-store', ...options, headers });
  if (await redirectToTwoFactorSetup(retry, options)) return retry;
  if (await redirectAfterPrivilegeReduction(retry, options)) return retry;
  if (retry.status === 401) {
    clearAdminSession();
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?next=${next}`);
  }
  return retry;
}

async function redirectAfterPrivilegeReduction(response: Response, options: ApiOptions) {
  if (options.skipAuth || response.status !== 403 || window.location.pathname === '/login') return false;
  const payload = await response.clone().json().catch(() => null);
  if (payload?.code === 'ADMIN_2FA_REQUIRED') return false;
  clearAdminSession();
  window.location.replace(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
  return true;
}

async function redirectToTwoFactorSetup(response: Response, options: ApiOptions) {
  if (options.skipAuth || response.status !== 403 || window.location.pathname === '/security/2fa') return false;
  const payload = await response.clone().json().catch(() => null);
  if (payload?.code !== 'ADMIN_2FA_REQUIRED') return false;
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.replace(`/security/2fa?next=${next}`);
  return true;
}

export async function refreshAdminToken() {
  const refreshToken = null;
  const res = await fetch('/api/admin/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) return '';
  setAdminAccessToken(data.accessToken);
  // Successful refresh rotates the HttpOnly cookie; remove any legacy token after migration.
  window.localStorage.removeItem('admin_refresh_token');
  return data.accessToken as string;
}

export function setAdminAccessToken(token: string) {
  inMemoryAccessToken = String(token ?? '');
}

export function clearAdminSession() {
  inMemoryAccessToken = '';
  window.localStorage.removeItem('admin_access_token');
  window.localStorage.removeItem('admin_refresh_token');
}
