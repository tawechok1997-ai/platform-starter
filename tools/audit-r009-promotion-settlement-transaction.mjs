import fs from 'node:fs';

const service = fs.readFileSync('apps/api/src/modules/promotions/settlement-command.service.ts', 'utf8');
const spec = fs.readFileSync('apps/api/src/modules/promotions/settlement-command.service.spec.ts', 'utf8');

const required = [
  ['command transaction', 'this.prisma.$transaction(async (tx) =>'],
  ['risk row lock', 'FROM "risk_alerts"'],
  ['bonus row lock', 'FROM "bonus_ledgers"'],
  ['wallet row lock', 'FROM "wallets"'],
  ['settlement helper', 'this.settleInTransaction(tx'],
  ['reversal helper', 'this.reverseInTransaction(tx'],
  ['risk update', 'tx.riskAlert.update'],
  ['audit write', 'tx.adminAuditLog.create'],
  ['serializable isolation', 'Prisma.TransactionIsolationLevel.Serializable'],
  ['wallet update', 'UPDATE "wallets"'],
  ['wallet ledger insert', 'INSERT INTO "wallet_ledgers"'],
  ['stable settlement key', 'bonus:${id}:settlement'],
  ['stable reversal key', 'bonus:${id}:settlement:reversal'],
];

const failed = required.filter(([, token]) => !service.includes(token));
if (service.includes('this.domain.updateLifecycle') || service.includes('this.settlements.')) {
  failed.push(['legacy split transaction dependency', 'removed']);
}
if (!spec.includes('under one transaction owner')) failed.push(['atomic regression', 'missing']);
if (!spec.includes('without creating another wallet ledger')) failed.push(['idempotency regression', 'missing']);
if (!spec.includes('after the settlement transaction rolls back')) failed.push(['rollback regression', 'missing']);

if (failed.length) {
  console.error('R-009 promotion settlement transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 promotion settlement transaction audit passed (${required.length + 3} checks).`);
