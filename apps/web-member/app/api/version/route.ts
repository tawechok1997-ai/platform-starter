import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      service: 'web-member',
      version: process.env.APP_VERSION ?? '0.1.0',
      commit: process.env.GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown',
      environment: process.env.NODE_ENV ?? 'development',
      builtAt: process.env.BUILT_AT ?? 'unknown',
      time: new Date().toISOString(),
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
