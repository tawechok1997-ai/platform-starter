import { pathToFileURL } from 'node:url';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_EVIDENCE_BYTES = 1_600_000;
const UNSAFE_FIELD_NAMES = new Set([
  'storageKey',
  'storage_key',
  'slipUrl',
  'slip_url',
  'paymentSlipUrl',
  'payment_slip_url',
  'objectKey',
  'object_key',
]);
const PRIVATE_KEY_PATTERN = /(?:^|["'\s])(slips|withdrawal-proofs)\//i;

export function resolvePrivateStorageConfig(env = process.env) {
  return {
    apiUrl: normalizeUrl(env.P6_API_URL),
    adminAccessToken: String(env.P6_ADMIN_ACCESS_TOKEN ?? '').trim(),
    depositRequestId: String(env.P6_DEPOSIT_REQUEST_ID ?? '').trim(),
    withdrawalRequestId: String(env.P6_WITHDRAWAL_REQUEST_ID ?? '').trim(),
    timeoutMs: parseTimeout(env.P6_PRIVATE_STORAGE_TIMEOUT_MS),
  };
}

export function missingPrivateStorageConfig(config) {
  const missing = [];
  if (!config.apiUrl) missing.push('P6_API_URL');
  if (!config.adminAccessToken) missing.push('P6_ADMIN_ACCESS_TOKEN');
  if (!config.depositRequestId) missing.push('P6_DEPOSIT_REQUEST_ID');
  if (!config.withdrawalRequestId) missing.push('P6_WITHDRAWAL_REQUEST_ID');
  return missing;
}

export async function runPrivateStorageVerification(config, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch API is unavailable');

  const missing = missingPrivateStorageConfig(config);
  if (missing.length) {
    return {
      ready: false,
      blocked: true,
      missing,
      checks: [],
    };
  }

  const targets = [
    {
      name: 'deposit-slip',
      path: `/admin/topups/${encodeURIComponent(config.depositRequestId)}/slip`,
    },
    {
      name: 'withdrawal-payment-proof',
      path: `/admin/withdrawals/${encodeURIComponent(config.withdrawalRequestId)}/payment-proof`,
    },
  ];

  const checks = [];
  for (const target of targets) {
    checks.push(await verifyAuthorizedEvidence(config, target, fetchImpl));
    checks.push(await verifyRejectedEvidence(config, target, fetchImpl, '', 'missing-token'));
    checks.push(await verifyRejectedEvidence(config, target, fetchImpl, 'invalid-private-storage-token', 'invalid-token'));
  }

  return {
    ready: checks.every((check) => check.ok),
    blocked: false,
    missing: [],
    checks,
  };
}

async function verifyAuthorizedEvidence(config, target, fetchImpl) {
  const response = await requestWithTimeout(fetchImpl, `${config.apiUrl}${target.path}`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${config.adminAccessToken}`,
    },
  }, config.timeoutMs);

  if (!response.ok) {
    return result(target.name, 'authorized-read', false, `HTTP ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (!isRecord(payload) || typeof payload.dataUrl !== 'string') {
    return result(target.name, 'authorized-read', false, 'response does not contain a dataUrl');
  }

  const evidence = parseEvidenceDataUrl(payload.dataUrl);
  if (!evidence.ok) return result(target.name, 'authorized-read', false, evidence.reason);

  const unsafeFields = findUnsafeFields(payload);
  if (unsafeFields.length) {
    return result(target.name, 'authorized-read', false, `unsafe fields exposed: ${unsafeFields.join(', ')}`);
  }

  const metadataOnly = JSON.stringify(stripDataUrl(payload));
  if (PRIVATE_KEY_PATTERN.test(metadataOnly)) {
    return result(target.name, 'authorized-read', false, 'private object key exposed in response metadata');
  }

  return {
    ...result(target.name, 'authorized-read', true, ''),
    contentType: evidence.contentType,
    sizeBytes: evidence.sizeBytes,
  };
}

async function verifyRejectedEvidence(config, target, fetchImpl, token, mode) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await requestWithTimeout(fetchImpl, `${config.apiUrl}${target.path}`, { headers }, config.timeoutMs);
  const rejected = response.status === 401 || response.status === 403;
  return result(target.name, mode, rejected, rejected ? '' : `expected 401/403, received HTTP ${response.status}`);
}

function parseEvidenceDataUrl(value) {
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { ok: false, reason: 'invalid evidence Data URL' };
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) return { ok: false, reason: 'evidence payload is empty' };
  if (bytes.length > MAX_EVIDENCE_BYTES) return { ok: false, reason: 'evidence payload exceeds the expected size limit' };
  return { ok: true, contentType: match[1], sizeBytes: bytes.length };
}

function findUnsafeFields(value, prefix = '') {
  if (Array.isArray(value)) return value.flatMap((item, index) => findUnsafeFields(item, `${prefix}[${index}]`));
  if (!isRecord(value)) return [];
  const found = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (UNSAFE_FIELD_NAMES.has(key)) found.push(path);
    found.push(...findUnsafeFields(child, path));
  }
  return found;
}

function stripDataUrl(value) {
  if (Array.isArray(value)) return value.map(stripDataUrl);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === 'dataUrl' ? '[redacted]' : stripDataUrl(child)]));
}

async function requestWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, redirect: 'error', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function result(target, mode, ok, reason) {
  return { target, mode, ok, reason };
}

function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function parseTimeout(value) {
  const parsed = Number(value ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.trunc(parsed), 1_000), 30_000);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function main() {
  const json = process.argv.includes('--json');
  const strict = process.argv.includes('--strict');
  const report = await runPrivateStorageVerification(resolvePrivateStorageConfig());

  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.blocked) {
    console.error(`Private storage verification blocked: missing ${report.missing.join(', ')}`);
  } else {
    for (const check of report.checks) {
      console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.target}/${check.mode}${check.reason ? `: ${check.reason}` : ''}`);
    }
  }

  if (!report.ready && (strict || !report.blocked)) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(`Private storage verification failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    process.exitCode = 1;
  });
}
