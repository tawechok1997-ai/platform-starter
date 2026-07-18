export type AdminSessionDecision = 'continue' | 'refresh' | 'login' | 'setup-2fa';

export function sessionDecision(input: {
  status: number;
  skipAuth?: boolean | undefined;
  responseCode?: string | null | undefined;
  pathname: string;
  hasRetried?: boolean | undefined;
}) : AdminSessionDecision {
  if (input.skipAuth) return 'continue';
  if (input.status === 403 && input.responseCode === 'ADMIN_2FA_REQUIRED' && input.pathname !== '/security/2fa') return 'setup-2fa';
  // A normal 403 means the current admin is authenticated but lacks permission for
  // this endpoint. Keep the session alive and let the route/UI permission boundary
  // render an access-denied state instead of creating a login redirect loop.
  if (input.status === 403) return 'continue';
  if (input.status === 401) return input.hasRetried ? 'login' : 'refresh';
  return 'continue';
}

export function adminNextPath(pathname: string, search = '') {
  return encodeURIComponent(`${pathname}${search}`);
}
