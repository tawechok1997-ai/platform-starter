import { NextRequest, NextResponse } from 'next/server';
import { upstreamApiUrl } from '../../upstream';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const origin = request.headers.get('origin');

  if (isCrossOriginMutation(method, origin, publicRequestOrigin(request))) {
    return NextResponse.json({ message: 'Cross-origin admin mutation blocked' }, { status: 403 });
  }

  if (!ALLOWED_METHODS.has(method) || !Array.isArray(path) || path.length === 0) {
    return NextResponse.json({ message: 'Unsupported admin API request' }, { status: 405 });
  }

  const upstreamPath = `/admin/${path.map(encodeURIComponent).join('/')}`;
  const search = request.nextUrl.search;
  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const cookie = request.headers.get('cookie');

  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  if (userAgent) headers.set('user-agent', userAgent);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (cookie) headers.set('cookie', cookie);

  const body = method === 'GET' ? '' : await request.text();
  const requestInit: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
    ...(body ? { body } : {}),
  };

  try {
    const response = await fetch(upstreamApiUrl(`${upstreamPath}${search}`), requestInit);

    const payload = await response.text();
    const responseHeaders = new Headers({
      'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('set-cookie', setCookie);
    return new NextResponse(payload || null, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: 'Admin API service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}

function publicRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '');

  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

function isCrossOriginMutation(method: string, origin: string | null, requestOrigin: string) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || !origin) return false;

  try {
    return new URL(origin).origin !== new URL(requestOrigin).origin;
  } catch {
    return true;
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
