import { NextRequest, NextResponse } from 'next/server';
import { upstreamApiUrl } from '../../upstream';

const ALLOWED_ENDPOINTS = new Set(['admin-login']);

function adminLoginAntiBotEnabled() {
  return String(process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED ?? '').trim().toLowerCase() === 'true';
}

function disabledConfig() {
  return {
    enabled: false,
    provider: null,
    siteKey: '',
    adaptiveMode: false,
    emergencyMode: false,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ endpoint: string }> },
) {
  const { endpoint } = await context.params;
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ message: 'Unsupported anti-bot endpoint' }, { status: 404 });
  }

  if (endpoint === 'admin-login' && !adminLoginAntiBotEnabled()) {
    return NextResponse.json(disabledConfig(), {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'x-admin-login-anti-bot': 'disabled',
      },
    });
  }

  try {
    const response = await fetch(upstreamApiUrl(`/public/anti-bot/${endpoint}`), {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload ?? disabledConfig(), {
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
