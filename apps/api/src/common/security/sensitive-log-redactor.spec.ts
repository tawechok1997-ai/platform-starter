import { isSensitiveLogKey, redactSensitiveUrl, redactSensitiveValue, toSafeLogRecord } from './sensitive-log-redactor';

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

  it('recognizes provider credential and transport keys without hiding safe identifiers', () => {
    for (const key of ['authorization', 'x-api-key', 'client_secret', 'privateKey', 'set-cookie', 'signature', 'credentials']) {
      expect(isSensitiveLogKey(key)).toBe(true);
    }
    for (const key of ['providerTransactionId', 'idempotencyKey', 'sessionId', 'gameCode', 'x-request-id']) {
      expect(isSensitiveLogKey(key)).toBe(false);
    }
  });

  it('redacts nested provider request and response fixtures', () => {
    const output = JSON.stringify(toSafeLogRecord({
      provider: 'ACME-GAMES',
      providerTransactionId: 'provider-tx-123',
      idempotencyKey: 'idem-safe-456',
      sessionId: 'session-safe-789',
      headers: {
        Authorization: 'Bearer provider-access-secret',
        'x-api-key': 'provider-api-secret',
        Cookie: 'sid=provider-cookie-secret',
        'x-request-id': 'request-safe-123',
      },
      request: {
        client_secret: 'client-secret-value',
        access_token: 'access-token-value',
        otp: '123456',
        signature: 'provider-signature-value',
        callbackUrl: 'https://provider.example/callback?token=query-secret&state=safe-state',
        gameCode: 'GAME-SAFE-01',
      },
      response: {
        setCookie: 'provider-response-cookie',
        refreshToken: 'refresh-secret-value',
        redirectUrl: 'https://member.example/return?signedUrl=private-link&result=ok',
        nested: {
          credentials: {
            username: 'provider-user',
            privateKey: '-----BEGIN PRIVATE KEY-----secret',
          },
          message: 'request failed with Bearer inline-token-secret',
        },
      },
    }));

    for (const secret of [
      'provider-access-secret',
      'provider-api-secret',
      'provider-cookie-secret',
      'client-secret-value',
      'access-token-value',
      '123456',
      'provider-signature-value',
      'query-secret',
      'provider-response-cookie',
      'refresh-secret-value',
      'private-link',
      'inline-token-secret',
      'BEGIN PRIVATE KEY',
    ]) {
      expect(output).not.toContain(secret);
    }

    for (const safeValue of ['provider-tx-123', 'idem-safe-456', 'session-safe-789', 'request-safe-123', 'GAME-SAFE-01', 'safe-state']) {
      expect(output).toContain(safeValue);
    }
  });

  it('redacts authorization schemes and JWTs inside arbitrary log strings', () => {
    const jwt = 'eyJabcdefghijk.eyJabcdefghijk.abcdefghijk';
    const output = redactSensitiveUrl(`Bearer abc.def.ghi ${jwt} /x?otp=999999&state=ok`);
    expect(output).not.toContain('abc.def.ghi');
    expect(output).not.toContain(jwt);
    expect(output).not.toContain('999999');
    expect(output).toContain('state=ok');
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

  it('bounds oversized arrays, objects and strings', () => {
    const output = redactSensitiveValue({
      items: Array.from({ length: 105 }, (_, index) => index),
      text: 'x'.repeat(5_100),
      object: Object.fromEntries(Array.from({ length: 105 }, (_, index) => [`key${index}`, index])),
    }) as Record<string, any>;

    expect(output.items).toHaveLength(101);
    expect(output.items[100]).toBe('[5 more items]');
    expect(output.text.endsWith('…[truncated]')).toBe(true);
    expect(output.object['[truncated]']).toBe('5 more keys');
  });
});
