const timeoutMs = parseTimeout(process.env.P6_CONNECTIVITY_TIMEOUT_MS);
const json = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const targets = [
  { name: 'api', env: 'P6_API_URL', path: '/health' },
  { name: 'admin', env: 'P6_ADMIN_URL', path: '/' },
  { name: 'member', env: 'P6_MEMBER_URL', path: '/' },
];

const results = [];
for (const target of targets) {
  results.push(await probe(target));
}

const report = {
  generatedAt: new Date().toISOString(),
  timeoutMs,
  ready: results.every((result) => result.ok),
  services: results,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('P6 connectivity preflight');
  for (const result of results) {
    const status = result.statusCode ? ` status=${result.statusCode}` : '';
    console.log(`  ${result.ok ? 'READY' : 'BLOCKED'} ${result.name}${status}${result.reason ? ` reason=${result.reason}` : ''}`);
  }
}

if (strict && !report.ready) process.exitCode = 1;

async function probe(target) {
  const raw = process.env[target.env]?.trim();
  if (!raw) return { name: target.name, ok: false, reason: 'missing-url' };

  let base;
  try {
    base = new URL(raw);
  } catch {
    return { name: target.name, ok: false, reason: 'invalid-url' };
  }

  const url = new URL(target.path, ensureTrailingSlash(base));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        accept: target.name === 'api' ? 'application/json' : 'text/html,application/xhtml+xml',
        'user-agent': 'platform-starter-p6-connectivity/1.0',
      },
    });

    if (isRedirect(response.status)) {
      const location = response.headers.get('location');
      if (!location) return { name: target.name, ok: false, statusCode: response.status, reason: 'redirect-without-location' };
      const redirectUrl = new URL(location, url);
      if (redirectUrl.origin !== url.origin) {
        return { name: target.name, ok: false, statusCode: response.status, reason: 'cross-origin-redirect' };
      }
      return { name: target.name, ok: false, statusCode: response.status, reason: 'redirect-not-followed' };
    }

    const ok = response.status >= 200 && response.status < 400;
    return {
      name: target.name,
      ok,
      statusCode: response.status,
      ...(ok ? {} : { reason: 'unhealthy-status' }),
    };
  } catch (error) {
    return {
      name: target.name,
      ok: false,
      reason: error?.name === 'AbortError' ? 'timeout' : 'connection-failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

function ensureTrailingSlash(url) {
  const copy = new URL(url);
  if (!copy.pathname.endsWith('/')) copy.pathname += '/';
  return copy;
}

function isRedirect(status) {
  return status >= 300 && status < 400;
}

function parseTimeout(raw) {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return 8_000;
  return Math.min(Math.max(parsed, 1_000), 30_000);
}
