export type AdminSessionDecision = 'continue' | 'refresh' | 'login' | 'setup-2fa';

const ADMIN_PUBLIC_PATHS = new Set(['/login', '/accept-invitation']);

export function isAdminPublicPath(pathname: string) {
  const normalized = pathname.split('?')[0]?.replace(/\/+$/, '') || '/';
  return ADMIN_PUBLIC_PATHS.has(normalized);
}

export function sessionDecision(input: {
  status: number;
  skipAuth?: boolean | undefined;
  responseCode?: string | null | undefined;
  pathname: string;
  hasRetried?: boolean | undefined;
}) : AdminSessionDecision {
  if (input.skipAuth || isAdminPublicPath(input.pathname)) return 'continue';
  if (input.status === 403 && input.responseCode === 'ADMIN_2FA_REQUIRED' && input.pathname !== '/security/2fa') return 'setup-2fa';
  // A normal 403 means the current admin is authenticated but lacks permission for
  // this endpoint. Keep the session alive and let the route/UI permission boundary
  // render an access-denied state instead of creating a login redirect loop.
  if (input.status === 403) return 'continue';
  if (input.status === 401) return input.hasRetried ? 'login' : 'refresh';
  return 'continue';
}

export function adminNextPath(pathname: string, search = '') {
  // Never preserve an auth page as the post-login destination. Otherwise any
  // accidental authenticated request on /login recursively nests next=/login?... .
  const destination = isAdminPublicPath(pathname) ? '/dashboard' : `${pathname}${search}`;
  return encodeURIComponent(destination);
}
