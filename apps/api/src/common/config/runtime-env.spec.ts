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

  it('rejects an invalid password reset delivery flag', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'development',
        PASSWORD_RESET_DELIVERY_ENABLED: 'sometimes',
      }),
    ).toThrow(/PASSWORD_RESET_DELIVERY_ENABLED/);
  });

  it('requires public production web URLs to use https and rejects weak secrets', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db.example.test/app',
        MEMBER_WEB_URL: 'http://member.example.test',
        ADMIN_WEB_URL: 'https://admin.example.test',
        JWT_SECRET: 'changeme',
      }),
    ).toThrow(/https|JWT_SECRET/);
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
