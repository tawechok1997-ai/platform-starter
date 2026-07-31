import fs from 'node:fs';

const service = fs.readFileSync('apps/api/src/modules/promotions/settlement-command.service.ts', 'utf8');
const adapter = fs.readFileSync('apps/api/src/common/infrastructure/prisma-risk-promotion-repository-adapters.ts', 'utf8');
const spec = fs.readFileSync('apps/api/src/modules/promotions/settlement-command.service.spec.ts', 'utf8');

const executeMethod = service.match(/async execute[\s\S]*?\n  private async settleInTransaction/)?.[0] ?? '';
const transactionIndex = executeMethod.indexOf('this.prisma.$transaction(');
const callbackIndex = executeMethod.indexOf('async (tx) =>', transactionIndex);
const settlementAdapterIndex = executeMethod.indexOf('new PrismaPromotionSettlementRepositoryAdapter(tx)', transactionIndex);

const checks = [
  ['command transaction exists', transactionIndex >= 0],
  ['command transaction owns callback', callbackIndex > transactionIndex],
  ['settlement adapter is transaction scoped', settlementAdapterIndex > callbackIndex],
  ['risk row lock', service.includes('FROM "risk_alerts"') && service.includes('FOR UPDATE')],
  ['bonus row lock is owned by adapter', adapter.includes('FROM "bonus_ledgers"') && adapter.includes('FOR UPDATE')],
  ['wallet row lock', service.includes('FROM "wallets"') && service.includes('FOR UPDATE')],
  ['settlement helper', service.includes('this.settleInTransaction(tx')],
  ['reversal helper', service.includes('this.reverseInTransaction(tx')],
  ['risk update', service.includes('tx.riskAlert.update')],
  ['audit write', service.includes('tx.adminAuditLog.create')],
  ['serializable isolation', service.includes('Prisma.TransactionIsolationLevel.Serializable')],
  ['wallet update', service.includes('UPDATE "wallets"')],
  ['wallet ledger insert', service.includes('INSERT INTO "wallet_ledgers"')],
  ['stable settlement key', service.includes('bonus:${id}:settlement')],
  ['stable reversal key', service.includes('bonus:${id}:settlement:reversal')],
  ['atomic regression', spec.includes('under one transaction owner')],
  ['idempotency regression', spec.includes('without creating another wallet ledger')],
  ['rollback regression', spec.includes('after the settlement transaction rolls back')],
];

const failed = checks.filter(([, passed]) => !passed);
if (service.includes('this.domain.updateLifecycle') || service.includes('this.settlements.')) {
  failed.push(['legacy split transaction dependency', false]);
}

if (failed.length) {
  console.error('R-009 promotion settlement transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 promotion settlement transaction audit passed (${checks.length} checks).`);
