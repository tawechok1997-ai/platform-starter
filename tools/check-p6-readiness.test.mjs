import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-p6-readiness.mjs', import.meta.url));
const p6Names = [
  'P6_ENVIRONMENT',
  'P6_API_URL',
  'P6_ADMIN_URL',
  'P6_MEMBER_URL',
  'P6_ADMIN_EMAIL',
  'P6_ADMIN_PASSWORD',
  'P6_READONLY_ADMIN_EMAIL',
  'P6_READONLY_ADMIN_PASSWORD',
  'P6_MEMBER_EMAIL',
  'P6_MEMBER_PASSWORD',
  'P6_PROVIDER_CODE',
  'P6_PROVIDER_BASE_URL',
  'P6_PROVIDER_API_KEY',
  'P6_PROVIDER_SECRET',
  'P6_PROVIDER_CALLBACK_URL',
];

const completeEnv = {
  P6_API_URL: 'https://api.example.test',
  P6_ADMIN_URL: 'https://admin.example.test',
  P6_MEMBER_URL: 'https://member.example.test',
  P6_ADMIN_EMAIL: 'admin@example.test',
  P6_ADMIN_PASSWORD: 'admin-secret-value',
  P6_READONLY_ADMIN_EMAIL: 'readonly@example.test',
  P6_READONLY_ADMIN_PASSWORD: 'readonly-secret-value',
  P6_MEMBER_EMAIL: 'member@example.test',
  P6_MEMBER_PASSWORD: 'member-secret-value',
  P6_PROVIDER_CODE: 'demo-provider',
  P6_PROVIDER_BASE_URL: 'https://provider.example.test',
};

test('reports every group blocked when no P6 variables exist', () => {
  const result = runChecker(['--json']);
  assert.equal(result.status, 0);

  const report = JSON.parse(result.stdout);
  assert.equal(report.ready, false);
  assert.equal(report.readyGroups, 0);
  assert.equal(report.totalGroups, 3);
  assert.equal(report.environment, 'non-production');
});

test('marks only deployed environment ready when URL variables are complete', () => {
  const result = runChecker(['--json'], {
    P6_API_URL: completeEnv.P6_API_URL,
    P6_ADMIN_URL: completeEnv.P6_ADMIN_URL,
    P6_MEMBER_URL: completeEnv.P6_MEMBER_URL,
  });
  const report = JSON.parse(result.stdout);

  assert.equal(report.readyGroups, 1);
  assert.equal(group(report, 'deployed-environment').ready, true);
  assert.equal(group(report, 'seeded-credentials').ready, false);
  assert.equal(group(report, 'vendor-uat').ready, false);
});

test('strict mode fails when required variables are incomplete', () => {
  const result = runChecker(['--strict']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /BLOCKED deployed-environment/);
});

test('strict mode succeeds when every required variable is present', () => {
  const result = runChecker(['--strict'], completeEnv);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /ready groups: 3\/3/);
});

test('optional provider secrets do not affect strict readiness', () => {
  const result = runChecker(['--strict', '--json'], completeEnv);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.deepEqual(group(report, 'vendor-uat').optionalPresent, []);
});

test('rejects malformed and non-http URLs without echoing values', () => {
  const secretUrl = 'ftp://hidden-user:hidden-pass@example.test/private';
  const result = runChecker(['--json'], {
    ...completeEnv,
    P6_API_URL: 'not a url',
    P6_PROVIDER_BASE_URL: secretUrl,
  });
  const report = JSON.parse(result.stdout);

  assert.equal(group(report, 'deployed-environment').ready, false);
  assert.equal(group(report, 'vendor-uat').ready, false);
  assert.equal(result.stdout.includes('not a url'), false);
  assert.equal(result.stdout.includes(secretUrl), false);
  assert.deepEqual(group(report, 'deployed-environment').validationErrors, [
    { field: 'P6_API_URL', reason: 'must be a valid http or https URL' },
  ]);
});

test('production readiness requires HTTPS for every configured URL', () => {
  const result = runChecker(['--strict', '--json'], {
    ...completeEnv,
    P6_ENVIRONMENT: 'production',
    P6_API_URL: 'http://api.example.test',
    P6_PROVIDER_CALLBACK_URL: 'http://callback.example.test/provider',
  });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(report.environment, 'production');
  assert.deepEqual(group(report, 'deployed-environment').validationErrors, [
    { field: 'P6_API_URL', reason: 'must use HTTPS for production' },
  ]);
  assert.deepEqual(group(report, 'vendor-uat').validationErrors, [
    { field: 'P6_PROVIDER_CALLBACK_URL', reason: 'must use HTTPS for production' },
  ]);
});

test('rejects duplicated API, Admin, or Member origins', () => {
  const result = runChecker(['--json'], {
    ...completeEnv,
    P6_ADMIN_URL: completeEnv.P6_API_URL,
  });
  const report = JSON.parse(result.stdout);

  assert.equal(group(report, 'deployed-environment').ready, false);
  assert.deepEqual(group(report, 'deployed-environment').validationErrors, [
    { field: 'P6_ADMIN_URL', reason: 'same origin as P6_API_URL' },
  ]);
});

test('rejects URLs containing embedded credentials', () => {
  const sensitive = 'https://secret-user:secret-pass@api.example.test';
  const result = runChecker(['--json'], { ...completeEnv, P6_API_URL: sensitive });
  const report = JSON.parse(result.stdout);

  assert.equal(group(report, 'deployed-environment').ready, false);
  assert.equal(result.stdout.includes(sensitive), false);
  assert.deepEqual(group(report, 'deployed-environment').validationErrors, [
    { field: 'P6_API_URL', reason: 'must not contain embedded credentials' },
  ]);
});

test('JSON output never contains credential or secret values', () => {
  const sensitiveValues = {
    ...completeEnv,
    P6_PROVIDER_API_KEY: 'provider-api-key-secret-value',
    P6_PROVIDER_SECRET: 'provider-signature-secret-value',
    P6_PROVIDER_CALLBACK_URL: 'https://callback.example.test/private-token',
  };
  const result = runChecker(['--json'], sensitiveValues);

  assert.equal(result.status, 0);
  for (const value of Object.values(sensitiveValues)) {
    assert.equal(result.stdout.includes(value), false, `output leaked value: ${value}`);
  }

  assert.deepEqual(group(JSON.parse(result.stdout), 'vendor-uat').optionalPresent, [
    'P6_PROVIDER_API_KEY',
    'P6_PROVIDER_SECRET',
    'P6_PROVIDER_CALLBACK_URL',
  ]);
});

function group(report, name) {
  return report.groups.find((item) => item.name === name);
}

function runChecker(args, overrides = {}) {
  const env = { ...process.env };
  for (const name of p6Names) delete env[name];
  Object.assign(env, overrides);

  const result = spawnSync(process.execPath, [checker, ...args], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });

  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  return result;
}
