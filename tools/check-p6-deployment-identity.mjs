const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
const timeoutMs = boundedInteger(process.env.P6_CONNECTIVITY_TIMEOUT_MS, 8_000, 1_000, 30_000);
const apiUrl = process.env.P6_API_URL?.trim();
const approvedCommit = normalizeCommit(process.env.P6_APPROVED_COMMIT_SHA);
const expectedEnvironment = process.env.P6_ENVIRONMENT?.trim() || 'non-production';

const report = {
  generatedAt: new Date().toISOString(),
  ready: false,
  checks: [],
};

if (!apiUrl) {
  report.checks.push({ name: 'api-version', ready: false, reason: 'missing_url' });
} else if (!approvedCommit) {
  report.checks.push({ name: 'approved-commit', ready: false, reason: 'missing_approved_commit' });
} else {
  const endpoint = new URL('/version', apiUrl);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: 'application/json', 'user-agent': 'platform-p6-deployment-identity/1.0' },
    });

    if (response.status >= 300 && response.status < 400) {
      report.checks.push({ name: 'api-version', ready: false, status: response.status, reason: 'redirect_blocked' });
    } else if (!response.ok) {
      report.checks.push({ name: 'api-version', ready: false, status: response.status, reason: 'http_error' });
    } else {
      const payload = await response.json();
      const deployedCommit = normalizeCommit(payload?.commit);
      const deployedEnvironment = typeof payload?.environment === 'string' ? payload.environment.trim() : '';
      const builtAt = typeof payload?.builtAt === 'string' ? payload.builtAt.trim() : '';
      const service = typeof payload?.service === 'string' ? payload.service.trim() : '';

      const identityChecks = [
        { name: 'service', ready: service === 'api', reason: service === 'api' ? undefined : 'unexpected_service' },
        { name: 'commit', ready: commitsMatch(deployedCommit, approvedCommit), reason: commitsMatch(deployedCommit, approvedCommit) ? undefined : 'commit_mismatch' },
        { name: 'environment', ready: environmentMatches(deployedEnvironment, expectedEnvironment), reason: environmentMatches(deployedEnvironment, expectedEnvironment) ? undefined : 'environment_mismatch' },
        { name: 'built-at', ready: isValidTimestamp(builtAt), reason: isValidTimestamp(builtAt) ? undefined : 'invalid_built_at' },
      ];
      report.checks.push(...identityChecks);
    }
  } catch (error) {
    report.checks.push({ name: 'api-version', ready: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'request_failed' });
  }
}

report.ready = report.checks.length > 0 && report.checks.every((check) => check.ready);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('P6 deployment identity');
  for (const check of report.checks) {
    const suffix = [check.status ? `status=${check.status}` : null, check.reason ? `reason=${check.reason}` : null].filter(Boolean).join(' ');
    console.log(`  ${check.ready ? 'READY' : 'BLOCKED'} ${check.name}${suffix ? ` ${suffix}` : ''}`);
  }
}

if (strict && !report.ready) process.exitCode = 1;

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
