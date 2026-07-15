import { joinApiUrl } from '@platform/api-client';

const MEMBER_UPSTREAM_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function upstreamApiUrl(path: string) {
  return joinApiUrl(MEMBER_UPSTREAM_API_URL, path);
}
