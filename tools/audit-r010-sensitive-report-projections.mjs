import fs from 'node:fs';

const projectionsPath = 'apps/api/src/modules/reports/report-read.projections.ts';
const modelPath = 'apps/api/src/modules/reports/admin-report-read.model.ts';
const projections = fs.readFileSync(projectionsPath, 'utf8');
const model = fs.readFileSync(modelPath, 'utf8');
const failures = [];

for (const symbol of ['TREND_PROJECTION', 'QUEUE_AGING_PROJECTION', 'RECONCILIATION_WALLET_PROJECTION', 'RECONCILIATION_LEDGER_PROJECTION']) {
  if (!projections.includes(`export const ${symbol}`)) failures.push(`missing ${symbol}`);
  if (!model.includes(symbol)) failures.push(`read model does not use ${symbol}`);
}

if (/QUEUE_AGING_PROJECTION[\s\S]*?phone\s*:\s*true/.test(projections)) failures.push('queue aging must not project phone');
if (/QUEUE_AGING_PROJECTION[\s\S]*?user:\s*\{\s*select:\s*\{[^}]*id\s*:\s*true/.test(projections)) failures.push('queue aging must not project nested user id');
if (/RECONCILIATION_WALLET_PROJECTION[\s\S]*?(email|phone)\s*:\s*true/.test(projections)) failures.push('reconciliation must not project email or phone');
if (!/RECONCILIATION_LEDGER_PROJECTION[\s\S]*?balanceAfter\s*:\s*true[\s\S]*?createdAt\s*:\s*true/.test(projections)) failures.push('ledger projection must remain narrow');
if (/include\s*:\s*\{\s*user/.test(model)) failures.push('report read model must not use broad user includes');
if (!model.includes('select: RECONCILIATION_LEDGER_PROJECTION')) failures.push('latest ledger must use narrow projection');

if (failures.length) {
  console.error('R-010 sensitive report projection audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 sensitive report projection audit passed.');
