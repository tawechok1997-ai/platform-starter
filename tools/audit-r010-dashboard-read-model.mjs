import fs from 'node:fs';

const modelPath = 'apps/api/src/modules/reports/admin-dashboard-read.model.ts';
const servicePath = 'apps/api/src/modules/reports/reports-query.service.ts';
const modulePath = 'apps/api/src/modules/reports/reports.module.ts';

const model = fs.readFileSync(modelPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');
const moduleSource = fs.readFileSync(modulePath, 'utf8');
const failures = [];

for (const token of [
  'export class AdminDashboardReadModel',
  'topUpRequest.groupBy',
  'withdrawalRequest.groupBy',
  'walletLedger.groupBy',
  'wallet.aggregate',
  'pendingQueues',
  'generatedAt',
]) {
  if (!model.includes(token)) failures.push(`dashboard read model missing ${token}`);
}

if (!service.includes('private readonly dashboardReadModel: AdminDashboardReadModel')) {
  failures.push('reports query service does not inject the dashboard read model');
}
if (!service.includes('return this.dashboardReadModel.load(query)')) {
  failures.push('daily dashboard endpoint does not delegate to the read model');
}
if (/getDailySummary[\s\S]{0,2500}this\.prisma\./.test(service)) {
  failures.push('daily dashboard Prisma reads escaped back into ReportsQueryService');
}
if (!moduleSource.includes('AdminDashboardReadModel') || !moduleSource.includes('providers: [AdminDashboardReadModel')) {
  failures.push('dashboard read model is not registered in ReportsModule');
}

for (const responseKey of ['range', 'topUps', 'withdrawals', 'adjustments', 'wallets', 'ledgers', 'pendingQueues', 'generatedAt']) {
  if (!model.includes(`${responseKey}:`)) failures.push(`dashboard response key missing: ${responseKey}`);
}

if (failures.length) {
  console.error('R-010 dashboard read-model audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 dashboard read-model audit passed.');
