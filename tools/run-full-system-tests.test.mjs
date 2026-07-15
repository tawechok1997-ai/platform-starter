import assert from 'node:assert/strict';
import test from 'node:test';
import {
  missingRequirements,
  parseArguments,
  renderMarkdown,
  selectSuites,
  summarize,
} from './run-full-system-tests.mjs';

test('parses profiles, suite filters and strict blocked behavior', () => {
  assert.deepEqual(parseArguments(['--profile', 'database', '--suite=db-finance', '--fail-on-blocked']), {
    profile: 'database',
    suites: ['db-finance'],
    list: false,
    dryRun: false,
    failOnBlocked: true,
    reportDir: 'artifacts/full-system/latest',
  });
});

test('selects only suites belonging to a profile', () => {
  const selected = selectSuites(parseArguments(['--profile=unit']));
  assert.ok(selected.length >= 5);
  assert.equal(
    selected.every((entry) => entry.group === 'unit'),
    true,
  );
});

test('rejects unknown profiles and suites', () => {
  assert.throws(() => parseArguments(['--profile=unknown']), /Unknown profile/);
  assert.throws(
    () => selectSuites({ ...parseArguments(['--profile=unit']), suites: ['missing-suite'] }),
    /Unknown suite/,
  );
});

test('blocks database suites unless both URL and explicit safety opt-in are present', () => {
  const entry = selectSuites(parseArguments(['--profile=database', '--suite=db-finance']))[0];
  assert.deepEqual(missingRequirements(entry, {}), ['FINANCE_TEST_DATABASE_URL', 'FULL_SYSTEM_ALLOW_DATABASE_TESTS']);
  assert.deepEqual(
    missingRequirements(entry, {
      FINANCE_TEST_DATABASE_URL: 'postgresql://postgres:postgres@localhost/platform_ci',
      FULL_SYSTEM_ALLOW_DATABASE_TESTS: 'true',
    }),
    [],
  );
});

test('classifies the approved proxy target as an external browser requirement', () => {
  const entry = selectSuites(parseArguments(['--profile=browser', '--suite=proxy-rate-limit']))[0];
  assert.deepEqual(missingRequirements(entry, {}), ['RATE_LIMIT_TEST_URL']);
  assert.deepEqual(missingRequirements(entry, { RATE_LIMIT_TEST_URL: 'https://approved.example.test' }), []);
});

test('summarizes all runner statuses', () => {
  assert.deepEqual(
    summarize([
      { status: 'passed', durationMs: 10 },
      { status: 'failed', durationMs: 20 },
      { status: 'blocked', durationMs: 0 },
      { status: 'planned', durationMs: 0 },
    ]),
    { total: 4, passed: 1, failed: 1, blocked: 1, planned: 1, durationMs: 30 },
  );
});

test('renders a markdown report with blocked requirements', () => {
  const markdown = renderMarkdown({
    generatedAt: '2026-07-15T00:00:00.000Z',
    commit: 'abcdef1',
    profile: 'p6',
    status: 'passed',
    summary: { passed: 0, failed: 0, blocked: 1, planned: 0 },
    results: [
      {
        name: 'P6 readiness',
        group: 'p6',
        status: 'blocked',
        durationMs: 0,
        missing: ['P6_API_URL'],
      },
    ],
  });
  assert.match(markdown, /Full-System Automated Test Report/);
  assert.match(markdown, /Missing: P6_API_URL/);
});
