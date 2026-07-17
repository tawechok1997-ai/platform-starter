import { joinApiUrl } from '@platform/api-client';

const LOCAL_API_URL = 'http://localhost:4000';

function configuredApiUrl() {
  const explicit = process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== 'production') return LOCAL_API_URL;
  throw new Error('Missing API_URL for web-admin production runtime');
}

export function upstreamApiUrl(path: string) {
  return joinApiUrl(configuredApiUrl(), path);
}

export function upstreamApiOrigin() {
  try {
    return new URL(configuredApiUrl()).origin;
  } catch {
    return 'unconfigured-upstream';
  }
}
