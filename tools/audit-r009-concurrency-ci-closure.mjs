import fs from 'node:fs';

const workflowPath = '.github/workflows/r009-parallel-boundary-closure.yml';
const packagePath = 'apps/api/package.json';

const workflow = fs.readFileSync(workflowPath, 'utf8');
const apiPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const checks = [
  ['PostgreSQL 16 service', workflow.includes('image: postgres:16')],
  ['isolated CI database', workflow.includes('POSTGRES_DB: platform_ci')],
  ['PostgreSQL health check', workflow.includes('pg_isready -U postgres -d platform_ci')],
  ['database URL configured', workflow.includes('DATABASE_URL: postgresql://postgres:postgres@localhost:5432/platform_ci?schema=public')],
  ['concurrency test URL configured', workflow.includes('FINANCE_TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/platform_ci?schema=public')],
  ['schema migration runs before DB tests', workflow.indexOf('run: pnpm db:migrate') < workflow.indexOf('run: pnpm --filter @platform/api test:db:finance')],
  ['finance DB test command', workflow.includes('run: pnpm --filter @platform/api test:db:finance')],
  ['promotion DB test command', workflow.includes('run: pnpm --filter @platform/api test:db:promotions')],
  ['KYC DB test command', workflow.includes('run: pnpm --filter @platform/api test:db:kyc')],
  ['watchlist DB test command', workflow.includes('run: pnpm --filter @platform/api test:db:risk-watchlist')],
  ['finance script exists', Boolean(apiPackage.scripts?.['test:db:finance'])],
  ['promotion script exists', Boolean(apiPackage.scripts?.['test:db:promotions'])],
  ['KYC script exists', Boolean(apiPackage.scripts?.['test:db:kyc'])],
  ['watchlist script exists', Boolean(apiPackage.scripts?.['test:db:risk-watchlist'])],
];

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length > 0) {
  console.error(`R-009 concurrency CI closure failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`R-009 concurrency CI closure passed: ${checks.length}/${checks.length} contracts.`);
