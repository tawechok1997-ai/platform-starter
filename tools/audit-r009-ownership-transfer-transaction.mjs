import fs from 'node:fs';

const servicePath = 'apps/api/src/modules/admin-access/admin-ownership-command.service.ts';
const controllerPath = 'apps/api/src/modules/admin-access/admin-access.controller.ts';
const service = fs.readFileSync(servicePath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');

const start = service.indexOf('  async transferOwnership(');
if (start < 0) {
  console.error('R-009 ownership audit failed: transferOwnership method was not found.');
  process.exit(1);
}
const body = service.slice(start);

const checks = [
  ['controller routes to ownership command service', controller.includes('this.ownershipCommands.transferOwnership(')],
  ['step-up authentication happens before transaction', body.indexOf('this.adminAuth.assertStepUp(') >= 0 && body.indexOf('this.adminAuth.assertStepUp(') < body.indexOf('this.prisma.$transaction(async (tx) =>')],
  ['single Prisma transaction owner', body.includes('this.prisma.$transaction(async (tx) =>')],
  ['deterministic UUID lock order', body.includes('[actorAdminId, targetAdminId].sort()')],
  ['actor and target lock through shared helper', body.includes('lockAdminUserForUpdate(tx, adminUserId)')],
  ['actor reloaded through transaction client', body.includes('tx.adminUser.findUnique({')],
  ['target active revalidation', body.includes("target.status === 'ACTIVE'")],
  ['target 2FA revalidation', body.includes('target.twoFactorEnabled')],
  ['target protected-role revalidation', body.includes('targetAlreadyProtected')],
  ['owner role removal through transaction client', body.includes('tx.adminUserRole.delete({')],
  ['owner role assignment through transaction client', body.includes('tx.adminUserRole.create({')],
  ['audit write through transaction client', body.includes('tx.adminAuditLog.create({')],
  ['role mutation occurs after locks', body.indexOf('lockAdminUserForUpdate(tx, adminUserId)') < body.indexOf('tx.adminUserRole.delete({')],
  ['audit occurs after role assignment', body.indexOf('tx.adminUserRole.create({') < body.indexOf('tx.adminAuditLog.create({')],
  ['legacy service delegation removed', !body.includes('this.adminAccess.transferOwnership(')],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length > 0) {
  console.error('R-009 ownership transfer transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 ownership transfer transaction audit passed (${checks.length} checks).`);
