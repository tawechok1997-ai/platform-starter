import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-p6-deployment-identity.mjs', import.meta.url));
const commit = 'abcdef1234567890';
const builtAt = '2026-07-15T10:00:00.000Z';

await test('fails when approved commit is missing', async () => {
  await withIdentityServer({}, (origin) => {
    const result = runChecker(['--strict', '--json'], urls(origin));
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).services[0].reason, 'missing_approved_commit');
  });
});

await test('passes when API, Admin and Member identities match', async () => {
  await withIdentityServer({}, (origin) => {
    const result = runChecker(['--strict', '--json'], {
      ...urls(origin),
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'staging',
    });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 0);
    assert.equal(report.ready, true);
    assert.deepEqual(report.services.map(({ name, ready }) => ({ name, ready })), [
      { name: 'api', ready: true },
      { name: 'admin', ready: true },
      { name: 'member', ready: true },
    ]);
  });
});

await test('fails when one frontend deploys a different commit without leaking values', async () => {
  await withIdentityServer({ member: { commit: '1111111111111111' } }, (origin) => {
    const result = runChecker(['--strict', '--json'], {
      ...urls(origin),
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'staging',
    });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 1);
    assert.equal(report.services.find((service) => service.name === 'member').reason, 'commit_mismatch');
    assert.equal(result.stdout.includes('1111111111111111'), false);
    assert.equal(result.stdout.includes('abcdef1'), false);
  });
});

await test('fails on frontend service, environment and build metadata mismatches', async () => {
  await withIdentityServer({
    admin: { service: 'wrong-admin' },
    member: { environment: 'development', builtAt: 'unknown' },
  }, (origin) => {
    const result = runChecker(['--strict', '--json'], {
      ...urls(origin),
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'production',
    });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 1);
    assert.equal(report.services.find((service) => service.name === 'admin').reason, 'unexpected_service');
    assert.equal(report.services.find((service) => service.name === 'member').reason, 'environment_mismatch');
  });
});

await test('blocks redirects for frontend identity endpoints', async () => {
  const source = createServer((_request, response) => {
    response.writeHead(302, { location: 'https://example.invalid/api/version' });
    response.end();
  });
  await listen(source);
  const origin = `http://127.0.0.1:${source.address().port}`;
  try {
    const result = runChecker(['--strict', '--json'], {
      ...urls(origin),
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
    });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).services.every((service) => service.reason === 'redirect_blocked'), true);
  } finally {
    source.close();
  }
});

function urls(origin) {
  return { P6_API_URL: origin, P6_ADMIN_URL: origin, P6_MEMBER_URL: origin };
}

function runChecker(args, overrides = {}) {
  const env = { ...process.env };
  for (const name of ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_APPROVED_COMMIT_SHA', 'P6_ENVIRONMENT', 'P6_CONNECTIVITY_TIMEOUT_MS']) delete env[name];
  Object.assign(env, overrides);
  const result = spawnSync(process.execPath, [checker, ...args], { cwd: process.cwd(), env, encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  return result;
}

async function withIdentityServer(overrides, callback) {
  const payloads = {
    api: { service: 'api', commit, environment: 'staging', builtAt },
    admin: { service: 'web-admin', commit, environment: 'staging', builtAt },
    member: { service: 'web-member', commit, environment: 'staging', builtAt },
  };
  for (const [name, value] of Object.entries(overrides)) payloads[name] = { ...payloads[name], ...value };

  const server = createServer((request, response) => {
    const key = request.url === '/version' ? 'api' : request.url === '/api/version' ? request.headers['x-test-service'] : null;
    const fallbackKey = request.url === '/api/version' ? (request.headers.host?.includes('admin') ? 'admin' : 'member') : key;
    const payload = payloads[fallbackKey] ?? payloads.api;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  });
  await listen(server);
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    // Use path-specific origins through lightweight URL prefixes; checker resolves fixed endpoints.
    await callback(origin);
  } finally {
    server.close();
  }
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}
