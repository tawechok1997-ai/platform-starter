import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
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

  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  if (userAgent) headers.set('user-agent', userAgent);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

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
    return new NextResponse(payload || null, {
      status: response.status,
      headers: {
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
