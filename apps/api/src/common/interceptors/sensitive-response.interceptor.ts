import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

const SENSITIVE_RESPONSE_FIELDS = new Set([
  'password',
  'passwordHash',
  'secret',
  'secretHash',
  'accessToken',
  'refreshToken',
  'twoFactorSecret',
  'otp',
  'otpCode',
  'recoveryCodes',
  'storageKey',
  'privateUrl',
]);

export function sanitizeApiResponse(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeApiResponse(entry, seen));
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (SENSITIVE_RESPONSE_FIELDS.has(key)) continue;
    result[key] = sanitizeApiResponse(entry, seen);
  }
  return result;
}

@Injectable()
export class SensitiveResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((value: unknown) => sanitizeApiResponse(value)));
  }
}
