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

    if (!response.ok) {
      return NextResponse.json(
        { message: `Upstream site settings returned ${response.status}` },
        { status: 502, headers: noStoreHeaders() },
      );
    }

    const data = await response.json() as PublicSiteSettings;
    const settings: PublicSiteSettings = {
      ...defaultSettings,
      ...data,
      icons: { ...defaultIconSettings, ...(data.icons ?? {}) },
      features: { ...defaultSettings.features, ...(data.features ?? {}) },
    };

    return NextResponse.json(settings, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json(
      { message: 'Upstream site settings are unavailable' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store, max-age=0',
  };
}
