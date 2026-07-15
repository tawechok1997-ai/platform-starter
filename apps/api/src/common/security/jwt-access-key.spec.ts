import { resolveJwtAccessKey } from './jwt-access-key';

describe('resolveJwtAccessKey', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtAccessKey = process.env.JWT_ACCESS_KEY;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtAccessKey === undefined) delete process.env.JWT_ACCESS_KEY;
    else process.env.JWT_ACCESS_KEY = originalJwtAccessKey;
  });

  it('uses the configured access key', () => {
    expect(resolveJwtAccessKey({ get: jest.fn(() => ' configured-key ') })).toBe('configured-key');
  });

  it('fails closed when the production key is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_ACCESS_KEY;

    expect(() => resolveJwtAccessKey({ get: jest.fn(() => undefined) })).toThrow(
      'JWT_ACCESS_KEY is required in production',
    );
  });
});
