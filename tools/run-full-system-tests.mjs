import { execFileSync, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_CAPTURED_OUTPUT = 12_000;

export const suites = [
  suite('frozen-install', 'Frozen lockfile install', 'repository', 'pnpm', [
    'install',
    '--frozen-lockfile',
    '--prefer-offline',
  ]),
  suite('migration-validation', 'Migration validation audit', 'repository', 'pnpm', ['audit:migration-validation']),
  suite('generated-drift', 'Generated drift audit', 'repository', 'pnpm', ['audit:generated-drift']),
  suite('production-secrets', 'Production secret audit', 'repository', 'pnpm', ['audit:production-secrets']),
  suite('production-dependencies', 'Production dependency audit', 'repository', 'pnpm', [
    'audit:production-dependencies',
  ]),
  suite('format', 'Changed-file formatting', 'repository', 'pnpm', ['format:check']),
  suite('lint', 'Workspace lint', 'repository', 'pnpm', ['lint']),
  suite('typecheck', 'Workspace typecheck', 'repository', 'pnpm', ['typecheck']),
  suite('unused-exports', 'Unused export audit', 'repository', 'pnpm', ['audit:unused-exports']),
  suite('circular-dependencies', 'Circular dependency audit', 'repository', 'pnpm', ['audit:circular-dependencies']),
  suite('architecture-inventory', 'Architecture inventory audit', 'repository', 'pnpm', [
    'audit:architecture-inventory',
  ]),
  suite('architecture-boundaries', 'Architecture boundary audit', 'repository', 'pnpm', [
    'audit:architecture-boundaries',
  ]),
  suite('critical-test-safety', 'Critical regression safety audit', 'repository', 'pnpm', [
    'audit:critical-test-safety',
  ]),
  suite('mutation-dto-coverage', 'Mutation DTO coverage audit', 'repository', 'pnpm', ['audit:mutation-dto-coverage']),
  suite('critical-controller-types', 'Critical controller type audit', 'repository', 'pnpm', [
    'audit:critical-controller-types',
  ]),
  suite('critical-service-types', 'Critical service type audit', 'repository', 'pnpm', [
    'audit:critical-service-types',
  ]),
  suite('api-response-safety', 'API response safety audit', 'repository', 'pnpm', ['audit:api-response-safety']),
  suite('error-contracts', 'Critical error contract audit', 'repository', 'pnpm', ['audit:critical-error-contracts']),
  suite('admin-permissions', 'Admin API permission audit', 'repository', 'pnpm', ['audit:admin-permissions']),
  suite('admin-ui-permissions', 'Admin UI permission audit', 'repository', 'pnpm', ['audit:admin-ui-permissions']),
  suite('finance-workflows', 'Finance workflow audit', 'repository', 'pnpm', ['audit:finance-workflows']),
  suite('admin-token-storage', 'Admin token storage audit', 'repository', 'pnpm', ['audit:admin-token-storage']),
  suite('admin-xss', 'Admin XSS boundary audit', 'repository', 'pnpm', ['audit:admin-xss']),
  suite('browser-quality', 'Browser quality audit', 'repository', 'pnpm', ['audit:browser-quality']),
  suite('runner-tests', 'Full-system runner tests', 'unit', 'node', ['--test', 'tools/run-full-system-tests.test.mjs']),
  suite('api-tests', 'API unit and integration tests', 'unit', 'pnpm', [
    '--filter',
    '@platform/api',
    'exec',
    'jest',
    '--runInBand',
  ]),
  suite('admin-tests', 'Web Admin component tests', 'unit', 'pnpm', ['--filter', '@platform/web-admin', 'test']),
  suite('member-tests', 'Web Member component tests', 'unit', 'pnpm', ['--filter', '@platform/web-member', 'test']),
  suite('api-client-tests', 'Shared API client tests', 'unit', 'pnpm', ['--filter', '@platform/api-client', 'test']),

  suite('production-build', 'All production builds', 'build', 'pnpm', ['build'], { timeoutMs: 15 * 60_000 }),

  databaseSuite('db-finance', 'PostgreSQL finance concurrency', 'test:db:finance'),
  databaseSuite('db-promotions', 'PostgreSQL promotion settlement', 'test:db:promotions'),
  databaseSuite('db-phone-otp', 'PostgreSQL phone OTP security', 'test:db:phone-otp'),
  databaseSuite('db-risk-watchlist', 'PostgreSQL risk/watchlist concurrency', 'test:db:risk-watchlist'),
  databaseSuite('db-kyc', 'PostgreSQL KYC concurrency', 'test:db:kyc'),

  suite('e2e-smoke', 'Deployed public/auth smoke', 'browser', 'pnpm', ['test:e2e:smoke:strict'], {
    requiredEnv: ['ADMIN_WEB_URL', 'MEMBER_WEB_URL'],
    timeoutMs: 15 * 60_000,
  }),
  suite('e2e-visual', 'Six-viewport visual regression', 'browser', 'pnpm', ['test:e2e:visual'], {
    timeoutMs: 20 * 60_000,
  }),
  suite('e2e-kyc', 'KYC responsive browser regression', 'browser', 'pnpm', ['test:e2e:kyc'], {
    timeoutMs: 20 * 60_000,
  }),
  suite('e2e-cms', 'CMS content browser regression', 'browser', 'pnpm', ['test:e2e:cms-content'], {
    timeoutMs: 20 * 60_000,
  }),
  suite('proxy-rate-limit', 'Approved reverse-proxy rate-limit test', 'browser', 'pnpm', ['test:proxy-rate-limit'], {
    requiredEnv: ['RATE_LIMIT_TEST_URL'],
  }),

  suite('p6-readiness', 'P6 external readiness', 'p6', 'pnpm', ['verify:p6:readiness:strict'], {
    requiredEnv: p6CoreEnvironment(),
  }),
  suite('p6-connectivity', 'P6 deployed connectivity', 'p6', 'pnpm', ['verify:p6:connectivity:strict'], {
    requiredEnv: ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL'],
  }),
  suite('p6-deployment', 'P6 deployment identity', 'p6', 'pnpm', ['verify:p6:deployment:strict'], {
    requiredEnv: ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_APPROVED_COMMIT_SHA'],
  }),
  suite('p6-kyc-deployed', 'P6 deployed KYC regression', 'p6', 'pnpm', ['test:kyc:deployed'], {
    requiredEnv: ['P6_API_URL', 'P6_ADMIN_EMAIL', 'P6_ADMIN_PASSWORD', 'P6_MEMBER_EMAIL', 'P6_MEMBER_PASSWORD'],
    timeoutMs: 10 * 60_000,
  }),
];

const profileGroups = {
  repository: ['repository'],
  unit: ['unit'],
  build: ['build'],
  database: ['database'],
  browser: ['browser'],
  p6: ['p6'],
  ci: ['repository', 'unit', 'build'],
  auto: ['repository', 'unit', 'build', 'database', 'browser'],
  all: ['repository', 'unit', 'build', 'database', 'browser', 'p6'],
};

function suite(id, name, group, command, args, options = {}) {
  return {
    id,
    name,
    group,
    command,
    args,
    requiredEnv: options.requiredEnv ?? [],
    timeoutMs: options.timeoutMs ?? 10 * 60_000,
  };
}

function databaseSuite(id, name, script) {
  return suite(id, name, 'database', 'pnpm', ['--filter', '@platform/api', script], {
    requiredEnv: ['FINANCE_TEST_DATABASE_URL', 'FULL_SYSTEM_ALLOW_DATABASE_TESTS'],
    timeoutMs: 10 * 60_000,
  });
}

function p6CoreEnvironment() {
  return [
    'P6_API_URL',
    'P6_ADMIN_URL',
    'P6_MEMBER_URL',
    'P6_ADMIN_EMAIL',
    'P6_ADMIN_PASSWORD',
    'P6_READONLY_ADMIN_EMAIL',
    'P6_READONLY_ADMIN_PASSWORD',
    'P6_MEMBER_EMAIL',
    'P6_MEMBER_PASSWORD',
  ];
}

export function parseArguments(argv) {
  const options = {
    profile: 'ci',
    suites: [],
    list: false,
    dryRun: false,
    failOnBlocked: false,
    reportDir: process.env.FULL_SYSTEM_REPORT_DIR || 'artifacts/full-system/latest',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--list') options.list = true;
    else if (value === '--dry-run') options.dryRun = true;
    else if (value === '--fail-on-blocked') options.failOnBlocked = true;
    else if (value.startsWith('--profile=')) options.profile = value.slice('--profile='.length);
    else if (value === '--profile') options.profile = argv[++index];
    else if (value.startsWith('--suite=')) options.suites.push(value.slice('--suite='.length));
    else if (value === '--suite') options.suites.push(argv[++index]);
    else if (value.startsWith('--report-dir=')) options.reportDir = value.slice('--report-dir='.length);
    else if (value === '--report-dir') options.reportDir = argv[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }

  if (!profileGroups[options.profile]) throw new Error(`Unknown profile: ${options.profile}`);
  if (!options.reportDir) throw new Error('Report directory must not be empty');
  return options;
}

export function selectSuites(options) {
  const groups = new Set(profileGroups[options.profile]);
  const selected = suites.filter((entry) => groups.has(entry.group));
  if (options.suites.length === 0) return selected;

  const requested = new Set(options.suites);
  const unknown = [...requested].filter((id) => !suites.some((entry) => entry.id === id));
  if (unknown.length > 0) throw new Error(`Unknown suite: ${unknown.join(', ')}`);
  return selected.filter((entry) => requested.has(entry.id));
}

export function missingRequirements(entry, env = process.env) {
  return entry.requiredEnv.filter((name) => {
    const value = env[name];
    if (name === 'FULL_SYSTEM_ALLOW_DATABASE_TESTS') return value !== 'true';
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

export function summarize(results) {
  const count = (status) => results.filter((result) => result.status === status).length;
  return {
    total: results.length,
    passed: count('passed'),
    failed: count('failed'),
    blocked: count('blocked'),
    planned: count('planned'),
    durationMs: results.reduce((total, result) => total + (result.durationMs ?? 0), 0),
  };
}

export function renderMarkdown(report) {
  const lines = [
    '# Full-System Automated Test Report',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Commit: \`${report.commit}\``,
    `- Profile: \`${report.profile}\``,
    `- Result: **${report.status.toUpperCase()}**`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    `- Blocked: ${report.summary.blocked}`,
    `- Planned: ${report.summary.planned}`,
    '',
    '| Suite | Group | Status | Duration | Detail |',
    '|---|---|---|---:|---|',
  ];

  for (const result of report.results) {
    const detail = result.missing?.length
      ? `Missing: ${result.missing.join(', ')}`
      : result.exitCode != null && result.exitCode !== 0
        ? `Exit ${result.exitCode}`
        : '';
    lines.push(
      `| ${escapeCell(result.name)} | ${result.group} | ${result.status.toUpperCase()} | ${formatDuration(result.durationMs)} | ${escapeCell(detail)} |`,
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function execute(entry, { dryRun }) {
  const missing = missingRequirements(entry);
  if (missing.length > 0) {
    return result(entry, 'blocked', { missing, durationMs: 0 });
  }
  if (dryRun) return result(entry, 'planned', { durationMs: 0 });

  const started = Date.now();
  console.log(`\n▶ ${entry.id}: ${entry.name}`);
  console.log(`  $ ${entry.command} ${entry.args.join(' ')}`);
  const commandResult = await runCommand(entry.command, entry.args, entry.timeoutMs);
  const status = commandResult.exitCode === 0 ? 'passed' : 'failed';
  console.log(`${status === 'passed' ? '✓' : '✗'} ${entry.id} (${formatDuration(Date.now() - started)})`);
  return result(entry, status, {
    ...commandResult,
    durationMs: Date.now() - started,
  });
}

function runCommand(command, args, timeoutMs) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      shell: false,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      stdout = captureTail(stdout, chunk);
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      stderr = captureTail(stderr, chunk);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: 1, signal: null, timedOut, stdout, stderr: captureTail(stderr, error.message) });
    });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: exitCode ?? 1, signal, timedOut, stdout, stderr });
    });
  });
}

function captureTail(previous, chunk) {
  return `${previous}${String(chunk)}`.slice(-MAX_CAPTURED_OUTPUT);
}

function result(entry, status, details) {
  return {
    id: entry.id,
    name: entry.name,
    group: entry.group,
    command: [entry.command, ...entry.args],
    status,
    ...details,
  };
}

function escapeCell(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
}

function formatDuration(milliseconds = 0) {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

async function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function writeReports(report, reportDir) {
  const directory = resolve(root, reportDir);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(join(directory, 'report.md'), renderMarkdown(report)),
  ]);
  return directory;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const selected = selectSuites(options);

  if (options.list) {
    for (const entry of selected) console.log(`${entry.id}\t${entry.group}\t${entry.name}`);
    return;
  }

  const results = [];
  for (const entry of selected) {
    const next = await execute(entry, options);
    results.push(next);
  }

  const summary = summarize(results);
  const status = summary.failed > 0 || (options.failOnBlocked && summary.blocked > 0) ? 'failed' : 'passed';
  const report = {
    generatedAt: new Date().toISOString(),
    commit: await currentCommit(),
    profile: options.profile,
    dryRun: options.dryRun,
    failOnBlocked: options.failOnBlocked,
    status,
    summary,
    results,
  };
  const reportDirectory = await writeReports(report, options.reportDir);

  console.log('\nFull-system automated test summary');
  console.log(`  passed: ${summary.passed}`);
  console.log(`  failed: ${summary.failed}`);
  console.log(`  blocked: ${summary.blocked}`);
  console.log(`  planned: ${summary.planned}`);
  console.log(`  reports: ${reportDirectory}`);

  if (status === 'failed') process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
