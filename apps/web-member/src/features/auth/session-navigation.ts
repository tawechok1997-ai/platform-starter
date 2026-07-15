import { resolveMemberLoginDestination } from './auth-redirect';

export function buildMemberSessionExpiredHref(pathname: string, search = '', hash = ''): string {
  const destination = safeMemberDestination(pathname, search, hash);
  return destination === '/' ? '/session-expired' : `/session-expired?next=${encodeURIComponent(destination)}`;
}

export function buildMemberLoginHrefFromExpiredSession(search: string): string {
  const destination = resolveMemberLoginDestination(search);
  return destination === '/' ? '/login' : `/login?next=${encodeURIComponent(destination)}`;
}

function safeMemberDestination(pathname: string, search: string, hash: string): string {
  if (pathname === '/session-expired' || pathname.startsWith('/session-expired/')) return '/';
  return resolveMemberLoginDestination(`?next=${encodeURIComponent(`${pathname}${search}${hash}`)}`);
}
