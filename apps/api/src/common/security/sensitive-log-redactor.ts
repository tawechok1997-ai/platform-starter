const REDACTED = '[redacted]';

const SENSITIVE_KEY_PATTERN = /(?:^|_)(?:password|passcode|pin|otp|token|accessToken|refreshToken|authorization|cookie|secret|apiKey|privateUrl|signedUrl)(?:$|_)/i;
const SENSITIVE_QUERY_PATTERN = /([?&](?:password|passcode|pin|otp|token|accessToken|refreshToken|authorization|cookie|secret|apiKey|privateUrl|signedUrl)=)[^&#]*/gi;

export function redactSensitiveUrl(value: unknown): string {
  return String(value ?? '').replace(SENSITIVE_QUERY_PATTERN, `$1${REDACTED}`);
}

export function redactSensitiveValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return redactSensitiveUrl(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveUrl(value.message),
    };
  }
  if (Array.isArray(value)) return value.map((item) => redactSensitiveValue(item, seen));
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(source).map(([key, nested]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactSensitiveValue(nested, seen),
    ]),
  );
}

export function toSafeLogRecord(record: Record<string, unknown>): Record<string, unknown> {
  return redactSensitiveValue(record) as Record<string, unknown>;
}
