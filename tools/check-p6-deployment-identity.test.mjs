import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-p6-deployment-identity.mjs', import.meta.url));
const commit = 'abcdef1234567890';
const builtAt = '2026-07-15T10:00:00.000Z';

await test('fails when approved commit is missing', async () => {
  await withIdentityServers({}, (env) => {
    const result = runChecker(['--strict', '--json'], env);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).services[0].reason, 'missing_approved_commit');
  });
});

await test('passes when API, Admin and Member identities match', async () => {
  await withIdentityServers({}, (env) => {
    const result = runChecker(['--strict', '--json'], {
      ...env,
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
  await withIdentityServers({ member: { commit: '1111111111111111' } }, (env) => {
    const result = runChecker(['--strict', '--json'], {
      ...env,
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

await test('fails on frontend service and environment mismatches', async () => {
  await withIdentityServers({ admin: { service: 'wrong-admin' }, member: { environment: 'development' } }, (env) => {
    const result = runChecker(['--strict', '--json'], {
      ...env,
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'production',
    });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 1);
    assert.equal(report.services.find((service) => service.name === 'admin').reason, 'unexpected_service');
    assert.equal(report.services.find((service) => service.name === 'member').reason, 'environment_mismatch');
  });
});

await test('blocks redirects for every identity endpoint', async () => {
  await withIdentityServers({ api: { redirect: true }, admin: { redirect: true }, member: { redirect: true } }, (env) => {
    const result = runChecker(['--strict', '--json'], { ...env, P6_APPROVED_COMMIT_SHA: 'abcdef1' });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 1);
    assert.equal(report.services.every((service) => service.reason === 'redirect_blocked'), true);
  });
});

function runChecker(args, overrides = {}) {
  const env = { ...process.env };
  for (const name of ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_APPROVED_COMMIT_SHA', 'P6_ENVIRONMENT', 'P6_CONNECTIVITY_TIMEOUT_MS']) delete env[name];
  Object.assign(env, overrides);
  const result = spawnSync(process.execPath, [checker, ...args], { cwd: process.cwd(), env, encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  return result;
}

async function withIdentityServers(overrides, callback) {
  const defaults = {
    api: { service: 'api', commit, environment: 'staging', builtAt },
    admin: { service: 'web-admin', commit, environment: 'staging', builtAt },
    member: { service: 'web-member', commit, environment: 'staging', builtAt },
  };
  const servers = {};
  const urls = {};

  try {
    for (const name of Object.keys(defaults)) {
      const config = { ...defaults[name], ...(overrides[name] ?? {}) };
      const expectedPath = name === 'api' ? '/version' : '/api/version';
      const server = createServer((request, response) => {
        if (request.url !== expectedPath) return response.writeHead(404).end();
        if (config.redirect) {
          response.writeHead(302, { location: 'https://example.invalid/version' });
          return response.end();
        }
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(config));
      });
      await listen(server);
      servers[name] = server;
      urls[name] = `http://127.0.0.1:${server.address().port}`;
    }

    await callback({ P6_API_URL: urls.api, P6_ADMIN_URL: urls.admin, P6_MEMBER_URL: urls.member });
  } finally {
    for (const server of Object.values(servers)) server.close();
  }
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}
