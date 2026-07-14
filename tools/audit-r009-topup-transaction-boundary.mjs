import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const servicePath = path.join(root, 'apps/api/src/modules/topups/topups.service.ts');
const helperPath = path.join(root, 'apps/api/src/common/infrastructure/prisma-row-locks.ts');

const failures = [];
if (!fs.existsSync(servicePath)) failures.push('topups service is missing');
if (!fs.existsSync(helperPath)) failures.push('row-lock helper module is missing');

const service = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';
const helpers = fs.existsSync(helperPath) ? fs.readFileSync(helperPath, 'utf8') : '';

const requiredServiceSignals = [
  "import { lockTopUpRequestForUpdate } from '../../common/infrastructure/prisma-row-locks'",
  'const lockedId = await lockTopUpRequestForUpdate(tx, id)',
  "action: 'CLAIM_TOP_UP'",
  "action: 'RELEASE_TOP_UP'",
];

for (const signal of requiredServiceSignals) {
  if (!service.includes(signal)) failures.push(`missing top-up transaction signal: ${signal}`);
}

if (!helpers.includes('export function lockTopUpRequestForUpdate')) {
  failures.push('lockTopUpRequestForUpdate helper is not exported');
}

const legacyRawLock = /FROM\s+["']top_up_requests["'][\s\S]{0,300}?FOR\s+UPDATE/i;
if (legacyRawLock.test(service)) failures.push('topups service still contains an inline raw row lock');

const releaseMethod = service.match(/async releaseRequest\([\s\S]*?\n  }\n\n  private async validateReceivingAccount/);
if (!releaseMethod) {
  failures.push('releaseRequest method boundary could not be inspected');
} else {
  if (!releaseMethod[0].includes('this.prisma.$transaction(async (tx) =>')) failures.push('releaseRequest is not transaction-owned');
  if (!releaseMethod[0].includes('tx.adminAuditLog.create')) failures.push('releaseRequest audit is outside the transaction');
  if (/this\.prisma\.(?:topUpRequest|adminAuditLog)/.test(releaseMethod[0])) failures.push('releaseRequest contains unscoped Prisma writes');
}

if (failures.length > 0) {
  console.error('R-009 top-up transaction boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-009 top-up transaction boundary audit passed. Claim/release locks and audit writes are transaction-scoped.');
