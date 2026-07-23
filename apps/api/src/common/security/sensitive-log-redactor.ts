const REDACTED = '[redacted]';
const MAX_DEPTH = 12;
const MAX_ARRAY_ITEMS = 100;
const MAX_OBJECT_KEYS = 100;
const MAX_STRING_LENGTH = 5_000;

const SENSITIVE_NORMALIZED_KEYS = new Set([
  'password',
  'passcode',
  'pin',
  'otp',
  'token',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'idtoken',
  'authorization',
  'proxyauthorization',
  'cookie',
  'setcookie',
  'secret',
  'clientsecret',
  'signingsecret',
  'webhooksecret',
  'apikey',
  'privatekey',
  'credential',
  'credentials',
  'signature',
  'signedurl',
  'presignedurl',
  'privateurl',
  'jwt',
]);

const SENSITIVE_QUERY_PATTERN = /([?&](?:password|passcode|pin|otp|token|access_token|accessToken|refresh_token|refreshToken|session_token|sessionToken|id_token|idToken|authorization|cookie|secret|client_secret|clientSecret|signing_secret|signingSecret|webhook_secret|webhookSecret|api_key|apiKey|private_key|privateKey|credential|signature|signed_url|signedUrl|presigned_url|presignedUrl|private_url|privateUrl|jwt)=)[^&#]*/gi;
const AUTH_SCHEME_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

function normalizeSensitiveKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function isSensitiveLogKey(key: string): boolean {
  return SENSITIVE_NORMALIZED_KEYS.has(normalizeSensitiveKey(key));
}

export function redactSensitiveUrl(value: unknown): string {
  const redacted = String(value ?? '')
    .replace(SENSITIVE_QUERY_PATTERN, `$1${REDACTED}`)
    .replace(AUTH_SCHEME_PATTERN, `$1 ${REDACTED}`)
    .replace(JWT_PATTERN, REDACTED);
  return redacted.length > MAX_STRING_LENGTH
    ? `${redacted.slice(0, MAX_STRING_LENGTH)}…[truncated]`
    : redacted;
}

export function redactSensitiveValue(
  value: unknown,
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return redactSensitiveUrl(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveUrl(value.message),
    };
  }
  if (typeof value !== 'object') return String(value);
  if (depth >= MAX_DEPTH) return '[max-depth]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactSensitiveValue(item, seen, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[${value.length - MAX_ARRAY_ITEMS} more items]`);
    return items;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, unknown> = {};
  for (const [key, nested] of entries.slice(0, MAX_OBJECT_KEYS)) {
    result[key] = isSensitiveLogKey(key)
      ? REDACTED
      : redactSensitiveValue(nested, seen, depth + 1);
  }
  if (entries.length > MAX_OBJECT_KEYS) result['[truncated]'] = `${entries.length - MAX_OBJECT_KEYS} more keys`;
  return result;
}

export function toSafeLogRecord(record: Record<string, unknown>): Record<string, unknown> {
  return redactSensitiveValue(record) as Record<string, unknown>;
}
