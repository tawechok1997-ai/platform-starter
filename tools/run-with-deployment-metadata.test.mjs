import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./run-with-deployment-metadata.mjs', import.meta.url));
const metadataNames = [
  'GIT_COMMIT_SHA',
  'RAILWAY_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_SHA',
  'GITHUB_SHA',
  'BUILT_AT',
  'NODE_ENV',
];

test('prefers explicit commit and preserves valid build metadata', () => {
  const report = run({
    GIT_COMMIT_SHA: 'abcdef1234567890',
    RAILWAY_GIT_COMMIT_SHA: '1111111111111111',
    BUILT_AT: '2026-07-15T10:00:00.000Z',
    NODE_ENV: 'staging',
  });

  assert.equal(report.GIT_COMMIT_SHA, 'abcdef1234567890');
  assert.equal(report.BUILT_AT, '2026-07-15T10:00:00.000Z');
  assert.equal(report.NODE_ENV, 'staging');
});

test('uses Railway commit when explicit commit is absent', () => {
  const report = run({ RAILWAY_GIT_COMMIT_SHA: 'fedcba9876543210' });
  assert.equal(report.GIT_COMMIT_SHA, 'fedcba9876543210');
});

test('uses Vercel and GitHub commit fallbacks in priority order', () => {
  const vercel = run({ VERCEL_GIT_COMMIT_SHA: 'aaaaaaa1111111', GITHUB_SHA: 'bbbbbbb2222222' });
  assert.equal(vercel.GIT_COMMIT_SHA, 'aaaaaaa1111111');

  const github = run({ GITHUB_SHA: 'bbbbbbb2222222' });
  assert.equal(github.GIT_COMMIT_SHA, 'bbbbbbb2222222');
});

test('replaces invalid build timestamp and defaults environment to production', () => {
  const before = Date.now();
  const report = run({ GIT_COMMIT_SHA: 'abcdef1234567', BUILT_AT: 'not-a-date' });
  const after = Date.now();

  assert.equal(report.NODE_ENV, 'production');
  assert.ok(Date.parse(report.BUILT_AT) >= before);
  assert.ok(Date.parse(report.BUILT_AT) <= after);
});

test('never includes unrelated environment values in JSON output', () => {
  const secret = 'must-not-be-printed';
  const result = spawnSync(process.execPath, [script, '--print-json'], {
    cwd: process.cwd(),
    env: cleanEnv({ GIT_COMMIT_SHA: 'abcdef1234567', P6_ADMIN_PASSWORD: secret }),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout.includes(secret), false);
  assert.deepEqual(Object.keys(JSON.parse(result.stdout)).sort(), ['BUILT_AT', 'GIT_COMMIT_SHA', 'NODE_ENV']);
});

function run(overrides = {}) {
  const result = spawnSync(process.execPath, [script, '--print-json'], {
    cwd: process.cwd(),
    env: cleanEnv(overrides),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

function cleanEnv(overrides) {
  const env = { ...process.env };
  for (const name of metadataNames) delete env[name];
  Object.assign(env, overrides);
  return env;
}
