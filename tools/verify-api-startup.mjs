import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const apiRoot = join(root, 'apps/api');
const port = Number(process.env.API_STARTUP_TEST_PORT ?? 4187);
const timeoutMs = Number(process.env.API_STARTUP_TEST_TIMEOUT_MS ?? 30_000);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const baseUrl = `http://127.0.0.1:${port}`;
const output = [];

const child = spawn(process.execPath, ['dist/main.js'], {
  cwd: apiRoot,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    API_PORT: String(port),
    MEMBER_WEB_URL: process.env.MEMBER_WEB_URL ?? 'http://localhost:3000',
    ADMIN_WEB_URL: process.env.ADMIN_WEB_URL ?? 'http://localhost:3001',
    API_PUBLIC_URL: process.env.API_PUBLIC_URL ?? baseUrl,
    PRIVATE_MEDIA_DIR: process.env.PRIVATE_MEDIA_DIR ?? '/tmp/platform-startup-private-media',
    STORAGE_DRIVER: 'local',
    STORAGE_LOCAL_ROOT: process.env.STORAGE_LOCAL_ROOT ?? '/tmp/platform-startup-object-storage',
    PASSWORD_RESET_DELIVERY_ENABLED: 'false',
    ENABLE_PROVIDER_SIMULATOR: 'false',
    GIT_COMMIT_SHA: commit,
    APP_VERSION: process.env.APP_VERSION ?? 'startup-verification',
    BUILT_AT: process.env.BUILT_AT ?? new Date().toISOString(),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

for (const stream of [child.stdout, child.stderr]) {
  stream?.on('data', (chunk) => {
    const text = String(chunk);
    output.push(text);
    if (output.join('').length > 100_000) output.shift();
  });
}

let exited = false;
child.once('exit', () => {
  exited = true;
});

async function readJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function waitForStartup() {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    if (exited) throw new Error('API process exited before startup verification completed');
    try {
      const health = await readJson('/health');
      const version = await readJson('/version');
      if (health?.status !== 'ok') throw new Error(`/health reported ${health?.status ?? 'unknown'}`);
      if (version?.commit !== commit) throw new Error(`/version commit ${version?.commit ?? 'unknown'} != ${commit}`);
      return { health, version };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error(`API did not become ready within ${timeoutMs}ms`);
}

try {
  const result = await waitForStartup();
  console.log('API startup verification passed');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('API startup verification failed');
  console.error(error);
  console.error('\nCaptured API output:\n' + output.join('').slice(-20_000));
  process.exitCode = 1;
} finally {
  if (!exited) {
    child.kill('SIGTERM');
    await Promise.race([
      once(child, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]);
  }
  if (!exited) child.kill('SIGKILL');
}
