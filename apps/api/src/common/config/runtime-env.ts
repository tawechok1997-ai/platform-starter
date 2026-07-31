const URL_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'MEMBER_WEB_URL',
  'ADMIN_WEB_URL',
  'API_PUBLIC_URL',
  'S3_ENDPOINT',
  'PASSWORD_RESET_DELIVERY_WEBHOOK_URL',
  'STORAGE_MALWARE_SCAN_URL',
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
  'STORAGE_MALWARE_SCAN_SECRET',
  'PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET',
  'S3_SECRET_ACCESS_KEY',
  'PROVIDER_SIMULATOR_SECRET',
] as const;
const BOOLEAN_KEYS = [
  'PASSWORD_RESET_DELIVERY_ENABLED',
  'PASSWORD_RESET_EXPOSE_TOKEN',
  'ENABLE_PROVIDER_SIMULATOR',
  'REAL_MONEY_PROVIDER_ENABLED',
  'EXTERNAL_PROVIDER_CALLBACK_ENABLED',
  'SEAMLESS_WALLET_ENABLED',
  'ALLOW_PLACEHOLDER_GAME_ASSETS',
  'S3_FORCE_PATH_STYLE',
] as const;

const REQUIRED_PRODUCTION_SECRETS = [
  'JWT_ACCESS_KEY',
  'TWO_FACTOR_ENCRYPTION_KEY',
  'GAME_CREDENTIAL_SECRET',
  'ANTIBOT_ENCRYPTION_KEY',
  'STORAGE_SIGNING_SECRET',
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
  const passwordResetDeliveryEnabled = readBoolean(env, 'PASSWORD_RESET_DELIVERY_ENABLED', failures, true);
  const simulatorEnabled = readBoolean(env, 'ENABLE_PROVIDER_SIMULATOR', failures, false);

  for (const key of BOOLEAN_KEYS) readBoolean(env, key, failures, false, true);

  for (const key of URL_KEYS) {
    const value = env[key]?.trim();
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (!parsed.protocol || !parsed.hostname) failures.push(`${key} must be an absolute URL`);
      if (
        production &&
        ['MEMBER_WEB_URL', 'ADMIN_WEB_URL', 'API_PUBLIC_URL'].includes(key) &&
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

  const storageDriver = env.STORAGE_DRIVER?.trim().toLowerCase() || 'local';
  if (!['local', 's3'].includes(storageDriver)) failures.push('STORAGE_DRIVER must be local or s3');
  if (storageDriver === 'local' && !env.STORAGE_LOCAL_ROOT?.trim()) {
    failures.push('STORAGE_LOCAL_ROOT is required when STORAGE_DRIVER=local');
  }
  if (storageDriver === 's3') {
    for (const key of ['S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const) {
      if (!env[key]?.trim()) failures.push(`${key} is required when STORAGE_DRIVER=s3`);
    }
  }

  if (production) {
    if (!env.DATABASE_URL?.trim()) failures.push('DATABASE_URL is required in production');
    if (!env.MEMBER_WEB_URL?.trim()) failures.push('MEMBER_WEB_URL is required in production');
    if (!env.ADMIN_WEB_URL?.trim()) failures.push('ADMIN_WEB_URL is required in production');
    if (simulatorEnabled && !env.API_PUBLIC_URL?.trim()) {
      failures.push('API_PUBLIC_URL is required when ENABLE_PROVIDER_SIMULATOR=true in production');
    }

    if (passwordResetDeliveryEnabled) {
      if (!env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL?.trim())
        failures.push('PASSWORD_RESET_DELIVERY_WEBHOOK_URL is required when password reset delivery is enabled');
      if (!env.PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET?.trim())
        failures.push('PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET is required when password reset delivery is enabled');
    }

    for (const key of REQUIRED_PRODUCTION_SECRETS) {
      if (!env[key]?.trim()) failures.push(`${key} is required in production`);
    }

    for (const key of SECRET_KEYS) {
      const value = env[key]?.trim();
      if (!value) continue;
      if (value.length < 32) failures.push(`${key} must contain at least 32 characters in production`);
      if (WEAK_SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
        failures.push(`${key} uses a known weak placeholder`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Runtime environment validation failed:\n- ${[...new Set(failures)].join('\n- ')}`);
  }
}

function readBoolean(
  env: NodeJS.ProcessEnv,
  key: string,
  failures: string[],
  fallback: boolean,
  validationOnly = false,
): boolean {
  const value = env[key]?.trim().toLowerCase();
  if (!value) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  failures.push(`${key} must be true or false`);
  return validationOnly ? fallback : false;
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
