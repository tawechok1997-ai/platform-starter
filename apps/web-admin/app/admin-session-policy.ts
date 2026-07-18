export type AdminSessionDecision = 'continue' | 'refresh' | 'login' | 'setup-2fa';

export function sessionDecision(input: {
  status: number;
  skipAuth?: boolean;
  responseCode?: string | null;
  pathname: string;
  hasRetried?: boolean;
}) : AdminSessionDecision {
  if (input.skipAuth) return 'continue';
  if (input.status === 403 && input.responseCode === 'ADMIN_2FA_REQUIRED' && input.pathname !== '/security/2fa') return 'setup-2fa';
  if (input.status === 403 && input.responseCode !== 'ADMIN_2FA_REQUIRED' && input.pathname !== '/login') return 'login';
  if (input.status === 401) return input.hasRetried ? 'login' : 'refresh';
  return 'continue';
}

export function adminNextPath(pathname: string, search = '') {
  return encodeURIComponent(`${pathname}${search}`);
}
