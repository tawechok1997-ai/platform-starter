import fs from 'node:fs';

const modelPath = 'apps/api/src/modules/reports/admin-report-read.model.ts';
const servicePath = 'apps/api/src/modules/reports/reports-query.service.ts';
const modulePath = 'apps/api/src/modules/reports/reports.module.ts';

const model = fs.readFileSync(modelPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');
const moduleSource = fs.readFileSync(modulePath, 'utf8');
const failures = [];

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
  if (!model.includes(`${key}:`)) failures.push(`trends response key drifted: ${key}`);
}
for (const key of ['summary', 'oldest', 'generatedAt']) {
  if (!model.includes(`${key}:`)) failures.push(`queue-aging response key drifted: ${key}`);
}
for (const key of ['items', 'checkedCount', 'mismatchCount', 'generatedAt']) {
  if (!model.includes(`${key}:`)) failures.push(`reconciliation response key drifted: ${key}`);
}

if (!model.includes("select: { amount: true, reviewedAt: true }")) {
  failures.push('trend reads must retain narrow projections');
}
if (!model.includes('RECONCILIATION_MAX_LIMIT = 500')) {
  failures.push('reconciliation maximum limit drifted');
}

if (failures.length) {
  console.error('R-010 report read-model audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 report read-model audit passed.');
