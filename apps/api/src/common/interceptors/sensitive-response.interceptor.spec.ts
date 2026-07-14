import { sanitizeApiResponse } from './sensitive-response.interceptor';

describe('sanitizeApiResponse', () => {
  it('removes sensitive fields recursively while preserving safe data', () => {
    const input = {
      id: 'user-1',
      username: 'member',
      passwordHash: 'hash',
      twoFactorSecret: '2fa-secret',
      otpCode: '123456',
      recoveryCodes: ['code-1', 'code-2'],
      privateUrl: 'https://storage.example/private-object',
      profile: {
        email: 'member@example.com',
        refreshToken: 'secret-token',
        storageKey: 'private/path',
      },
      sessions: [{ id: 'session-1', accessToken: 'access', device: 'ios' }],
    };

    expect(sanitizeApiResponse(input)).toEqual({
      id: 'user-1',
      username: 'member',
      profile: { email: 'member@example.com' },
      sessions: [{ id: 'session-1', device: 'ios' }],
    });
  });

  it('handles circular objects without throwing', () => {
    const input: Record<string, unknown> = { id: 'item-1' };
    input.self = input;

    expect(sanitizeApiResponse(input)).toEqual({ id: 'item-1', self: '[Circular]' });
  });
});