import { NextRequest, NextResponse } from 'next/server';
import { upstreamApiUrl } from '../../upstream';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const ADMIN_ACCESS_COOKIE = 'platform_admin_access';
const ADMIN_ACCESS_MAX_AGE_SECONDS = 10 * 60;

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
  const cookieAccessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const cookie = request.headers.get('cookie');

  if (authorization) headers.set('authorization', authorization);
  else if (cookieAccessToken) headers.set('authorization', `Bearer ${cookieAccessToken}`);
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
    if (setCookie) responseHeaders.append('set-cookie', setCookie);

    const responsePayload = response.ok ? payload : JSON.stringify(safeAdminError(response.status, payload));
    const nextResponse = new NextResponse(responsePayload || null, {
      status: response.status,
      headers: responseHeaders,
    });

    const accessToken = response.ok && isTokenIssuingPath(path) ? readAccessToken(payload) : '';
    if (accessToken) setAccessCookie(nextResponse, accessToken);
    if (isLogoutPath(path)) clearAccessCookie(nextResponse);

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: 'Admin API service is unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}

function safeAdminError(status: number, payload: string) {
  const upstream = readErrorPayload(payload);
  const code = typeof upstream?.code === 'string' && /^([A-Z0-9_]{3,80})$/.test(upstream.code) ? upstream.code : undefined;
  const message = status === 400 || status === 422
    ? 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่'
    : status === 401
      ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
      : status === 403
        ? 'คุณไม่มีสิทธิ์ดำเนินการนี้'
        : status === 404
          ? 'ไม่พบข้อมูลที่ต้องการ'
          : status === 409
            ? 'ข้อมูลนี้ถูกเปลี่ยนแปลงแล้ว กรุณารีเฟรชและลองใหม่'
            : status >= 500
              ? 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'
              : 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่';
  return { message, ...(code ? { code } : {}) };
}

function readErrorPayload(payload: string): { code?: unknown } | null {
  try {
    const value = JSON.parse(payload) as unknown;
    return value && typeof value === 'object' ? value as { code?: unknown } : null;
  } catch {
    return null;
  }
}

function readAccessToken(payload: string) {
  try {
    const parsed = JSON.parse(payload) as { accessToken?: unknown };
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : '';
  } catch {
    return '';
  }
}

function isTokenIssuingPath(path: string[]) {
  const value = path.join('/');
  return value === 'auth/refresh' || value === 'auth/2fa/verify';
}

function isLogoutPath(path: string[]) {
  return path.join('/') === 'auth/logout';
}

function setAccessCookie(response: NextResponse, accessToken: string) {
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
    maxAge: ADMIN_ACCESS_MAX_AGE_SECONDS,
  });
}

function clearAccessCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
    maxAge: 0,
  });
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
