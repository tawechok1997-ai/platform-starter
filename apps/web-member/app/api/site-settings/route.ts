import { NextResponse } from 'next/server';
import {
  API_URL,
  defaultIconSettings,
  defaultSettings,
  type PublicSiteSettings,
} from '../../site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(`${API_URL.replace(/\/+$/, '')}/public/site-settings`, {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return staleSnapshotResponse();

    const data = await response.json() as PublicSiteSettings;
    const settings: PublicSiteSettings = {
      ...defaultSettings,
      ...data,
      icons: { ...defaultIconSettings, ...(data.icons ?? {}) },
      features: { ...defaultSettings.features, ...(data.features ?? {}) },
    };

    return NextResponse.json(settings, { headers: noStoreHeaders() });
  } catch {
    return staleSnapshotResponse();
  }
}

function staleSnapshotResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...noStoreHeaders(),
      'x-site-settings-state': 'stale',
    },
  });
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store, max-age=0',
  };
}
