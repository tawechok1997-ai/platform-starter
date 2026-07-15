const URL_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'MEMBER_WEB_URL',
  'ADMIN_WEB_URL',
  'PASSWORD_RESET_DELIVERY_WEBHOOK_URL',
] as const;
const SECRET_KEYS = [
  'JWT_ACCESS_KEY',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'MEMBER_JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ADMIN_REFRESH_TOKEN_SECRET',
  'MEMBER_REFRESH_TOKEN_SECRET',
  'ENCRYPTION_KEY',
  'TWO_FACTOR_ENCRYPTION_KEY',
  'GAME_CREDENTIAL_SECRET',
  'ANTIBOT_ENCRYPTION_KEY',
  'STORAGE_SIGNING_SECRET',
  'PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET',
] as const;

const REQUIRED_PRODUCTION_SECRETS = [
  'JWT_ACCESS_KEY',
  'TWO_FACTOR_ENCRYPTION_KEY',
  'GAME_CREDENTIAL_SECRET',
  'ANTIBOT_ENCRYPTION_KEY',
  'STORAGE_SIGNING_SECRET',
  'PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET',
] as const;

const WEAK_SECRET_PATTERNS = [
  /^changeme$/i,
  /^change-me$/i,
  /^secret$/i,
  /^password$/i,
  /^development$/i,
  /^test$/i,
  /^123456/,
];

export function validateRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const failures: string[] = [];
  const production = env.NODE_ENV === 'production';

  for (const key of URL_KEYS) {
    const value = env[key]?.trim();
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (!parsed.protocol || !parsed.hostname) failures.push(`${key} must be an absolute URL`);
      if (
        production &&
        (key === 'MEMBER_WEB_URL' || key === 'ADMIN_WEB_URL') &&
        parsed.protocol !== 'https:' &&
        !isTrustedInternalHttpUrl(parsed)
      ) {
        failures.push(`${key} must use https in production unless it targets a trusted internal service`);
      }
    } catch {
      failures.push(`${key} must be a valid absolute URL`);
    }
  }

  const proxyHops = env.TRUSTED_PROXY_HOPS?.trim();
  if (proxyHops && (!Number.isInteger(Number(proxyHops)) || Number(proxyHops) < 0)) {
    failures.push('TRUSTED_PROXY_HOPS must be a non-negative integer');
  }

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('RATE_LIMIT_') || !value?.trim()) continue;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) failures.push(`${key} must be a positive integer`);
  }

  if (production) {
    if (!env.DATABASE_URL?.trim()) failures.push('DATABASE_URL is required in production');
    if (!env.MEMBER_WEB_URL?.trim()) failures.push('MEMBER_WEB_URL is required in production');
    if (!env.ADMIN_WEB_URL?.trim()) failures.push('ADMIN_WEB_URL is required in production');
    if (!env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL?.trim())
      failures.push('PASSWORD_RESET_DELIVERY_WEBHOOK_URL is required in production');

    for (const key of REQUIRED_PRODUCTION_SECRETS) {
      if (!env[key]?.trim()) failures.push(`${key} is required in production`);
    }

    for (const key of SECRET_KEYS) {
      const value = env[key]?.trim();
      if (!value) continue;
      if (value.length < 32) failures.push(`${key} must contain at least 32 characters in production`);
      if (WEAK_SECRET_PATTERNS.some((pattern) => pattern.test(value)))
        failures.push(`${key} uses a known weak placeholder`);
    }

    const localStorageRoot = env.STORAGE_LOCAL_ROOT?.trim();
    const storageDriver = env.STORAGE_DRIVER?.trim().toLowerCase();
    if (storageDriver === 'local' && !localStorageRoot)
      failures.push('STORAGE_LOCAL_ROOT is required when STORAGE_DRIVER=local');
  }

  if (failures.length > 0) {
    throw new Error(`Runtime environment validation failed:\n- ${failures.join('\n- ')}`);
  }
}

function isTrustedInternalHttpUrl(url: URL): boolean {
  if (url.protocol !== 'http:') return false;

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '::1' || hostname.endsWith('.localhost')) return true;
  if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(hostname)) return true;

  const private172 = /^172\.(\d{1,3})(?:\.\d{1,3}){2}$/.exec(hostname);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
}
