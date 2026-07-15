import { redactSensitiveUrl, toSafeLogRecord } from '../security/sensitive-log-redactor';

type ActorType = 'ADMIN' | 'MEMBER' | 'SYSTEM' | 'ANONYMOUS';
type LogResult = 'success' | 'client_error' | 'server_error';

type StructuredLogInput = {
  level?: 'info' | 'warn' | 'error';
  event: string;
  requestId?: unknown;
  method?: unknown;
  path?: unknown;
  statusCode?: unknown;
  durationMs?: unknown;
  ip?: unknown;
  userAgent?: unknown;
  actor?: unknown;
  module?: unknown;
  action?: unknown;
  result?: unknown;
  extra?: Record<string, unknown>;
};

export function buildStructuredLogRecord(input: StructuredLogInput): Record<string, unknown> {
  const statusCode = numberOrNull(input.statusCode);
  const actor = actorFields(input.actor);
  const method = textOrNull(input.method)?.toUpperCase() ?? null;
  const path = redactSensitiveUrl(input.path ?? '');
  const moduleName = textOrNull(input.module) ?? inferModule(path);
  const action = textOrNull(input.action) ?? inferAction(method, path);
  const result = textOrNull(input.result) ?? inferResult(statusCode);

  return toSafeLogRecord({
    level: input.level ?? inferLevel(statusCode),
    event: input.event,
    requestId: textOrNull(input.requestId),
    actorId: actor.actorId,
    actorType: actor.actorType,
    module: moduleName,
    action,
    durationMs: numberOrNull(input.durationMs),
    result,
    method,
    path,
    statusCode,
    ip: textOrNull(input.ip),
    userAgent: textOrNull(input.userAgent),
    ...(input.extra ?? {}),
  });
}

export function inferModule(path: string): string {
  const cleanPath = stripQuery(path);
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments[0] === 'admin' && segments[1]) return `admin.${segments[1]}`;
  if (segments[0] === 'member' && segments[1]) return `member.${segments[1]}`;
  if (segments[0] === 'provider-webhooks') return 'provider.webhooks';
  if (segments[0] === 'auth') return 'member.auth';
  return segments[0] ?? 'root';
}

export function inferAction(method: string | null, path: string): string {
  const cleanPath = stripQuery(path);
  const segments = cleanPath.split('/').filter(Boolean).slice(0, 3);
  return [method ?? 'UNKNOWN', segments.join('.') || 'root'].join(' ');
}

function actorFields(actor: unknown): { actorId: string | null; actorType: ActorType } {
  if (!actor || typeof actor !== 'object') return { actorId: null, actorType: 'ANONYMOUS' };
  const source = actor as Record<string, unknown>;
  const actorType = source.type === 'ADMIN' || source.type === 'MEMBER' ? source.type : 'ANONYMOUS';
  return { actorId: textOrNull(source.id), actorType };
}

function inferLevel(statusCode: number | null) {
  if (statusCode != null && statusCode >= 500) return 'error';
  if (statusCode != null && statusCode >= 400) return 'warn';
  return 'info';
}

function inferResult(statusCode: number | null): LogResult {
  if (statusCode != null && statusCode >= 500) return 'server_error';
  if (statusCode != null && statusCode >= 400) return 'client_error';
  return 'success';
}

function stripQuery(path: string) {
  return String(path ?? '').split('?')[0];
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function numberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}
