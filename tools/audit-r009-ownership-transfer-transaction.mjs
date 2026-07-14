import fs from 'node:fs';

const servicePath = 'apps/api/src/modules/admin-access/admin-access.service.ts';
const source = fs.readFileSync(servicePath, 'utf8');
const method = source.match(/async transferOwnership\([\s\S]*?\n  }\n\n  async listDelegations/);

if (!method) {
  console.error('R-009 ownership audit failed: transferOwnership method was not found.');
  process.exit(1);
}

const body = method[0];
const checks = [
  ['step-up authentication', /assertStepUp\(/],
  ['single Prisma transaction owner', /this\.prisma\.\$transaction\(async \(tx\)/],
  ['owner role removal through transaction client', /tx\.adminUserRole\.delete/],
  ['owner role assignment through transaction client', /tx\.adminUserRole\.(?:create|upsert)/],
  ['audit write through transaction client', /tx\.adminAuditLog\.create/],
  ['protected-role validation', /PROTECTED_ROLE_CODES/],
  ['active target validation', /target\.status !== 'ACTIVE'/],
  ['target 2FA validation', /target\.twoFactorEnabled/],
];

const failed = checks.filter(([, pattern]) => !pattern.test(body)).map(([name]) => name);
const hasTransactionalLocks = /lockAdminUserForUpdate\(tx, actorAdminId\)[\s\S]*lockAdminUserForUpdate\(tx, targetAdminId\)/.test(body);

console.log(`R-009 ownership transfer audit: ${checks.length - failed.length}/${checks.length} baseline checks passed.`);
console.log(`Transactional actor/target lock order: ${hasTransactionalLocks ? 'present' : 'missing'}.`);

if (failed.length) {
  console.error(`Missing ownership transaction contracts: ${failed.join(', ')}`);
  process.exitCode = 1;
}

if (!hasTransactionalLocks) {
  console.error('R-009 ownership transfer remains partial: actor and target must be re-locked and revalidated inside the transaction.');
  process.exitCode = 1;
}
