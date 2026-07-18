import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { upstreamApiOrigin, upstreamApiUrl } from '../../upstream';

const ADMIN_ACCESS_COOKIE = 'platform_admin_access';
const ADMIN_ACCESS_MAX_AGE_SECONDS = 10 * 60;

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const body = await request.text();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const response = await fetch(upstreamApiUrl('/admin/auth/login'), {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-request-id': requestId,
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
        ...(request.headers.get('user-agent') ? { 'user-agent': request.headers.get('user-agent')! } : {}),
      },
      body,
    });

    const payload = await response.json().catch(() => null) as { accessToken?: unknown } | null;
    const headers = new Headers({ 'cache-control': 'no-store', 'x-request-id': requestId });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) headers.append('set-cookie', setCookie);

    const nextResponse = NextResponse.json(
      payload ?? { message: 'Authentication service returned an invalid response', requestId },
      { status: response.status, headers },
    );

    if (response.ok && typeof payload?.accessToken === 'string') {
      nextResponse.cookies.set({
        name: ADMIN_ACCESS_COOKIE,
        value: payload.accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/admin',
        maxAge: ADMIN_ACCESS_MAX_AGE_SECONDS,
      });
    }

    return nextResponse;
  } catch (error) {
    const detail = error instanceof Error
      ? { name: error.name, message: error.message, cause: error.cause instanceof Error ? error.cause.message : String(error.cause ?? '') }
      : { name: 'UnknownError', message: String(error), cause: '' };

    console.error(JSON.stringify({
      level: 'error',
      event: 'admin_login_proxy_failed',
      requestId,
      upstreamOrigin: upstreamApiOrigin(),
      error: detail,
    }));

    return NextResponse.json(
      {
        message: 'Authentication service is unavailable',
        code: 'AUTH_UPSTREAM_UNAVAILABLE',
        requestId,
      },
      { status: 503, headers: { 'cache-control': 'no-store', 'x-request-id': requestId } },
    );
  }
}
