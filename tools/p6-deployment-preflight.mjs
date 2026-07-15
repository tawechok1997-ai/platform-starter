import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/\/$/, '');
};

const memberUrl = required('MEMBER_WEB_URL');
const adminUrl = required('ADMIN_WEB_URL');
const apiUrl = required('API_URL');
const approvedCommit = process.env.APPROVED_COMMIT?.trim() ?? '';
const outputDir = resolve(process.env.P6_EVIDENCE_DIR?.trim() || 'p6-evidence');

function assertHttps(name, value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS: ${value}`);
  return url;
}

function selectHeaders(headers) {
  const names = [
    'cache-control',
    'content-security-policy',
    'content-type',
    'cross-origin-resource-policy',
    'referrer-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
  ];
  return Object.fromEntries(names.map((name) => [name, headers.get(name)]).filter(([, value]) => value));
}

async function inspectEndpoint(name, inputUrl, { parseJson = false } = {}) {
  assertHttps(name, inputUrl);
  const startedAt = Date.now();
  const response = await fetch(inputUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
    headers: { 'user-agent': 'platform-starter-p6-preflight/1.0' },
  });
  const elapsedMs = Date.now() - startedAt;
  const body = await response.text();
  const finalUrl = new URL(response.url);

  if (finalUrl.protocol !== 'https:') throw new Error(`${name} redirected away from HTTPS: ${response.url}`);
  if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);

  let json = null;
  if (parseJson) {
    try {
      json = JSON.parse(body);
    } catch {
      throw new Error(`${name} did not return valid JSON`);
    }
  }

  return {
    name,
    requestedUrl: inputUrl,
    finalUrl: response.url,
    status: response.status,
    elapsedMs,
    headers: selectHeaders(response.headers),
    bodyPreview: body.slice(0, 500),
    json,
  };
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, output));
  return output;
}

const endpoints = [];
endpoints.push(await inspectEndpoint('member-web', memberUrl));
endpoints.push(await inspectEndpoint('admin-web', adminUrl));
const health = await inspectEndpoint('api-health', `${apiUrl}/health`, { parseJson: true });
endpoints.push(health);

let approvedCommitMatched = null;
if (approvedCommit) {
  const candidates = collectStrings(health.json).map((value) => value.toLowerCase());
  const expected = approvedCommit.toLowerCase();
  approvedCommitMatched = candidates.some((value) => value === expected || value.startsWith(expected) || expected.startsWith(value));
  if (!approvedCommitMatched) throw new Error(`API health payload does not contain approved commit ${approvedCommit}`);
}

const securityHeaderWarnings = [];
for (const endpoint of endpoints.filter((item) => item.name !== 'api-health')) {
  if (!endpoint.headers['strict-transport-security']) securityHeaderWarnings.push(`${endpoint.name}: missing strict-transport-security`);
  if (endpoint.headers['x-content-type-options']?.toLowerCase() !== 'nosniff') securityHeaderWarnings.push(`${endpoint.name}: missing x-content-type-options=nosniff`);
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  approvedCommit: approvedCommit || null,
  approvedCommitMatched,
  endpoints,
  securityHeaderWarnings,
  result: 'PASS',
};

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'deployment-preflight.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(
  resolve(outputDir, 'deployment-preflight-summary.md'),
  [
    '# P6 Deployment Preflight',
    '',
    `- Generated: ${manifest.generatedAt}`,
    `- Result: ${manifest.result}`,
    `- Approved commit: ${manifest.approvedCommit ?? 'not supplied'}`,
    `- Commit matched: ${manifest.approvedCommitMatched ?? 'not checked'}`,
    '',
    '## Endpoints',
    '',
    ...endpoints.map((item) => `- ${item.name}: HTTP ${item.status}, ${item.elapsedMs} ms, ${item.finalUrl}`),
    '',
    '## Header warnings',
    '',
    ...(securityHeaderWarnings.length ? securityHeaderWarnings.map((warning) => `- ${warning}`) : ['- None']),
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify(manifest, null, 2));
