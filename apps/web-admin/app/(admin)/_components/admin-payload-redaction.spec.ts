import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_REDACTED_VALUE,
  isSensitiveAdminPayloadKey,
  redactAdminPayload,
  redactAdminPayloadString,
  stringifyAdminPayload,
} from './admin-payload-redaction';

const fixtureValue = (...parts: string[]) => parts.join('-');
const clientSecretFixture = fixtureValue('client', 'fixture', 'value');
const privateKeyFixture = ['-----BEGIN', 'PRIVATE', 'KEY-----', 'fixture'].join(' ');

const providerFixture = {
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
    client_secret: clientSecretFixture,
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
        privateKey: privateKeyFixture,
      },
      message: 'request failed with Bearer inline-token-secret',
    },
  },
};

test('recognizes provider credential and transport keys without hiding safe identifiers', () => {
  for (const key of ['authorization', 'x-api-key', 'client_secret', 'privateKey', 'set-cookie', 'signature', 'credentials']) {
    assert.equal(isSensitiveAdminPayloadKey(key), true, key);
  }
  for (const key of ['providerTransactionId', 'idempotencyKey', 'sessionId', 'gameCode', 'x-request-id']) {
    assert.equal(isSensitiveAdminPayloadKey(key), false, key);
  }
});

test('redacts nested provider request and response fixtures', () => {
  const output = stringifyAdminPayload(providerFixture);

  for (const secret of [
    'provider-access-secret',
    'provider-api-secret',
    'provider-cookie-secret',
    clientSecretFixture,
    'access-token-value',
    '123456',
    'provider-signature-value',
    'query-secret',
    'provider-response-cookie',
    'refresh-secret-value',
    'private-link',
    'inline-token-secret',
    privateKeyFixture,
  ]) {
    assert.equal(output.includes(secret), false, secret);
  }

  for (const safeValue of ['provider-tx-123', 'idem-safe-456', 'session-safe-789', 'request-safe-123', 'GAME-SAFE-01', 'safe-state']) {
    assert.equal(output.includes(safeValue), true, safeValue);
  }
  assert.equal(output.includes(ADMIN_REDACTED_VALUE), true);
});

test('redacts authorization schemes, JWTs and sensitive URL parameters inside strings', () => {
  const jwt = 'eyJabcdefghijk.eyJabcdefghijk.abcdefghijk';
  const output = redactAdminPayloadString(`Bearer abc.def.ghi ${jwt} /x?otp=999999&state=ok`);
  assert.equal(output.includes('abc.def.ghi'), false);
  assert.equal(output.includes(jwt), false);
  assert.equal(output.includes('999999'), false);
  assert.equal(output.includes('state=ok'), true);
});

test('handles circular provider payloads safely', () => {
  const payload: Record<string, unknown> = { providerTransactionId: 'tx-safe' };
  payload.self = payload;
  assert.deepEqual(redactAdminPayload(payload), {
    providerTransactionId: 'tx-safe',
    self: '[circular]',
  });
});

test('bounds oversized arrays, objects and strings for the technical viewer', () => {
  const output = redactAdminPayload({
    items: Array.from({ length: 105 }, (_, index) => index),
    text: 'x'.repeat(5_100),
    object: Object.fromEntries(Array.from({ length: 105 }, (_, index) => [`key${index}`, index])),
  }) as Record<string, any>;

  assert.equal(output.items.length, 101);
  assert.equal(output.items[100], '[5 more items]');
  assert.equal(output.text.endsWith('…[truncated]'), true);
  assert.equal(output.object['[truncated]'], '5 more keys');
});
