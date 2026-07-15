const BLOCKED_AUTH_ROUTES = new Set(['/login', '/register']);
const MEMBER_ORIGIN = 'https://member.local';

export function resolveMemberLoginDestination(search: string): string {
  const rawDestination = new URLSearchParams(search).get('next');
  if (!rawDestination || !rawDestination.startsWith('/') || rawDestination.startsWith('//')) return '/';
  if (rawDestination.includes('\\')) return '/';

  try {
    const destination = new URL(rawDestination, MEMBER_ORIGIN);
    if (destination.origin !== MEMBER_ORIGIN || BLOCKED_AUTH_ROUTES.has(destination.pathname)) return '/';
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/';
  }
}
