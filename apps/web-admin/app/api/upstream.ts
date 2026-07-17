import { joinApiUrl } from '@platform/api-client';

const LOCAL_API_URL = 'http://localhost:4000';
const PRODUCTION_API_FALLBACK_URL = 'https://platformapi-production-3c91.up.railway.app';

function configuredApiUrl() {
  return (
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? PRODUCTION_API_FALLBACK_URL : LOCAL_API_URL)
  );
}

export function upstreamApiUrl(path: string) {
  return joinApiUrl(configuredApiUrl(), path);
}

export function upstreamApiOrigin() {
  try {
    return new URL(configuredApiUrl()).origin;
  } catch {
    return 'invalid-upstream-url';
  }
}
