import { joinApiUrl } from '@platform/api-client';

const LOCAL_API_URL = 'http://localhost:4000';
const PRODUCTION_API_FALLBACK_URL = 'https://platformapi-production-3c91.up.railway.app';

const ADMIN_UPSTREAM_API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_FALLBACK_URL : LOCAL_API_URL);

export function upstreamApiUrl(path: string) {
  return joinApiUrl(ADMIN_UPSTREAM_API_URL, path);
}

export function upstreamApiOrigin() {
  try {
    return new URL(ADMIN_UPSTREAM_API_URL).origin;
  } catch {
    return 'invalid-upstream-url';
  }
}
