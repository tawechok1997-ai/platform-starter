const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
const timeoutMs = boundedInteger(process.env.P6_CONNECTIVITY_TIMEOUT_MS, 8_000, 1_000, 30_000);
const approvedCommit = normalizeCommit(process.env.P6_APPROVED_COMMIT_SHA);
const expectedEnvironment = process.env.P6_ENVIRONMENT?.trim() || 'non-production';
const targets = [
  { name: 'api', env: 'P6_API_URL', path: '/version', expectedService: 'api' },
  { name: 'admin', env: 'P6_ADMIN_URL', path: '/api/version', expectedService: 'web-admin' },
  { name: 'member', env: 'P6_MEMBER_URL', path: '/api/version', expectedService: 'web-member' },
];

const report = { generatedAt: new Date().toISOString(), ready: false, services: [] };

if (!approvedCommit) {
  report.services.push({ name: 'approved-commit', ready: false, reason: 'missing_approved_commit' });
} else {
  for (const target of targets) report.services.push(await verifyTarget(target));
}

report.ready = report.services.length > 0 && report.services.every((service) => service.ready);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('P6 deployment identity');
  for (const service of report.services) {
    const suffix = [service.status ? `status=${service.status}` : null, service.reason ? `reason=${service.reason}` : null].filter(Boolean).join(' ');
    console.log(`  ${service.ready ? 'READY' : 'BLOCKED'} ${service.name}${suffix ? ` ${suffix}` : ''}`);
  }
}

if (strict && !report.ready) process.exitCode = 1;

async function verifyTarget(target) {
  const rawUrl = process.env[target.env]?.trim();
  if (!rawUrl) return { name: target.name, ready: false, reason: 'missing_url' };

  let endpoint;
  try {
    endpoint = new URL(target.path, rawUrl);
  } catch {
    return { name: target.name, ready: false, reason: 'invalid_url' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: 'application/json', 'user-agent': 'platform-p6-deployment-identity/2.0' },
    });

    if (response.status >= 300 && response.status < 400) return { name: target.name, ready: false, status: response.status, reason: 'redirect_blocked' };
    if (!response.ok) return { name: target.name, ready: false, status: response.status, reason: 'http_error' };

    let payload;
    try {
      payload = await response.json();
    } catch {
      return { name: target.name, ready: false, status: response.status, reason: 'invalid_json' };
    }

    const deployedCommit = normalizeCommit(payload?.commit);
    const deployedEnvironment = typeof payload?.environment === 'string' ? payload.environment.trim() : '';
    const builtAt = typeof payload?.builtAt === 'string' ? payload.builtAt.trim() : '';
    const service = typeof payload?.service === 'string' ? payload.service.trim() : '';

    if (service !== target.expectedService) return { name: target.name, ready: false, status: response.status, reason: 'unexpected_service' };
    if (!commitsMatch(deployedCommit, approvedCommit)) return { name: target.name, ready: false, status: response.status, reason: 'commit_mismatch' };
    if (!environmentMatches(deployedEnvironment, expectedEnvironment)) return { name: target.name, ready: false, status: response.status, reason: 'environment_mismatch' };
    if (!isValidTimestamp(builtAt)) return { name: target.name, ready: false, status: response.status, reason: 'invalid_built_at' };

    return { name: target.name, ready: true, status: response.status };
  } catch (error) {
    return { name: target.name, ready: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'request_failed' };
  }
}

function normalizeCommit(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(normalized) ? normalized : '';
}

function commitsMatch(actual, expected) {
  if (!actual || !expected) return false;
  return actual.startsWith(expected) || expected.startsWith(actual);
}

function environmentMatches(actual, expected) {
  if (!actual) return false;
  if (expected === 'non-production') return actual !== 'production';
  return actual === expected;
}

function isValidTimestamp(value) {
  if (!value || value === 'unknown') return false;
  return Number.isFinite(Date.parse(value));
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
