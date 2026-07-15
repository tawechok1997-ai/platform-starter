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

  it('requires production URLs and rejects weak secrets', () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db.example.test/app',
      MEMBER_WEB_URL: 'http://member.example.test',
      ADMIN_WEB_URL: 'https://admin.example.test',
      JWT_SECRET: 'changeme',
    })).toThrow(/https|JWT_SECRET/);
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
