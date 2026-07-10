import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ALLOWED_ENDPOINTS = new Set(['admin-login']);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ endpoint: string }> },
) {
  const { endpoint } = await context.params;
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ message: 'Unsupported anti-bot endpoint' }, { status: 404 });
  }

  try {
    const response = await fetch(`${API_URL}/public/anti-bot/${endpoint}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload ?? { enabled: false, provider: null, siteKey: '' }, {
      status: response.status,
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Anti-bot configuration service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
