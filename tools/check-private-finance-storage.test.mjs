import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  missingPrivateStorageConfig,
  resolvePrivateStorageConfig,
  runPrivateStorageVerification,
} from './check-private-finance-storage.mjs';

const config = {
  apiUrl: 'https://api.example.test',
  adminAccessToken: 'admin-access-token-value',
  depositRequestId: '11111111-1111-4111-8111-111111111111',
  withdrawalRequestId: '22222222-2222-4222-8222-222222222222',
  timeoutMs: 5_000,
};

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function evidenceDataUrl(value) {
  return `data:image/png;base64,${Buffer.from(value, 'utf8').toString('base64')}`;
}

test('reports missing staged configuration without exposing values', () => {
  const resolved = resolvePrivateStorageConfig({ P6_API_URL: 'ftp://invalid', P6_ADMIN_ACCESS_TOKEN: '' });
  assert.deepEqual(missingPrivateStorageConfig(resolved), [
    'P6_API_URL',
    'P6_ADMIN_ACCESS_TOKEN',
    'P6_DEPOSIT_REQUEST_ID',
    'P6_WITHDRAWAL_REQUEST_ID',
  ]);
});

test('passes only when authorized reads work and anonymous or invalid tokens are rejected', async () => {
  const calls = [];
  const responses = [
    jsonResponse(200, { dataUrl: evidenceDataUrl('deposit-proof') }),
    jsonResponse(401, { code: 'UNAUTHORIZED' }),
    jsonResponse(401, { code: 'UNAUTHORIZED' }),
    jsonResponse(200, { dataUrl: evidenceDataUrl('withdrawal-proof'), transactionRef: 'safe-reference' }),
    jsonResponse(403, { code: 'FORBIDDEN' }),
    jsonResponse(401, { code: 'UNAUTHORIZED' }),
  ];
  const fetchImpl = async (url, init) => {
    calls.push({ url, authorization: init.headers.authorization ?? '' });
    return responses.shift();
  };

  const report = await runPrivateStorageVerification(config, { fetchImpl });

  assert.equal(report.ready, true);
  assert.equal(report.blocked, false);
  assert.equal(report.checks.length, 6);
  assert.equal(report.checks.every((check) => check.ok), true);
  assert.equal(calls[0].authorization, `Bearer ${config.adminAccessToken}`);
  assert.equal(calls[1].authorization, '');
  assert.equal(calls[2].authorization, 'Bearer invalid-private-storage-token');
  assert.equal(JSON.stringify(report).includes(config.adminAccessToken), false);
  assert.equal(JSON.stringify(report).includes(config.depositRequestId), false);
});

test('fails when an authorized response leaks a private key field', async () => {
  const responses = [
    jsonResponse(200, { dataUrl: evidenceDataUrl('deposit-proof'), storageKey: 'slips/private/file.png' }),
    jsonResponse(401, {}),
    jsonResponse(401, {}),
    jsonResponse(200, { dataUrl: evidenceDataUrl('withdrawal-proof') }),
    jsonResponse(401, {}),
    jsonResponse(401, {}),
  ];
  const report = await runPrivateStorageVerification(config, {
    fetchImpl: async () => responses.shift(),
  });

  assert.equal(report.ready, false);
  assert.equal(report.checks[0].ok, false);
  assert.match(report.checks[0].reason, /unsafe fields exposed/);
});

test('fails when evidence is not returned as a supported image Data URL', async () => {
  const responses = [
    jsonResponse(200, { dataUrl: 'https://storage.example.test/slips/private.png' }),
    jsonResponse(401, {}),
    jsonResponse(401, {}),
    jsonResponse(200, { dataUrl: evidenceDataUrl('withdrawal-proof') }),
    jsonResponse(401, {}),
    jsonResponse(401, {}),
  ];
  const report = await runPrivateStorageVerification(config, {
    fetchImpl: async () => responses.shift(),
  });

  assert.equal(report.ready, false);
  assert.equal(report.checks[0].ok, false);
  assert.equal(report.checks[0].reason, 'invalid evidence Data URL');
});
