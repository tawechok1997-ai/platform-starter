import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const servicePath = path.join(root, 'apps/api/src/modules/topups/topups.service.ts');
const controllerPath = path.join(root, 'apps/api/src/modules/topups/topups.controller.ts');
const policyPath = path.join(root, 'apps/api/src/modules/topups/domain/deposit.policy.ts');
const helperPath = path.join(root, 'apps/api/src/common/infrastructure/prisma-row-locks.ts');

const failures = [];
for (const file of [servicePath, controllerPath, policyPath, helperPath]) {
  if (!fs.existsSync(file)) failures.push(`required top-up boundary file is missing: ${path.relative(root, file)}`);
}

const service = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';
const controller = fs.existsSync(controllerPath) ? fs.readFileSync(controllerPath, 'utf8') : '';
const policy = fs.existsSync(policyPath) ? fs.readFileSync(policyPath, 'utf8') : '';
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

// R-009 currently has no production approval/credit command to consolidate.
// Fail closed when one appears so the new money-moving path must define its
// row lock, idempotency, wallet/ledger writes, request transition and audit
// under one transaction owner before it can enter production.
const approvalRoute = /@(?:Post|Patch|Put)\([^\n]*(?:approve|credit|complete)/i;
const approvalCommand = /async\s+\w*(?:approve|credit|complete)\w*\s*\(/i;
const walletMutation = /(?:wallet|walletLedger)\.(?:create|update|upsert)|["']wallet_ledgers["']/i;

if (approvalRoute.test(controller)) failures.push('top-up approval/credit route exists without an R-009 transaction contract');
if (approvalCommand.test(service)) failures.push('top-up approval/credit command exists without an R-009 transaction contract');
if (walletMutation.test(service)) failures.push('topups service performs wallet/ledger mutation outside an approved deposit-credit command contract');
if (!policy.includes("PENDING_CREDIT: ['COMPLETED', 'REJECTED']")) failures.push('deposit policy no longer exposes the documented pending-credit transition');

if (failures.length > 0) {
  console.error('R-009 top-up transaction boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-009 top-up transaction boundary audit passed. Claim/release are transaction-scoped and no production approval/credit command exists.');
