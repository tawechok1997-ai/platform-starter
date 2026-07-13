import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();

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

  const hasBody = method !== 'GET' && method !== 'DELETE';
  const body = hasBody ? await request.text() : undefined;

  try {
    const response = await fetch(`${API_URL}${upstreamPath}${search}`, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

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
        'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Admin API service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
