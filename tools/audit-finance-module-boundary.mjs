import fs from 'node:fs';

const financePath = 'apps/api/src/modules/finance/finance.module.ts';
const appPath = 'apps/api/src/app.module.ts';
const finance = fs.readFileSync(financePath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');

const forbiddenFinanceImports = ['QueuesModule', 'ActivityModule', 'RiskModule', 'AdminMembersModule'];
const requiredAppModules = ['FinanceModule', ...forbiddenFinanceImports];
const failures = [];

for (const moduleName of forbiddenFinanceImports) {
  if (finance.includes(moduleName)) failures.push(`${financePath} must not compose ${moduleName}`);
}

for (const moduleName of requiredAppModules) {
  const importPattern = new RegExp(`import\\s+\\{\\s*${moduleName}\\s*\\}`);
  if (!importPattern.test(app) || !app.includes(`    ${moduleName},`)) {
    failures.push(`${appPath} must import and register ${moduleName}`);
  }
}

if (!finance.includes('FinanceController') || !finance.includes('FinanceSummaryQueryService') || !finance.includes('FinanceReportsQueryService')) {
  failures.push(`${financePath} must retain finance controller and reporting projections`);
}

if (failures.length) {
  console.error('Finance module boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Finance module boundary is valid.');
