import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-p6-deployment-identity.mjs', import.meta.url));

await test('fails when approved commit is missing', async () => {
  await withServer({ service: 'api', commit: 'abcdef1234567', environment: 'staging', builtAt: new Date().toISOString() }, ({ baseUrl }) => {
    const result = runChecker(['--strict', '--json'], { P6_API_URL: baseUrl, P6_ENVIRONMENT: 'staging' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).checks[0].reason, 'missing_approved_commit');
  });
});

await test('passes when commit, service, environment and build timestamp match', async () => {
  await withServer({ service: 'api', commit: 'abcdef1234567890', environment: 'staging', builtAt: '2026-07-15T10:00:00.000Z' }, ({ baseUrl }) => {
    const result = runChecker(['--strict', '--json'], {
      P6_API_URL: baseUrl,
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'staging',
    });
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).ready, true);
  });
});

await test('fails on commit mismatch without printing either commit value', async () => {
  await withServer({ service: 'api', commit: '1111111111111111', environment: 'staging', builtAt: '2026-07-15T10:00:00.000Z' }, ({ baseUrl }) => {
    const result = runChecker(['--strict', '--json'], {
      P6_API_URL: baseUrl,
      P6_APPROVED_COMMIT_SHA: '2222222',
      P6_ENVIRONMENT: 'staging',
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout.includes('1111111111111111'), false);
    assert.equal(result.stdout.includes('2222222'), false);
    assert.equal(JSON.parse(result.stdout).checks.find((check) => check.name === 'commit').reason, 'commit_mismatch');
  });
});

await test('fails on environment mismatch and invalid build timestamp', async () => {
  await withServer({ service: 'api', commit: 'abcdef1234567', environment: 'development', builtAt: 'unknown' }, ({ baseUrl }) => {
    const result = runChecker(['--strict', '--json'], {
      P6_API_URL: baseUrl,
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
      P6_ENVIRONMENT: 'production',
    });
    const report = JSON.parse(result.stdout);
    assert.equal(result.status, 1);
    assert.equal(report.checks.find((check) => check.name === 'environment').reason, 'environment_mismatch');
    assert.equal(report.checks.find((check) => check.name === 'built-at').reason, 'invalid_built_at');
  });
});

await test('blocks redirects and does not follow them', async () => {
  const target = createServer((request, response) => response.end('unexpected'));
  await listen(target);
  const source = createServer((request, response) => {
    response.writeHead(302, { location: `http://127.0.0.1:${target.address().port}/version` });
    response.end();
  });
  await listen(source);
  try {
    const result = runChecker(['--strict', '--json'], {
      P6_API_URL: `http://127.0.0.1:${source.address().port}`,
      P6_APPROVED_COMMIT_SHA: 'abcdef1',
    });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).checks[0].reason, 'redirect_blocked');
  } finally {
    source.close();
    target.close();
  }
});

function runChecker(args, overrides = {}) {
  const env = { ...process.env };
  for (const name of ['P6_API_URL', 'P6_APPROVED_COMMIT_SHA', 'P6_ENVIRONMENT', 'P6_CONNECTIVITY_TIMEOUT_MS']) delete env[name];
  Object.assign(env, overrides);
  const result = spawnSync(process.execPath, [checker, ...args], { cwd: process.cwd(), env, encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  return result;
}

async function withServer(payload, callback) {
  const server = createServer((request, response) => {
    if (request.url !== '/version') {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  });
  await listen(server);
  try {
    await callback({ baseUrl: `http://127.0.0.1:${server.address().port}` });
  } finally {
    server.close();
  }
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}
