import { readFile } from 'node:fs/promises';

const legacyModulePath = 'apps/api/src/modules/risk/risk.module.ts';
const legacyQueryPath = 'apps/api/src/modules/risk/risk-summary-query.service.ts';
const ownerModulePath = 'apps/api/src/modules/risk-alerts/risk-alerts.module.ts';
const ownerQueryPath = 'apps/api/src/modules/risk-alerts/finance-risk-summary-query.service.ts';

const errors = [];
const read = (path) => readFile(path, 'utf8');

const [legacyModule, ownerModule, ownerQuery] = await Promise.all([
  read(legacyModulePath),
  read(ownerModulePath),
  read(ownerQueryPath),
]);

if (!legacyModule.includes('RiskAlertsModule')) {
  errors.push('RiskModule must import RiskAlertsModule as its compatibility owner.');
}
if (legacyModule.includes('DatabaseModule') || legacyModule.includes('RiskSummaryQueryService')) {
  errors.push('RiskModule must not own database or summary-query implementation.');
}
if (!ownerModule.includes('FinanceRiskSummaryQueryService')) {
  errors.push('RiskAlertsModule must provide and export FinanceRiskSummaryQueryService.');
}
if (!ownerQuery.includes('class FinanceRiskSummaryQueryService')) {
  errors.push('Finance risk summary owner is missing.');
}

try {
  await read(legacyQueryPath);
  errors.push('Legacy risk-summary-query.service.ts must remain removed.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

if (errors.length) {
  console.error('Risk ownership boundary audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Risk ownership boundary is valid.');
