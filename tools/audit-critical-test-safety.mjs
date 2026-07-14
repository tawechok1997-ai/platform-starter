import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const packagePath = join(root, 'package.json');
const workflowPath = join(root, '.github', 'workflows', 'build.yml');
const inventoryPath = join(root, 'docs', 'architecture', 'test-inventory.md');

const criticalSuites = [
  {
    script: 'test:db:finance',
    path: 'apps/api/src/modules/finance/finance-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL finance concurrency',
    inventoryMarker: 'rollback / idempotency',
  },
  {
    script: 'test:db:promotions',
    path: 'apps/api/src/modules/promotions/promotion-settlement.db.spec.ts',
    workflowMarker: 'Test PostgreSQL promotion settlement concurrency',
    inventoryMarker: 'duplicate claim/settlement prevention',
  },
  {
    script: 'test:db:phone-otp',
    path: 'apps/api/src/modules/auth/phone-otp.db.spec.ts',
    workflowMarker: 'Test PostgreSQL phone OTP security',
    inventoryMarker: 'replay, brute force',
  },
  {
    script: 'test:db:risk-watchlist',
    path: 'apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL risk watchlist concurrency',
    inventoryMarker: 'matching, duplicate protection',
  },
  {
    script: 'test:db:kyc',
    path: 'apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts',
    workflowMarker: 'Test PostgreSQL KYC concurrency',
    inventoryMarker: 'document/review state transitions',
  },
];

const requiredRootAudits = [
  'audit:architecture-inventory',
  'audit:architecture-boundaries',
  'audit:admin-permissions',
  'audit:admin-ui-permissions',
  'audit:finance-workflows',
  'audit:mutation-dto-coverage',
  'audit:error-code-catalog',
  'audit:critical-error-contracts',
];

const requiredInventoryDomains = [
  'Support',
  'Admin lifecycle',
  'Critical API errors',
  'Mutation DTOs',
  'Known environment-gated coverage',
  'before/after regression evidence',
];

const skipPattern = /\b(?:describe|test|it)\.skip\s*\(|\b(?:xdescribe|xtest|xit)\s*\(/;
const [rootPackageRaw, apiPackageRaw, workflow, inventory] = await Promise.all([
  readFile(packagePath, 'utf8'),
  readFile(join(root, 'apps', 'api', 'package.json'), 'utf8'),
  readFile(workflowPath, 'utf8'),
  readFile(inventoryPath, 'utf8'),
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
  if (!inventory.includes(suite.inventoryMarker)) failures.push(`test-inventory.md: missing behavior marker "${suite.inventoryMarker}"`);
}

for (const script of requiredRootAudits) {
  if (!rootPackage.scripts?.[script]) failures.push(`package.json: missing ${script}`);
  if (!inventory.includes(`\`pnpm ${script}\``)) failures.push(`test-inventory.md: missing pnpm ${script}`);
}

for (const marker of requiredInventoryDomains) {
  if (!inventory.includes(marker)) failures.push(`test-inventory.md: missing required coverage marker "${marker}"`);
}

if (!workflow.includes('Regression safety failure summary')) {
  failures.push('build.yml: missing Regression safety failure summary step');
}
if (!workflow.includes('$GITHUB_STEP_SUMMARY')) {
  failures.push('build.yml: regression failure summary does not write to GITHUB_STEP_SUMMARY');
}

console.log(`Critical test safety audit: ${criticalSuites.length} database suites`);
console.log(`  required root audits: ${requiredRootAudits.length}`);
console.log(`  required inventory markers: ${requiredInventoryDomains.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nCritical regression safety violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}