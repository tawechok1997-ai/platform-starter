import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
        ...(request.headers.get('user-agent') ? { 'user-agent': request.headers.get('user-agent')! } : {}),
      },
      body,
    });

    const payload = await response.json().catch(() => null);
    const headers = new Headers({ 'cache-control': 'no-store' });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) headers.set('set-cookie', setCookie);
    return NextResponse.json(payload ?? { message: 'Authentication service returned an invalid response' }, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { message: 'Authentication service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
