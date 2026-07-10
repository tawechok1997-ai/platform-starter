import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerCode: string }> },
) {
  const { providerCode } = await context.params;
  if (!providerCode?.trim()) {
    return NextResponse.json({ message: 'Provider code is required' }, { status: 400 });
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const timestamp = request.headers.get('x-timestamp');
  const signature = request.headers.get('x-signature');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (contentType) headers.set('content-type', contentType);
  if (timestamp) headers.set('x-timestamp', timestamp);
  if (signature) headers.set('x-signature', signature);
  if (userAgent) headers.set('user-agent', userAgent);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  try {
    const response = await fetch(
      `${API_URL}/provider-webhooks/${encodeURIComponent(providerCode)}`,
      {
        method: 'POST',
        headers,
        body: await request.text(),
        cache: 'no-store',
        redirect: 'manual',
      },
    );

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
      { message: 'Webhook test service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
