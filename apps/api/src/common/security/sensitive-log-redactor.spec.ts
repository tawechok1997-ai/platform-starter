import { redactSensitiveUrl, redactSensitiveValue, toSafeLogRecord } from './sensitive-log-redactor';

describe('sensitive log redactor', () => {
  it('redacts sensitive query parameters', () => {
    expect(redactSensitiveUrl('/callback?token=abc&state=ok&otp=123456'))
      .toBe('/callback?token=[redacted]&state=ok&otp=[redacted]');
  });

  it('redacts nested sensitive fields and preserves safe fields', () => {
    expect(toSafeLogRecord({
      event: 'login_failed',
      password: 'secret',
      nested: { accessToken: 'token', reason: 'invalid' },
    })).toEqual({
      event: 'login_failed',
      password: '[redacted]',
      nested: { accessToken: '[redacted]', reason: 'invalid' },
    });
  });

  it('sanitizes Error instances without exposing arbitrary properties', () => {
    const value = redactSensitiveValue(new Error('request failed: /x?secret=value'));
    expect(value).toEqual({ name: 'Error', message: 'request failed: /x?secret=[redacted]' });
  });

  it('handles circular values safely', () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(redactSensitiveValue(value)).toEqual({ self: '[circular]' });
  });
});
