import fs from 'node:fs';

const modelPath = 'apps/api/src/modules/reports/admin-report-read.model.ts';
const projectionPath = 'apps/api/src/modules/reports/report-read.projections.ts';
const servicePath = 'apps/api/src/modules/reports/reports-query.service.ts';
const modulePath = 'apps/api/src/modules/reports/reports.module.ts';

const model = fs.readFileSync(modelPath, 'utf8');
const projections = fs.readFileSync(projectionPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');
const moduleSource = fs.readFileSync(modulePath, 'utf8');
const failures = [];

function hasResponseKey(source, key) {
  return new RegExp(`\\b${key}\\s*(?=:|,)`).test(source);
}

for (const method of ['loadTrends', 'loadQueueAging', 'loadReconciliation']) {
  if (!model.includes(`${method}(`)) failures.push(`missing report read-model method ${method}`);
  if (!service.includes(`this.reportReadModel.${method}`)) failures.push(`reports query service does not delegate ${method}`);
}

if (!service.includes('AdminReportReadModel')) failures.push('reports query service is missing AdminReportReadModel dependency');
if (service.includes('PrismaService') || service.includes('this.prisma.')) {
  failures.push('ReportsQueryService must not access Prisma directly');
}
if (!moduleSource.includes('AdminReportReadModel')) failures.push('ReportsModule does not register AdminReportReadModel');

for (const key of ['range', 'totals', 'daily', 'generatedAt']) {
  if (!hasResponseKey(model, key)) failures.push(`trends response key drifted: ${key}`);
}
for (const key of ['summary', 'oldest', 'generatedAt']) {
  if (!hasResponseKey(model, key)) failures.push(`queue-aging response key drifted: ${key}`);
}
for (const key of ['items', 'checkedCount', 'mismatchCount', 'generatedAt']) {
  if (!hasResponseKey(model, key)) failures.push(`reconciliation response key drifted: ${key}`);
}

if (!model.includes('select: TREND_PROJECTION')) {
  failures.push('trend reads must use the shared narrow projection');
}
for (const signal of ['export const TREND_PROJECTION', 'amount: true', 'reviewedAt: true']) {
  if (!projections.includes(signal)) failures.push(`trend projection drifted: ${signal}`);
}
if (!model.includes('select: QUEUE_AGING_PROJECTION')) failures.push('queue-aging reads must use the shared projection');
if (!model.includes('select: RECONCILIATION_WALLET_PROJECTION')) failures.push('reconciliation wallet reads must use the shared projection');
if (!model.includes('select: RECONCILIATION_LEDGER_PROJECTION')) failures.push('reconciliation ledger reads must use the shared projection');
if (!model.includes('RECONCILIATION_MAX_LIMIT = 500')) {
  failures.push('reconciliation maximum limit drifted');
}

if (failures.length) {
  console.error('R-010 report read-model audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 report read-model audit passed.');
