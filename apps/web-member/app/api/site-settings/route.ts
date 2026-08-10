import { NextResponse } from 'next/server';
import { loadPublicSiteSettings } from '../../site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const settings = await loadPublicSiteSettings();
  return NextResponse.json(settings, {
    headers: {
      'cache-control': 'no-store, max-age=0',
    },
  });
}
