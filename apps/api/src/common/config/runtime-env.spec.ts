import { validateRuntimeEnvironment } from './runtime-env';

describe('validateRuntimeEnvironment', () => {
  it('accepts a minimal development environment', () => {
    expect(() => validateRuntimeEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('rejects malformed URLs and numeric configuration', () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: 'development',
      MEMBER_WEB_URL: 'not-a-url',
      TRUSTED_PROXY_HOPS: '-1',
      RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE: '0',
    })).toThrow(/MEMBER_WEB_URL|TRUSTED_PROXY_HOPS|RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE/);
  });

  it('requires public production web URLs to use https and rejects weak secrets', () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db.example.test/app',
      MEMBER_WEB_URL: 'http://member.example.test',
      ADMIN_WEB_URL: 'https://admin.example.test',
      JWT_SECRET: 'changeme',
    })).toThrow(/https|JWT_SECRET/);
  });

  it('accepts trusted internal http service URLs in production', () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db.example.test/app',
      MEMBER_WEB_URL: 'http://web-member.railway.internal:3000',
      ADMIN_WEB_URL: 'http://web-admin.railway.internal:3001',
      JWT_SECRET: 'a'.repeat(48),
    })).not.toThrow();
  });

  it('accepts a valid production baseline', () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db.example.test/app',
      MEMBER_WEB_URL: 'https://member.example.test',
      ADMIN_WEB_URL: 'https://admin.example.test',
      JWT_SECRET: 'a'.repeat(48),
      TRUSTED_PROXY_HOPS: '1',
      RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE: '10',
    })).not.toThrow();
  });
});
