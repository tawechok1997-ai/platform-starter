import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-p6-connectivity.mjs', import.meta.url));
const p6Names = ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_CONNECTIVITY_TIMEOUT_MS'];

test('reports all services ready for successful local endpoints', async () => {
  await withServer((req, res) => {
    res.writeHead(200, { 'content-type': req.url === '/health' ? 'application/json' : 'text/html' });
    res.end(req.url === '/health' ? '{"ok":true}' : '<html></html>');
  }, async (origin) => {
    const result = await runChecker(['--strict', '--json'], completeEnv(origin));
    assert.equal(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ready, true);
    assert.deepEqual(report.services.map(({ name, ok }) => ({ name, ok })), [
      { name: 'api', ok: true },
      { name: 'admin', ok: true },
      { name: 'member', ok: true },
    ]);
  });
});

test('strict mode fails on unhealthy status without leaking URLs', async () => {
  await withServer((_req, res) => {
    res.writeHead(500);
    res.end('failure');
  }, async (origin) => {
    const env = completeEnv(origin);
    const result = await runChecker(['--strict', '--json'], env);
    assert.equal(result.status, 1);
    assert.equal(result.stdout.includes(origin), false);
    const report = JSON.parse(result.stdout);
    assert.equal(report.services.every((service) => service.reason === 'unhealthy-status'), true);
  });
});

test('blocks cross-origin redirects and does not follow them', async () => {
  let redirectedRequests = 0;
  await withServer((_req, res) => {
    redirectedRequests += 1;
    res.writeHead(200);
    res.end('unexpected');
  }, async (redirectOrigin) => {
    await withServer((_req, res) => {
      res.writeHead(302, { location: `${redirectOrigin}/capture` });
      res.end();
    }, async (origin) => {
      const result = await runChecker(['--json'], completeEnv(origin));
      const report = JSON.parse(result.stdout);
      assert.equal(report.ready, false);
      assert.equal(report.services.every((service) => service.reason === 'cross-origin-redirect'), true);
      assert.equal(redirectedRequests, 0);
    });
  });
});

test('reports timeout with bounded configurable timeout', async () => {
  await withServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(200);
      res.end('late');
    }, 2_000);
  }, async (origin) => {
    const result = await runChecker(['--strict', '--json'], {
      ...completeEnv(origin),
      P6_CONNECTIVITY_TIMEOUT_MS: '1000',
    });
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.timeoutMs, 1000);
    assert.equal(report.services.every((service) => service.reason === 'timeout'), true);
  });
});

test('reports missing URLs without making network requests', async () => {
  const result = await runChecker(['--strict', '--json']);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.services.every((service) => service.reason === 'missing-url'), true);
});

function completeEnv(origin) {
  return {
    P6_API_URL: `${origin}/api-base`,
    P6_ADMIN_URL: `${origin}/admin-base`,
    P6_MEMBER_URL: `${origin}/member-base`,
  };
}

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await callback(origin);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function runChecker(args, overrides = {}) {
  const env = { ...process.env };
  for (const name of p6Names) delete env[name];
  Object.assign(env, overrides);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [checker, ...args], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status) => {
      assert.equal(stderr, '');
      resolve({ status, stdout });
    });
  });
}
