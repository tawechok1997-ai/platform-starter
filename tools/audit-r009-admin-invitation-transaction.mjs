import fs from 'node:fs';

const file = 'apps/api/src/modules/admin-access/admin-access.service.ts';
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('  async createInvitation(');
const end = source.indexOf('\n  async assignRole(', start);

if (start < 0 || end < 0) {
  console.error('R-009 admin invitation transaction audit: createInvitation method not found.');
  process.exit(1);
}

const method = source.slice(start, end);
const transactionStart = method.indexOf('this.prisma.$transaction(async (tx) =>');
const transactionReturn = method.indexOf('    });', transactionStart);
const auditAction = method.indexOf("action: 'CREATE_ADMIN_INVITATION'");
const legacyAudit = method.indexOf("await this.audit(actorAdminId, 'CREATE_ADMIN_INVITATION'");

const checks = [
  ['transaction owner exists', transactionStart >= 0],
  ['invitation admin write uses tx', method.includes('await tx.adminUser.create(')],
  ['verification token write uses tx', method.includes('await tx.verificationToken.create(')],
  ['audit action exists', auditAction >= 0],
  ['audit write uses tx', method.includes('await tx.adminAuditLog.create(')],
  ['legacy post-transaction audit removed', legacyAudit < 0],
  ['audit appears before transaction closes', auditAction >= transactionStart && auditAction < transactionReturn],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length > 0) {
  console.error('R-009 admin invitation transaction audit failed:');
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-009 admin invitation transaction audit passed (${checks.length} checks).`);
