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

const ROUTE_RESPONSE_FIELDS: Array<{ method: string; path: RegExp; fields: string[] }> = [
  { method: 'POST', path: /^\/member\/auth\/(?:login|register|refresh)$/, fields: ['accessToken', 'refreshToken'] },
  { method: 'POST', path: /^\/admin\/auth\/(?:login|2fa\/verify|refresh)$/, fields: ['accessToken'] },
  { method: 'POST', path: /^\/admin\/auth\/2fa\/setup$/, fields: ['secret'] },
  {
    method: 'POST',
    path: /^\/admin\/auth\/(?:2fa\/enable|2fa\/recovery-codes\/regenerate)$/,
    fields: ['recoveryCodes'],
  },
  { method: 'POST', path: /^\/admin\/settings\/cms-assets$/, fields: ['storageKey'] },
];

export function sanitizeApiResponse(
  value: unknown,
  allowedFields = new Set<string>(),
  seen = new WeakSet<object>(),
): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeApiResponse(entry, allowedFields, seen));
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (SENSITIVE_RESPONSE_FIELDS.has(key) && !allowedFields.has(key)) continue;
    result[key] = sanitizeApiResponse(entry, allowedFields, seen);
  }
  return result;
}

@Injectable()
export class SensitiveResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const method = String(request?.method ?? '').toUpperCase();
    const path = String(request?.originalUrl ?? request?.url ?? '').split('?')[0];
    const allowedFields = new Set(
      ROUTE_RESPONSE_FIELDS.filter((rule) => rule.method === method && rule.path.test(path)).flatMap(
        (rule) => rule.fields,
      ),
    );
    return next.handle().pipe(map((value: unknown) => sanitizeApiResponse(value, allowedFields)));
  }
}
