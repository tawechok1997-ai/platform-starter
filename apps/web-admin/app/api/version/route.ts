import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const processStartedAt = new Date().toISOString();

export function GET() {
  return NextResponse.json(
    {
      service: 'web-admin',
      version: process.env.APP_VERSION ?? '0.1.0',
      commit: process.env.GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown',
      environment: process.env.NODE_ENV ?? 'development',
      builtAt: resolveBuiltAt(process.env.BUILT_AT),
      time: new Date().toISOString(),
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}

function resolveBuiltAt(value: string | undefined) {
  if (value && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return processStartedAt;
}
