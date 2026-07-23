export const ADMIN_REDACTED_VALUE = '[redacted]';

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
const SENSITIVE_KEY_SUFFIXES = [
  'password',
  'passcode',
  'otp',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'privatekey',
  'credential',
  'credentials',
  'signature',
  'signedurl',
  'presignedurl',
  'privateurl',
  'jwt',
] as const;

const SENSITIVE_QUERY_PATTERN = /([?&](?:password|passcode|pin|otp|token|access_token|accessToken|refresh_token|refreshToken|session_token|sessionToken|id_token|idToken|authorization|cookie|secret|client_secret|clientSecret|signing_secret|signingSecret|webhook_secret|webhookSecret|api_key|apiKey|private_key|privateKey|credential|signature|signed_url|signedUrl|presigned_url|presignedUrl|private_url|privateUrl|jwt)=)[^&#]*/gi;
const AUTH_SCHEME_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

export function normalizeAdminPayloadKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function isSensitiveAdminPayloadKey(key: string) {
  const normalized = normalizeAdminPayloadKey(key);
  return SENSITIVE_NORMALIZED_KEYS.has(normalized)
    || SENSITIVE_KEY_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function redactAdminPayloadString(value: string) {
  const redacted = value
    .replace(SENSITIVE_QUERY_PATTERN, `$1${ADMIN_REDACTED_VALUE}`)
    .replace(AUTH_SCHEME_PATTERN, `$1 ${ADMIN_REDACTED_VALUE}`)
    .replace(JWT_PATTERN, ADMIN_REDACTED_VALUE);
  return redacted.length > MAX_STRING_LENGTH
    ? `${redacted.slice(0, MAX_STRING_LENGTH)}…[truncated]`
    : redacted;
}

export function redactAdminPayload(
  value: unknown,
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return redactAdminPayloadString(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactAdminPayloadString(value.message),
    };
  }
  if (typeof value !== 'object') return String(value);
  if (depth >= MAX_DEPTH) return '[max-depth]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactAdminPayload(item, seen, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[${value.length - MAX_ARRAY_ITEMS} more items]`);
    return items;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, unknown> = {};
  for (const [key, nested] of entries.slice(0, MAX_OBJECT_KEYS)) {
    result[key] = isSensitiveAdminPayloadKey(key)
      ? ADMIN_REDACTED_VALUE
      : redactAdminPayload(nested, seen, depth + 1);
  }
  if (entries.length > MAX_OBJECT_KEYS) result['[truncated]'] = `${entries.length - MAX_OBJECT_KEYS} more keys`;
  return result;
}

export function stringifyAdminPayload(value: unknown, spacing = 2) {
  return JSON.stringify(redactAdminPayload(value ?? {}), null, spacing);
}
