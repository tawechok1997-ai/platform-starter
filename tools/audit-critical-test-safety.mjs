import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const packagePath = join(root, 'package.json');
const workflowPath = join(root, '.github', 'workflows', 'build.yml');
const inventoryPath = join(root, 'docs', 'architecture', 'test-inventory.md');
const closurePath = join(root, 'docs', 'architecture', 'r003-closure.md');

const criticalSuites = [
  {
    script: 'test:db:finance',
    path: 'apps/api/src/modules/finance/finance-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL finance concurrency',
  },
  {
    script: 'test:db:promotions',
    path: 'apps/api/src/modules/promotions/promotion-settlement.db.spec.ts',
    workflowMarker: 'Test PostgreSQL promotion settlement concurrency',
  },
  {
    script: 'test:db:phone-otp',
    path: 'apps/api/src/modules/auth/phone-otp.db.spec.ts',
    workflowMarker: 'Test PostgreSQL phone OTP security',
  },
  {
    script: 'test:db:risk-watchlist',
    path: 'apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL risk watchlist concurrency',
  },
  {
    script: 'test:db:kyc',
    path: 'apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL KYC concurrency',
  },
];

const requiredCharacterizationSuites = [
  {
    path: 'apps/api/src/modules/support/support.service.spec.ts',
    markers: ['reopens a resolved ticket', 'audits an admin reply'],
  },
  {
    path: 'apps/api/src/modules/admin-access/admin-account-lifecycle.service.spec.ts',
    markers: ['returns an idempotent no-op', 'rolls back account and session changes'],
  },
];

const requiredTestClasses = [
  'Unit',
  'Integration',
  'Contract',
  'Database',
  'Browser',
  'Visual',
  'Concurrency',
];

const requiredCriticalFlows = [
  'Deposit lifecycle',
  'Withdrawal lifecycle',
  'KYC lifecycle',
  'Watchlist lifecycle',
  'Support lifecycle',
  'Admin account lifecycle',
  'Promotion settlement',
  'Provider webhook/settlement',
];

const skipPattern = /\b(?:describe|test|it)\.skip\s*\(|\b(?:xdescribe|xtest|xit)\s*\(/;
const [rootPackageRaw, apiPackageRaw, workflow, inventory, closure] = await Promise.all([
  readFile(packagePath, 'utf8'),
  readFile(join(root, 'apps', 'api', 'package.json'), 'utf8'),
  readFile(workflowPath, 'utf8'),
  readFile(inventoryPath, 'utf8'),
  readFile(closurePath, 'utf8'),
]);

const rootPackage = JSON.parse(rootPackageRaw);
const apiPackage = JSON.parse(apiPackageRaw);
const failures = [];

for (const suite of criticalSuites) {
  const absolutePath = join(root, suite.path);
  try {
    await access(absolutePath);
  } catch {
    failures.push(`${suite.path}: critical suite file is missing`);
    continue;
  }

  const source = await readFile(absolutePath, 'utf8');
  if (skipPattern.test(source)) failures.push(`${suite.path}: skipped critical test detected`);
  if (!apiPackage.scripts?.[suite.script]) failures.push(`apps/api/package.json: missing ${suite.script}`);
  if (!workflow.includes(suite.workflowMarker)) failures.push(`build.yml: missing ${suite.workflowMarker}`);
  if (!inventory.includes(`\`${suite.path}\``)) failures.push(`test-inventory.md: missing ${suite.path}`);
}

for (const suite of requiredCharacterizationSuites) {
  const source = await readFile(join(root, suite.path), 'utf8');
  if (skipPattern.test(source)) failures.push(`${suite.path}: skipped characterization test detected`);
  for (const marker of suite.markers) {
    if (!source.includes(marker)) failures.push(`${suite.path}: missing characterization case "${marker}"`);
  }
  if (!inventory.includes(`\`${suite.path}\``)) failures.push(`test-inventory.md: missing ${suite.path}`);
}

const requiredRootAudits = [
  'audit:architecture-inventory',
  'audit:architecture-boundaries',
  'audit:critical-test-safety',
  'audit:mutation-dto-coverage',
  'audit:critical-controller-types',
  'audit:critical-service-types',
  'audit:critical-error-contracts',
  'audit:admin-permissions',
  'audit:admin-ui-permissions',
];
for (const script of requiredRootAudits) {
  if (!rootPackage.scripts?.[script]) failures.push(`package.json: missing ${script}`);
  if (!inventory.includes(`\`pnpm ${script}\``)) failures.push(`test-inventory.md: missing pnpm ${script}`);
}

for (const testClass of requiredTestClasses) {
  if (!inventory.includes(`| ${testClass} |`)) failures.push(`test-inventory.md: missing ${testClass} test class`);
}

for (const flow of requiredCriticalFlows) {
  if (!inventory.includes(`| ${flow} |`)) failures.push(`test-inventory.md: missing ${flow} coverage row`);
}

if (!inventory.includes('A gap in this table is a refactor blocker')) {
  failures.push('test-inventory.md: missing explicit refactor-blocker rule');
}

const workflowSummaryMarkers = [
  'Regression test summary',
  'if: always()',
  'GITHUB_STEP_SUMMARY',
  'steps.test_api.outcome',
  'steps.test_finance.outcome',
  'steps.test_promotions.outcome',
  'steps.test_phone_otp.outcome',
  'steps.test_risk_watchlist.outcome',
  'steps.test_kyc.outcome',
];
for (const marker of workflowSummaryMarkers) {
  if (!workflow.includes(marker)) failures.push(`build.yml: missing regression summary marker ${marker}`);
}

if (!closure.includes('Status: **DONE**')) failures.push('r003-closure.md: closure status is not DONE');
if (!closure.includes('Structural refactors remain blocked')) failures.push('r003-closure.md: missing residual-gap rule');

console.log(`Critical test safety audit: ${criticalSuites.length} database suites`);
console.log(`  characterization suites: ${requiredCharacterizationSuites.length}`);
console.log(`  required root audits: ${requiredRootAudits.length}`);
console.log(`  documented test classes: ${requiredTestClasses.length}`);
console.log(`  critical-flow rows: ${requiredCriticalFlows.length}`);
console.log(`  CI summary markers: ${workflowSummaryMarkers.length}`);
console.log(`  closure record: ${failures.some((item) => item.startsWith('r003-closure.md')) ? 'invalid' : 'valid'}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nCritical regression safety violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}