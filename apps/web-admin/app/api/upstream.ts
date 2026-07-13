import { joinApiUrl } from '@platform/api-client';

export const ADMIN_UPSTREAM_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function upstreamApiUrl(path: string) {
  return joinApiUrl(ADMIN_UPSTREAM_API_URL, path);
}
