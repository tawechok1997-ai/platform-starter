const URL_KEYS = ['DATABASE_URL', 'REDIS_URL', 'MEMBER_WEB_URL', 'ADMIN_WEB_URL'] as const;
const SECRET_KEYS = [
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'MEMBER_JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ADMIN_REFRESH_TOKEN_SECRET',
  'MEMBER_REFRESH_TOKEN_SECRET',
  'ENCRYPTION_KEY',
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
      if (production && (key === 'MEMBER_WEB_URL' || key === 'ADMIN_WEB_URL') && parsed.protocol !== 'https:') {
        failures.push(`${key} must use https in production`);
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

    for (const key of SECRET_KEYS) {
      const value = env[key]?.trim();
      if (!value) continue;
      if (value.length < 32) failures.push(`${key} must contain at least 32 characters in production`);
      if (WEAK_SECRET_PATTERNS.some((pattern) => pattern.test(value))) failures.push(`${key} uses a known weak placeholder`);
    }

    const localStorageRoot = env.STORAGE_LOCAL_ROOT?.trim();
    const storageDriver = env.STORAGE_DRIVER?.trim().toLowerCase();
    if (storageDriver === 'local' && !localStorageRoot) failures.push('STORAGE_LOCAL_ROOT is required when STORAGE_DRIVER=local');
  }

  if (failures.length > 0) {
    throw new Error(`Runtime environment validation failed:\n- ${failures.join('\n- ')}`);
  }
}
