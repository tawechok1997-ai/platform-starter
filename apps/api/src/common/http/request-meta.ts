import type { HttpRequestContext } from '../actors';

export type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
};

export function getClientIp(req: HttpRequestContext): string {
  return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
}

export function getRequestMeta(req: HttpRequestContext, deviceId?: string): RequestMeta {
  const userAgentHeader = req.headers?.['user-agent'];
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;

  return {
    ipAddress: getClientIp(req),
    ...(userAgent ? { userAgent } : {}),
    ...(deviceId ? { deviceId } : {}),
  };
}
