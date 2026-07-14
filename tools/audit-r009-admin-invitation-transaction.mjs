import fs from 'node:fs';

const serviceFile = 'apps/api/src/modules/admin-access/admin-invitation-admin.service.ts';
const controllerFile = 'apps/api/src/modules/admin-access/admin-access.controller.ts';
const service = fs.readFileSync(serviceFile, 'utf8');
const controller = fs.readFileSync(controllerFile, 'utf8');

function methodSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return null;
  return source.slice(start, end);
}

const createMethod = methodSlice(service, '  async create(', '\n  async list(');
const reissueMethod = methodSlice(service, '  async reissue(', '\n  private readAdminUserId(');

if (!createMethod || !reissueMethod) {
  console.error('R-009 admin invitation transaction audit: command methods not found.');
  process.exit(1);
}

const createTransactionStart = createMethod.indexOf('this.prisma.$transaction(async (tx) =>');
const createTransactionEnd = createMethod.indexOf('    });', createTransactionStart);
const createAuditAction = createMethod.indexOf("action: 'CREATE_ADMIN_INVITATION'");
const reissueTransactionStart = reissueMethod.indexOf('this.prisma.$transaction(async (tx) =>');
const reissueTransactionEnd = reissueMethod.indexOf('    });', reissueTransactionStart);
const reissueAuditAction = reissueMethod.indexOf("action: 'REISSUE_ADMIN_INVITATION'");

const checks = [
  ['controller imports invitation command service', controller.includes("import { AdminInvitationAdminService } from './admin-invitation-admin.service';")],
  ['controller injects invitation command service', controller.includes('private readonly invitationCommands: AdminInvitationAdminService')],
  ['controller routes creation through command service', controller.includes('return this.invitationCommands.create(req.user.id, body.email, body.roleId, body.expiresInHours);')],
  ['create transaction owner exists', createTransactionStart >= 0],
  ['create admin write uses tx', createMethod.includes('await tx.adminUser.create(')],
  ['create token write uses tx', createMethod.includes('await tx.verificationToken.create(')],
  ['create audit write uses tx', createMethod.includes('await tx.adminAuditLog.create(')],
  ['create audit action exists', createAuditAction >= 0],
  ['create audit appears before transaction closes', createAuditAction >= createTransactionStart && createAuditAction < createTransactionEnd],
  ['reissue transaction owner exists', reissueTransactionStart >= 0],
  ['reissue token update uses tx', reissueMethod.includes('await tx.verificationToken.updateMany(')],
  ['reissue token create uses tx', reissueMethod.includes('await tx.verificationToken.create(')],
  ['reissue audit write uses tx', reissueMethod.includes('await tx.adminAuditLog.create(')],
  ['reissue audit action exists', reissueAuditAction >= 0],
  ['reissue audit appears before transaction closes', reissueAuditAction >= reissueTransactionStart && reissueAuditAction < reissueTransactionEnd],
  ['no post-transaction create audit helper call', !createMethod.includes("await this.audit(actorAdminId, 'CREATE_ADMIN_INVITATION'")],
  ['no post-transaction reissue audit helper call', !reissueMethod.includes("await this.audit(actorAdminId, 'REISSUE_ADMIN_INVITATION'")],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length > 0) {
  console.error('R-009 admin invitation transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 admin invitation transaction audit passed (${checks.length} checks).`);
