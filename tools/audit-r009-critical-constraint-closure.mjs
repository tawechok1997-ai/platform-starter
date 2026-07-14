import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const schemaPath = path.join(ROOT, 'prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

function modelBody(name) {
  const match = schema.match(new RegExp(`model\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? '';
}

const checks = [
  ['Wallet.userId unique', /userId\s+String[^\n]*@unique/.test(modelBody('Wallet'))],
  ['Wallet status index', /@@index\(\[status\]\)/.test(modelBody('Wallet'))],
  ['WalletLedger.idempotencyKey unique', /idempotencyKey\s+String\?[^\n]*@unique/.test(modelBody('WalletLedger'))],
  ['WalletLedger wallet history index', /@@index\(\[walletId,\s*createdAt\]\)/.test(modelBody('WalletLedger'))],
  ['WalletLedger reference index', /@@index\(\[referenceType,\s*referenceId\]\)/.test(modelBody('WalletLedger'))],
  ['TopUpRequest.idempotencyKey unique', /idempotencyKey\s+String\?[^\n]*@unique/.test(modelBody('TopUpRequest'))],
  ['TopUpRequest user history index', /@@index\(\[userId,\s*createdAt\]\)/.test(modelBody('TopUpRequest'))],
  ['TopUpRequest duplicate reference index', /@@index\(\[duplicateOfId\]\)/.test(modelBody('TopUpRequest'))],
  ['WithdrawalRequest.idempotencyKey unique', /idempotencyKey\s+String\?[^\n]*@unique/.test(modelBody('WithdrawalRequest'))],
  ['WithdrawalRequest user history index', /@@index\(\[userId,\s*createdAt\]\)/.test(modelBody('WithdrawalRequest'))],
  ['AdminUserRole composite primary key', /@@id\(\[adminUserId,\s*roleId\]\)/.test(modelBody('AdminUserRole'))],
  ['Role.code unique', /code\s+String[^\n]*@unique/.test(modelBody('Role'))],
  ['GameTransfer.idempotencyKey unique', /idempotencyKey\s+String[^\n]*@unique/.test(modelBody('GameTransfer'))],
  ['WebhookLog idempotency index', /@@index\(\[idempotencyKey\]\)/.test(modelBody('WebhookLog'))],
];

const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failed.length > 0) {
  console.error('R-009 critical constraint closure audit failed:');
  for (const name of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 critical constraint closure audit passed (${checks.length} checks).`);
