import { validateRuntimeEnvironment } from './runtime-env';

describe('validateRuntimeEnvironment', () => {
  const productionSecrets = {
    JWT_ACCESS_KEY: 'a'.repeat(48),
    TWO_FACTOR_ENCRYPTION_KEY: 'b'.repeat(48),
    GAME_CREDENTIAL_SECRET: 'c'.repeat(48),
    ANTIBOT_ENCRYPTION_KEY: 'd'.repeat(48),
    STORAGE_SIGNING_SECRET: 'e'.repeat(48),
    PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET: 'f'.repeat(48),
    PASSWORD_RESET_DELIVERY_WEBHOOK_URL: 'https://delivery.example.test/password-reset',
    STORAGE_DRIVER: 'local',
    STORAGE_LOCAL_ROOT: '/var/lib/platform/object-storage',
  };

  it('accepts a minimal development environment', () => {
    expect(() => validateRuntimeEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('rejects malformed URLs and numeric configuration', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'development',
        MEMBER_WEB_URL: 'not-a-url',
        TRUSTED_PROXY_HOPS: '-1',
        RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE: '0',
      }),
    ).toThrow(/MEMBER_WEB_URL|TRUSTED_PROXY_HOPS|RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE/);
  });

  it('rejects invalid boolean flags', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'development',
        PASSWORD_RESET_DELIVERY_ENABLED: 'sometimes',
        ENABLE_PROVIDER_SIMULATOR: 'occasionally',
      }),
    ).toThrow(/PASSWORD_RESET_DELIVERY_ENABLED|ENABLE_PROVIDER_SIMULATOR/);
  });

  it('requires public production web URLs to use https and rejects weak secrets', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'http://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        JWT_SECRET: 'changeme',
        STORAGE_DRIVER: 'local',
      }),
    ).toThrow(/https|JWT_SECRET|STORAGE_LOCAL_ROOT/);
  });

  it('accepts trusted internal http service URLs in production', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'http://web-member.railway.internal:3000',
        ADMIN_WEB_URL: 'http://web-admin.railway.internal:3001',
        ...productionSecrets,
      }),
    ).not.toThrow();
  });

  it('accepts production with password reset delivery explicitly disabled', () => {
    const {
      PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET: _secret,
      PASSWORD_RESET_DELIVERY_WEBHOOK_URL: _url,
      ...requiredSecrets
    } = productionSecrets;

    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'https://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        PASSWORD_RESET_DELIVERY_ENABLED: 'false',
        ...requiredSecrets,
      }),
    ).not.toThrow();
  });

  it('still requires password reset webhook configuration when delivery is enabled', () => {
    const {
      PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET: _secret,
      PASSWORD_RESET_DELIVERY_WEBHOOK_URL: _url,
      ...requiredSecrets
    } = productionSecrets;

    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'https://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        PASSWORD_RESET_DELIVERY_ENABLED: 'true',
        ...requiredSecrets,
      }),
    ).toThrow(/PASSWORD_RESET_DELIVERY_WEBHOOK_URL|PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET/);
  });

  it('requires API_PUBLIC_URL when simulator is enabled in production', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'https://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        ENABLE_PROVIDER_SIMULATOR: 'true',
        ...productionSecrets,
      }),
    ).toThrow(/API_PUBLIC_URL/);
  });

  it('requires complete S3 configuration when selected', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'development',
        STORAGE_DRIVER: 's3',
        S3_ENDPOINT: 'https://storage.example.test',
      }),
    ).toThrow(/S3_REGION|S3_BUCKET|S3_ACCESS_KEY_ID|S3_SECRET_ACCESS_KEY/);
  });

  it('accepts a valid production baseline', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'https://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        ...productionSecrets,
        TRUSTED_PROXY_HOPS: '1',
        RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE: '10',
      }),
    ).not.toThrow();
  });
});
