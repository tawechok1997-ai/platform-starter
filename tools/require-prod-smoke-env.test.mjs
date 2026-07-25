import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/require-prod-smoke-env.sh');
const baseEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  PROD_BASE_URL: 'https://platformapi-production.example.test',
  PROD_ADMIN_TOKEN: 'admin-token-abcdefghijklmnopqrstuvwxyz',
  PROD_MEMBER_TOKEN: 'member-token-abcdefghijklmnopqrstuvwxyz',
};

function run(overrides = {}, removed = []) {
  const env = { ...baseEnv, ...overrides };
  for (const name of removed) delete env[name];
  return spawnSync('bash', [script], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
}

test('fails closed when required production inputs are missing', () => {
  const result = run({}, ['PROD_ADMIN_TOKEN', 'PROD_MEMBER_TOKEN']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing: PROD_ADMIN_TOKEN PROD_MEMBER_TOKEN/);
});

test('accepts a safe HTTPS read-only configuration without printing secrets', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validated for host platformapi-production\.example\.test in read-only mode/);
  assert.equal(result.stdout.includes(baseEnv.PROD_ADMIN_TOKEN), false);
  assert.equal(result.stdout.includes(baseEnv.PROD_MEMBER_TOKEN), false);
});

test('allows HTTP only for localhost', () => {
  const productionHttp = run({ PROD_BASE_URL: 'http://platformapi-production.example.test' });
  assert.notEqual(productionHttp.status, 0);
  assert.match(productionHttp.stderr, /must use HTTPS except for localhost/);

  const localhost = run({ PROD_BASE_URL: 'http://127.0.0.1:4000' });
  assert.equal(localhost.status, 0, localhost.stderr);
});

test('rejects embedded URL credentials and fragments', () => {
  const credentials = run({ PROD_BASE_URL: 'https://user:secret@platformapi-production.example.test' });
  assert.notEqual(credentials.status, 0);
  assert.match(credentials.stderr, /must not embed credentials/);

  const fragment = run({ PROD_BASE_URL: 'https://platformapi-production.example.test/#admin' });
  assert.notEqual(fragment.status, 0);
  assert.match(fragment.stderr, /must not include a fragment/);
});

test('enforces an optional exact host allow-list', () => {
  const allowed = run({ PROD_SMOKE_ALLOWED_HOSTS: 'other.example.test, platformapi-production.example.test' });
  assert.equal(allowed.status, 0, allowed.stderr);

  const blocked = run({ PROD_SMOKE_ALLOWED_HOSTS: 'other.example.test' });
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /not included in PROD_SMOKE_ALLOWED_HOSTS/);
});

test('rejects weak, whitespace, or shared access tokens', () => {
  const short = run({ PROD_ADMIN_TOKEN: 'too-short' });
  assert.notEqual(short.status, 0);
  assert.match(short.stderr, /too short/);

  const whitespace = run({ PROD_MEMBER_TOKEN: 'member token abcdefghijklmnopqrstuvwxyz' });
  assert.notEqual(whitespace.status, 0);
  assert.match(whitespace.stderr, /must not contain whitespace/);

  const shared = run({ PROD_MEMBER_TOKEN: baseEnv.PROD_ADMIN_TOKEN });
  assert.notEqual(shared.status, 0);
  assert.match(shared.stderr, /must be different/);
});

test('requires explicit bounded mutation safeguards', () => {
  const missingAcknowledgement = run({ PROD_SMOKE_MODE: 'mutations' });
  assert.notEqual(missingAcknowledgement.status, 0);
  assert.match(missingAcknowledgement.stderr, /I_ACKNOWLEDGE_PRODUCTION_MUTATIONS/);

  const invalidPrefix = run({
    PROD_SMOKE_MODE: 'mutations',
    PROD_SMOKE_ALLOW_MUTATIONS: 'I_ACKNOWLEDGE_PRODUCTION_MUTATIONS',
    PROD_SMOKE_TEST_ACCOUNT_ID: '11111111-1111-4111-8111-111111111111',
    PROD_SMOKE_IDEMPOTENCY_PREFIX: 'unsafe',
    PROD_SMOKE_MAX_AMOUNT: '1',
  });
  assert.notEqual(invalidPrefix.status, 0);
  assert.match(invalidPrefix.stderr, /IDEMPOTENCY_PREFIX/);

  const excessiveAmount = run({
    PROD_SMOKE_MODE: 'mutations',
    PROD_SMOKE_ALLOW_MUTATIONS: 'I_ACKNOWLEDGE_PRODUCTION_MUTATIONS',
    PROD_SMOKE_TEST_ACCOUNT_ID: '11111111-1111-4111-8111-111111111111',
    PROD_SMOKE_IDEMPOTENCY_PREFIX: 'smoke-platform-ci',
    PROD_SMOKE_MAX_AMOUNT: '101',
  });
  assert.notEqual(excessiveAmount.status, 0);
  assert.match(excessiveAmount.stderr, /not above 100/);

  const valid = run({
    PROD_SMOKE_MODE: 'mutations',
    PROD_SMOKE_ALLOW_MUTATIONS: 'I_ACKNOWLEDGE_PRODUCTION_MUTATIONS',
    PROD_SMOKE_TEST_ACCOUNT_ID: '11111111-1111-4111-8111-111111111111',
    PROD_SMOKE_IDEMPOTENCY_PREFIX: 'smoke-platform-ci',
    PROD_SMOKE_MAX_AMOUNT: '1',
  });
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /in mutations mode/);
});
